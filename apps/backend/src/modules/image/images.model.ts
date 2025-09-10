import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.types";
import { type Static, t } from "elysia";

// 图片管理模型定义
export const imagesModel = {
	// 创建图片请求参数
	CreateImageDto: t.Omit(DbType.typebox.insert.imagesSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新图片请求参数
	UpdateImageDto: t.Omit(DbType.typebox.insert.imagesSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 图片列表查询参数
	ImageListQueryDto: t.Composite([
		UnoQuery,
		t.Object({
			category: t.Optional(t.String()),
			search: t.Optional(t.String()),
			mimeType: t.Optional(t.String()),
		}),
	]),

	// 批量删除请求参数
	BatchDeleteImageDto: t.Object({
		imageIds: t.Array(t.String()),
	}),

	// 预签名URL请求参数（包含创建图片记录所需信息）
	PresignedUrlDto: t.Object({
		fileName: t.String(),
		category: t.Optional(t.String()),
		fileSize: t.Number(),
		mimeType: t.String(),
		altText: t.Optional(t.String()),
	}),
};

// 导出类型
export type ImageEntity = Static<typeof DbType.typebox.insert.imagesSchema>;
export type CreateImageDto = typeof imagesModel.CreateImageDto.static;
export type UpdateImageDto = typeof imagesModel.UpdateImageDto.static;
export type ImageListQueryDto = typeof imagesModel.ImageListQueryDto.static;

export type PresignedUrlDto = typeof imagesModel.PresignedUrlDto.static;
