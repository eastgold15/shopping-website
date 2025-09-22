// 后端统一类型导出文件
// 为前端提供唯一的事实来源

export * from "@backend/utils/Res";
export * from "../db/common.model";
export * from "../db/models";
export * from "../db/models/attribute.model"; // 添加属性模型导出
export * from "../db/models/category.model";
export * from "../db/models/images.model";
export * from "../db/models/product.model";
export * from "../db/models/sku.model"; // 添加SKU模型导出
export * from "../db/models/statistics.model";
export * from "../db/models/users.model";

// 常用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Service层类型定义

// 查询选项
export interface QueryOptions {
	filters?: QueryFilter[];
	sort?: SortOption[];
}

// 分页参数
export interface PaginationParams {
	page?: number;
	limit?: number;
}

// 查询过滤器 - 用于构建数据库查询的过滤条件
export interface QueryFilter {
	field: string; // 要过滤的字段名
	operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "in" | "nin"; // 操作符：等于、不等于、大于、大于等于、小于、小于等于、模糊匹配、在数组内、不在数组内
	value: any; // 过滤值
}

// 排序选项 - 用于指定查询结果的排序方式
export interface SortOption {
	field: string; // 要排序的字段名
	direction: "asc" | "desc"; // 排序方向：升序或降序
}

// 创建选项
export interface CreateOptions {
	validate?: boolean;
	transaction?: any;
}

// 更新选项
export interface UpdateOptions {
	validate?: boolean;
	transaction?: any;
}

// 删除选项
export interface DeleteOptions {
	transaction?: any;
	force?: boolean;
}

// 查询构建器选项
export interface QueryBuilderOptions {
	table: string;
	selects?: string[];
	joins?: Array<{
		table: string;
		on: string;
		type: "left" | "right" | "inner";
	}>;
	where?: Record<string, any>;
	orderBy?: Array<{
		column: string;
		direction: "asc" | "desc";
	}>;
	groupBy?: string[];
	having?: Record<string, any>;
}

// 事务选项
export interface TransactionOptions {
	isolationLevel?:
		| "read_uncommitted"
		| "read_committed"
		| "repeatable_read"
		| "serializable";
	timeout?: number;
}

// 批量操作选项
export interface BatchOptions {
	batchSize?: number;
	delay?: number;
	retryCount?: number;
	onError?: "continue" | "stop";
}

// 缓存选项
export interface CacheOptions {
	key: string;
	ttl?: number;
	tags?: string[];
}
