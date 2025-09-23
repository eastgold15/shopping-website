import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { imagesTable } from ".";
import { UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 广告表 - 存储网站的广告信息
 * 支持多种类型的广告展示和管理
 */
export const advertisementsTable = pgTable("advertisements", {
	id: serial("id").primaryKey(), // 广告唯一标识
	title: varchar("title", { length: 255 }).notNull(), // 广告标题
	type: varchar("type", { length: 50 }).notNull(), // 广告类型(banner, popup, sidebar等)
	image_id: integer("image_id")
		.notNull()
		.references(() => imagesTable.id), // 广告图片ID - 引用imagesSchema.id
	link: varchar("link", { length: 500 }).default(""), // 广告链接地址
	position: varchar("position", { length: 100 }).default(""), // 广告显示位置
	sortOrder: integer("sort_order").default(0), // 排序权重
	isActive: boolean("is_active").default(true), // 是否启用
	startDate: timestamp("start_date").defaultNow(), // 广告开始时间
	endDate: timestamp("end_date"), // 广告结束时间
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertAdvertisementsSchema = createInsertSchema(
	advertisementsTable,
	{
		title: z
			.string()
			.min(1, "广告标题不能为空")
			.max(200, "广告标题不能超过200个字符"),
		position: z.string().min(1, "广告位置不能为空"),
		startDate: z.iso.datetime().optional().or(z.date().optional()),
		endDate: z.iso.datetime().optional().or(z.date().optional()),
	},
);
export const updateAdvertisementsSchema = createUpdateSchema(
	advertisementsTable,
	{
		title: z
			.string()
			.min(1, "广告标题不能为空")
			.max(200, "广告标题不能超过200个字符")
			.optional(),
		position: z.string().min(1, "广告位置不能为空").optional(),
		startDate: z.iso.datetime().optional().or(z.date().optional()),
		endDate: z.iso.datetime().optional().or(z.date().optional()),
	},
);
export const selectAdvertisementsSchema =
	createSelectSchema(advertisementsTable);

// 广告模型定义
export const advertisementsModel = {
	selectAdvertisementsTable: selectAdvertisementsSchema,
	// 创建广告请求参数
	insertAdvertisementsDto: insertAdvertisementsSchema.omit({
		id: true,
		clickCount: true,
		viewCount: true,
		createdAt: true,
		updatedAt: true,
	}),

	updateAdvertisementsDto: updateAdvertisementsSchema.omit({
		id: true,
		clickCount: true,
		viewCount: true,
		createdAt: true,
		updatedAt: true,
	}),

	// 广告列表查询参数
	queryAdvertisementsListDto: UnoPageQueryZod.extend({
		position: z.string().optional(),
		isActive: z.boolean().optional(),
		title: z.string().optional(),
		type: z.enum(["banner", "carousel", "list"]).optional(), // 广告类型：banner横幅、carousel轮播、list列表
	}),

	// 按位置查询广告参数
	queryAdvertisementsByPositionDto: z.object({
		position: z.string(),
		isActive: z.boolean().default(true),
		limit: z.number().int().positive().optional(),
	}),

	// 广告统计更新DTO
	updateAdvertisementStatsDto: z.object({
		type: z.enum(["click", "view"]),
	}),

	// 批量更新广告状态DTO
	batchUpdateAdvertisementStatusDto: z.object({
		ids: z.array(z.number().positive()),
		isActive: z.boolean(),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertAdvertisementsDto = z.infer<
	typeof advertisementsModel.insertAdvertisementsDto
>; // 请求用
export type UpdateAdvertisementsDto = z.infer<
	typeof advertisementsModel.updateAdvertisementsDto
>; // 请求用
export type SelectAdvertisementsType = z.infer<
	typeof advertisementsModel.selectAdvertisementsTable
>; // 查询返回原始类型
export type AdvertisementsListQueryDto = z.infer<
	typeof advertisementsModel.queryAdvertisementsListDto
>;
export type AdvertisementsByPositionQueryDto = z.infer<
	typeof advertisementsModel.queryAdvertisementsByPositionDto
>;
export type UpdateAdvertisementStatsDto = z.infer<
	typeof advertisementsModel.updateAdvertisementStatsDto
>;
export type BatchUpdateAdvertisementStatusDto = z.infer<
	typeof advertisementsModel.batchUpdateAdvertisementStatusDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectAdvertisementsVo = Omit<
	SelectAdvertisementsType,
	"image_id"
> & { imageUrl: string };

// 5. 关系定义（广告表通常不需要复杂的关系定义）
// export const advertisementsRelations = relations(advertisementsTable, ({ }) => ({}));

export const advertisementsRelations = relations(
	advertisementsTable,
	({ one }) => ({
		// 广告图片关联到图片管理表 - 外键在advertisements表中
		imageRef: one(imagesTable, {
			fields: [advertisementsTable.image_id],
			references: [imagesTable.id],
		}),
	}),
);
