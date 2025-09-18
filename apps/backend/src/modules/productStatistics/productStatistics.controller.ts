import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { ProductStatisticsService } from "./productStatistics.service";

/**
 * 商品统计控制器
 * 处理商品统计相关的HTTP请求
 */
export const productStatisticsController = new Elysia({
	prefix: "/product-statistics",
	tags: ["商品统计"],
})
	.onBeforeHandle(() => {
		// 可以在这里添加全局的前置处理逻辑
	})

	// 获取商品概览统计数据
	.get(
		"/overview",
		async () => {
			const result = await ProductStatisticsService.getProductOverview();
			return commonRes(result);
		},
		{
			detail: {
				summary: "获取商品概览统计",
				description:
					"获取商品总数、上架商品数、推荐商品数、低库存商品数等概览数据",
			},
		},
	)

	// 获取热门商品统计
	.get(
		"/popular",
		async ({ query }) => {
			const result = await ProductStatisticsService.getPopularProducts({
				limit: query.limit,
			});
			return commonRes(result);
		},
		{
			query: t.Object({
				limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
			}),
			detail: {
				summary: "获取热门商品统计",
				description: "获取浏览量、搜索量、收藏量最多的商品列表",
			},
		},
	)

	// 获取最新商品列表
	.get(
		"/recent",
		async ({ query }) => {
			const result = await ProductStatisticsService.getRecentProducts(
				query.limit,
			);
			return commonRes(result);
		},
		{
			query: t.Object({
				limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 })),
			}),
			detail: {
				summary: "获取最新商品列表",
				description: "获取最新添加的商品列表",
			},
		},
	)

	// 获取分类商品统计
	.get(
		"/by-category",
		async () => {
			const result = await ProductStatisticsService.getProductStatsByCategory();
			return commonRes(result);
		},
		{
			detail: {
				summary: "获取分类商品统计",
				description: "按分类统计商品数量",
			},
		},
	);
