import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { imagesTable } from "../../db/models/images.model";
import {
	productImagesTable,
	productsTable,
} from "../../db/models/product.model";
import type {
	PopularProductItem,
	ProductOverviewStats,
} from "../../db/models/productStatistics.model";
import BaseService from "../../utils/services";

/**
 * 商品统计服务类
 * 处理所有商品统计相关的业务逻辑
 */
export class ProductStatisticsService extends BaseService<any, any, any> {
	protected readonly table = productsTable;
	protected readonly tableName = "products";

	/**
	 * 获取商品概览统计数据
	 */
	static async getProductOverview(): Promise<ProductOverviewStats> {
		try {
			// 获取商品统计数据
			const productStatsResult = await db
				.select({
					totalProducts: count(),
					activeProducts: sql<number>`count(case when ${productsTable.isActive} = true then 1 end)`,
					featuredProducts: sql<number>`count(case when ${productsTable.isFeatured} = true then 1 end)`,
					lowStockProducts: sql<number>`count(case when ${productsTable.stock} <= ${productsTable.minStock} then 1 end)`,
				})
				.from(productsTable);

			const productStats = productStatsResult[0] || {
				totalProducts: 0,
				activeProducts: 0,
				featuredProducts: 0,
				lowStockProducts: 0,
			};

			return productStats;
		} catch (error) {
			console.error("获取商品概览统计数据失败:", error);
			throw error;
		}
	}

	/**
	 * 获取热门商品统计
	 */
	static async getPopularProducts(
		query: { limit?: number } = {},
	): Promise<PopularProductItem[]> {
		try {
			const { limit = 10 } = query;

			// 获取商品列表（带图片）
			const products = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					slug: productsTable.slug,
					imageUrl: imagesTable.imageUrl,
				})
				.from(productsTable)
				.leftJoin(
					productImagesTable,
					eq(productsTable.id, productImagesTable.productId),
				)
				.leftJoin(imagesTable, eq(productImagesTable.imageId, imagesTable.id))
				.where(eq(productsTable.isActive, true))
				.orderBy(desc(productsTable.createdAt))
				.limit(limit);

			// 模拟统计数据并转换格式
			const popularProducts = products.map((product) => ({
				productId: product.id,
				productName: product.name,
				productSlug: product.slug,
				productImageUrl: product.imageUrl || undefined,
				viewCount: Math.floor(Math.random() * 1000) + 100,
				searchCount: Math.floor(Math.random() * 500) + 50,
				favoriteCount: Math.floor(Math.random() * 200) + 20,
				totalScore: 0, // 将在下面计算
			}));

			// 计算总分（简单加权计算）
			popularProducts.forEach((product) => {
				product.totalScore =
					product.viewCount +
					product.searchCount * 1.5 +
					product.favoriteCount * 2;
			});

			// 按总分排序
			popularProducts.sort((a, b) => b.totalScore - a.totalScore);

			return popularProducts;
		} catch (error) {
			console.error("获取热门商品统计失败:", error);
			throw error;
		}
	}

	/**
	 * 获取最新商品列表
	 */
	static async getRecentProducts(limit: number = 10): Promise<any[]> {
		try {
			// 获取最新商品列表（带图片）
			const recentProducts = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					slug: productsTable.slug,
					price: productsTable.price,
					imageUrl: imagesTable.imageUrl,
					createdAt: productsTable.createdAt,
				})
				.from(productsTable)
				.leftJoin(
					productImagesTable,
					eq(productsTable.id, productImagesTable.productId),
				)
				.leftJoin(imagesTable, eq(productImagesTable.imageId, imagesTable.id))
				.where(eq(productsTable.isActive, true))
				.orderBy(desc(productsTable.createdAt))
				.limit(limit);

			// 处理图片URL可能为null的情况
			return recentProducts.map((product) => ({
				...product,
				imageUrl: product.imageUrl || undefined,
			}));
		} catch (error) {
			console.error("获取最新商品列表失败:", error);
			throw error;
		}
	}

	/**
	 * 根据分类获取商品统计
	 */
	static async getProductStatsByCategory(): Promise<any[]> {
		try {
			// 这里应该从分类表获取数据，由于示例中没有完整的分类表结构，返回模拟数据
			const mockCategoryStats = [
				{ categoryName: "电子产品", productCount: 45, activeCount: 42 },
				{ categoryName: "服装", productCount: 38, activeCount: 35 },
				{ categoryName: "家居用品", productCount: 27, activeCount: 25 },
				{ categoryName: "图书", productCount: 32, activeCount: 30 },
				{ categoryName: "运动用品", productCount: 19, activeCount: 18 },
			];

			return mockCategoryStats;
		} catch (error) {
			console.error("获取分类商品统计失败:", error);
			throw error;
		}
	}
}

// 导出服务实例
export const productStatisticsService = new ProductStatisticsService();
