import { relations } from "drizzle-orm";


import { boolean, decimal, integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";

import { categoriesTable, imagesTable, orderItemsTable, reviewsTable } from ".";
import { stringToNumber, UnoQueryZod } from "./utils";


/**
 * 1. Drizzle 表定义
 * 商品表 - 存储商品的基本信息、价格、库存等
 * 包含商品的完整属性，支持SEO优化和商品展示
 */
export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(), // 商品唯一标识
  name: varchar("name", { length: 255 }).notNull(), // 商品名称
  slug: varchar("slug", { length: 255 }).notNull().unique(), // 商品别名，用于URL优化
  description: text("description").default(""), // 商品详细描述
  shortDescription: text("short_description").default(""), // 商品简短描述
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // 商品售价
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }).notNull(), // 商品原价/对比价格
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(), // 商品成本价
  sku: varchar("sku", { length: 100 }).unique().default(""), // 商品库存单位
  barcode: varchar("barcode", { length: 100 }).default(""), // 商品条形码
  weight: decimal("weight", { precision: 8, scale: 2 }).notNull(), // 商品重量(kg)
  dimensions: json("dimensions").default({}), // 商品尺寸(长宽高)
  // 商品图片通过 productImagesTable 中间表关联
  videos: json("videos").default([]), // 商品视频列表
  colors: json("colors").default([]), // 商品可选颜色
  sizes: json("sizes").default([]), // 商品可选尺寸
  materials: json("materials").default([]), // 商品材料信息
  careInstructions: text("care_instructions").default(""), // 商品保养说明
  features: json("features").default([]), // 商品特性列表
  specifications: json("specifications").default({}), // 商品规格参数
  categoryId: integer("category_id")
    .references(() => categoriesTable.id)
    .default(-1), // 所属分类ID
  stock: integer("stock").default(0), // 商品库存数量
  minStock: integer("min_stock").default(0), // 最低库存预警值
  isActive: boolean("is_active").default(true), // 是否上架销售
  isFeatured: boolean("is_featured").default(false), // 是否为推荐商品
  metaTitle: varchar("meta_title", { length: 255 }).default(""), // SEO标题
  metaDescription: text("meta_description").default(""), // SEO描述
  metaKeywords: varchar("meta_keywords", { length: 500 }).default(""), // SEO关键词
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）

// 2. Zod 校验规则（运行时校验）
export const insertProductSchema = createInsertSchema(productsTable,);
export const updateProductSchema = createUpdateSchema(productsTable,);
export const selectProductSchema = createSelectSchema(productsTable);

// 商品模型定义
export const productsModel = {
  selectProductcTable: selectProductSchema,
  // 创建商品请求参数 - 前端传入 number，后端转换为 string 存储
  insertProductDto: insertProductSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
    cost: stringToNumber,
    price: stringToNumber,
    comparePrice: stringToNumber,
    weight: stringToNumber,
    image_ids: z.array(z.number()),
  }),

  updateProductDto: updateProductSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
    cost: stringToNumber,
    price: stringToNumber,
    comparePrice: stringToNumber,
    weight: stringToNumber,
    image_ids: z.array(z.number()),
  }),
  UpdateSortDto: z.object({ sortOrder: z.number() }),

  // // 商品列表查询参数
  queryProductListDto: UnoQueryZod.extend({
    // HTTP查询参数传输时会变成字符串，需要转换为数字
    categoryId: z.optional(z.string().transform((val) => val ? parseInt(val, 10) : undefined)),
    isActive: z.optional(z.string().transform((val) => val === 'true')),
    isFeatured: z.optional(z.string().transform((val) => val === 'true')),
  }),
  // // 商品搜索查询参数
  querySearchProductDto: UnoQueryZod.extend({
    // HTTP查询参数传输时会变成字符串，需要转换为对应类型
    categoryId: z.optional(z.string().transform((val) => val ? parseInt(val, 10) : undefined)),
    minPrice: z.optional(z.string().transform((val) => val ? parseFloat(val) : undefined)),
    maxPrice: z.optional(z.string().transform((val) => val ? parseFloat(val) : undefined)),
    colors: z.optional(z.string().transform((val) => val ? val.split(',') : undefined)),
    sizes: z.optional(z.string().transform((val) => val ? val.split(',') : undefined)),
    tags: z.optional(z.string().transform((val) => val ? val.split(',') : undefined)),
    brand: z.string().optional(),
    isActive: z.optional(z.string().transform((val) => val === 'true')),
    isFeatured: z.optional(z.string().transform((val) => val === 'true')),
  }),

  // 筛选选项查询参数
  queryFilterOptionsDto: z.object({
    categoryId: z.string().optional(),
  })
};
// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertProductDto = z.infer<typeof productsModel.insertProductDto>;  // 请求用
export type UpdateProductDto = z.infer<typeof productsModel.updateProductDto>;  // 请求用
export type SelectProductType = z.infer<typeof productsModel.selectProductcTable>; // 查询返回原始类型
export type ProductSearchQueryDto = z.infer<typeof productsModel.querySearchProductDto>// 搜索用
export type ProductListQueryDto = z.infer<typeof productsModel.queryProductListDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectProductVo = SelectProductType; // 可直接复用，或扩展字段（比如格式化日期等）
export type SelectProductDetailVo = SelectProductType & {
  images: {
    id: number
    , url: string, alt: string, isMain: boolean
  }[]
}; // 可直接复用，或扩展字段（比如格式化日期等）





export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.categoryId],
    references: [categoriesTable.id],
  }),
  reviews: many(reviewsTable),
  orderItems: many(orderItemsTable),
  // 商品图片关联(通过中间表)
  productImages: many(productImagesTable),
}));










// // 导出类型
// export type CreateProductDto = typeof productsModel.CreateProductDto.static;
// export type UpdateProductDto = typeof productsModel.UpdateProductDto.static;

// export type FilterOptionsQueryDto =
//   typeof productsModel.FilterOptionsQueryDto.static;
// export type UpdateSortDto = typeof productsModel.UpdateSortDto.static;
// export type ProductListQueryDto =
//   typeof productsModel.ProductListQueryDto.static;

// export type ProductModel = typeof productsModel.CreateProductDto.static;
// export type ProductSchema = typeof productsModel.productcSchema.static;









/**
 * 商品图片关联表 - 处理商品与图片的多对多关系
 */
export const productImagesTable = pgTable("product_images", {
  productId: integer("product_id")
    .references(() => productsTable.id)
    .notNull(),
  imageId: integer("image_id")
    .references(() => imagesTable.id)
    .notNull(),
  isMain: boolean("is_main").default(false),
});



export const productImagesRelations = relations(
  productImagesTable,
  ({ one }) => ({
    product: one(productsTable, {
      fields: [productImagesTable.productId],
      references: [productsTable.id],
    }),
    image: one(imagesTable, {
      fields: [productImagesTable.imageId],
      references: [imagesTable.id],
    }),
  }),
);