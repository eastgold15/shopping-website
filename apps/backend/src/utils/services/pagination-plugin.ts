import { Elysia, t } from 'elysia'
import { createPaginator, paginate } from './pagination'
import { pageRes, pageResSchema } from '../Res'

/**
 * 分页查询参数的 Elysia 类型定义
 */
export const PaginationQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
})

/**
 * ElysiaJS 分页插件
 * 提供分页相关的装饰器和工具函数
 */
export const PaginationPlugin = new Elysia({ name: 'pagination-plugin' })
  .decorate('paginate', paginate)
  .decorate('createPaginator', createPaginator)
  .decorate('pageRes', pageRes)
  .model({
    'pagination.query': PaginationQuery,
    'pagination.result': pageResSchema(t.Any()),
  })
