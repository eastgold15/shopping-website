import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	integer,
	json,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { colorSpecsTable } from "./color-spec.model";
import { imagesTable } from "./images.model";
import { productsTable } from "./product.model";
import { UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * SKU表 - 基于颜色规格的库存管理单位
 * 每个SKU代表一个颜色规格的可销售单元，不再包含尺寸信息
 */
export const skusTable = pgTable("skus", {
	id: serial("id").primaryKey(), // SKU唯一标识
	productId: integer("product_id")
		.references(() => productsTable.id, { onDelete: "cascade" })
		.notNull(), // 关联的商品ID
	colorSpecId: integer("color_spec_id")
		.references(() => colorSpecsTable.id, { onDelete: "cascade" })
		.notNull(), // 关联的颜色规格ID
	name: varchar("name", { length: 255 }).notNull(), // SKU名称（如：午夜蓝）
	skuCode: varchar("sku_code", { length: 100 }).notNull().unique(), // SKU编码
	price: decimal("price", { precision: 10, scale: 2 }).notNull(), // SKU价格
	comparePrice: decimal("compare_price", { precision: 10, scale: 2 }), // SKU原价
	cost: decimal("cost", { precision: 10, scale: 2 }), // SKU成本价
	stock: integer("stock").default(0), // SKU库存数量
	minStock: integer("min_stock").default(0), // 最低库存预警值
	weight: decimal("weight", { precision: 8, scale: 2 }), // SKU重量(kg)
	dimensions: json("dimensions").default({}), // SKU尺寸(长宽高)
	
	// 可选：该SKU的专属图片（覆盖颜色规格的图片）
	imageOverride: text("image_override"), // SKU专属图片URL
	
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
	insertSkuDto: insertSkuSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),

	updateSkuDto: updateSkuSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}).extend({
		images: z.array(z.number()).optional(), // 修改为images，与列表展示字段一致
	}),

	// SKU列表查询参数
	querySkuListDto: UnoPageQueryZod.extend({
		productId: z.string().optional(),
		colorSpecId: z.string().optional(), // 改为colorSpecId
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
	colorSpec: one(colorSpecsTable, {
		fields: [skusTable.colorSpecId],
		references: [colorSpecsTable.id],
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
