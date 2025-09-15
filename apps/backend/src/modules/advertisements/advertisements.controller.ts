import { Elysia } from "elysia";
import { z } from "zod/v4";
import { advertisementsModel } from "../../db/models/advertisements.model";
import { commonRes, UpdateSortDto } from "../../types";
import { AdvertisementsService } from "./advertisements.service";

/**
 * 广告控制器
 * 处理广告相关的HTTP请求
 */
export const advertisementsController = new Elysia({
	prefix: "/advertisements",
})

	.model(advertisementsModel)
	.decorate("advertisementsService", new AdvertisementsService())
	// 获取广告列表 - RESTful标准设计，支持类型筛选
	.get(
		"/",
		async ({ query, advertisementsService }) => {
			// 根据查询参数决定返回哪种广告列表
			if (query.type === 'banner') {
				const banners = await advertisementsService.getBannerAdvertisements(
					query.position,
				);
				return commonRes(banners);
			}

			if (query.type === 'carousel') {
				const carousels = await advertisementsService.getCarouselAdvertisements();
				return commonRes(carousels);
			}

			// 默认返回分页广告列表
			const result = await advertisementsService.getAdvertisementList(query);
			return commonRes(result);
		},
		{
			query: advertisementsModel.queryAdvertisementsListDto,
			detail: {
				summary: "获取广告列表",
				description: "获取广告列表，支持分页、搜索和筛选。使用type=banner获取Banner广告，type=carousel获取轮播图广告",
				tags: ["Advertisements"],
			},
		},
	)

	// 根据ID获取广告详情
	.get(
		"/:id",
		async ({ params: { id }, advertisementsService }) => {
			const advertisement =
				await advertisementsService.getAdvertisementById(id);
			return commonRes(advertisement);
		},
		{
			params: z.object({
				id: z.number(),
			}),
			detail: {
				summary: "获取广告详情",
				description: "根据ID获取广告详细信息",
				tags: ["Advertisements"],
			},
		},
	)

	// 创建广告
	.post(
		"/",
		async ({ body, advertisementsService }) => {
			const advertisement =
				await advertisementsService.createAdvertisement(body);
			return commonRes(advertisement, 201);
		},
		{
			body: advertisementsModel.insertAdvertisementsDto,
			detail: {
				summary: "创建广告",
				description: "创建新的广告",
				tags: ["Advertisements"],
			},
		},
	)

	// 更新广告
	.put(
		"/:id",
		async ({ params: { id }, body, advertisementsService }) => {
			const advertisement = await advertisementsService.updateAdvertisement(
				id,
				body,
			);
			return commonRes(advertisement);
		},
		{
			params: z.object({
				id: z.number(),
			}),
			body: advertisementsModel.updateAdvertisementsDto,
			detail: {
				summary: "更新广告",
				description: "更新指定ID的广告信息",
				tags: ["Advertisements"],
			},
		},
	)

	// 删除广告
	.delete(
		"/:id",
		async ({ params: { id }, advertisementsService }) => {
			const advertisement = await advertisementsService.deleteAdvertisement(id);
			return commonRes(advertisement);
		},
		{
			params: z.object({
				id: z.number(),
			}),
			detail: {
				summary: "删除广告",
				description: "删除指定ID的广告",
				tags: ["Advertisements"],
			},
		},
	)

	// 切换广告状态
	.patch(
		"/:id/toggle",
		async ({ params: { id }, advertisementsService }) => {
			const advertisement =
				await advertisementsService.toggleAdvertisementStatus(id);
			return commonRes(advertisement);
		},
		{
			params: z.object({
				id: z.number(),
			}),
			detail: {
				summary: "切换广告状态",
				description: "切换广告的激活/停用状态",
				tags: ["Advertisements"],
			},
		},
	)

	// 获取激活的广告
	.get(
		"/active/list",
		async ({ query, advertisementsService }) => {
			const advertisements =
				await advertisementsService.getActiveAdvertisements(
					query.position,
				);
			return commonRes(advertisements);
		},
		{
			query: advertisementsModel.queryAdvertisementsByPositionDto,
			detail: {
				summary: "获取激活的广告",
				description: "获取所有激活状态的广告，支持按类型和位置筛选",
				tags: ["Advertisements"],
			},
		},
	)

	// 更新广告排序
	.patch(
		"/:id/sort",
		async ({ params: { id }, body, advertisementsService }) => {
			const advertisement = await advertisementsService.updateAdvertisementSort(
				id,
				body,
			);
			return commonRes(advertisement);
		},
		{
			params: z.object({
				id: z.number(),
			}),
			body: UpdateSortDto,
			detail: {
				summary: "更新广告排序",
				description: "更新指定广告的排序值",
				tags: ["Advertisements"],
			},
		},
	);
