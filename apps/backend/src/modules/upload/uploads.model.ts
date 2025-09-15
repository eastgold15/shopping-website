
import { z } from "zod/v4";
import { imagesModel } from "@backend/db/models/images.model";
import { FOLDDER_TYPE } from "../oss";

// Zod 模型定义
export const uploadsModel = {
	// 图片信息类型 - 引用 images 模型
	ImageInfo: imagesModel.selectImagesTable,

	// 文件信息类型
	FileInfo: z.object({
		url: z.string().url("请提供有效的URL"),
		fileName: z.string().min(1, "文件名不能为空"),
		size: z.number().positive("文件大小必须为正数"),
		type: z.string().min(1, "文件类型不能为空"),
		uploadedAt: z.string(),
	}),

	// 单文件上传请求参数
	UploadImageDto: z.object({
		file: z.any(), // 文件对象，在运行时验证
		folder: z.enum([
			FOLDDER_TYPE.ADVERTISEMENT,
			FOLDDER_TYPE.CATEGORY,
			FOLDDER_TYPE.GENERAL,
			FOLDDER_TYPE.PRODUCT,
			FOLDDER_TYPE.USER_AVATAR,
		]).optional().default(FOLDDER_TYPE.GENERAL),
	}),

	// 多文件上传请求参数
	UploadImagesDto: z.object({
		files: z.array(z.any()).min(1, "至少需要上传一个文件"), // 文件数组，在运行时验证
		folder: z.enum([
			FOLDDER_TYPE.ADVERTISEMENT,
			FOLDDER_TYPE.CATEGORY,
			FOLDDER_TYPE.GENERAL,
			FOLDDER_TYPE.PRODUCT,
			FOLDDER_TYPE.USER_AVATAR,
		]).optional().default(FOLDDER_TYPE.GENERAL),
	}),

	// 上传响应类型
	UploadResponse: z.object({
		success: z.boolean(),
		message: z.string(),
		url: z.string().url().optional(),
		fileName: z.string().optional(),
		error: z.string().optional(),
	}),

	// 批量上传响应类型
	BatchUploadResponse: z.object({
		success: z.boolean(),
		message: z.string(),
		urls: z.array(z.string().url()).optional(),
		files: z.array(
			z.object({
				url: z.string().url(),
				fileName: z.string(),
			})
		).optional(),
		error: z.string().optional(),
	}),
};

// 导出 Zod 推断类型
export type UploadImageDto = z.infer<typeof uploadsModel.UploadImageDto>;
export type UploadImagesDto = z.infer<typeof uploadsModel.UploadImagesDto>;
export type UploadResponse = z.infer<typeof uploadsModel.UploadResponse>;
export type BatchUploadResponse = z.infer<typeof uploadsModel.BatchUploadResponse>;
export type FileInfo = z.infer<typeof uploadsModel.FileInfo>;
export type ImageInfo = z.infer<typeof uploadsModel.ImageInfo>;

// 导出选择的图片类型（从 images 模型）
export type SelectImageType = z.infer<typeof imagesModel.selectImagesTable>;
