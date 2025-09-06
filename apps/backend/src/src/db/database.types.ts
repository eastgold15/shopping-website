/**
 * 自动生成的 TypeBox 配置文件
 * 基于 Schema 文件中的 JSDoc @typebox 注释生成
 * 请勿手动修改此文件
 */

import { t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { spreads } from '../utils/dizzle.type'
import { dbSchema, tableNames } from './schema/index'

/**
 * 数据库 TypeBox 配置
 */
export const DbType = {
  typebox: {
    insert: {
      userSchema: createInsertSchema(dbSchema.userSchema, {
        email: t.String({"format":"email"})
      }),
      tokenSchema: createInsertSchema(dbSchema.tokenSchema),
      categoriesSchema: createInsertSchema(dbSchema.categoriesSchema),
      productsSchema: createInsertSchema(dbSchema.productsSchema),
      reviewsSchema: createInsertSchema(dbSchema.reviewsSchema),
      siteConfigSchema: createInsertSchema(dbSchema.siteConfigSchema),
      advertisementsSchema: createInsertSchema(dbSchema.advertisementsSchema),
      imagesSchema: createInsertSchema(dbSchema.imagesSchema),
      ordersSchema: createInsertSchema(dbSchema.ordersSchema),
      orderItemsSchema: createInsertSchema(dbSchema.orderItemsSchema),
      refundsSchema: createInsertSchema(dbSchema.refundsSchema),
      partnersSchema: createInsertSchema(dbSchema.partnersSchema),
    },
    select: {
      userSchema: createSelectSchema(dbSchema.userSchema, {
        email: t.String({"format":"email"})
      }),
      tokenSchema: createSelectSchema(dbSchema.tokenSchema),
      categoriesSchema: createSelectSchema(dbSchema.categoriesSchema),
      productsSchema: createSelectSchema(dbSchema.productsSchema),
      reviewsSchema: createSelectSchema(dbSchema.reviewsSchema),
      siteConfigSchema: createSelectSchema(dbSchema.siteConfigSchema),
      advertisementsSchema: createSelectSchema(dbSchema.advertisementsSchema),
      imagesSchema: createSelectSchema(dbSchema.imagesSchema),
      ordersSchema: createSelectSchema(dbSchema.ordersSchema),
      orderItemsSchema: createSelectSchema(dbSchema.orderItemsSchema),
      refundsSchema: createSelectSchema(dbSchema.refundsSchema),
      partnersSchema: createSelectSchema(dbSchema.partnersSchema),
    }
  },
  spreads: {
    insert: spreads({
      userSchema: createInsertSchema(dbSchema.userSchema, {
        email: t.String({"format":"email"})
      }),
      tokenSchema: createInsertSchema(dbSchema.tokenSchema),
      categoriesSchema: createInsertSchema(dbSchema.categoriesSchema),
      productsSchema: createInsertSchema(dbSchema.productsSchema),
      reviewsSchema: createInsertSchema(dbSchema.reviewsSchema),
      siteConfigSchema: createInsertSchema(dbSchema.siteConfigSchema),
      advertisementsSchema: createInsertSchema(dbSchema.advertisementsSchema),
      imagesSchema: createInsertSchema(dbSchema.imagesSchema),
      ordersSchema: createInsertSchema(dbSchema.ordersSchema),
      orderItemsSchema: createInsertSchema(dbSchema.orderItemsSchema),
      refundsSchema: createInsertSchema(dbSchema.refundsSchema),
      partnersSchema: createInsertSchema(dbSchema.partnersSchema),
    }, 'insert'),
    select: spreads({
      userSchema: createSelectSchema(dbSchema.userSchema, {
        email: t.String({"format":"email"})
      }),
      tokenSchema: createSelectSchema(dbSchema.tokenSchema),
      categoriesSchema: createSelectSchema(dbSchema.categoriesSchema),
      productsSchema: createSelectSchema(dbSchema.productsSchema),
      reviewsSchema: createSelectSchema(dbSchema.reviewsSchema),
      siteConfigSchema: createSelectSchema(dbSchema.siteConfigSchema),
      advertisementsSchema: createSelectSchema(dbSchema.advertisementsSchema),
      imagesSchema: createSelectSchema(dbSchema.imagesSchema),
      ordersSchema: createSelectSchema(dbSchema.ordersSchema),
      orderItemsSchema: createSelectSchema(dbSchema.orderItemsSchema),
      refundsSchema: createSelectSchema(dbSchema.refundsSchema),
      partnersSchema: createSelectSchema(dbSchema.partnersSchema),
    }, 'select')
  }
} as const
