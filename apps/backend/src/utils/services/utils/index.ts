// Service层工具函数

import type { QueryFilter, SortOption } from "@backend/types";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	like,
	lte,
	ne,
	type SQL,
} from "drizzle-orm";
import { ValidationError } from "../../error/customError";

/**
 * 构建查询条件
 */
export function buildWhereClause(
	filters: QueryFilter[],
	schema: any,
): SQL | undefined {
	if (!filters || filters.length === 0) {
		return undefined;
	}

	const conditions = filters.map((filter) => {
		const { field, operator, value } = filter;
		const column = schema[field];

		if (!column) {
			throw new ValidationError(`无效字段: ${field}`);
		}

		switch (operator) {
			case "eq":
				return eq(column, value);
			case "ne":
				return ne(column, value);
			case "gt":
				return gte(column, value);
			case "gte":
				return gte(column, value);
			case "lt":
				return lte(column, value);
			case "lte":
				return lte(column, value);
			case "like":
				return like(column, `%${value}%`);
			case "in":
				return inArray(column, value);
			case "nin":
				return ne(column, value);
			default:
				throw new ValidationError(`不支持的操作符: ${operator}`);
		}
	});

	return conditions.length > 1 ? and(...conditions) : conditions[0];
}

/**
 * 构建排序条件
 */
export function buildOrderByClause(sortOptions: SortOption[], schema: any) {
	if (!sortOptions || sortOptions.length === 0) {
		return [];
	}

	return sortOptions.map((option) => {
		const { field, direction } = option;
		const column = schema[field];

		if (!column) {
			throw new ValidationError(`无效排序字段: ${field}`);
		}

		return direction === "asc" ? asc(column) : desc(column);
	});
}

/**
 * 验证必填字段
 */
export function validateRequired(data: any, requiredFields: string[]): void {
	const missingFields = requiredFields.filter((field) => {
		const value = data[field];
		return value === undefined || value === null || value === "";
	});

	if (missingFields.length > 0) {
		throw new ValidationError(`缺少必填字段: ${missingFields.join(", ")}`);
	}
}

/**
 * 构建查询选项
 */
export function buildQueryOptions(query: any) {
	const options: any = {};

	// 分页参数
	if (query.page !== undefined) {
		options.page = parseInt(query.page);
	}
	if (query.limit !== undefined) {
		options.limit = parseInt(query.limit);
	}

	// 排序参数
	if (query.sortBy !== undefined) {
		options.sort = [
			{
				field: query.sortBy,
				direction: query.sortOrder || "asc",
			},
		];
	}

	// 搜索参数
	if (query.search !== undefined) {
		options.search = query.search;
	}

	// 其他过滤器
	Object.keys(query).forEach((key) => {
		if (!["page", "limit", "sortBy", "sortOrder", "search"].includes(key)) {
			options[key] = query[key];
		}
	});

	return options;
}
