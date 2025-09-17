import { db } from "@backend/db/connection";
import { UpdateSortDtoType } from "@backend/types";
import {
  DatabaseError,
  InternalServerError,
  NotFoundError,
} from "@backend/utils/error/customError";
import {
  and,
  eq,
  getTableColumns,
  like,
  or,
  sql
} from "drizzle-orm";
import { InsertPartnersDto, PartnersListQueryDto, partnersTable, UpdatePartnersDto } from "../../db/models/partners.model";


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
    const result = await db.query.partnersTable.findMany({
      with: {
        imageRef: true, // 关联查询图片信息
      },
      where: (partners, { eq }) => eq(partners.isActive, true),
      orderBy: (partners, { asc }) => asc(partners.sortOrder),
    });

    // 转换数据格式以匹配前端期望
    return result.map(partner => ({
      ...partner,
      imageUrl: partner.imageRef?.imageUrl || null,
      image: undefined, // 移除image字段，因为我们现在有imageRef
    }));
  }

  /**
   * 获取合作伙伴列表（管理后台用）- 使用统一的分页函数
   * @param params 查询参数
   * @returns 分页的合作伙伴列表
   */
  async getPartnersList(params: PartnersListQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "sortOrder",
      sortOrder = "asc",
      search,
      name,
      isActive,
    } = params;

    // 使用Drizzle ORM的关联查询功能
    const result = await db.query.partnersTable.findMany({
      with: {
        imageRef: true, // 关联查询图片信息
      },
      where: (partners, { and, like, eq, or }) => {
        const conditions = [];

        // search参数：使用or连接多个字段搜索
        if (search) {
          conditions.push(
            or(
              like(partners.name, `%${search}%`),
              like(partners.description, `%${search}%`),
            ),
          );
        }

        // 独立的精确搜索条件
        if (name) {
          conditions.push(like(partners.name, `%${name}%`));
        }
        if (isActive !== undefined) {
          conditions.push(eq(partners.isActive, isActive));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      orderBy: (partners, { asc, desc }) => {
        const sortFieldMap: Record<string, any> = {
          name: partners.name,
          sortOrder: partners.sortOrder,
          createdAt: partners.createdAt,
          updatedAt: partners.updatedAt,
        };
        // 确定排序字段和方向
        const orderBy = sortFieldMap[sortBy] || partners.sortOrder;
        return sortOrder === "asc" ? asc(orderBy) : desc(orderBy);
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // 构建计算总数的查询，考虑搜索条件
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(partnersTable);

    // 搜索条件构建
    const whereConditions = [];

    // search参数：使用or连接多个字段搜索
    if (search) {
      whereConditions.push(
        or(
          like(partnersTable.name, `%${search}%`),
          like(partnersTable.description, `%${search}%`),
        ),
      );
    }

    // 独立的精确搜索条件
    if (name) {
      whereConditions.push(like(partnersTable.name, `%${name}%`));
    }
    if (isActive !== undefined) {
      whereConditions.push(eq(partnersTable.isActive, isActive));
    }

    // 应用查询条件
    if (whereConditions.length > 0) {
      // @ts-ignore
      countQuery = countQuery.where(and(...whereConditions));
    }

    // @ts-ignore
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0].count);
    return {
      items: result,
      meta: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
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
        imageRef: true, // 关联查询图片信息
      },
      where: (partners, { eq }) => eq(partners.id, id),
    });

    if (!result) {
      throw new NotFoundError("合作伙伴不存在", "com");
    }

    // 转换数据格式以匹配前端期望
    return {
      ...result,
      imageUrl: result.imageRef?.imageUrl || null,
      image: undefined, // 移除image字段，因为我们现在有imageRef
    };
  }

  /**
   * 创建合作伙伴
   * @param data 创建数据
   * @returns 创建的合作伙伴
   */
  async createPartner(data: InsertPartnersDto) {
    const [newPartner] = await db
      .insert(partnersTable)
      .values(data)
      .returning();

    if (!newPartner) {
      throw new InternalServerError("创建合作伙伴失败");
    }
    return newPartner;
  }

  /**
   * 更新合作伙伴
   * @param id 合作伙伴ID
   * @param data 更新数据
   * @returns 更新后的合作伙伴
   */
  async updatePartner(id: number, data: UpdatePartnersDto) {
    const [updatedPartner] = await db
      .update(partnersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(partnersTable.id, id))
      .returning(this.columns);

    if (!updatedPartner) {
      throw new NotFoundError("合作伙伴不存在");
    }

    return updatedPartner;
  }

  /**
   * 删除合作伙伴
   * @param id 合作伙伴ID
   */
  async deletePartner(id: number) {
    // 先检查合作伙伴是否存在
    await this.getPartnerById(id);

    try {
      const result = await db
        .delete(partnersTable)
        .where(eq(partnersTable.id, id));

      if (!result || result.rowCount === 0) {
        throw new InternalServerError("删除合作伙伴失败");
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("数据库操作失败");
    }
  }

  /**
   * 更新合作伙伴排序
   * @param id 合作伙伴ID
   * @param data 排序数据
   * @returns 更新后的合作伙伴
   */
  async updatePartnerSort(id: number, data: UpdateSortDtoType) {
    const [updatedPartner] = await db
      .update(partnersTable)
      .set({
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(partnersTable.id, id))
      .returning(this.columns);

    if (!updatedPartner) {
      throw new NotFoundError("合作伙伴不存在");
    }

    return updatedPartner;
  }

  /**
   * 切换合作伙伴启用状态
   * @param id 合作伙伴ID
   * @returns 更新后的合作伙伴或null
   */
  async togglePartnerActive(id: number) {
    // 先获取当前状态
    const currentPartner = await this.getPartnerById(id);
    if (!currentPartner) {
      throw new NotFoundError("合作伙伴不存在");
    }

    // 切换状态
    const [updatedPartner] = await db
      .update(partnersTable)
      .set({
        isActive: !currentPartner.isActive,
        updatedAt: new Date(),
      })
      .where(eq(partnersTable.id, id))
      .returning(this.columns);

    if (!updatedPartner) {
      throw new InternalServerError("更新合作伙伴状态失败");
    }

    return updatedPartner;
  }
}
