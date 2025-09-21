import { db } from "@backend/db/connection";
import { imagesTable } from "@backend/types";
import {
  handleDatabaseError,
  InternalServerError,
  NotFoundError
} from "@backend/utils/error/customError";
import {
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  like,
  or
} from "drizzle-orm";
import { InsertPartners, partnerImagesTable, PartnersListQueryDto, partnersTable, UpdatePartnersDto } from "../../db/models/partners.model";
/**
 * 合作伙伴服务类
 * 处理合作伙伴相关的业务逻辑
 */
export class PartnersService {
  private readonly columns = getTableColumns(partnersTable);

  /**
   * 获取启用的合作伙伴列表（前台用）
   * @returns 启用的合作伙伴列表，按排序权重排序
   */
  async getActivePartnersList() {
    // 使用Drizzle ORM的关联查询功能
    const res = await db.select().from(partnersTable)
      .leftJoin(partnerImagesTable, eq(partnerImagesTable.partnerId, partnersTable.id))
      .leftJoin(imagesTable, eq(partnerImagesTable.imageId, imagesTable.id))
    const aggregated = Object.values(
      res.reduce((acc, items) => {
        const { partners, partner_images, images } = items
        // 如果没有id 则添加id
        if (!acc[partners.id]) {
          acc[partners.id] = {
            ...partners,
            images: []
          }
        }
        acc[partners.id].images.push({
          ...images,
          isMain: partner_images?.isMain
        })
        return acc
      }, {} as Record<string, any>)
    )
    return aggregated
    // const result = await db.query.partnersTable.findMany({
    //   with: {
    //     partnerImageRef: {
    //       columns: {

    //       },
    //       with: {

    //         imageRef: {
    //         }, // 自动 JOIN 并加载 imageRef 数据
    //       },
    //     },
    //   },
    //   where: (partners, { eq }) => eq(partners.isActive, true),
    //   orderBy: (partners, { asc }) => asc(partners.sortOrder),
    // });

    // // 转换数据格式以匹配前端期望
    // return result.map(partner => ({
    //   ...partner,
    //   isMain: partner.partnerImageRef?.isMain || false,
    //   imageUrl: {
    //     id: partner.partnerImageRef?.imageRef?.id || null,
    //     imageUrl: partner.partnerImageRef?.imageRef?.imageUrl || null,
    //     fileName: partner.partnerImageRef.imageRef.fileName || null,
    //     category: partner.partnerImageRef.imageRef.category || null,
    //   },
    //   imageRef: undefined, // 移除image字段，因为我们现在有imageRef
    //   partnerImageRef: undefined, // 移除partnerImageRef字段，因为我们现在有imageRef
    // }));
  }

  /**
   * 分页获取合作伙伴列表（管理后台用）- 使用统一的分页函数
   * @param params 查询参数
   * @returns 分页的合作伙伴列表
   */
  async getPartnersList(params: PartnersListQueryDto) {
    const {
      page = 1,
      limit = 10,
      sort = "sortOrder",
      sortOrder = "asc",
      search,
      isActive,
    } = params;

    const conditions = [];
    // search参数：使用or连接多个字段搜索
    if (search) {
      conditions.push(
        or(
          like(partnersTable.name, `%${search}%`),
          like(partnersTable.description, `%${search}%`),
        ),
      );
    }
    if (isActive !== undefined) {
      conditions.push(eq(partnersTable.isActive, isActive));
    }


    // 构建计算总数的查询，考虑搜索条件
    let countQuery = db.select({ count: count() }).from(partnersTable);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [result, totalArr] = await Promise.all([
      db.query.partnersTable.findMany({
        with: {
          partnerImageRef: {
            columns: {
              partnerId: false,
              imageId: false,
            },
            with: {
              imageRef: {
                columns: {
                  id: true,
                  imageUrl: true,
                  fileName: true,
                  category: true,
                }
              },
            },
          },
        },
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (partners, { asc, desc }) => {
          const sortFieldMap: Record<string, any> = {
            updatedAt: partners.updatedAt,
          };
          // 确定排序字段和方向
          const orderBy = sortFieldMap[sort] || partners.updatedAt;
          return sortOrder === "asc" ? asc(orderBy) : desc(orderBy);
        },
        limit: limit,
        offset: (page - 1) * limit,
      }),
      countQuery
    ]);


    const res = result.map((item) => ({
      ...item,
      images: item.partnerImageRef.map(ref => ({
        ...ref.imageRef,
        isMain: ref.isMain
      })),
      partnerImageRef: undefined
    }))


    const totalCount = totalArr[0]?.count ?? 0;

    return {
      items: res,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * 根据ID获取合作伙伴详情
   * @param id 合作伙伴ID
   * @returns 合作伙伴详情或null
   */
  async getPartnerById(id: number) {
    const result = await db.query.partnersTable.findFirst({
      with: {
        partnerImageRef: {
          with: {
            imageRef: true
          }
        }, // 关联查询图片信息
      },
      where: (partners, { eq }) => eq(partners.id, id),
    });

    if (!result) {
      throw new NotFoundError("合作伙伴不存在", "com");
    }


    // 转换数据格式以匹配前端期望
    return {
      ...result,
      images: result.partnerImageRef.map((item) => ({ isMain: item.isMain, ...item.imageRef })),
      partnerImageRef: undefined
    };
  }

  /**
   * 创建合作伙伴
   * @param data 创建数据
   * @returns 创建的合作伙伴
   */
  async createPartner(data: InsertPartners) {

    const { image_ids, ...partner } = data

    let newPartner;
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(partnersTable)
        .values(partner)
        .returning();
      newPartner = inserted
      if (!inserted) throw new InternalServerError("创建失败")

      if (image_ids && image_ids.length > 0) {
        const existingImages = await tx.query.imagesTable.findMany({
          where: inArray(imagesTable.id, image_ids)
        });
        const foundIds = existingImages.map(img => img.id)
        const notFound = image_ids.filter(id => !foundIds.includes(id))

        if (notFound.length > 0) {
          throw new NotFoundError(`图片 ID ${notFound.join(', ')} 不存在`);
        }

        // 批量插入关联关系
        const refsToInsert = image_ids.map((imageId, index) => ({
          partnerId: inserted.id,
          imageId,
          isMain: index == 0 ? true : false // 默认都不是主图，您也可以扩展逻辑
        }));
        await tx.insert(partnerImagesTable).values(refsToInsert)
      }
    })
    return newPartner;
  }

