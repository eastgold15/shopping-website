import { Elysia, t } from "elysia";
import { imagesModel } from "../../db/models/images.model";
import {
	InternalServerError,
	NotFoundError,
} from "../../utils/error/customError";
import { commonRes } from "../../utils/Res";
import { ossService } from "../oss";
import { ImageService } from "./images.service";

/**
 * 图片管理控制器
 * 处理图片相关的HTTP请求
 */
export const imagesController = new Elysia({ prefix: "/images" })
	.decorate("imagesService", new ImageService())
	.model(imagesModel)
	.guard({
		detail: {
			tags: ["Images"],
		},
	})
	// 获取图片列表 - RESTful标准设计
	.get(
		"/",
		async ({ query, imagesService }) => {
			const result = await imagesService.getImageList(query);
			return commonRes(result);
		},
		{
			query: "queryImagesListDto",
			detail: {
				summary: "获取图片列表",
				description: "获取图片列表，支持分类筛选、搜索和分页",
			},
		},
	)

	// 获取单个图片信息
	.get(
		"/:id",
		async ({ params, imagesService }) => {
			const result = await imagesService.getImageById(params.id);
			return commonRes(result);
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				summary: "获取单个图片信息",
				description: "根据ID获取图片的详细信息",
			},
		},
	)

	// 更新图片信息
	.put(
		"/:id",
		async ({ params, body, imagesService }) => {
			const result = await imagesService.updateImage(params.id, body as any);
			return commonRes(result);
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateImagesDto",
			detail: {
				summary: "更新图片信息",
				description: "更新图片的基本信息",
			},
		},
	)

	// 删除图片
	.delete(
		"/:id",
		async ({ params: { id }, imagesService }) => {
			try {
				// 先获取图片信息
				const [imageResult] = await imagesService.getImageById(id);

				if (!imageResult) {
					throw new NotFoundError("图片不存在");
				}

				const imageUrl = imageResult.url;

				// 从OSS删除文件
				try {
					const ossKey = imageUrl.split("/").pop(); // 从URL提取key
					if (ossKey) {
						await ossService.deleteFile(ossKey);
					}
				} catch (ossError) {
					console.warn("OSS文件删除失败:", ossError);
					// 继续删除数据库记录，即使OSS删除失败
				}

				// 删除数据库记录
				const deleteResult = await imagesService.delete(id);

				if (!deleteResult) {
					throw new InternalServerError("删除图片记录失败");
				}

				return commonRes(null, 410, "删除成功");
			} catch (error) {
				console.error("删除图片失败:", error);
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				summary: "删除图片",
				description: "删除指定的图片记录和文件",
			},
		},
	)

	// 批量删除图片
	.delete(
		"/batch",
		async ({ body, imagesService }) => {
			try {
				const { imageIds } = body as any;

				if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
					return {
						success: false,
						error: "请提供有效的图片ID列表",
					};
				}

				// 获取所有图片信息
				const images = [];
				for (const id of imageIds) {
					const [result] = await imagesService.getImageById(id);
					images.push(result)
				}

				// 从OSS批量删除文件
				const ossKeys = images
					.map((img) => img.url.split("/").pop())
					.filter(Boolean);

				if (ossKeys.length > 0) {
					try {
						await Promise.all(
							ossKeys.map((key) => ossService.deleteFile(key!)),
						);
					} catch (ossError) {
						console.warn("OSS批量删除失败:", ossError);
						// 继续删除数据库记录
					}
				}

				// 批量删除数据库记录
				const deleteResult = await imagesService.deleteImages(imageIds);

				if (!deleteResult) {
					throw new InternalServerError("数据库操作失败");
				}

				return commonRes(null, 410, "删除成功");
			} catch (error) {
				console.error("批量删除图片失败:", error);
				throw error;
			}
		},
		{
			body: "batchDeleteImagesDto",
			detail: {
				summary: "批量删除图片",
				description: "批量删除多个图片记录和文件",
			},
		},
	);

// // 获取图片统计信息
// .get(
//   "/stats/overview",
//   async ({ imagesService }) => {
//     const result = await imagesService.getImageStats();

//     if (result.code !== 200) {
//       return {
//         success: false,
//         error: result.message || "获取统计信息失败",
//       };
//     }

//     return commonRes(result.data);
//   },
//   {
//     detail: {
//       summary: "获取图片统计信息",
//       description: "获取图片的统计概览信息",
//     },
//   },
// );
