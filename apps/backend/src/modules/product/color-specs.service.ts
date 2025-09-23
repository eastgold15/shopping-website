import { colorSpecsTable, type InsertColorSpecDto, type UpdateColorSpecDto, type ColorSpecListQueryDto } from "@backend/db/models/color-spec.model";
import { handleDatabaseError, NotFoundError } from "@backend/utils/error/customError";
import { and, asc, count, desc, eq, getTableColumns, like, or } from "drizzle-orm";
import { db } from "../../db/connection";

/**
 * 颜色规格服务类
 * 处理所有颜色规格相关的业务逻辑
 */
export class ColorSpecsService {
  /**
   * 创建颜色规格
   */
  async create(data: InsertColorSpecDto) {
    try {
      const result = await db.insert(colorSpecsTable).values(data).returning();
      return result[0];
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 获取颜色规格列表
   */
  async getList(query: ColorSpecListQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "createdAt",
        sortOrder = "desc",
        productId,
        name,
        isActive,
      } = query;

      // 查询条件
      const conditions = [];
      if (productId) {
        conditions.push(eq(colorSpecsTable.productId, productId));
      }
      if (name) {
        conditions.push(like(colorSpecsTable.name, `%${name}%`));
      }
      if (isActive !== undefined) {
        conditions.push(eq(colorSpecsTable.isActive, isActive));
      }

      // 定义允许排序的字段
      const sortFieldMap: Record<string, any> = {
        id: colorSpecsTable.id,
        name: colorSpecsTable.name,
        productId: colorSpecsTable.productId,
        sortOrder: colorSpecsTable.sortOrder,
        createdAt: colorSpecsTable.createdAt,
        updatedAt: colorSpecsTable.updatedAt,
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sort] || colorSpecsTable.createdAt;
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(colorSpecsTable),
        })
        .from(colorSpecsTable);

      // 获取总数
      const totalBuilder = db.select({ count: count() }).from(colorSpecsTable);

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
      const [rawColorSpecs, totalResult] = await Promise.all([
        queryBuilder,
        totalBuilder,
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        items: rawColorSpecs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("获取颜色规格列表失败:", error);
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 获取所有颜色规格（不分页）
   */
  async getAll(query: any = {}) {
    try {
      const {
        sort = "sortOrder",
        sortOrder = "asc",
        productId,
        name,
        isActive,
      } = query;

      // 查询条件
      const conditions = [];
      if (productId) {
        conditions.push(eq(colorSpecsTable.productId, productId));
      }
      if (name) {
        conditions.push(like(colorSpecsTable.name, `%${name}%`));
      }
      if (isActive !== undefined) {
        conditions.push(eq(colorSpecsTable.isActive, isActive === "true"));
      }

      // 定义允许排序的字段
      const sortFieldMap: Record<string, any> = {
        id: colorSpecsTable.id,
        name: colorSpecsTable.name,
        productId: colorSpecsTable.productId,
        sortOrder: colorSpecsTable.sortOrder,
        createdAt: colorSpecsTable.createdAt,
        updatedAt: colorSpecsTable.updatedAt,
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sort] || colorSpecsTable.sortOrder;
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(colorSpecsTable),
        })
        .from(colorSpecsTable);

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
      }

      // 添加排序
      queryBuilder.orderBy(_orderBy);

      // 查询所有数据（不分页）
      const rawColorSpecs = await queryBuilder;
      
      return rawColorSpecs;
    } catch (error: any) {
      console.error("获取所有颜色规格失败:", error);
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 根据ID获取颜色规格详情
   */
  async getById(id: number) {
    try {
      const [colorSpec] = await db
        .select()
        .from(colorSpecsTable)
        .where(eq(colorSpecsTable.id, id));
      if (!colorSpec) {
        throw new NotFoundError("颜色规格不存在");
      }
      return colorSpec;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据商品ID获取颜色规格列表
   */
  async getByProductId(productId: number) {
    try {
      const colorSpecs = await db
        .select()
        .from(colorSpecsTable)
        .where(
          and(
            eq(colorSpecsTable.productId, productId),
            eq(colorSpecsTable.isActive, true)
          )
        )
        .orderBy(asc(colorSpecsTable.sortOrder));

      return colorSpecs;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新颜色规格
   */
  async update(id: number, data: UpdateColorSpecDto) {
    try {
      const [updatedColorSpec] = await db
        .update(colorSpecsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(colorSpecsTable.id, id))
        .returning();

      if (!updatedColorSpec) {
        throw new NotFoundError("颜色规格不存在");
      }
      return updatedColorSpec;
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 删除颜色规格
   */
  async delete(id: number) {
    try {
      const [deletedColorSpec] = await db
        .delete(colorSpecsTable)
        .where(eq(colorSpecsTable.id, id))
        .returning();

      if (!deletedColorSpec) {
        throw new NotFoundError("颜色规格不存在");
      }
      return deletedColorSpec;
    } catch (error: any) {
      throw handleDatabaseError(error.cause);
    }
  }

  /**
   * 批量创建颜色规格
   */
  async batchCreate(productId: number, colorSpecs: Array<Omit<InsertColorSpecDto, 'productId'>>) {
    try {
      const colorSpecsWithProductId = colorSpecs.map(spec => ({
        ...spec,
        productId,
      }));

      const createdColorSpecs = await db.transaction(async (tx) => {
        const results = [];
        for (const specData of colorSpecsWithProductId) {
          const [newColorSpec] = await tx
            .insert(colorSpecsTable)
            .values(specData)
            .returning();
          results.push(newColorSpec);
        }
        return results;
      });

      return {
        createdCount: createdColorSpecs.length,
        colorSpecs: createdColorSpecs,
      };
    } catch (error) {
      console.error("批量创建颜色规格失败:", error);
      throw handleDatabaseError(error);
    }
  }
}