  /**
   * 更新合作伙伴
   * @param id 合作伙伴ID
   * @param data 更新数据
   * @returns 更新后的合作伙伴
   */
  async updatePartner(id: number, data: UpdatePartnersDto) {

    const { image_ids, ...partner } = data

    let updatedPartner;
    await db.transaction(async (tx) => {
      const [updated] = await tx.update(partnersTable).set({
        ...partner,
        updatedAt: new Date()
      }).where(eq(partnersTable.id, id))
        .returning()
      updatedPartner = updated

      if (!updated) throw new InternalServerError("更新合作伙伴状态失败")
      if (image_ids && image_ids.length > 0) {
        const existingImages = await tx.query.imagesTable.findMany({
          where: inArray(imagesTable.id, image_ids)
        })
        const foundIds = existingImages.map(img => img.id)
        const notFound = image_ids.filter((id) => !foundIds.includes(id));
        if (notFound.length > 0) {
          throw new NotFoundError(`图片 ID ${notFound.join(', ')} 不存在`);
        }

        // 🧹 2.2 删除旧的关联（关键！否则会残留旧数据）
        await tx
          .delete(partnerImagesTable)
          .where(eq(partnerImagesTable.partnerId, updated.id));

        // ➕ 2.3 插入新的关联
        const refsToInsert = image_ids.map((imageId, index) => ({
          partnerId: updated.id,
          imageId,
          isMain: index === 0, // 第一张图设为主图（可自定义逻辑）
        }));
        await tx.insert(partnerImagesTable).values(refsToInsert);
      }
    })
    return updatedPartner;
  }


  async exists(ids: number | number[]): Promise<boolean> {
    const whereCondition = Array.isArray(ids)
      ? inArray(partnersTable.id, ids)
      : eq(partnersTable.id, ids);

    const result = await db
      .select({ id: partnersTable.id })
      .from(partnersTable)
      .where(whereCondition)
      .limit(1) // 👈 只查一个，性能优化

    return result.length > 0;
  }

  /**
  * 删除合作伙伴
  * @param id 合作伙伴ID（支持单个或多个）
  */
  async deletePartner(ids: number | number[]): Promise<boolean> {
    const idList = Array.isArray(ids) ? ids : [ids];

    if (idList.length === 0) {
      return true; // 空数组，视为删除成功
    }

    try {
      await db.transaction(async (tx) => {
        // ✅ 1. 先检查合作伙伴是否存在
        const existing = await tx.query.partnersTable.findMany({
          where: inArray(partnersTable.id, idList),
          columns: { id: true } // 只查 ID，提高性能
        });
        const foundIds = existing.map(item => item.id);
        const notFound = idList.filter(id => !foundIds.includes(id));
        if (notFound.length > 0) {
          throw new NotFoundError(`合作伙伴 ID ${notFound.join(', ')} 不存在`);
        }
        // ✅ 2. 先删除关联表数据（避免外键约束）
        await tx
          .delete(partnerImagesTable)
          .where(inArray(partnerImagesTable.partnerId, idList));

        // ✅ 3. 删除主表数据
        const result = await tx
          .delete(partnersTable)
          .where(inArray(partnersTable.id, idList));

      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error)
    }
  }
}
