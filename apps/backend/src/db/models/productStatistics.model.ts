import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { productsTable } from "./product.model";

/**
 * 1. Drizzle 表定义
 * 商品统计表 - 存储商品相关的统计数据
 */
export const productStatisticsTable = pgTable("product_statistics", {
  id: serial("id").primaryKey(), // 统计记录唯一标识
  productId: integer("product_id").references(() => productsTable.id), // 商品ID
  date: varchar("date", { length: 10 }).notNull(), // 统计日期 (YYYY-MM-DD)
  viewType: varchar("view_type", { length: 50 }).notNull(), // 查看类型 (view, search, favorite)
  count: integer("count").default(0).notNull(), // 查看次数
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertProductStatisticsSchema = createInsertSchema(productStatisticsTable);
export const selectProductStatisticsSchema = createSelectSchema(productStatisticsTable);
export const updateProductStatisticsSchema = createUpdateSchema(productStatisticsTable);

// 3. 业务相关的 Zod Schema
export const productStatisticsModel = {
  // 基础 Schema
  insertProductStatisticsDto: insertProductStatisticsSchema,
  updateProductStatisticsDto: updateProductStatisticsSchema.partial(),
  selectProductStatisticsTable: selectProductStatisticsSchema,

  // 查询列表DTO
  queryProductStatisticsListDto: z.object({
    productId: z.number().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "开始日期格式必须为YYYY-MM-DD").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "结束日期格式必须为YYYY-MM-DD").optional(),
    viewType: z.enum(["view", "search", "favorite"]).optional(),
  }),

  // 商品统计概览DTO
  productStatisticsOverviewDto: z.object({
    productId: z.number(),
  }),

  // 热门商品统计DTO
  popularProductsDto: z.object({
    limit: z.number().min(1).max(100).default(10),
    period: z.enum(["today", "week", "month", "year"]).default("week"),
  }),
};

// 4. 类型定义
export type InsertProductStatisticsDto = z.infer<typeof productStatisticsModel.insertProductStatisticsDto>;
export type UpdateProductStatisticsDto = z.infer<typeof productStatisticsModel.updateProductStatisticsDto>;
export type SelectProductStatisticsType = z.infer<typeof productStatisticsModel.selectProductStatisticsTable>;
export type ProductStatisticsListQueryDto = z.infer<typeof productStatisticsModel.queryProductStatisticsListDto>;
export type ProductStatisticsOverviewDto = z.infer<typeof productStatisticsModel.productStatisticsOverviewDto>;
export type PopularProductsDto = z.infer<typeof productStatisticsModel.popularProductsDto>;

// 5. 前端展示类型
export type ProductStatisticsVo = SelectProductStatisticsType & {
  productName?: string; // 商品名称
  productImageUrl?: string; // 商品图片URL
};

// 6. 统计概览类型
export type ProductOverviewStats = {
  totalProducts: number; // 商品总数
  activeProducts: number; // 上架商品数
  featuredProducts: number; // 推荐商品数
  lowStockProducts: number; // 低库存商品数
};

// 7. 热门商品类型
export type PopularProductItem = {
  productId: number; // 商品ID
  productName: string; // 商品名称
  productSlug: string; // 商品slug
  productImageUrl?: string; // 商品图片URL
  viewCount: number; // 查看次数
  searchCount: number; // 搜索次数
  favoriteCount: number; // 收藏次数
  totalScore: number; // 总分
};