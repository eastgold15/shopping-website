// 基础Service类，提供通用的CRUD操作

import type {
	DeleteOptions,
	PaginationParams,
	QueryFilter,
	QueryOptions,
	SortOption,
	UpdateOptions,
} from "@backend/types";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	like,
	lt,
	lte,
	ne,
	type SQL,
} from "drizzle-orm";
import { db } from "../../db/connection";
import {
	DatabaseError,
	handleDatabaseError,
	NotFoundError,
	ValidationError,
} from "../error/customError";
import type { PageData } from "../Res";
import { paginate } from "./pagination";
/**
 * 基础Service类，提供通用的CRUD操作
 * 移除了验证逻辑（由Controller层处理）
 */
export abstract class BaseService<
	T extends Record<string, any>,
	CreateInput extends Record<string, any>,
	UpdateInput extends Partial<CreateInput>,
> {
	protected abstract readonly table: any;
	protected abstract readonly tableName: string;

	/**
	 * 创建记录
	 */
	/**
	 * 创建单条记录 - 修复版本
	 */
	async create(data: CreateInput): Promise<T> {
		try {
			// 明确指定返回类型
			const result = await db
				.insert(this.table)
				.values(data as any)
				.returning();

			// 检查返回的是数组
			if (!Array.isArray(result) || result.length === 0) {
				throw new DatabaseError("Failed to create record");
			}

			return result[0] as T;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 批量创建记录 - 修复版本
	 */
	async createMany(data: CreateInput[]): Promise<T[]> {
		if (!data || data.length === 0) {
			throw new ValidationError("No data provided for batch creation");
		}

		try {
			const result = await db
				.insert(this.table)
				.values(data as any)
				.returning();

			if (!Array.isArray(result)) {
				throw new DatabaseError("Failed to create records");
			}

			return result as T[];
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据ID查找记录
	 */
	async findById(id: number): Promise<T | null> {
		const [result] = await db
			.select()
			.from(this.table)
			.where(eq(this.table.id, id))
			.limit(1);

		return (result as T) || null;
	}

	/**
	 * 根据ID查找记录或抛出错误
	 */
	async findByIdOrThrow(id: number): Promise<T> {
		const result = await this.findById(id);

		if (!result) {
			throw new NotFoundError(`Record with id ${id} not found`);
		}

		return result;
	}

	/**
	 * 根据条件查找单条记录
	 */
	async findOne(filters: QueryFilter[]): Promise<T | null> {
		const whereClause = this.buildWhereClause(filters);

		const [result] = await db
			.select()
			.from(this.table)
			.where(whereClause)
			.limit(1);

		return (result as T) || null;
	}

	/**
	 * 查询多条记录
	 */
	async findMany(queryOptions: QueryOptions = {}): Promise<T[]> {
		const whereClause = this.buildWhereClause(queryOptions.filters || []);
		const orderByClause = this.buildOrderByClause(queryOptions.sort || []);

		const query = db.select().from(this.table);

		if (whereClause) {
			query.where(whereClause);
		}

		if (orderByClause.length > 0) {
			query.orderBy(...orderByClause);
		}

		return (await query) as T[];
	}

	/**
	 * 分页查询 - 使用统一的分页函数
	 */
	async findPaginated(
		pagination: PaginationParams,
		queryOptions: QueryOptions = {},
	): Promise<PageData<T>> {
		const { page = 1, limit = 10 } = pagination;

		const whereClause = this.buildWhereClause(queryOptions.filters || []);
		const _orderByClause = this.buildOrderByClause(queryOptions.sort || []);

		// 构建基础查询
		let baseQuery = db.select().from(this.table).$dynamic();

		// 应用查询条件
		if (whereClause) {
			baseQuery = baseQuery.where(whereClause);
		}

		// 确定排序字段
		let orderBy = this.table.id; // 默认使用id排序
		let orderDirection: "asc" | "desc" = "asc";

		if (queryOptions.sort && queryOptions.sort.length > 0) {
			const firstSort = queryOptions.sort[0];
			orderBy = this.table[firstSort.field];
			orderDirection = firstSort.direction;
		}

		// 使用统一的分页函数
		return await paginate<T>(db, baseQuery, {
			page,
			limit,
			orderBy,
			orderDirection,
		});
	}

	/**
	 * 更新记录
	 */
	async update(
		id: number,
		data: UpdateInput,
		options: UpdateOptions = {},
	): Promise<T> {
		// 检查记录是否存在
		const existing = await this.findById(id);
		if (!existing) {
			throw new NotFoundError(`Record with id ${id} not found`);
		}

		const [result] = await db
			.update(this.table)
			.set(data)
			.where(eq(this.table.id, id))
			.returning();

		if (!result) {
			throw new DatabaseError("Failed to update record");
		}

		return result as T;
	}

	/**
	 * 删除记录
	 */
	async delete(id: number, options: DeleteOptions = {}): Promise<boolean> {
		// 检查记录是否存在
		const existing = await this.findById(id);
		if (!existing) {
			throw new NotFoundError(`Record with id ${id} not found`);
		}

		const dbInstance = options.transaction || db;

		const result = await dbInstance
			.delete(this.table)
			.where(eq(this.table.id, id))
			.returning({ id: this.table.id });

		return result.length > 0;
	}

	/**
	 * 批量删除记录
	 */
	async deleteBatch(ids: number[]): Promise<number> {
		if (!ids || ids.length === 0) {
			throw new ValidationError("No IDs provided for batch deletion");
		}

		const result = await db
			.delete(this.table)
			.where(inArray(this.table.id, ids))
			.returning({ id: this.table.id });

		return result.length;
	}

	/**
	 * 统计记录数量
	 */
	async count(filters: QueryFilter[] = []): Promise<number> {
		const whereClause = this.buildWhereClause(filters);

		const query = db.select({ count: this.table.id }).from(this.table);

		if (whereClause) {
			query.where(whereClause);
		}

		const result = await query;
		return Number(result[0]?.count || 0);
	}

	/**
	 * 检查记录是否存在
	 */
	async exists(id: number): Promise<boolean> {
		const result = await this.findById(id);
		return !!result;
	}

	/**
	 * 构建查询条件
	 */
	protected buildWhereClause(filters: QueryFilter[]): SQL | undefined {
		if (!filters || filters.length === 0) {
			return undefined;
		}

		const conditions = filters.map((filter) => {
			const { field, operator, value } = filter;
			const column = this.table[field];

			if (!column) {
				throw new ValidationError(`Invalid field: ${field}`);
			}

			switch (operator) {
				case "eq":
					return eq(column, value);
				case "ne":
					return ne(column, value);
				case "gt":
					return gt(column, value);
				case "gte":
					return gte(column, value);
				case "lt":
					return lt(column, value);
				case "lte":
					return lte(column, value);
				case "like":
					return like(column, `%${value}%`);
				case "in":
					return inArray(column, value);
				default:
					throw new ValidationError(`Unsupported operator: ${operator}`);
			}
		});

		return conditions.length > 1 ? and(...conditions) : conditions[0];
	}

	/**
	 * 构建排序条件
	 */
	protected buildOrderByClause(sortOptions: SortOption[]): any[] {
		if (!sortOptions || sortOptions.length === 0) {
			return [];
		}

		return sortOptions.map((option) => {
			const { field, direction } = option;
			const column = this.table[field];

			if (!column) {
				throw new ValidationError(`Invalid sort field: ${field}`);
			}

			return direction === "asc" ? asc(column) : desc(column);
		});
	}
}
