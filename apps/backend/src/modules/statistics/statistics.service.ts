import {
	categoriesSchema,
	imagesSchema,
	productImagesSchema,
	productsSchema,
} from "@backend/db/schema/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import type {
	CategorySalesItem,
	CategorySalesQuery,
	DashboardQuery,
	DashboardStats,
	PopularProductItem,
	PopularProductsQuery,
	SalesTrendQuery,
	UserGrowthQuery,
} from "./statistics.model";
export class StatisticsService {
	/**
	 * 获取仪表板统计数据
	 */
	async getDashboard(query: DashboardQuery): Promise<DashboardStats> {
		try {
			// 获取商品统计数据
			const productStatsResult = await db
				.select({
					totalProducts: count(),
					activeProducts: sql<number>`count(case when ${productsSchema.isActive} = true then 1 end)`,
					featuredProducts: sql<number>`count(case when ${productsSchema.isFeatured} = true then 1 end)`,
				})
				.from(productsSchema);

			const productStats = productStatsResult[0] || {
				totalProducts: 0,
				activeProducts: 0,
				featuredProducts: 0,
			};

			// 获取最新商品列表（带链接）
			const recentProducts = await db
				.select({
					id: productsSchema.id,
					name: productsSchema.name,
					slug: productsSchema.slug,
					price: productsSchema.price,
					isActive: productsSchema.isActive,
					isFeatured: productsSchema.isFeatured,
					createdAt: productsSchema.createdAt,
				})
				.from(productsSchema)
				.where(eq(productsSchema.isActive, true))
				.orderBy(desc(productsSchema.createdAt))
				.limit(10);

			const result = {
				// 商品统计概览
				productStats: productStats,
				// 最新商品列表（可用于生成链接）
				recentProducts: recentProducts.map((product) => ({
					...product,
					// 生成商品详情页链接
					detailUrl: `/products/${product.slug}`,
					// 生成管理页面链接
					adminUrl: `/admin/products/${product.id}`,
				})),
				// 预留扩展字段
				extensions: {
					// 未来可以添加其他统计数据
					// 例如：销售统计、用户统计、订单统计等
				},
			};

			return result;
		} catch (error) {
			console.error("获取仪表板统计数据失败:", error);
			throw error;
		}
	}

	/**
	 * 获取销售趋势数据
	 */
	async getSalesTrend(query: SalesTrendQuery) {
		try {
			const { period = "7d", startDate, endDate } = query;

			let dateRange;
			const now = new Date();

			switch (period) {
				case "7d":
					dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case "30d":
					dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
				case "90d":
					dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
					break;
				case "custom":
					if (startDate && endDate) {
						dateRange = new Date(startDate);
					} else {
						dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					}
					break;
				default:
					dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			}

			// 这里应该查询订单表获取销售数据
			// 由于示例中没有完整的订单表结构，这里返回模拟数据
			const mockTrend = [];
			const days =
				period === "custom" && startDate && endDate
					? Math.ceil(
							(new Date(endDate).getTime() - new Date(startDate).getTime()) /
								(24 * 60 * 60 * 1000),
						)
					: parseInt(period.replace("d", ""));

			for (let i = 0; i < days; i++) {
				const date = new Date(dateRange.getTime() + i * 24 * 60 * 60 * 1000);
				mockTrend.push({
					date: date.toISOString().split("T")[0],
					sales: Math.floor(Math.random() * 100) + 50,
					orders: Math.floor(Math.random() * 20) + 10,
					revenue: Math.floor(Math.random() * 10000) + 5000,
				});
			}

			const summary = {
				totalSales: mockTrend.reduce((sum, item) => sum + item.sales, 0),
				totalOrders: mockTrend.reduce((sum, item) => sum + item.orders, 0),
				totalRevenue: mockTrend.reduce((sum, item) => sum + item.revenue, 0),
				averageOrderValue: 0,
			};
			summary.averageOrderValue =
				summary.totalOrders > 0
					? summary.totalRevenue / summary.totalOrders
					: 0;

			return {
				trend: mockTrend,
				summary,
			};
		} catch (error) {
			console.error("获取销售趋势数据失败:", error);
			throw error;
		}
	}

