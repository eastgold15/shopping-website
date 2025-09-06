// /**
//  * 基于 Drizzle ORM 的 .$dynamic() 函数实现的自定义分页功能
//  *
//  * 特性：
//  * - 支持标准的 limit/offset 分页
//  * - 基于 Drizzle ORM .$dynamic() 动态查询构建
//  * - 类型安全的 TypeScript 实现
//  * - 统一的分页响应格式
//  * - 简单易用的 API
//  * - 支持软删除查询过滤
//  */
// import { asc, desc, SQL } from "drizzle-orm";
// import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";
// import type { QueryScope, SoftDeletableTable } from "../soft-delete/types";
// import { notDeleted, onlyDeleted } from "../soft-delete";

// /**
//  * 分页查询参数接口
//  */
// export interface PaginationParams {
// 	page?: number;
// 	pageSize?: number;
// }

// /**
//  * 分页选项接口
//  */
// export interface PaginationOptions {
// 	page: number;
// 	pageSize: number;
// 	orderBy?: PgColumn | SQL | SQL.Aliased;
// 	orderDirection?: "asc" | "desc";
// 	scope?: QueryScope;
// 	table?: SoftDeletableTable;
// }

// /**
//  * 分页结果接口
//  */
// export interface PaginationResult<T> {
// 	data: T[];
// 	total: number;
// 	page: number;
// 	pageSize: number;
// 	totalPages: number;
// 	hasNext: boolean;
// 	hasPrev: boolean;
// }

// /**
//  * 解析分页查询参数
//  * @param query 查询参数对象
//  * @param defaultPageSize 默认每页大小
//  * @returns 解析后的分页参数
//  */
// export function parsePaginationQuery(
// 	query: Record<string, any>,
// 	defaultPageSize = 10,
// ): { page: number; pageSize: number } {
// 	const page = Math.max(1, Number(query.page) || 1);
// 	const pageSize = Math.min(
// 		100,
// 		Math.max(1, Number(query.pageSize) || defaultPageSize),
// 	);

// 	return { page, pageSize };
// }

// /**
//  * 执行分页查询
//  * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
//  * @param countQuery 计数查询构建器（必须是 .$dynamic() 模式）
//  * @param options 分页选项
//  * @returns 分页结果
//  */
// export async function paginate<T>(
// 	dataQuery: PgSelect,
// 	countQuery: PgSelect,
// 	options: PaginationOptions,
// ): Promise<PaginationResult<T>> {
// 	const {
// 		page,
// 		pageSize,
// 		orderBy,
// 		orderDirection = "asc",
// 		scope = "active",
// 		table,
// 	} = options;

// 	// 验证参数
// 	if (page < 1) {
// 		throw new Error("页码必须大于 0");
// 	}

// 	if (pageSize < 1 || pageSize > 100) {
// 		throw new Error("每页大小必须在 1-100 之间");
// 	}

// 	// 计算偏移量
// 	const offset = (page - 1) * pageSize;

// 	// 应用软删除过滤（如果提供了 table，默认只查询活跃记录）
// 	let filteredDataQuery = dataQuery;
// 	let filteredCountQuery = countQuery;

// 	if (table && "deletedAt" in table) {
// 		switch (scope) {
// 			case "active":
// 				filteredDataQuery = dataQuery.where(notDeleted(table));
// 				filteredCountQuery = countQuery.where(notDeleted(table));
// 				break;
// 			case "deleted":
// 				filteredDataQuery = dataQuery.where(onlyDeleted(table));
// 				filteredCountQuery = countQuery.where(onlyDeleted(table));
// 				break;
// 			case "all":
// 				// 不添加任何过滤条件，查询所有记录
// 				break;
// 		}
// 	}

// 	// 构建数据查询
// 	let finalDataQuery = filteredDataQuery.limit(pageSize).offset(offset);

// 	// 添加排序
// 	if (orderBy) {
// 		finalDataQuery =
// 			orderDirection === "desc"
// 				? finalDataQuery.orderBy(desc(orderBy))
// 				: finalDataQuery.orderBy(asc(orderBy));
// 	}

// 	// 并行执行数据查询和计数查询
// 	const [data, countResult] = await Promise.all([
// 		finalDataQuery,
// 		filteredCountQuery,
// 	]);

// 	// 提取总数
// 	const total =
// 		Array.isArray(countResult) && countResult.length > 0
// 			? (countResult[0] as any).count || 0
// 			: 0;

// 	// 计算分页信息
// 	const totalPages = Math.ceil(total / pageSize);
// 	const hasNext = page < totalPages;
// 	const hasPrev = page > 1;

// 	return {
// 		data: data as T[],
// 		total,
// 		page,
// 		pageSize,
// 		totalPages,
// 		hasNext,
// 		hasPrev,
// 	};
// }

// /**
//  * 创建可复用的分页器
//  * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
//  * @param countQuery 计数查询构建器（必须是 .$dynamic() 模式）
//  * @param defaultOrderBy 默认排序字段
//  * @param table 可选的表信息，用于软删除支持
//  * @returns 分页器函数
//  */
// export function createPaginator<T>(
// 	dataQuery: PgSelect,
// 	countQuery: PgSelect,
// 	defaultOrderBy?: PgColumn | SQL | SQL.Aliased,
// 	table?: SoftDeletableTable,
// ) {
// 	return async (
// 		options: Partial<PaginationOptions>,
// 	): Promise<PaginationResult<T>> => {
// 		const finalOptions: PaginationOptions = {
// 			page: options.page || 1,
// 			pageSize: options.pageSize || 10,
// 			orderBy: options.orderBy || defaultOrderBy,
// 			orderDirection: options.orderDirection || "asc",
// 			scope: options.scope,
// 			table: options.table || table,
// 		};

// 		return paginate<T>(dataQuery, countQuery, finalOptions);
// 	};
// }
