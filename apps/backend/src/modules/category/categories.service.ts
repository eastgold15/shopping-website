import { handleDatabaseError, InternalServerError, NotFoundError } from "@backend/utils/error/customError";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import {
  categoriesTable,
  type InsertCategoryDto,
  type UpdateCategoryDto
} from "../../db/models";
import { buildTree } from "../../utils/buildTree";

/**
 * 分类服务类
 * 处理分类相关的业务逻辑
 */
export class CategoriesService {
  /**
   * 创建分类
   */
  async createCategory(data: InsertCategoryDto) {
    try {
      // 从 data 中提取对应的字段数据
      const categoryData = {
        ...data,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isVisible: data.isVisible ?? false,
        createdAt: new Date(), // 👈 添加创建时间
        updatedAt: new Date(),
      };
      const [newCategory] = await db
        .insert(categoriesTable)
        .values(categoryData)
        .returning();

      return newCategory;
    } catch (error: any) {
      // 👇 提取原始 PostgreSQL 错误
      const pgError = error.cause;
      handleDatabaseError(pgError)
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDto) {
    try {
      // 从 data 中提取对应的字段数据，只更新提供的字段
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const [updatedCategory] = await db
        .update(categoriesTable)
        .set(updateData)
        .where(eq(categoriesTable.id, id))
        .returning();

      return updatedCategory;
    } catch (error) {
      console.error("更新分类失败:", error);
      throw error;
    }
  }

  /**
   * 获取分类树形结构
   */
  async getCategoryTree() {
    try {
      const categories = await db
        .select()
        .from(categoriesTable)
        .orderBy(asc(categoriesTable.sortOrder));
      const tree = buildTree(categories, "id", "parentId");
      return tree;
    } catch (error) {
      console.error("获取分类树失败:", error);
      throw new Error("获取分类树失败");
    }
  }
  /**
   * 根据ID获取分类详情
   */
  async getCategoryById(id: number) {
    try {
      const [category] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, id));
      if (!category) {
        throw new NotFoundError("分类不存在");
      }
      return category;
    } catch (error) {
      console.error("获取分类详情失败:", error);
      throw error;
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number) {
    try {
      // 检查是否有子分类
      const children = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.parentId, id))
        .limit(1);
      if (children.length > 0) {
        throw new InternalServerError("该分类下还有子分类，无法删除");
      }
      const [result] = await db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("删除分类失败:", error);
      handleDatabaseError(error)
    }
  }

}