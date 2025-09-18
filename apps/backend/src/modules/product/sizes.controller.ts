import { attributesModel } from "@backend/db/models/attribute.model";
import { paramIdZod } from "@backend/types";
import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { SizesService } from "./sizes.service";

/**
 * 尺寸控制器
 * 处理HTTP请求和响应
 */
export const sizesController = new Elysia({
	prefix: "/sizes",
	tags: ["Sizes"],
})
	.model(attributesModel)
	.decorate("sizesService", new SizesService())

	// 创建尺寸
	.post(
		"/",
		async ({ body, sizesService }) => {
			const result = await sizesService.create(body);
			return commonRes(result, 200, "尺寸创建成功");
		},
		{
			body: "insertSizeDto",
			detail: {
				tags: ["Sizes"],
				summary: "创建尺寸",
				description: "创建新的尺寸",
			},
		},
	)

	// 获取尺寸列表
	.get(
		"/",
		async ({ query, sizesService }) => {
			try {
				const result = await sizesService.getList(query);
				return commonRes(result, 200, "获取尺寸列表成功");
			} catch (error) {
				console.error("获取尺寸列表失败:", error);
				return commonRes(
					null,
					500,
					error instanceof Error ? error.message : "获取尺寸列表失败",
				);
			}
		},
		{
			query: "querySizeListDto",
			detail: {
				tags: ["Sizes"],
				summary: "获取尺寸列表",
				description: "获取尺寸列表，支持分页、搜索、筛选和排序",
			},
		},
	)

	// 根据ID获取尺寸详情
	.get(
		"/:id",
		async ({ params: { id }, sizesService }) => {
			if (!id) {
				return commonRes(null, 400, "ID参数不能为空");
			}
			const result = await sizesService.getById(parseInt(id));
			return commonRes(result);
		},
		{
			params: paramIdZod,
			detail: {
				tags: ["Sizes"],
				summary: "根据ID获取尺寸详情",
				description: "根据尺寸ID获取尺寸的详细信息",
			},
		},
	)

	// 更新尺寸
	.put(
		"/:id",
		async ({ params: { id }, body, sizesService }) => {
			const result = await sizesService.update(id, body);
			return commonRes(result, 200, "尺寸更新成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateSizeDto",
			detail: {
				tags: ["Sizes"],
				summary: "更新尺寸",
				description: "根据尺寸ID更新尺寸信息",
			},
		},
	)

	// 删除尺寸
	.delete(
		"/:id",
		async ({ params: { id }, sizesService }) => {
			const result = await sizesService.delete(id);
			return commonRes(result, 200, "尺寸删除成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				tags: ["Sizes"],
				summary: "删除尺寸",
				description: "根据尺寸ID删除尺寸",
			},
		},
	);
