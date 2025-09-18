import {
	attributesModel,
	colorsTable,
	type InsertColorDto,
	type SelectColorType,
	type UpdateColorDto,
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
	like,
	or,
} from "drizzle-orm";
import { db } from "../../db/connection";

/**
 * 颜色服务类
 * 处理所有颜色相关的业务逻辑
 */
export class ColorsService extends BaseService<
	SelectColorType,
	InsertColorDto,
	UpdateColorDto
> {
	protected readonly table = colorsTable;
	protected readonly tableName = "colors";

	constructor() {
		super();
	}

	/**
	 * 创建颜色
	 */
	static async create(data: InsertColorDto) {
		try {
			const result = await db.insert(colorsTable).values(data).returning();
			return result[0];
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 获取颜色列表
	 */
	static async getList(query: any) {
		try {
			const {
				page = 1,
				pageSize = 10,
				sortBy = "createdAt",
				sortOrder = "desc",
				name,
				isActive,
			} = query;

			// 查询条件
			const conditions = [];
			if (name) {
				conditions.push(
					or(
						like(colorsTable.name, `%${name}%`),
						like(colorsTable.displayName, `%${name}%`),
					),
				);
			}
			if (isActive !== undefined) {
				conditions.push(eq(colorsTable.isActive, isActive === "true"));
			}

			// 定义允许排序的字段
			const sortFieldMap: Record<string, any> = {
				id: colorsTable.id,
				name: colorsTable.name,
				displayName: colorsTable.displayName,
				sortOrder: colorsTable.sortOrder,
				createdAt: colorsTable.createdAt,
				updatedAt: colorsTable.updatedAt,
			};

			// 确定排序字段和方向
			const sortField = sortFieldMap[sortBy] || colorsTable.id;
			const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

			// 构建查询
			const queryBuilder = db
				.select({
					...getTableColumns(colorsTable),
				})
				.from(colorsTable);

			// 获取总数
			const totalBuilder = db.select({ count: count() }).from(colorsTable);

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
			const [rawColors, totalResult] = await Promise.all([
				queryBuilder,
				totalBuilder,
			]);

			const total = totalResult[0]?.count || 0;

			return {
				items: rawColors,
				meta: {
					total,
					page: parseInt(page),
					pageSize: parseInt(pageSize),
					totalPages: Math.ceil(total / parseInt(pageSize)),
				},
			};
		} catch (error) {
			console.error("获取颜色列表失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据ID获取颜色详情
	 */
	static async getById(id: number) {
		try {
			const [color] = await db
				.select()
				.from(colorsTable)
				.where(eq(colorsTable.id, id));

			if (!color) {
				throw new NotFoundError("颜色不存在");
			}

			return color;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 更新颜色
	 */
	static async update(id: number, data: UpdateColorDto) {
		try {
			const [updatedColor] = await db
				.update(colorsTable)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(colorsTable.id, id))
				.returning();

			if (!updatedColor) {
				throw new NotFoundError("颜色不存在");
			}

			return updatedColor;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 删除颜色
	 */
	static async delete(id: number) {
		try {
			const [deletedColor] = await db
				.delete(colorsTable)
				.where(eq(colorsTable.id, id))
				.returning();

			if (!deletedColor) {
				throw new NotFoundError("颜色不存在");
			}

			return deletedColor;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}
}
