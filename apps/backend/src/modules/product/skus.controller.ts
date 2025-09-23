import { skusModel } from "@backend/db/models/sku.model";
import { paramIdZod } from "@backend/types";
import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { SkusService } from "./index";

/**
 * SKU控制器
 * 处理HTTP请求和响应
 */
export const skusController = new Elysia({
	prefix: "/skus",
	tags: ["SKUs"],
})
	.model(skusModel)
	.decorate("skusService", SkusService)

	// 创建SKU
	.post(
		"/",
		async ({ body, skusService }) => {
			const result = await skusService.create(body);
			return commonRes(result, 200, "SKU创建成功");
		},
		{
			body: "insertSkuDto",
			detail: {
				tags: ["SKUs"],
				summary: "创建SKU",
				description: "创建新的SKU",
			},
		},
	)

	// 获取SKU列表
	.get(
		"/",
		async ({ query, skusService }) => {
			try {
				const result = await skusService.getList(query);
				return commonRes(result, 200, "获取SKU列表成功");
			} catch (error) {
				console.error("获取SKU列表失败:", error);
				return commonRes(
					null,
					500,
					error instanceof Error ? error.message : "获取SKU列表失败",
				);
			}
		},
		{
			query: "querySkuListDto",
			detail: {
				tags: ["SKUs"],
				summary: "获取SKU列表",
				description: "获取SKU列表，支持分页、搜索、筛选和排序",
			},
		},
	)

	// 根据ID获取SKU详情
	.get(
		"/:id",
		async ({ params: { id }, skusService }) => {
			const result = await skusService.getById(id);
			return commonRes(result);
		},
		{
			params: paramIdZod,
			detail: {
				tags: ["SKUs"],
				summary: "根据ID获取SKU详情",
				description: "根据SKU ID获取SKU的详细信息",
			},
		},
	)

	// 根据商品ID获取所有SKU
	.get(
		"/product/:productId",
		async ({ params: { productId }, skusService }) => {
			const result = await skusService.getByProductId(productId);
			return commonRes(result);
		},
		{
			params: t.Object({
				productId: t.Number(),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "根据商品ID获取所有SKU",
				description: "根据商品ID获取所有相关的SKU信息",
			},
		},
	)

	// 更新SKU
	.put(
		"/:id",
		async ({ params: { id }, body, skusService }) => {
			const result = await skusService.update(id, body);
			return commonRes(result, 200, "SKU更新成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateSkuDto",
			detail: {
				tags: ["SKUs"],
				summary: "更新SKU",
				description: "根据SKU ID更新SKU信息",
			},
		},
	)

	// 删除SKU
	.delete(
		"/:id",
		async ({ params: { id }, skusService }) => {
			const result = await skusService.delete(id);
			return commonRes(result, 200, "SKU删除成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "删除SKU",
				description: "根据SKU ID删除SKU",
			},
		},
	)

	// 为SKU添加图片
	.post(
		"/:id/images",
		async ({ params: { id }, body }) => {
			const { imageId, isMain } = body;
			const result = await SkusService.addSkuImage(id, imageId, isMain);
			return commonRes(result, 200, "SKU图片添加成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: t.Object({
				imageId: t.Number(),
				isMain: t.Optional(t.Boolean()),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "为SKU添加图片",
				description: "为指定SKU添加图片关联",
			},
		},
	)

	// 设置SKU主图
	.put(
		"/:id/images/:imageId/main",
		async ({ params: { id, imageId } }) => {
			await SkusService.setSkuMainImage(id, imageId);
			return commonRes(null, 200, "SKU主图设置成功");
		},
		{
			params: t.Object({
				id: t.Number(),
				imageId: t.Number(),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "设置SKU主图",
				description: "设置指定图片为SKU的主图",
			},
		},
	)

	// 批量更新SKU图片
	.put(
		"/:id/images",
		async ({ params: { id }, body }) => {
			const { images } = body;
			await SkusService.updateSkuImages(id, images);
			return commonRes(null, 200, "SKU图片更新成功");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: t.Object({
				images: t.Array(t.Number()),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "批量更新SKU图片",
				description: "批量更新SKU关联的图片",
			},
		},
	)

	// 基于颜色规格批量创建SKU
	.post(
		"/batch/:productId",
		async ({ params: { productId }, body }) => {
			const result = await SkusService.batchCreateByColorSpecs({
				productId,
				colorSpecs: body.colorSpecs,
			});
			return commonRes(result, 201, `成功创建 ${result.createdCount} 个SKU`);
		},
		{
			params: t.Object({
				productId: t.Number(),
			}),
			body: t.Object({
				colorSpecs: t.Array(
					t.Object({
						id: t.Number(), // 颜色规格ID
						name: t.String(), // SKU名称（使用颜色名称）
						price: t.String(), // 价格
						comparePrice: t.Optional(t.String()), // 原价
						cost: t.Optional(t.String()), // 成本价
						stock: t.Number(), // 库存
						minStock: t.Optional(t.Number()), // 最低库存
						weight: t.Optional(t.String()), // 重量
						skuCode: t.Optional(t.String()), // SKU编码
					})
				),
			}),
			detail: {
				tags: ["SKUs"],
				summary: "基于颜色规格批量创建SKU",
				description: "为指定商品基于颜色规格批量创建SKU，一个颜色规格对应一个SKU",
			},
		},
	);
