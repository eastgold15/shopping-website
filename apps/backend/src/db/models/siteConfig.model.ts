import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 网站配置表 - 存储网站的各种配置项
 * 支持按分类管理不同模块的配置
 */
export const siteConfigTable = pgTable("site_config", {
	id: serial("id").primaryKey(), // 配置项唯一标识
	key: varchar("key", { length: 100 }).notNull().unique(), // 配置键名
	value: text("value").default(""), // 配置值
	description: text("description").default(""), // 配置项描述
	category: varchar("category", { length: 50 }).default("general"), // 配置分类(general, seo, payment等)
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertSiteConfigSchema = createInsertSchema(siteConfigTable, {
	key: z
		.string()
		.min(1, "配置键名不能为空")
		.max(100, "配置键名不能超过100个字符"),
	category: z.string().min(1, "配置分类不能为空"),
});
export const updateSiteConfigSchema = createUpdateSchema(siteConfigTable, {
	key: z
		.string()
		.min(1, "配置键名不能为空")
		.max(100, "配置键名不能超过100个字符")
		.optional(),
	category: z.string().min(1, "配置分类不能为空").optional(),
});
export const selectSiteConfigSchema = createSelectSchema(siteConfigTable);

// 网站配置模型定义
export const siteConfigModel = {
	selectSiteConfigTable: selectSiteConfigSchema,
	// 创建配置请求参数
	insertSiteConfigDto: insertSiteConfigSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),

	updateSiteConfigDto: updateSiteConfigSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),

	// 批量更新配置DTO
	batchUpdateSiteConfigDto: z.array(
		z.object({
			key: z.string(),
			value: z.string(),
		}),
	),

	// 配置列表查询参数
	querySiteConfigListDto: UnoPageQueryZod.extend({
		category: z.string().optional(),
		key: z.string().optional(),
	}),

	// 按分类查询配置参数
	querySiteConfigByCategoryDto: z.object({
		category: z.string(),
	}),

	querySiteConfigByCategoryOptionalDto: z
		.object({
			category: z.string(),
		})
		.optional(),

	// 按键名查询配置参数
	querySiteConfigByKeysDto: z.object({
		keys: z.array(z.string()),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertSiteConfigDto = z.infer<
	typeof siteConfigModel.insertSiteConfigDto
>; // 请求用
export type UpdateSiteConfigDto = z.infer<
	typeof siteConfigModel.updateSiteConfigDto
>; // 请求用
export type BatchUpdateSiteConfigDto = z.infer<
	typeof siteConfigModel.batchUpdateSiteConfigDto
>; // 批量更新用
export type SelectSiteConfigType = z.infer<
	typeof siteConfigModel.selectSiteConfigTable
>; // 查询返回原始类型
export type SiteConfigListQueryDto = z.infer<
	typeof siteConfigModel.querySiteConfigListDto
>;
export type SiteConfigByCategoryQueryDto = z.infer<
	typeof siteConfigModel.querySiteConfigByCategoryDto
>;
export type SiteConfigByCategoryOptionalQueryDto = z.infer<
	typeof siteConfigModel.querySiteConfigByCategoryOptionalDto
>;
export type SiteConfigByKeysQueryDto = z.infer<
	typeof siteConfigModel.querySiteConfigByKeysDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectSiteConfigVo = SelectSiteConfigType; // 可直接复用，或扩展字段（比如格式化日期等）

// 5. 关系定义（网站配置表通常不需要关系定义）
// export const siteConfigRelations = relations(siteConfigTable, ({ }) => ({}));
