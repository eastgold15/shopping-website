import { NotFoundError } from "@backend/utils/error/customError";
import { and, asc, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { categoriesSchema } from "../../db/schema";
import { buildTree } from "../../utils/buildTree";
import type { UpdateSortDto } from "../partner";
import type {
	CategoriesQueryDTO,
	CreateCategoryDto,
	UpdateCategoryDto,
} from "./categories.model";

/**
 * 分类服务类
 * 处理分类相关的业务逻辑
 */
export class CategoriesService {
	/**
	 * 创建分类
	 */
	async createCategory(data: CreateCategoryDto) {
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
				.insert(categoriesSchema)
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
				.update(categoriesSchema)
				.set(updateData)
				.where(eq(categoriesSchema.id, id))
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
				.from(categoriesSchema)
				.orderBy(asc(categoriesSchema.sortOrder));

			const tree = buildTree(categories, "id", "parentId");
			return tree;
		} catch (error) {
			console.error("获取分类树失败:", error);
			throw new Error("获取分类树失败");
		}
	}

	/**
	 * 获取分类列表（分页）
	 */
	async getCategoryList(params: CategoriesQueryDTO) {
		try {
			// 1.默认值
			const {
				page = 1,
				pageSize = 10,
				sortBy = "createdAt",
				sortOrder = "desc",
				search,
				name,
				parentId,
				isVisible,
			} = params;

			// 搜索条件构建
			const conditions = [];

			// 搜索条件
			if (search) {
				conditions.push(
					or(
						like(categoriesSchema.name, `%${search}%`),
						like(categoriesSchema.description, `%${search}%`),
					),
				);
			}

			if (name) {
				conditions.push(like(categoriesSchema.name, `%${name}%`));
			}

			if (parentId !== undefined) {
				if (parentId === "null" || parentId === "") {
					conditions.push(isNull(categoriesSchema.parentId));
				} else {
					conditions.push(eq(categoriesSchema.parentId, parseInt(parentId)));
				}
			}

			if (isVisible !== undefined) {
				conditions.push(eq(categoriesSchema.isVisible, isVisible));
			}

			// 排序字段映射
			const sortFieldMap: Record<string, any> = {
				name: categoriesSchema.name,
				sortOrder: categoriesSchema.sortOrder,
				createdAt: categoriesSchema.createdAt,
				updatedAt: categoriesSchema.updatedAt,
			};

			// 确定排序字段和方向
			const sortField = sortFieldMap[sortBy] || categoriesSchema.sortOrder;
			const orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

			// 构建查询
			const queryBuilder = db.select().from(categoriesSchema).orderBy(orderBy);

			// 获取总数
			const totalBuilder = db.select({ count: count() }).from(categoriesSchema);

			if (conditions.length > 0) {
				queryBuilder.where(and(...conditions));
				totalBuilder.where(and(...conditions));
			}

			// 分页
			const offset = (page - 1) * pageSize;
			const categoriesQuery = queryBuilder.limit(pageSize).offset(offset);

			// 查询数据和总数
			const [categories, [{ count: total }]] = await Promise.all([
				categoriesQuery,
				totalBuilder,
			]);

			return {
				items: categories,
				meta: {
					total,
					page,
					pageSize,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		} catch (error) {
			console.error("获取分类列表失败:", error);
			throw new Error("获取分类列表失败");
		}
	}

	/**
	 * 根据ID获取分类详情
	 */
	async getCategoryById(id: number) {
		try {
			const [category] = await db
				.select()
				.from(categoriesSchema)
				.where(eq(categoriesSchema.id, id));
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
				.from(categoriesSchema)
				.where(eq(categoriesSchema.parentId, id))
				.limit(1);

			if (children.length > 0) {
				throw new Error("该分类下还有子分类，无法删除");
			}

			const [result] = await db
				.delete(categoriesSchema)
				.where(eq(categoriesSchema.id, id))
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
	//       .from(categoriesSchema)
	//       .where(eq(categoriesSchema.parentId, id))
	//       .orderBy(asc(categoriesSchema.sortOrder));

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
	async updateCategorySort(id: number, data: UpdateSortDto) {
		try {
			const [result] = await db
				.update(categoriesSchema)
				.set({
					sortOrder: data.sortOrder,
					updatedAt: new Date(),
				})
				.where(eq(categoriesSchema.id, id))
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
				.select({ isVisible: categoriesSchema.isVisible })
				.from(categoriesSchema)
				.where(eq(categoriesSchema.id, id))
				.limit(1);

			if (!isVisible) {
				throw new Error("错误");
			}

			const newVisibility = !isVisible;

			const [result] = await db
				.update(categoriesSchema)
				.set({
					isVisible: newVisibility,
					updatedAt: new Date(),
				})
				.where(eq(categoriesSchema.id, id))
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
				.from(categoriesSchema)
				.where(eq(categoriesSchema.id, id))
				.limit(1);

			const currentCategory = current;

			// 找到同级别中排序值小于当前分类且最接近的分类
			const prevCategory = await db
				.select()
				.from(categoriesSchema)
				.where(
					and(
						currentCategory.parentId
							? eq(categoriesSchema.parentId, currentCategory.parentId)
							: isNull(categoriesSchema.parentId),
						sql`${categoriesSchema.sortOrder} < ${currentCategory.sortOrder}`,
					),
				)
				.orderBy(desc(categoriesSchema.sortOrder))
				.limit(1);

			if (prevCategory.length === 0) {
				throw new Error("已经是第一个了");
			}

			// 交换排序值
			const prevSortOrder = prevCategory[0].sortOrder;
			const currentSortOrder = currentCategory.sortOrder;

			await db.transaction(async (tx) => {
				await tx
					.update(categoriesSchema)
					.set({ sortOrder: prevSortOrder, updatedAt: new Date() })
					.where(eq(categoriesSchema.id, id));

				await tx
					.update(categoriesSchema)
					.set({ sortOrder: currentSortOrder, updatedAt: new Date() })
					.where(eq(categoriesSchema.id, prevCategory[0].id));
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
				.from(categoriesSchema)
				.where(eq(categoriesSchema.id, id))
				.limit(1);

			const currentCategory = current;

			// 找到同级别中排序值大于当前分类且最接近的分类
			const nextCategory = await db
				.select()
				.from(categoriesSchema)
				.where(
					and(
						currentCategory.parentId
							? eq(categoriesSchema.parentId, currentCategory.parentId)
							: isNull(categoriesSchema.parentId),
						sql`${categoriesSchema.sortOrder} > ${currentCategory.sortOrder}`,
					),
				)
				.orderBy(asc(categoriesSchema.sortOrder))
				.limit(1);

			if (nextCategory.length === 0) {
				throw new Error("已经是最后一个了");
			}

			// 交换排序值
			const nextSortOrder = nextCategory[0].sortOrder;
			const currentSortOrder = currentCategory.sortOrder;

			await db.transaction(async (tx) => {
				await tx
					.update(categoriesSchema)
					.set({ sortOrder: nextSortOrder, updatedAt: new Date() })
					.where(eq(categoriesSchema.id, id));

				await tx
					.update(categoriesSchema)
					.set({ sortOrder: currentSortOrder, updatedAt: new Date() })
					.where(eq(categoriesSchema.id, nextCategory[0].id));
			});

			return await this.getCategoryById(id);
		} catch (error) {
			console.error("分类下移失败:", error);
			throw error;
		}
	}
}
