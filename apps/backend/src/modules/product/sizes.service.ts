import {
  attributesModel,
  type InsertSizeDto,
  type SelectSizeType,
  SizeListQueryDto,
  sizesTable,
  type UpdateSizeDto,
} from "@backend/db/models/attribute.model";
import {
  handleDatabaseError,
  NotFoundError,
} from "@backend/utils/error/customError";
import BaseService from "@backend/utils/services";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  like,
  or,
} from "drizzle-orm";
import { db } from "../../db/connection";

/**
 * 尺寸服务类
 * 处理所有尺寸相关的业务逻辑
 */
export class SizesService {
  /**
   * 创建尺寸
   */
  async create(data: InsertSizeDto) {
    try {
      const result = await db.insert(sizesTable).values(data).returning();
      return result[0];
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 获取尺寸列表
   */
  async getList(query: SizeListQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "createdAt",
        sortOrder = "desc",
        name,
        category,
        isActive,
      } = query;

      // 查询条件
      const conditions = [];
      if (name) {
        conditions.push(
          or(
            like(sizesTable.name, `%${name}%`),
            like(sizesTable.displayName, `%${name}%`),
          ),
        );
      }
      if (category) {
        conditions.push(eq(sizesTable.category, category));
      }
      if (isActive !== undefined) {
        conditions.push(eq(sizesTable.isActive, isActive === "true"));
      }

      // 定义允许排序的字段
      const sortFieldMap: Record<string, any> = {
        id: sizesTable.id,
        name: sizesTable.name,
        value: sizesTable.value,
        category: sizesTable.category,
        sortOrder: sizesTable.sortOrder,
        createdAt: sizesTable.createdAt,
        updatedAt: sizesTable.updatedAt,
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sort] || sizesTable.value;
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(sizesTable),
        })
        .from(sizesTable);

      // 获取总数
      const totalBuilder = db.select({ count: count() }).from(sizesTable);

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
        totalBuilder.where(and(...conditions));
      }

      // 添加排序
      queryBuilder.orderBy(_orderBy);

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.limit(limit).offset(offset);

      // 查询数据和总数
      const [rawSizes, totalResult] = await Promise.all([
        queryBuilder,
        totalBuilder,
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        items: rawSizes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("获取尺寸列表失败:", error);
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 根据ID获取尺寸详情
   */
  async getById(id: number) {
    try {
      const [size] = await db
        .select()
        .from(sizesTable)
        .where(eq(sizesTable.id, id));
      if (!size) {
        throw new NotFoundError("尺寸不存在");
      }
      return size;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新尺寸
   */
  async update(id: number, data: UpdateSizeDto) {
    try {
      const [updatedSize] = await db
        .update(sizesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sizesTable.id, id))
        .returning();

      if (!updatedSize) {
        throw new NotFoundError("尺寸不存在");
      }
      return updatedSize;
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 删除尺寸
   */
  async delete(ids: number | number[]) {
    try {
      ids = Array.isArray(ids) ? ids : [ids];
      // 1.思考id在不在，优先是数组



      const [deletedSize] = await db
        .delete(sizesTable)
        .where(inArray(sizesTable.id, ids))
        .returning();
      if (!deletedSize) {
        throw new NotFoundError("尺寸不存在");
      }

      return deletedSize;
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }
}
