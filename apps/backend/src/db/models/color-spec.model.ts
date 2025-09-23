import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import {
  createSchemaFactory,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./product.model";
import { UnoPageQueryZod } from "./utils";

const { createInsertSchema } = createSchemaFactory({
  coerce: {
    date: true,
  },
});

/**
 * 颜色规格表 - 存储商品的颜色规格信息
 * 每个颜色规格包含展示图片、名称等信息
 * 用于替代传统的颜色属性表，成为SKU的关联维度
 */
export const colorSpecsTable = pgTable("color_specs", {
  id: serial("id").primaryKey(), // 颜色规格唯一标识
  productId: integer("product_id")
    .references(() => productsTable.id, { onDelete: "cascade" })
    .notNull(), // 关联商品ID
  name: varchar("name", { length: 100 }).notNull(), // 颜色名称，如"午夜蓝"、"玫瑰金"  
  colorValue: varchar("color_value", { length: 50 }), // 颜色值，如"#FF0000"
  imageUrl: text("image_url").notNull(), // 该颜色的展示图片URL
  description: text("description").default(""), // 颜色描述
  sortOrder: integer("sort_order").default(0), // 排序权重
  isActive: boolean("is_active").default(true), // 是否启用
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// Zod 校验规则
export const insertColorSpecSchema = createInsertSchema(colorSpecsTable);
export const updateColorSpecSchema = createUpdateSchema(colorSpecsTable);
export const selectColorSpecSchema = createSelectSchema(colorSpecsTable);

// 颜色规格模型定义
export const colorSpecsModel = {
  // 插入数据传输对象
  insertColorSpecDto: insertColorSpecSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),

  // 更新数据传输对象  
  updateColorSpecDto: updateColorSpecSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),

  // 查询列表参数
  queryColorSpecListDto: UnoPageQueryZod.extend({
    productId: z.optional(
      z.string().transform((val) => (val ? parseInt(val, 10) : undefined))
    ),
    name: z.string().optional(),
    isActive: z.optional(z.coerce.boolean()),
  }),

  // 批量创建颜色规格
  batchCreateColorSpecsDto: z.object({
    productId: z.number(),
    colorSpecs: z.array(
      z.object({
        name: z.string().min(1, "颜色名称不能为空"),
        colorValue: z.string().optional(),
        imageUrl: z.string().min(1, "颜色图片不能为空"),
        description: z.string().optional(),
        sortOrder: z.number().default(0),
      })
    ),
  }),

  // 返回给前端的类型
  selectColorSpecVo: selectColorSpecSchema,
};

// 类型定义
export type InsertColorSpecDto = z.infer<typeof colorSpecsModel.insertColorSpecDto>;
export type UpdateColorSpecDto = z.infer<typeof colorSpecsModel.updateColorSpecDto>;
export type SelectColorSpecVo = z.infer<typeof colorSpecsModel.selectColorSpecVo>;
export type ColorSpecListQueryDto = z.infer<typeof colorSpecsModel.queryColorSpecListDto>;