	/**
	 * 获取热门商品统计
	 */
	async getPopularProducts(
		query: PopularProductsQuery,
	): Promise<PopularProductItem[]> {
		try {
			const { pageSize = 10 } = query;

			// 获取商品列表（这里应该根据销量排序，暂时按创建时间）
			// 使用左连接获取商品图片
			const products = await db
				.select({
					id: productsSchema.id,
					name: productsSchema.name,
					slug: productsSchema.slug,
					price: productsSchema.price,

					imageUrl: imagesSchema.url,
				})
				.from(productsSchema)
				.leftJoin(
					productImagesSchema,
					eq(productsSchema.id, productImagesSchema.productId),
				)
				.leftJoin(
					imagesSchema,
					eq(productImagesSchema.imageId, imagesSchema.id),
				)
				.where(eq(productsSchema.isActive, true))
				.orderBy(desc(productsSchema.createdAt))
				.limit(pageSize);

			// 模拟销售数据
			const result = products.map((product) => ({
				...product,
				salesCount: Math.floor(Math.random() * 500) + 100,
				revenue:
					(Math.floor(Math.random() * 500) + 100) * Number(product.price),
			}));

			return result;
		} catch (error) {
			console.error("获取热门商品统计失败:", error);
			throw error;
		}
	}

	/**
	 * 获取分类销售统计
	 */
	async getCategorySales(
		query: CategorySalesQuery,
	): Promise<CategorySalesItem[]> {
		try {
			const { pageSize = 10 } = query;

			// 获取分类列表
			const categories = await db
				.select({
					id: categoriesSchema.id,
					name: categoriesSchema.name,
					slug: categoriesSchema.slug,
				})
				.from(categoriesSchema)
				.where(eq(categoriesSchema.isVisible, true))
				.limit(pageSize);

			// 模拟销售数据
			const result = categories.map((category) => ({
				categoryId: category.id,
				categoryName: category.name,
				salesCount: Math.floor(Math.random() * 200) + 50,
				revenue: Math.floor(Math.random() * 50000) + 10000,
				percentage: Math.floor(Math.random() * 100),
			}));

			return result;
		} catch (error) {
			console.error("获取分类销售统计失败:", error);
			throw error;
		}
	}

	/**
	 * 获取用户增长趋势
	 */
	async getUserGrowth(query: UserGrowthQuery) {
		try {
			const { period = "30d" } = query;
			const days = parseInt(period.replace("d", ""));
			const now = new Date();
			const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

			// 模拟用户增长数据
			const growth = [];
			let totalUsers = 1000;

			for (let i = 0; i < days; i++) {
				const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
				const newUsers = Math.floor(Math.random() * 20) + 5;
				totalUsers += newUsers;

				growth.push({
					date: date.toISOString().split("T")[0],
					newUsers,
					activeUsers: Math.floor(Math.random() * 100) + 50,
					totalUsers,
				});
			}

			const summary = {
				totalNewUsers: growth.reduce((sum, item) => sum + item.newUsers, 0),
				averageActiveUsers: Math.round(
					growth.reduce((sum, item) => sum + item.activeUsers, 0) /
						growth.length,
				),
				growthRate:
					growth.length > 1
						? Math.round(
								((growth[growth.length - 1].totalUsers - growth[0].totalUsers) /
									growth[0].totalUsers) *
									100 *
									100,
							) / 100
						: 0,
			};

			return {
				growth,
				summary,
			};
		} catch (error) {
			console.error("获取用户增长趋势失败:", error);
			throw error;
		}
	}
}

// 导出服务实例
export const statisticsService = new StatisticsService();
