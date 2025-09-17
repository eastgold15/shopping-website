import { Elysia } from "elysia";

import { createPaginator, paginate } from "./pagination";

import { PaginationQueryZod } from '../Res';
/**
 * ElysiaJS 分页插件
 * 提供分页相关的装饰器和工具函数
 */
export const PaginationPlugin = new Elysia({ name: "pagination-plugin" })
  .decorate("paginate", paginate)
  .decorate("createPaginator", createPaginator)
  .model({
    "pagination.query": PaginationQueryZod,
  });


