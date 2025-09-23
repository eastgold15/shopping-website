import { relations, Table } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  foreignKey,
  bigint
} from "drizzle-orm/pg-core";
import {
  createSchemaFactory,
  createSelectSchema,
  createUpdateSchema,

} from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./product.model";
import { UnoQueryZod } from "./utils";


/**
 * 1. Drizzle 表定义
 * 商品分类表 - 存储商品的分类信息
 * 包含分类的基本信息、层级关系和显示属性
 */
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(), // 分类唯一标识
  name: varchar("name", { length: 100 }).notNull(), // 分类名称
  slug: varchar("slug", { length: 100 }).notNull().unique(), // 分类别名，用于URL优化
  description: text("description").default(""), // 分类描述
  parentId: integer("parent_id"), //0 表示顶级分类
  sortOrder: integer("sort_order").default(0), // 排序权重，值越小越靠前
  isVisible: boolean("is_visible").default(true), // 是否在前端显示
  icon: varchar("icon", { length: 255 }).default(""), // 分类图标
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
}, (table) => [
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "parent"
  })
]);
const { createInsertSchema } = createSchemaFactory({
  coerce: {
    date: true
  }
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertCategorySchema = createInsertSchema(categoriesTable);
export const updateCategorySchema = createUpdateSchema(categoriesTable);
export const selectCategorySchema = createSelectSchema(categoriesTable);

// 分类模型定义
export const categoriesModel = {
  selectCategoryTable: selectCategorySchema.extend({
    children: z.array(selectCategorySchema).optional(), // 子分类列表
  }),
  // 创建分类请求参数
  insertCategoryDto: insertCategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),

  updateCategoryDto: updateCategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),

  // 分类列表查询参数
  queryCategoryListDto: UnoQueryZod.extend({
    name: z.string().optional(), // 按名称搜索
    parentId: z.string().optional(),
    isVisible: z.boolean().optional(),
  }),

  // 分类树查询参数
  queryCategoryTreeDto: z.object({
    includeInvisible: z.boolean().optional(),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertCategoryDto = z.infer<
  typeof categoriesModel.insertCategoryDto
>; // 请求用
export type UpdateCategoryDto = z.infer<
  typeof categoriesModel.updateCategoryDto
>; // 请求用
export type SelectCategoryType = z.infer<
  typeof categoriesModel.selectCategoryTable
>; // 查询返回原始类型
export type CategoryListQueryDto = z.infer<
  typeof categoriesModel.queryCategoryListDto
>;
export type CategoryTreeQueryDto = z.infer<
  typeof categoriesModel.queryCategoryTreeDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectCategoryVo = SelectCategoryType; // 可直接复用，或扩展字段（比如格式化日期等）

// 5. 关系定义
export const categoriesRelations = relations(
  categoriesTable,
  ({ one, many }) => ({
    parent: one(categoriesTable, {
      fields: [categoriesTable.parentId],
      references: [categoriesTable.id],
      relationName: "categoryParent",
    }),
    children: many(categoriesTable, {
      relationName: "categoryParent",
    }),
    products: many(productsTable),
  }),
);
