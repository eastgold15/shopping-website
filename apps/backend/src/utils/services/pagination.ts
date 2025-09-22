/**
 * 基于 Drizzle ORM 的 .$dynamic() 函数实现的自定义分页功能
 *
 * 特性：
 * - 支持标准的 page/limit 分页
 * - 基于 Drizzle ORM .$dynamic() 动态查询构建
 * - 类型安全的 TypeScript 实现
 * - 统一的分页响应格式
 * - 简单易用的 API
 * - 支持软删除查询过滤
 * - 使用 $count() 方法优化计数查询
 * - 支持多条件合并查询
 * - 确保分页稳定性（建议使用唯一键排序）
 *
 * 使用示例：
 * ```typescript
 * // 基础用法
 * const result = await paginate<User>(
 *   db.select().from(users).$dynamic(),
 *   db.select({ count: count() }).from(users).$dynamic(),
 *   { page: 1, limit: 10, orderBy: users.id }
 * );
 *
 * // 推荐用法（使用 $count 方法）
 * const result = await paginateWithCount<User>(
 *   db,
 *   db.select().from(users).$dynamic(),
 *   { page: 1, limit: 10, orderBy: users.id, table: users }
 * );
 *
 * // 创建可复用分页器
 * const userPaginator = createCountPaginator<User>(
 *   db,
 *   db.select().from(users).$dynamic(),
 *   users.id, // 默认排序字段
 *   users     // 支持软删除
 * );
 * const result = await userPaginator({ page: 1, limit: 10 });
 * ```
 */
import { and, asc, desc, type SQL } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";
import type { PageData, PaginationOptionsType } from "../Res";
import type { SoftDeletableTable } from "../soft-delete/types";
import { QueryScope as QueryScopeEnum } from "../soft-delete/types";
import { createSoftDeleteCondition } from "../soft-delete/utils";

/**
 * 执行分页查询（使用 $count() 方法的优化版本）
 * @param db 数据库实例
 * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
 * @param options 分页选项
 * @returns 分页结果
 */
export async function paginate<T>(
	db: any, // 数据库实例
	dataQuery: PgSelect,
	options: PaginationOptionsType,
): Promise<PageData<T>> {
	const {
		page,
		limit,
		orderBy,
		orderDirection = "asc",
		scope = QueryScopeEnum.ACTIVE,
		table,
	} = options;

	// 验证分页参数
	validatePaginationParams(page, limit);

	// 计算偏移量
	const offset = calculateOffset(page, limit);

	// 构建查询条件数组
	const conditions: (SQL | undefined)[] = [];

	// 添加软删除条件（如果提供了 table）
	if (table && "deletedAt" in table) {
		const softDeleteCondition = createSoftDeleteCondition(table, scope);
		if (softDeleteCondition) {
			conditions.push(softDeleteCondition);
		}
	}

	// 合并所有条件
	const whereCondition =
		conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined;

	// 应用条件到数据查询
	let filteredDataQuery = dataQuery;
	if (whereCondition) {
		filteredDataQuery = dataQuery.where(whereCondition);
	}

	// 构建最终数据查询
	let finalDataQuery = filteredDataQuery.limit(limit).offset(offset);

	// 添加排序（建议使用唯一键如主键确保分页稳定性）
	if (orderBy) {
		finalDataQuery =
			orderDirection === "desc"
				? finalDataQuery.orderBy(desc(orderBy))
				: finalDataQuery.orderBy(asc(orderBy));
	}

	// 创建计数查询（使用相同的条件）
	const countQuery = filteredDataQuery;

	// 并行执行数据查询和计数查询
	const [data, total] = await Promise.all([
		finalDataQuery,
		db.$count(countQuery), // 使用 Drizzle 官方推荐的 $count() 方法
	]);

	return {
		items: data as T[],
		meta: buildPageMeta(total, page, limit),
	};
}

/**
 * 创建可复用的分页器
 * @param db 数据库实例
 * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
 * @param defaultOrderBy 默认排序字段
 * @param table 可选的表信息，用于软删除支持
 * @returns 分页器函数
 */
export function createPaginator<T>(
	db: any,
	dataQuery: PgSelect,
	defaultOrderBy?: PgColumn | SQL | SQL.Aliased,
	table?: SoftDeletableTable,
) {
	return async (
		options: Partial<PaginationOptionsType>,
	): Promise<PageData<T>> => {
		const finalOptions: PaginationOptionsType = {
			page: options.page || 1,
			limit: options.limit || 10,
			orderBy: options.orderBy || defaultOrderBy,
			orderDirection: options.orderDirection || "asc",
			scope: options.scope,
			table: options.table || table,
		};

		return paginate<T>(db, dataQuery, finalOptions);
	};
}

/**
 * 验证分页参数
 * @param page 页码
 * @param limit 每页大小
 * @throws Error 当参数无效时抛出错误
 */
export function validatePaginationParams(page: number, limit: number): void {
	if (!Number.isInteger(page) || page < 1) {
		throw new Error("页码必须是大于等于1的整数");
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		throw new Error("每页大小必须是1-100之间的整数");
	}
}

/**
 * 计算分页偏移量
 * @param page 页码
 * @param limit 每页大小
 * @returns 偏移量
 */
export function calculateOffset(page: number, limit: number): number {
	return (page - 1) * limit;
}

/**
 * 计算总页数
 * @param total 总记录数
 * @param limit 每页大小
 * @returns 总页数
 */
export function calculateTotalPages(total: number, limit: number): number {
	return Math.ceil(total / limit);
}

/**
 * 构建分页元数据
 * @param total 总记录数
 * @param page 当前页码
 * @param limit 每页大小
 * @returns 分页元数据
 */
export function buildPageMeta(total: number, page: number, limit: number) {
	return {
		total,
		page,
		limit,
		totalPages: calculateTotalPages(total, limit),
	};
}
