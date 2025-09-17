import { InsertSizeDto, SelectSizeType, sizesTable, attributesModel, UpdateSizeDto } from "@backend/db/models/attribute.model";
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
  like,
  or,
} from "drizzle-orm";
import { db } from "../../db/connection";

/**
 * 尺寸服务类
 * 处理所有尺寸相关的业务逻辑
 */
export class SizesService extends BaseService<
  SelectSizeType,
  InsertSizeDto,
  UpdateSizeDto
> {
  protected readonly table = sizesTable;
  protected readonly tableName = 'sizes';

  constructor() {
    super();
  }

  /**
   * 创建尺寸
   */
  static async create(data: InsertSizeDto) {
    try {
      const result = await db.insert(sizesTable).values(data).returning();
      return result[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取尺寸列表
   */
  static async getList(query: any) {
    try {
      const {
        page = 1,
        pageSize = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        name,
        category,
        isActive,
      } = query;

      // 查询条件
      const conditions = [];
      if (name) {
        conditions.push(or(
          like(sizesTable.name, `%${name}%`),
          like(sizesTable.displayName, `%${name}%`)
        ));
      }
      if (category) {
        conditions.push(eq(sizesTable.category, category));
      }
      if (isActive !== undefined) {
        conditions.push(eq(sizesTable.isActive, isActive === 'true'));
      }

      // 定义允许排序的字段
      const sortFieldMap: Record<string, any> = {
        id: sizesTable.id,
        name: sizesTable.name,
        displayName: sizesTable.displayName,
        category: sizesTable.category,
        sortOrder: sizesTable.sortOrder,
        createdAt: sizesTable.createdAt,
        updatedAt: sizesTable.updatedAt,
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sortBy] || sizesTable.id;
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(sizesTable),
        })
        .from(sizesTable);

      // 获取总数
      const totalBuilder = db
        .select({ count: count() })
        .from(sizesTable);

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
        totalBuilder.where(and(...conditions));
      }

      // 添加排序
      queryBuilder.orderBy(_orderBy);

      // 分页
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      queryBuilder.limit(parseInt(pageSize)).offset(offset);

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
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      };
    } catch (error) {
      console.error("获取尺寸列表失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据ID获取尺寸详情
   */
  static async getById(id: number) {
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
  static async update(id: number, data: UpdateSizeDto) {
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
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 删除尺寸
   */
  static async delete(id: number) {
    try {
      const [deletedSize] = await db
        .delete(sizesTable)
        .where(eq(sizesTable.id, id))
        .returning();

      if (!deletedSize) {
        throw new NotFoundError("尺寸不存在");
      }

      return deletedSize;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}