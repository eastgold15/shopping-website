import { relations } from "drizzle-orm";
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
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { skusTable } from "./sku.model";
import { UnoPageQueryZod, UnoQueryZod } from "./utils";

/**
 * 颜色表 - 存储标准颜色信息
 */
export const colorsTable = pgTable("colors", {
	id: serial("id").primaryKey(), // 颜色唯一标识
	name: varchar("name", { length: 50 }).notNull(), // 颜色名称
	value: varchar("value", { length: 50 }).notNull(), // 颜色值（如：#FF0000）
	displayName: varchar("display_name", { length: 100 }), // 显示名称
	sortOrder: integer("sort_order").default(0), // 排序权重
	isActive: boolean("is_active").default(true), // 是否启用
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

/**
 * 尺寸表 - 存储标准尺寸信息
 */
export const sizesTable = pgTable("sizes", {
	id: serial("id").primaryKey(), // 尺寸唯一标识
	name: varchar("name", { length: 50 }).notNull(), // 尺寸名称
	value: varchar("value", { length: 50 }).notNull(), // 尺寸值
	displayName: varchar("display_name", { length: 100 }), // 显示名称
	category: varchar("category", { length: 50 }), // 尺寸分类（如：服装、鞋子）
	ukSize: varchar("uk_size", { length: 20 }), // UK码
	usSize: varchar("us_size", { length: 20 }), // US码
	euSize: varchar("eu_size", { length: 20 }), // EU码
	sortOrder: integer("sort_order").default(0), // 排序权重
	isActive: boolean("is_active").default(true), // 是否启用
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// Zod Schema
export const insertColorSchema = createInsertSchema(colorsTable);
export const updateColorSchema = createUpdateSchema(colorsTable);
export const selectColorSchema = createSelectSchema(colorsTable);

export const insertSizeSchema = createInsertSchema(sizesTable);
export const updateSizeSchema = createUpdateSchema(sizesTable);
export const selectSizeSchema = createSelectSchema(sizesTable);

// 模型定义
export const attributesModel = {
	// 颜色相关
	selectColorTable: selectColorSchema,
	insertColorDto: insertColorSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	updateColorDto: updateColorSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	queryColorAllDto: UnoQueryZod.extend({
		name: z.string().optional(),
		isActive: z.string().optional(),
	}),

	// 尺寸相关
	selectSizeTable: selectSizeSchema,
	insertSizeDto: insertSizeSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	updateSizeDto: updateSizeSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	querySizeListDto: UnoPageQueryZod.extend({
		name: z.string().optional(),
		category: z.string().optional(),
    value:z.string().optional(),
		isActive: z.string().optional(),
	}),
};

// 类型定义
export type InsertColorDto = z.infer<typeof attributesModel.insertColorDto>;
export type UpdateColorDto = z.infer<typeof attributesModel.updateColorDto>;
export type SelectColorType = z.infer<typeof attributesModel.selectColorTable>;
export type ColorListQueryDto = z.infer<
	typeof attributesModel.queryColorAllDto
>;

export type InsertSizeDto = z.infer<typeof attributesModel.insertSizeDto>;
export type UpdateSizeDto = z.infer<typeof attributesModel.updateSizeDto>;
export type SelectSizeType = z.infer<typeof attributesModel.selectSizeTable>;
export type SizeListQueryDto = z.infer<typeof attributesModel.querySizeListDto>;

// 推荐再包装一层，用于前端展示
export type SelectColorVo = SelectColorType;
export type SelectSizeVo = SelectSizeType & {
	sizeConversions: {
		uk: string;
		us: string;
		eu: string;
	};
};

// 关系定义
export const colorsRelations = relations(colorsTable, ({ many }) => ({
	skus: many(skusTable),
}));

export const sizesRelations = relations(sizesTable, ({ many }) => ({
	skus: many(skusTable),
}));
