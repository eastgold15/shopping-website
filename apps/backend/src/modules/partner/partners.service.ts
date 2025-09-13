import { db } from "@backend/db/connection";
import { imagesSchema, partnersSchema } from "@backend/db/schema/schema";
import {
  DatabaseError,
  InternalServerError,
  NotFoundError,
} from "@backend/utils/error/customError";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  like,
  or,
} from "drizzle-orm";
import type {
  CreatePartnerDto,
  PartnerQueryDto,
  UpdatePartnerDto,
  UpdateSortDto,
} from "./partners.model";

/**
 * 合作伙伴服务类
 * 处理合作伙伴相关的业务逻辑
 */
export class PartnersService {
  private readonly columns = getTableColumns(partnersSchema);

  /**
   * 获取启用的合作伙伴列表（前台用）
   * @returns 启用的合作伙伴列表，按排序权重排序
   */
  async getActivePartnersList() {
    return await db
      .select({
        ...this.columns,
        image: imagesSchema.url, // 添加图片URL字段
      })
      .from(partnersSchema)
      .innerJoin(imagesSchema, eq(partnersSchema.image_id, imagesSchema.id))
      .where(eq(partnersSchema.isActive, true))
      .orderBy(asc(partnersSchema.sortOrder));
  }

  /**
   * 获取合作伙伴列表（管理后台用）
   * @param params 查询参数
   * @returns 分页的合作伙伴列表
   */
  async getPartnersList(params: PartnerQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "sortOrder",
      sortOrder = "asc",
      search,
      name,
      isActive,
    } = params;

    // 搜索条件构建
    const conditions = [];

    // search参数：使用or连接多个字段搜索
    if (search) {
      conditions.push(
        or(
          like(partnersSchema.name, `%${search}%`),
          like(partnersSchema.description, `%${search}%`),
        ),
      );
    }

    // 独立的精确搜索条件
    if (name) {
      conditions.push(like(partnersSchema.name, `%${name}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(partnersSchema.isActive, isActive));
    }

    // 排序字段映射
    const sortFieldMap: Record<string, any> = {
      name: partnersSchema.name,
      sortOrder: partnersSchema.sortOrder,
      createdAt: partnersSchema.createdAt,
      updatedAt: partnersSchema.updatedAt,
    };
    // 确定排序字段和方向
    const sortField = sortFieldMap[sortBy] || partnersSchema.sortOrder;
    const orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

    // 构建查询
    const queryBuilder = db
      .select({
        ...this.columns,
        image: imagesSchema.url, // 添加图片URL字段
      })
      .from(partnersSchema)
      .leftJoin(imagesSchema, eq(partnersSchema.image_id, imagesSchema.id))
      .orderBy(orderBy);

    // 获取总数
    const totalBuilder = db.select({ count: count() }).from(partnersSchema);

    if (conditions.length > 0) {
      queryBuilder.where(and(...conditions));
      totalBuilder.where(and(...conditions));
    }

    // 分页
    const offset = (page - 1) * pageSize;
    queryBuilder.limit(pageSize).offset(offset);

    // 开始查询
    const [partners, [{ count: total }]] = await Promise.all([
      queryBuilder,
      totalBuilder,
    ]);
    return {
      items: partners,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 根据ID获取合作伙伴详情
   * @param id 合作伙伴ID
   * @returns 合作伙伴详情或null
   */
  async getPartnerById(id: number) {
    const [partner] = await db
      .select({
        ...this.columns,
        image: imagesSchema.url, // 添加图片URL字段
      })
      .from(partnersSchema)
      .leftJoin(imagesSchema, eq(partnersSchema.image_id, imagesSchema.id))
      .where(eq(partnersSchema.id, id));

    if (!partner) {
      throw new NotFoundError("合作伙伴不存在", "com");
    }
    return partner;
  }

  /**
   * 创建合作伙伴
   * @param data 创建数据
   * @returns 创建的合作伙伴
   */
  async createPartner(data: CreatePartnerDto) {
    const [newPartner] = await db
      .insert(partnersSchema)
      .values(data)
      .returning(this.columns);

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
  async updatePartner(id: number, data: UpdatePartnerDto) {
    const [updatedPartner] = await db
      .update(partnersSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(partnersSchema.id, id))
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
        .delete(partnersSchema)
        .where(eq(partnersSchema.id, id));

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
  async updatePartnerSort(id: number, data: UpdateSortDto) {
    const [updatedPartner] = await db
      .update(partnersSchema)
      .set({
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(partnersSchema.id, id))
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
      .update(partnersSchema)
      .set({
        isActive: !currentPartner.isActive,
        updatedAt: new Date(),
      })
      .where(eq(partnersSchema.id, id))
      .returning(this.columns);

    if (!updatedPartner) {
      throw new InternalServerError("更新合作伙伴状态失败");
    }

    return updatedPartner;
  }
}