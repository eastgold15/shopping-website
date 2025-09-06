// import { Elysia, t, TSchema } from "elysia";
// import { parsePaginationQuery } from ".";

// /**
//  * 分页查询参数的 Elysia 类型定义
//  */
// export const PaginationQuery = t.Partial(
// 	t.Object({
// 		page: t.Numeric({ minimum: 1 }),
// 		pageSize: t.Numeric({ minimum: 1, maximum: 100 }),
// 	}),
// );
// /**
//  * 分页响应的 Elysia 类型定义工厂
//  * @param dataSchema 数据项的类型定义
//  * @returns 完整的分页响应类型定义
//  */
// export function createPaginationResponse<T extends TSchema>(dataSchema: T) {
// 	return t.Object({
// 		data: t.Array(dataSchema),
// 		total: t.Number(),
// 		page: t.Number(),
// 		pageSize: t.Number(),
// 		totalPages: t.Number(),
// 		hasNext: t.Boolean(),
// 		hasPrev: t.Boolean(),
// 	});
// }

// /**
//  * 分页错误类
//  */
// export class PaginationError extends Error {
// 	constructor(
// 		message: string,
// 		public code = "PAGINATION_ERROR",
// 	) {
// 		super(message);
// 		this.name = "PAGINATION_ERROR";
// 	}
// }

// /**
//  * ElysiaJS 分页插件
//  * 提供分页相关的装饰器和工具函数
//  */

// // export const PaginationPlugin = new Elysia({ name: "pagination-plugin" })
// // 	.decorate("paginate", paginate)
// // 	.decorate("parsePaginationQuery", parsePaginationQuery)
// // 	.decorate("createPaginator", createPaginator)
// // 	.decorate("PaginationError", PaginationError)
// // 	.model({
// // 		"pagination.query": PaginationQuery,
// // 		"pagination.result": createPaginationResponse(t.Any()),
// // 	});

// export const paginationPlugin = new Elysia({ name: "pagination" })
// 	.model({
// 		"pagination.query": PaginationQuery,
// 		"pagination.param": t.Object({
// 			id: t.Number(),
// 		}),
// 	})
// 	.guard({ as: "local", query: "pagination.query", params: "pagination.param" })
// 	.derive(({ query, params }) => {
// 		// id存在是单个查询
// 		if (params?.id) {
// 			return {
// 				unPagination: true,
// 			};
// 		}
// 		// id不存在是多个查询
// 		return {
// 			pagination: parsePaginationQuery(query),
// 		};
// 	})
//   .onAfterHandle((response,pagination)=>{

//   })
