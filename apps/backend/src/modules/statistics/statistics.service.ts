import { categoriesTable } from "../../db/models/category.model";
import { imagesTable } from "../../db/models/images.model";
import { productImagesTable, productsTable } from "../../db/models/product.model";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { BaseService } from "../../utils/services/BaseService";
import { paginate } from "../../utils/services/pagination";
import type { PaginationParams } from "@backend/types";


// 扩展查询参数接口以支持分页
interface PopularProductsQueryWithPagination extends PopularProductsQuery, PaginationParams {}
interface CategorySalesQueryWithPagination extends CategorySalesQuery, PaginationParams {}

export class StatisticsService extends BaseService<any, any, any> {
  protected readonly table = productsTable;
  protected readonly tableName = 'products';
  /**
   * 获取仪表板统计数据
   */
  async getDashboard(query: DashboardQuery): Promise<DashboardStats> {
    try {
      // 获取商品统计数据
      const productStatsResult = await db
        .select({
          totalProducts: count(),
          activeProducts: sql<number>`count(case when ${productsTable.isActive} = true then 1 end)`,
          featuredProducts: sql<number>`count(case when ${productsTable.isFeatured} = true then 1 end)`,
        })
        .from(productsTable);

      const productStats = productStatsResult[0] || {
        totalProducts: 0,
        activeProducts: 0,
        featuredProducts: 0,
      };

      // 获取最新商品列表（带链接）
      const recentProducts = await db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          slug: productsTable.slug,
          price: productsTable.price,
          isActive: productsTable.isActive,
          isFeatured: productsTable.isFeatured,
          createdAt: productsTable.createdAt,
        })
        .from(productsTable)
        .where(eq(productsTable.isActive, true))
        .orderBy(desc(productsTable.createdAt))
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

      for (let i = 0;i < days;i++) {
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
   * 获取热门商品统计 - 使用统一分页函数
   */
  async getPopularProducts(
    query: PopularProductsQueryWithPagination,
  ): Promise<{ items: PopularProductItem[]; meta: any }> {
    try {
      const { page = 1, pageSize = 10 } = query;

      // 构建基础查询
      const queryBuilder = db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          slug: productsTable.slug,
          price: productsTable.price,
          imageUrl: imagesTable.url,
        })
        .from(productsTable)
        .leftJoin(
          productImagesTable,
          eq(productsTable.id, productImagesTable.productId),
        )
        .leftJoin(
          imagesTable,
          eq(productImagesTable.imageId, imagesTable.id),
        )
        .where(eq(productsTable.isActive, true));

      // 使用统一分页函数
      const result = await paginate(db, queryBuilder.$dynamic(), {
        page,
        pageSize,
        orderBy: productsTable.createdAt,
        orderDirection: "desc",
      });

      // 模拟销售数据并转换格式
      const itemsWithSales = result.items.map((product: any) => ({
        ...product,
        salesCount: Math.floor(Math.random() * 500) + 100,
        revenue:
          (Math.floor(Math.random() * 500) + 100) * Number(product.price),
      }));

      return {
        items: itemsWithSales,
        meta: result.meta,
      };
    } catch (error) {
      console.error("获取热门商品统计失败:", error);
      throw error;
    }
  }

  /**
   * 获取分类销售统计 - 使用统一分页函数
   */
  async getCategorySales(
    query: CategorySalesQueryWithPagination,
  ): Promise<{ items: CategorySalesItem[]; meta: any }> {
    try {
      const { page = 1, pageSize = 10 } = query;

      // 构建基础查询
      const queryBuilder = db
        .select({
          id: categoriesTable.id,
          name: categoriesTable.name,
          slug: categoriesTable.slug,
        })
        .from(categoriesTable)
        .where(eq(categoriesTable.isVisible, true));

      // 使用统一分页函数
      const result = await paginate(db, queryBuilder.$dynamic(), {
        page,
        pageSize,
        orderBy: categoriesTable.name,
        orderDirection: "asc",
      });

      // 模拟销售数据并转换格式
      const itemsWithSales = result.items.map((category: any) => ({
        categoryId: category.id,
        categoryName: category.name,
        salesCount: Math.floor(Math.random() * 200) + 50,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        percentage: Math.floor(Math.random() * 100),
      }));

      return {
        items: itemsWithSales,
        meta: result.meta,
      };
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

      for (let i = 0;i < days;i++) {
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
