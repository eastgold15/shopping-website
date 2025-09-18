import { NotFoundError } from "@backend/utils/error/customError";
import { paginate } from "@backend/utils/services/pagination";
import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { categoriesTable, CategoryListQueryDto, InsertCategoryDto, UpdateCategoryDto } from "../../db/models";
import { UpdateSortDtoType } from "../../db/models/utils";
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
        isVisible: data.isVisible ?? true,
        updatedAt: new Date(),
      };

      const [newCategory] = await db
        .insert(categoriesTable)
        .values(categoryData)
        .returning();

      return newCategory;
    } catch (error) {
      console.error("创建分类失败:", error);
      throw new Error("创建分类失败");
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
   * 获取分类列表（分页）- 使用统一的分页函数
   */
  async getCategoryList(params: CategoryListQueryDto) {
    try {
      // 1.默认值
      const {
        page = 1,
        limit = 10,
        sort = "createdAt",
        sortOrder = "desc",
        search,
        name,
        parentId,
        isVisible,
      } = params;

      // 构建基础查询
      let baseQuery = db.select().from(categoriesTable).$dynamic();

      // 搜索条件构建
      const conditions = [];

      // 搜索条件
      if (search) {
        conditions.push(
          or(
            like(categoriesTable.name, `%${search}%`),
            like(categoriesTable.description, `%${search}%`),
          ),
        );
      }

      if (name) {
        conditions.push(like(categoriesTable.name, `%${name}%`));
      }

      if (parentId !== undefined) {
        if (parentId === "null" || parentId === "") {
          conditions.push(isNull(categoriesTable.parentId));
        } else {
          conditions.push(eq(categoriesTable.parentId, parseInt(parentId)));
        }
      }

      if (isVisible !== undefined) {
        conditions.push(eq(categoriesTable.isVisible, isVisible));
      }

      // 应用查询条件
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      // 排序字段映射
      const sortFieldMap: Record<string, any> = {
        name: categoriesTable.name,
        sortOrder: categoriesTable.sortOrder,
        createdAt: categoriesTable.createdAt,
        updatedAt: categoriesTable.updatedAt,
      };

      // 确定排序字段和方向
      const orderBy = sortFieldMap[sort] || categoriesTable.sortOrder;
      const orderDirection = sortOrder as "asc" | "desc";

      // 使用统一的分页函数
      return await paginate(db, baseQuery, {
        page,
        limit,
        orderBy,
        orderDirection,
      });
    } catch (error) {
      console.error("获取分类列表失败:", error);
      throw new Error("获取分类列表失败");
    }
  }

  /**
   * 获取所有分类列表（不分页）
   * 主要用于前端展示，支持树形结构
   */
  async allCategories(params: { includeInvisible?: boolean }) {
    try {
      const { includeInvisible = false } = params;

      // 构建查询条件
      const conditions = [];

      // 默认只显示可见的分类
      if (!includeInvisible) {
        conditions.push(eq(categoriesTable.isVisible, true));
      }

      // 查询所有分类
      const queryBuilder = db
        .select()
        .from(categoriesTable)
        .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
      }

      const categories = await queryBuilder;

      // 构建树形结构
      const tree = buildTree(categories, "id", "parentId");

      return tree;
    } catch (error) {
      console.error("获取分类列表失败:", error);
      throw new Error("获取分类列表失败");
    }
  }

  /**
   * 获取分类列表（分页）
   * 遵循命名规范：listXxx 用于分页查询
   */
  async listCategories(params: any) {
    return this.getCategoryList(params);
  }

  /**
   * 获取分类列表（兼容旧方法名）
   */
  async getList(params: any) {
    return this.getCategoryList(params);
  }

  /**
   * 获取所有分类列表（兼容旧方法名）
   */
  async getAllList(params: { includeInvisible?: boolean }) {
    return this.allCategories(params);
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
        throw new Error("该分类下还有子分类，无法删除");
      }

      const [result] = await db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, id))
        .returning();

      if (!result) {
        throw new NotFoundError("分类不存在");
      }
      return result;
    } catch (error) {
      console.error("删除分类失败:", error);
      throw error;
    }
  }

  // /**
  //  * 获取分类的子分类
  //  */
  // async getCategoryChildren(id: number) {
  //   try {
  //     const children = await db
  //       .select()
  //       .from(categoriesTable)
  //       .where(eq(categoriesTable.parentId, id))
  //       .orderBy(asc(categoriesTable.sortOrder));

  //     return children.map((child) => ({
  //       ...child,
  //       id: child.id.toString(),
  //       parentId: child.parentId?.toString(),
  //     }));
  //   } catch (error) {
  //     console.error("获取子分类失败:", error);
  //     throw new Error("获取子分类失败");
  //   }
  // }

  /**
   * 更新分类排序
   */
  async updateCategorySort(id: number, data: UpdateSortDtoType) {
    try {
      const [result] = await db
        .update(categoriesTable)
        .set({
          sortOrder: data.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(categoriesTable.id, id))
        .returning();

      return result;
    } catch (error) {
      console.error("更新分类排序失败:", error);
      throw error;
    }
  }

  /**
   * 切换分类可见性
   */
  async toggleCategoryVisibility(id: number) {
    try {
      // 先获取当前状态
      const [isVisible] = await db
        .select({ isVisible: categoriesTable.isVisible })
        .from(categoriesTable)
        .where(eq(categoriesTable.id, id))
        .limit(1);

      if (!isVisible) {
        throw new Error("错误");
      }

      const newVisibility = !isVisible;

      const [result] = await db
        .update(categoriesTable)
        .set({
          isVisible: newVisibility,
          updatedAt: new Date(),
        })
        .where(eq(categoriesTable.id, id))
        .returning();

      return result;
    } catch (error) {
      console.error("切换分类可见性失败:", error);
      throw error;
    }
  }

  /**
   * 分类上移
   */
  async moveCategoryUp(id: number) {
    try {
      const [current] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, id))
        .limit(1);

      const currentCategory = current;

      // 找到同级别中排序值小于当前分类且最接近的分类
      const prevCategory = await db
        .select()
        .from(categoriesTable)
        .where(
          and(
            currentCategory.parentId
              ? eq(categoriesTable.parentId, currentCategory.parentId)
              : isNull(categoriesTable.parentId),
            sql`${categoriesTable.sortOrder} < ${currentCategory.sortOrder}`,
          ),
        )
        .orderBy(desc(categoriesTable.sortOrder))
        .limit(1);

      if (prevCategory.length === 0) {
        throw new Error("已经是第一个了");
      }

      // 交换排序值
      const prevSortOrder = prevCategory[0].sortOrder;
      const currentSortOrder = currentCategory.sortOrder;

      await db.transaction(async (tx) => {
        await tx
          .update(categoriesTable)
          .set({ sortOrder: prevSortOrder, updatedAt: new Date() })
          .where(eq(categoriesTable.id, id));

        await tx
          .update(categoriesTable)
          .set({ sortOrder: currentSortOrder, updatedAt: new Date() })
          .where(eq(categoriesTable.id, prevCategory[0].id));
      });

      return await this.getCategoryById(id);
    } catch (error) {
      console.error("分类上移失败:", error);
      throw error;
    }
  }

  /**
   * 分类下移
   */
  async moveCategoryDown(id: number) {
    try {
      const [current] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, id))
        .limit(1);

      const currentCategory = current;

      // 找到同级别中排序值大于当前分类且最接近的分类
      const nextCategory = await db
        .select()
        .from(categoriesTable)
        .where(
          and(
            currentCategory.parentId
              ? eq(categoriesTable.parentId, currentCategory.parentId)
              : isNull(categoriesTable.parentId),
            sql`${categoriesTable.sortOrder} > ${currentCategory.sortOrder}`,
          ),
        )
        .orderBy(asc(categoriesTable.sortOrder))
        .limit(1);

      if (nextCategory.length === 0) {
        throw new Error("已经是最后一个了");
      }

      // 交换排序值
      const nextSortOrder = nextCategory[0].sortOrder;
      const currentSortOrder = currentCategory.sortOrder;

      await db.transaction(async (tx) => {
        await tx
          .update(categoriesTable)
          .set({ sortOrder: nextSortOrder, updatedAt: new Date() })
          .where(eq(categoriesTable.id, id));

        await tx
          .update(categoriesTable)
          .set({ sortOrder: currentSortOrder, updatedAt: new Date() })
          .where(eq(categoriesTable.id, nextCategory[0].id));
      });

      return await this.getCategoryById(id);
    } catch (error) {
      console.error("分类下移失败:", error);
      throw error;
    }
  }
}
