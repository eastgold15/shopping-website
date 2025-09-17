import { relations } from "drizzle-orm";
import { boolean, decimal, integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { productsTable } from "./product.model";
import { imagesTable } from "./images.model";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * SKU表 - 存储商品的具体规格信息（颜色、尺寸等）
 * 每个SKU代表一个可销售的商品单元
 */
export const skusTable = pgTable("skus", {
  id: serial("id").primaryKey(), // SKU唯一标识
  productId: integer("product_id")
    .references(() => productsTable.id, { onDelete: "cascade" })
    .notNull(), // 关联的商品ID
  name: varchar("name", { length: 255 }).notNull(), // SKU名称（如：红色-L）
  skuCode: varchar("sku_code", { length: 100 }).notNull().unique(), // SKU编码
  colorId: integer("color_id"), // 关联的颜色ID
  sizeId: integer("size_id"), // 关联的尺寸ID
  colorValue: varchar("color_value", { length: 50 }), // 颜色值（如：#FF0000）
  colorName: varchar("color_name", { length: 50 }), // 颜色名称（如：红色）
  sizeValue: varchar("size_value", { length: 50 }), // 尺寸值（如：L）
  sizeName: varchar("size_name", { length: 50 }), // 尺寸名称（如：大号）
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // SKU价格
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }), // SKU原价
  stock: integer("stock").default(0), // SKU库存数量
  minStock: integer("min_stock").default(0), // 最低库存预警值
  weight: decimal("weight", { precision: 8, scale: 2 }), // SKU重量(kg)
  dimensions: json("dimensions").default({}), // SKU尺寸(长宽高)
  isActive: boolean("is_active").default(true), // 是否上架销售
  sortOrder: integer("sort_order").default(0), // 排序权重
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

/**
 * SKU图片关联表 - 处理SKU与图片的多对多关系
 */
export const skuImagesTable = pgTable("sku_images", {
  skuId: integer("sku_id")
    .references(() => skusTable.id, { onDelete: "cascade" })
    .notNull(),
  imageId: integer("image_id")
    .references(() => imagesTable.id)
    .notNull(),
  isMain: boolean("is_main").default(false), // 是否为主图
  displayOrder: integer("display_order").default(0), // 显示顺序
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertSkuSchema = createInsertSchema(skusTable);
export const updateSkuSchema = createUpdateSchema(skusTable);
export const selectSkuSchema = createSelectSchema(skusTable);

// SKU模型定义
export const skusModel = {
  selectSkuTable: selectSkuSchema,
  // 创建SKU请求参数
  insertSkuDto: insertSkuSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  updateSkuDto: updateSkuSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  // SKU列表查询参数
  querySkuListDto: UnoQueryZod.extend({
    productId: z.string().optional(),
    colorId: z.string().optional(),
    sizeId: z.string().optional(),
    isActive: z.string().optional(),
  }),
};

// 3. 类型定义
export type InsertSkuDto = z.infer<typeof skusModel.insertSkuDto>;
export type UpdateSkuDto = z.infer<typeof skusModel.updateSkuDto>;
export type SelectSkuType = z.infer<typeof skusModel.selectSkuTable>;
export type SkuListQueryDto = z.infer<typeof skusModel.querySkuListDto>;

// 4. 推荐再包装一层，用于前端展示
export type SelectSkuVo = SelectSkuType & {
  images: {
    id: number;
    url: string;
    alt: string;
    isMain: boolean;
  }[];
};

// 5. 关系定义
export const skusRelations = relations(skusTable, ({ one, many }) => ({
  product: one(productsTable, {
    fields: [skusTable.productId],
    references: [productsTable.id],
  }),
  skuImages: many(skuImagesTable),
  images: many(imagesTable),
}));

export const skuImagesRelations = relations(skuImagesTable, ({ one }) => ({
  sku: one(skusTable, {
    fields: [skuImagesTable.skuId],
    references: [skusTable.id],
  }),
  image: one(imagesTable, {
    fields: [skuImagesTable.imageId],
    references: [imagesTable.id],
  }),
}));