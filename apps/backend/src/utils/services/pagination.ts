/**
 * 基于 Drizzle ORM 的 .$dynamic() 函数实现的自定义分页功能
 *
 * 特性：
 * - 支持标准的 limit/offset 分页
 * - 基于 Drizzle ORM .$dynamic() 动态查询构建
 * - 类型安全的 TypeScript 实现
 * - 统一的分页响应格式
 * - 简单易用的 API
 * - 支持软删除查询过滤
 */
import { asc, desc, type SQL } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";
import { pageRes } from "../Res";
import type { QueryScope, SoftDeletableTable } from "../soft-delete/types";
import { QueryScope as QueryScopeEnum } from "../soft-delete/types";
import { notDeleted, onlyDeleted } from "../soft-delete/utils";

/**
 * 分页选项接口
 */
export interface PaginationOptions {
	page: number;
	pageSize: number;
	orderBy?: PgColumn | SQL | SQL.Aliased;
	orderDirection?: "asc" | "desc";
	scope?: QueryScope;
	table?: SoftDeletableTable;
}

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
	code: number;
	message: string;
	data: {
		items: T[];
		meta: {
			total: number;
			page: number;
			pageSize: number;
			totalPages: number;
		};
	};
}

/**
 * 执行分页查询
 * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
 * @param countQuery 计数查询构建器（必须是 .$dynamic() 模式）
 * @param options 分页选项
 * @returns 分页结果
 */
export async function paginate<T>(
	dataQuery: PgSelect,
	countQuery: PgSelect,
	options: PaginationOptions,
): Promise<PaginationResult<T>> {
	const {
		page,
		pageSize,
		orderBy,
		orderDirection = "asc",
		scope = QueryScopeEnum.ACTIVE,
		table,
	} = options;

	// 计算偏移量
	const offset = (page - 1) * pageSize;

	// 应用软删除过滤（如果提供了 table，默认只查询活跃记录）
	let filteredDataQuery = dataQuery;
	let filteredCountQuery = countQuery;

	if (table && "deletedAt" in table) {
		switch (scope) {
			case QueryScopeEnum.ACTIVE:
				filteredDataQuery = dataQuery.where(notDeleted(table));
				filteredCountQuery = countQuery.where(notDeleted(table));
				break;
			case QueryScopeEnum.DELETED:
				filteredDataQuery = dataQuery.where(onlyDeleted(table));
				filteredCountQuery = countQuery.where(onlyDeleted(table));
				break;
			case QueryScopeEnum.ALL:
				// 不添加任何过滤条件，查询所有记录
				break;
		}
	}

	// 构建数据查询
	let finalDataQuery = filteredDataQuery.limit(pageSize).offset(offset);

	// 添加排序
	if (orderBy) {
		finalDataQuery =
			orderDirection === "desc"
				? finalDataQuery.orderBy(desc(orderBy))
				: finalDataQuery.orderBy(asc(orderBy));
	}

	// 并行执行数据查询和计数查询
	const [data, countResult] = await Promise.all([
		finalDataQuery,
		filteredCountQuery,
	]);

	// 提取总数
	const total =
		Array.isArray(countResult) && countResult.length > 0
			? (countResult[0] as any).count || 0
			: 0;

	return pageRes(data as T[], total, page, pageSize, "获取成功");
}

/**
 * 创建可复用的分页器
 * @param dataQuery 数据查询构建器（必须是 .$dynamic() 模式）
 * @param countQuery 计数查询构建器（必须是 .$dynamic() 模式）
 * @param defaultOrderBy 默认排序字段
 * @param table 可选的表信息，用于软删除支持
 * @returns 分页器函数
 */
export function createPaginator<T>(
	dataQuery: PgSelect,
	countQuery: PgSelect,
	defaultOrderBy?: PgColumn | SQL | SQL.Aliased,
	table?: SoftDeletableTable,
) {
	return async (
		options: Partial<PaginationOptions>,
	): Promise<PaginationResult<T>> => {
		const finalOptions: PaginationOptions = {
			page: options.page || 1,
			pageSize: options.pageSize || 10,
			orderBy: options.orderBy || defaultOrderBy,
			orderDirection: options.orderDirection || "asc",
			scope: options.scope,
			table: options.table || table,
		};

		return paginate<T>(dataQuery, countQuery, finalOptions);
	};
}
