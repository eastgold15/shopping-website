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
	createSchemaFactory,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./category.model";
import { imagesTable } from "./images.model";
import { skusTable } from "./sku.model"; // 添加SKU导入
import { numberToString, UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 商品表 - 存储商品的基本信息、价格、库存等
 * 包含商品的完整属性，支持SEO优化和商品展示
 */
export const productsTable = pgTable("products", {
	id: serial("id").primaryKey(), // 商品唯一标识
	name: varchar("name", { length: 255 }).notNull(), // 商品名称
	description: text("description").default(""), // 商品详细描述
	shortDescription: text("short_description").default(""), // 商品简短描述
	sku: varchar("sku", { length: 100 }).unique().default(""), // 商品库存单位
	barcode: varchar("barcode", { length: 100 }).default(""), // 商品条形码
	weight: decimal("weight", { precision: 8, scale: 2 }).default("0"), // 商品重量(kg)
	dimensions: json("dimensions").default({}), // 商品尺寸(长宽高)

	// 🆕 尺码范围管理（脱离SKU）
	sizeMin: varchar("size_min", { length: 20 }), // 最小尺码，如"39"
	sizeMax: varchar("size_max", { length: 20 }), // 最大尺码，如"48"
	sizeTable: text("size_table"), // 尺码表，如"39,40,41,42,43,44,45,46,47,48"或JSON格式
	sizeDescription: text("size_description"), // 尺码说明，如"适合脚长24.5-28cm"

	// 商品图片通过 productImagesTable 中间表关联
	defaultImage: text("default_image"), // 默认主图URL

	// 原有的规格字段保留（可选）
	colors: json("colors").default([]), // 商品可选颜色（备用，主要用ColorSpec表）
	sizes: json("sizes").default([]), // 商品可选尺寸（备用）
	materials: json("materials").default([]), // 商品材料信息
	careInstructions: text("care_instructions").default(""), // 商品保养说明
	features: json("features").default([]), // 商品特性列表
	specifications: json("specifications").default({}), // 商品规格参数

	categoryId: integer("category_id")
		.references(() => categoriesTable.id)
		.default(-1), // 所属分类ID
	isActive: boolean("is_active").default(true), // 是否上架销售
	isFeatured: boolean("is_featured").default(false), // 是否为推荐商品
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
const { createInsertSchema } = createSchemaFactory({
	// This configuration will only coerce dates. Set `coerce` to `true` to coerce all data types or specify others
	coerce: {
		date: true,
	},
});
// 2. Zod 校验规则（运行时校验）
// 创建
export const insertProductSchema = createInsertSchema(productsTable);
// 更新
export const updateProductSchema = createUpdateSchema(productsTable);
// 查询 关联表查询
export const selectProductSchema = createSelectSchema(productsTable, {});

// 商品模型定义
export const productsModel = {
	selectProductcTable: selectProductSchema.extend({

		weight: z.string().transform((val) => parseFloat(val)),
	}),
	// 创建商品请求参数
	createProductDto: insertProductSchema
		.omit({ id: true, createdAt: true, updatedAt: true })
		.extend({

			weight: z.string().transform((val) => parseFloat(val)),
			image_ids: z.array(z.number()),
			// 新增尺码范围字段
			sizeMin: z.string().optional(),
			sizeMax: z.string().optional(),
			sizeTable: z.string().optional(),
			sizeDescription: z.string().optional(),
			defaultImage: z.string().optional(),
		}),

	insertProductDto: insertProductSchema
		.omit({ id: true, createdAt: true, updatedAt: true })
		.extend({
			weight: numberToString,
			image_ids: z.array(z.number()),
			// 新增尺码范围字段
			sizeMin: z.string().optional(),
			sizeMax: z.string().optional(),
			sizeTable: z.string().optional(),
			sizeDescription: z.string().optional(),
			defaultImage: z.string().optional(),
		}),

	updateProductDto: updateProductSchema
		.omit({ id: true, createdAt: true, updatedAt: true })
		.extend({

			weight: numberToString,
			image_ids: z.array(z.number()),
			// 新增尺码范围字段
			sizeMin: z.string().optional(),
			sizeMax: z.string().optional(),
			sizeTable: z.string().optional(),
			sizeDescription: z.string().optional(),
			defaultImage: z.string().optional(),
		}),
	UpdateSortDto: z.object({ sortOrder: z.number() }),

	// // 商品列表查询参数
	queryProductListDto: UnoPageQueryZod.extend({
		// HTTP查询参数传输时会变成字符串，需要转换为数字
		categoryId: z.optional(
			z.string().transform((val) => (val ? parseInt(val, 10) : undefined)),
		),
		isActive: z.optional(z.coerce.boolean()),
		isFeatured: z.optional(z.coerce.boolean()),
	}),

	// SKU批量创建请求参数
	batchCreateSkusDto: z.object({
		productId: z.number(),
		colors: z.array(
			z.object({
				id: z.number(),
				name: z.string(),
				value: z.string().optional(),
			}),
		),
		sizes: z.array(
			z.object({
				id: z.number(),
				name: z.string(),
				value: z.string().optional(),
			}),
		),
		defaultPrice: z.string(),
		defaultComparePrice: z.string().optional(),
		defaultCost: z.string().optional(),
		defaultStock: z.number().min(0),
		defaultWeight: z.string().optional(),
		skuCodePattern: z.string().default("{productId}-{colorValue}-{sizeValue}"), // SKU编码模式
	}),
	// // 商品搜索查询参数
	querySearchProductDto: UnoPageQueryZod.extend({
		// HTTP查询参数传输时会变成字符串，需要转换为对应类型
		categoryId: z.optional(
			z.string().transform((val) => (val ? parseInt(val, 10) : undefined)),
		),
		minPrice: z.optional(
			z.string().transform((val) => (val ? parseFloat(val) : undefined)),
		),
		maxPrice: z.optional(
			z.string().transform((val) => (val ? parseFloat(val) : undefined)),
		),
		colors: z.optional(
			z.string().transform((val) => (val ? val.split(",") : undefined)),
		),
		sizes: z.optional(
			z.string().transform((val) => (val ? val.split(",") : undefined)),
		),
		tags: z.optional(
			z.string().transform((val) => (val ? val.split(",") : undefined)),
		),
		brand: z.string().optional(),
		isActive: z.optional(z.string().transform((val) => val === "true")),
		isFeatured: z.optional(z.string().transform((val) => val === "true")),
	}),

	// 筛选选项查询参数
	queryFilterOptionsDto: z.object({
		categoryId: z.string().optional(),
	}),

	listProductRes: selectProductSchema.extend({
		// 将价格相关字段从字符串转换为数字
		price: z.string().transform((val) => parseFloat(val)),
		comparePrice: z.string().transform((val) => parseFloat(val)),
		cost: z.string().transform((val) => parseFloat(val)),
		weight: z.string().transform((val) => parseFloat(val)),
		imageRef: z.array(
			z.object({
				id: z.number(),
				url: z.string(),
				alt: z.string(),
				isMain: z.boolean(),
			}),
		),
		categoryRef: z.object({
			id: z.number(),
			name: z.string(),
		}),
	}),
};
// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertProductDto = z.input<typeof productsModel.insertProductDto>; // 请求用
export type UpdateProductDto = z.input<typeof productsModel.updateProductDto>; // 请求用
export type SelectProductType = z.infer<
	typeof productsModel.selectProductcTable
>; // 查询返回原始类型
export type SearchProductQueryDto = z.infer<
	typeof productsModel.querySearchProductDto
>; // 搜索用
export type ListProductQueryDto = z.infer<
	typeof productsModel.queryProductListDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectProductVo = SelectProductType & {
	imageRef: {
		id: number;
		url: string;
		alt: string;
		isMain: boolean;
	}[];
} & {
	categoryRef: {
		id: number;
		name: string;
	};
};

export type SelectProductDetailVo = SelectProductType & {
	images: {
		id: number;
		url: string;
		alt: string;
		isMain: boolean;
	}[];
	categoryName: string;
	skus?: any[];
	hasVariants?: boolean;
}; // 可直接复用，或扩展字段（比如格式化日期等）

export const productsRelations = relations(productsTable, ({ one, many }) => ({
	category: one(categoriesTable, {
		fields: [productsTable.categoryId],
		references: [categoriesTable.id],
	}),
	productImages: many(productImagesTable),
	skus: many(skusTable), // 添加SKU关联
}));

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
