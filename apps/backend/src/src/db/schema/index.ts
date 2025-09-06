/**
 * 自动生成的数据库 Schema 文件
 * 请勿手动修改此文件，运行 `bun run generate:schema` 重新生成
 * 生成时间: 2025-08-22T13:15:08.712Z
 */

import { userSchema, tokenSchema } from './auth.ts';
import { categoriesSchema, productsSchema, reviewsSchema, siteConfigSchema, advertisementsSchema, imagesSchema, ordersSchema, orderItemsSchema, refundsSchema, partnersSchema } from './schema.ts';

export const dbSchema = {
  userSchema,
  tokenSchema,
  categoriesSchema,
  productsSchema,
  reviewsSchema,
  siteConfigSchema,
  advertisementsSchema,
  imagesSchema,
  ordersSchema,
  orderItemsSchema,
  refundsSchema,
  partnersSchema,
};
// 导出所有扫描到的数据库模式文件
export * from "./auth.ts";
export * from "./schema.ts";

/**
 * 数据库 Schema 类型
 */
export type DbSchema = typeof dbSchema;

/**
 * 所有表的名称列表
 */
export const tableNames = ['userSchema', 'tokenSchema', 'categoriesSchema', 'productsSchema', 'reviewsSchema', 'siteConfigSchema', 'advertisementsSchema', 'imagesSchema', 'ordersSchema', 'orderItemsSchema', 'refundsSchema', 'partnersSchema'] as const;

/**
 * 表名称类型
 */
export type TableName = typeof tableNames[number];
