import { Elysia, t } from "elysia";
import { imagesModel } from "../../db/models/images.model";
import { NotFoundError } from "../../utils/error/customError";
import { commonRes } from "../../utils/Res";
import { ImageService } from "./images.service";

/**
 * 图片管理控制器
 * 处理图片相关的HTTP请求
 */
export const imagesController = new Elysia({
	prefix: "/images",
	tags: ["Images"],
})
	.model(imagesModel)
	// 分页获取图片列表 - RESTful标准设计
	.get(
		"/",
		async ({ query }) => {
			const result = await ImageService.getList(query);
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
		async ({ params }) => {
			const result = await ImageService.getById(params.id);
			if (!result) {
				throw new NotFoundError("图片不存在");
			}
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
		async ({ params, body }) => {
			const result = await ImageService.update(params.id, body as any);
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
		async ({ params: { id } }) => {
			try {
				const result = await ImageService.deleteWithFile(id);
				return commonRes(null, 204, "删除成功");
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
		async ({ body }) => {
			try {
				const { imageIds } = body as any;
				const result = await ImageService.deleteBatchWithFiles(imageIds);
				return commonRes(null, 204, `成功删除 ${result} 张图片`);
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
