import { db } from "@backend/db/connection";
import { UpdateSortDtoType } from "@backend/types";
import {
  DatabaseError,
  InternalServerError,
  NotFoundError,
} from "@backend/utils/error/customError";
import { paginate } from "@backend/utils/services/pagination";
import {
  and,
  asc,
  eq,
  getTableColumns,
  like,
  or
} from "drizzle-orm";
import { imagesTable } from "../../db/models/images.model";
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
    return await db
      .select({
        ...this.columns,
        image: imagesTable.url, // 添加图片URL字段
      })
      .from(partnersTable)
      .innerJoin(imagesTable, eq(partnersTable.image_id, imagesTable.id))
      .where(eq(partnersTable.isActive, true))
      .orderBy(asc(partnersTable.sortOrder));
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

    // 构建基础查询
    let baseQuery = db
      .select({
        ...this.columns,
        image: imagesTable.url, // 添加图片URL字段
      })
      .from(partnersTable)
      .leftJoin(imagesTable, eq(partnersTable.image_id, imagesTable.id))
      .$dynamic();

    // 搜索条件构建
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

    // 独立的精确搜索条件
    if (name) {
      conditions.push(like(partnersTable.name, `%${name}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(partnersTable.isActive, isActive));
    }

    // 应用查询条件
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // 排序字段映射
    const sortFieldMap: Record<string, any> = {
      name: partnersTable.name,
      sortOrder: partnersTable.sortOrder,
      createdAt: partnersTable.createdAt,
      updatedAt: partnersTable.updatedAt,
    };
    // 确定排序字段和方向
    const orderBy = sortFieldMap[sortBy] || partnersTable.sortOrder;
    const orderDirection = sortOrder as "asc" | "desc";

    // 使用统一的分页函数
    return await paginate(db, baseQuery, {
      page,
      pageSize,
      orderBy,
      orderDirection,
    });
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
        image: imagesTable.url, // 添加图片URL字段
      })
      .from(partnersTable)
      .leftJoin(imagesTable, eq(partnersTable.image_id, imagesTable.id))
      .where(eq(partnersTable.id, id));

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
