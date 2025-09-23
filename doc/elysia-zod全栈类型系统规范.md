1.每一个个table 定义一个文件,table定义之后就是Zod Schema,其中xxxmodel是提供给elysia使用. 之后又是// 3. 类型定义（可选，但推荐）,这个是提供给前端和后端的server使用.


# Drizzle ORM + Zod 模块化架构规范文档
## 概述
本规范定义了基于 Drizzle ORM + Zod 的模块化架构标准，确保前后端类型安全与一致性。每个数据库表对应一个独立文件，包含完整的表定义、Zod Schema、类型定义和关联关系。
`[entity]` 需替换为具体的业务实体名称。




## 文件结构标准
```
src/schema/
├── [entity].ts          # 实体表模块（如：products.ts）
├── [entity].ts          # 实体表模块（如：categories.ts）
├── utils.ts            # 公共工具函数
└── index.ts            # 统一导出
```

## 四层架构规范

### 1. Drizzle 表定义层
```typescript
export const [entity]Table = pgTable("[entity]", {
  id: serial("id").primaryKey(),
  // 字段定义...
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```
- 使用 PostgreSQL 数据类型
- 包含完整的字段注释
- 设置合理的默认值和约束

### 2. Zod Schema 层（运行时校验）
```typescript
// 基础Schema
export const insert[Entity]Schema = createInsertSchema([entity]Table);
export const update[Entity]Schema = createUpdateSchema([entity]Table);
export const select[Entity]Schema = createSelectSchema([entity]Table);

// 业务模型（供Elysia使用）
1.insert等于创建,update等于更新,select等于查询。创建和更新的时候,createdAt和updatedAt,由后端确定。所以insert和update不能有id, createdAt,updatedAt 
export const [entity]Model = {
  insert[entity]Dto: insert[Entity]Schema.omit({id: true, createdAt: true, updatedAt: true }).extend({
    // 自定义扩展字段和校验
  }),
  update[entity]Dto: update[Entity]Schema.omit({id: true, createdAt: true, updatedAt: true }).extend({
    // 自定义扩展字段和校验
  }),
  query[entity]Dto: BaseQueryZod.extend({
    // 查询参数扩展
  })
};
```

### 3. 类型定义层（编译时类型）只能来自[entity]Model
```typescript
export type Insert[Entity]Dto = z.infer<typeof [entity]Model.insert[entity]Dto>;
export type Update[Entity]Dto = z.infer<typeof [entity]Model.update[entity]Dto>;
export type Select[Entity]Type = z.infer<typeof [entity]Model.select[Entity]Schema>;
export type Query[Entity]Dto = z.infer<typeof [entity]Model.query[entity]Dto>;

// 前端展示类型（可选扩展）
export type Select[Entity]Vo = Select[Entity]Type; // 或扩展格式化字段
```

### 4. 关联关系层
```typescript
export const [entity]Relations = relations([entity]Table, ({ one, many }) => ({
  relatedTable: one(relatedTable, {
    fields: [[entity]Table.foreignKey],
    references: [relatedTable.id],
  }),
  // 其他关联...
}));
```

## 最佳实践

### 字段处理规范
- JSON字段明确默认值：`default([])` 或 `default({})`
- 时间字段统一使用 `defaultNow()`

### 命名约定
- 表名：`[entity]` + "Table" 后缀
- Schema：操作类型 + `[Entity]` + "Schema" 后缀
- 模型：`[entity]` + "Model" 后缀
- DTO类型：操作类型 + `[Entity]` + "Dto" 后缀
- VO类型：操作类型 + `[Entity]` + "Vo" 后缀

### 导入导出
- 在模块文件末尾统一导出所有类型和Schema
- 在index.ts中集中导出所有模块

## 示例模块模板
```typescript


import { relations } from "drizzle-orm";
import { boolean, decimal, integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { categoriesTable, orderItemsTable, productImagesTable, reviewsTable } from "./schema";
import { stringToNumber, UnoPageQueryZod } from "./utils";

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
  queryProductListDto: UnoPageQueryZod.extend({
    categoryId: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
  // // 商品搜索查询参数
  querySearchProductDto: UnoPageQueryZod.extend({
    categoryId: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    brand: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
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
```

