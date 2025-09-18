import { FOLDDER_TYPE } from "@backend/modules/oss";
import { relations } from "drizzle-orm";
import {
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
import { t } from "elysia";
import { z } from "zod/v4";
import { advertisementsTable } from "./advertisements.model";
import { partnersTable } from "./partners.model";
import { productImagesTable } from "./product.model";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 图片表 - 存储系统中的所有图片信息
 * 支持多种用途的图片管理（产品图片、广告图片等）
 */
export const imagesTable = pgTable("images", {
	id: serial("id").primaryKey(), // 图片唯一标识
	fileName: varchar("file_name", { length: 255 }).notNull(), // 存储文件名
	imageUrl: text("image_url").notNull().unique(), // 图片访问URL - 添加唯一约束用于外键引用
	category: varchar("category", { length: 50 }).notNull().default("general"), // 图片分类
	fileSize: integer("file_size").notNull(), // 文件大小(字节)
	mimeType: varchar("mime_type", { length: 100 }).notNull(), // 文件MIME类型
	alt: text("alt").default(""), // 图片ALT文本
	createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertImagesSchema = createInsertSchema(imagesTable, {
	imageUrl: z.string(),
	mimeType: z.string().min(1, "MIME类型不能为空"),
});
export const updateImagesSchema = createUpdateSchema(imagesTable, {
	imageUrl: z.string(),
	mimeType: z.string().min(1, "MIME类型不能为空"),
});
export const selectImagesSchema = createSelectSchema(imagesTable);

// 图片模型定义
export const imagesModel = {
	selectImagesTable: selectImagesSchema,
	// 创建图片请求参数
	insertImagesDto: insertImagesSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	updateImagesDto: updateImagesSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),
	// 图片列表查询参数
	queryImagesListDto: UnoQueryZod.extend({
		category: z.string().optional(),
		mimeType: z.string().optional(),
		filename: z.string().optional(),
	}),
	// 批量删除图片参数
	batchDeleteImagesDto: z.object({
		ids: z.array(z.number().positive()),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertImagesDto = z.infer<typeof imagesModel.insertImagesDto>; // 请求用
export type UpdateImagesDto = z.infer<typeof imagesModel.updateImagesDto>; // 请求用
export type SelectImagesType = z.infer<typeof imagesModel.selectImagesTable>; // 查询返回原始类型
export type ListImagesQueryDto = z.infer<typeof imagesModel.queryImagesListDto>;
export type BatchDeleteImagesDto = z.infer<
	typeof imagesModel.batchDeleteImagesDto
>;
// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectImagesVo = SelectImagesType;

//5. 创建关联
export const imagesRelations = relations(imagesTable, ({ many }) => ({
	// 图片可以被多个广告使用 - 外键在advertisements表中
	advertisements: many(advertisementsTable),
	// 图片可以被多个合作伙伴使用 - 外键在partners表中
	partners: many(partnersTable),
	// 图片可以被多个商品使用(通过中间表)
	productImages: many(productImagesTable),
}));

// Zod 模型定义
export const uploadsModel = {
	// 单文件上传请求参数
	UploadImageDto: t.Object({
		file: t.File(),
		folder: t.UnionEnum([
			FOLDDER_TYPE.GENERAL,
			FOLDDER_TYPE.BANNER,
			FOLDDER_TYPE.PRODUCT,
			FOLDDER_TYPE.LOGO,
			FOLDDER_TYPE.USER_AVATAR,
			FOLDDER_TYPE.OTHER,
		]),
	}),
	// 多文件上传请求参数
	UploadImagesDto: t.Object({
		files: t.Files(),
		folder: t.UnionEnum([
			FOLDDER_TYPE.GENERAL,
			FOLDDER_TYPE.BANNER,
			FOLDDER_TYPE.PRODUCT,
			FOLDDER_TYPE.LOGO,
			FOLDDER_TYPE.USER_AVATAR,
			FOLDDER_TYPE.OTHER,
		]),
	}),
};
// 导出 Zod 推断类型
export type UploadImageDto = typeof uploadsModel.UploadImageDto.static;
export type UploadImagesDto = typeof uploadsModel.UploadImagesDto.static;
