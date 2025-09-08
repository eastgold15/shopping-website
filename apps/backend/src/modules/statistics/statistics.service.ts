import { db } from '../../db/connection';
import {
  userSchema,
  ordersSchema,
  productsSchema,
  categoriesSchema,
  advertisementsSchema
} from '../../db/schema';
import { eq, desc, asc, like, and, count, sum, sql, gte, lte } from 'drizzle-orm';
import type {
  DashboardQuery,
  SalesTrendQuery,
  PopularProductsQuery,
  CategorySalesQuery,
  UserGrowthQuery,
  DashboardStats,
  SalesTrendResponse,
  PopularProductItem,
  CategorySalesItem,
  UserGrowthResponse
} from './statistics.model';

/**
 * 统计服务类
 * 处理统计相关的业务逻辑
 */
export class StatisticsService {
  /**
   * 获取仪表板统计数据
   */
  async getDashboardStats(query: DashboardQuery): Promise<{ success: boolean; data?: DashboardStats; error?: Error }> {
    try {
      // 获取商品统计数据
      const [productStats] = await Promise.all([
        db.select({
          totalProducts: count(),
          activeProducts: sql<number>`count(case when ${productsSchema.isActive} = true then 1 end)`,
          featuredProducts: sql<number>`count(case when ${productsSchema.isFeatured} = true then 1 end)`
        }).from(productsSchema)
      ]);

      // 获取最新商品列表（带链接）
      const recentProducts = await db
        .select({
          id: productsSchema.id,
          name: productsSchema.name,
          slug: productsSchema.slug,
          price: productsSchema.price,
          images: productsSchema.images,
          isActive: productsSchema.isActive,
          isFeatured: productsSchema.isFeatured,
          createdAt: productsSchema.createdAt
        })
        .from(productsSchema)
        .where(eq(productsSchema.isActive, true))
        .orderBy(desc(productsSchema.createdAt))
        .limit(10);

      const result: DashboardStats = {
        // 商品统计概览
        productStats: productStats[0],
        // 最新商品列表（可用于生成链接）
        recentProducts: recentProducts.map(product => ({
          ...product,
          // 生成商品详情页链接
          detailUrl: `/products/${product.slug}`,
          // 生成管理页面链接
          adminUrl: `/admin/products/${product.id}`
        })),
        // 预留扩展字段
        extensions: {
          // 未来可以添加其他统计数据
          // 例如：销售统计、用户统计、订单统计等
        }
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('获取仪表板统计数据失败:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * 获取销售趋势数据
   */
  async getSalesTrend(query: SalesTrendQuery): Promise<{ success: boolean; data?: SalesTrendResponse; error?: Error }> {
    try {
      const { period = '7d', startDate, endDate } = query;

      let dateRange;
      const now = new Date();

      switch (period) {
        case '7d':
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
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
      const days = period === 'custom' && startDate && endDate 
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000))
        : parseInt(period.replace('d', ''));

      for (let i = 0; i < days; i++) {
        const date = new Date(dateRange.getTime() + i * 24 * 60 * 60 * 1000);
        mockTrend.push({
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 100) + 50,
          orders: Math.floor(Math.random() * 20) + 10,
          revenue: Math.floor(Math.random() * 10000) + 5000
        });
      }

      const summary = {
        totalSales: mockTrend.reduce((sum, item) => sum + item.sales, 0),
        totalOrders: mockTrend.reduce((sum, item) => sum + item.orders, 0),
        totalRevenue: mockTrend.reduce((sum, item) => sum + item.revenue, 0),
        averageOrderValue: 0
      };
      summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;

      return {
        success: true,
        data: {
          trend: mockTrend,
          summary
        }
      };
    } catch (error) {
      console.error('获取销售趋势数据失败:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * 获取热门商品统计
   */
  async getPopularProducts(query: PopularProductsQuery): Promise<{ success: boolean; data?: PopularProductItem[]; error?: Error }> {
    try {
      const { pageSize = 10 } = query;

      // 获取商品列表（这里应该根据销量排序，暂时按创建时间）
      const products = await db
        .select({
          id: productsSchema.id,
          name: productsSchema.name,
          slug: productsSchema.slug,
          price: productsSchema.price,
          images: productsSchema.images
        })
        .from(productsSchema)
        .where(eq(productsSchema.isActive, true))
        .orderBy(desc(productsSchema.createdAt))
        .limit(pageSize);

      // 模拟销售数据
      const result: PopularProductItem[] = products.map(product => ({
        ...product,
        salesCount: Math.floor(Math.random() * 500) + 100,
        revenue: (Math.floor(Math.random() * 500) + 100) * product.price
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('获取热门商品统计失败:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * 获取分类销售统计
   */
  async getCategorySales(query: CategorySalesQuery): Promise<{ success: boolean; data?: CategorySalesItem[]; error?: Error }> {
    try {
      // 获取分类列表
      const categories = await db
        .select({
          id: categoriesSchema.id,
          name: categoriesSchema.name
        })
        .from(categoriesSchema)
        .where(eq(categoriesSchema.isActive, true));

      // 模拟销售数据
      const totalRevenue = 100000;
      const result: CategorySalesItem[] = categories.map(category => {
        const revenue = Math.floor(Math.random() * 20000) + 5000;
        return {
          categoryId: category.id,
          categoryName: category.name,
          salesCount: Math.floor(Math.random() * 200) + 50,
          revenue,
          percentage: Math.round((revenue / totalRevenue) * 100 * 100) / 100
        };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('获取分类销售统计失败:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * 获取用户增长趋势
   */
  async getUserGrowth(query: UserGrowthQuery): Promise<{ success: boolean; data?: UserGrowthResponse; error?: Error }> {
    try {
      const { period = '30d' } = query;
      const days = parseInt(period.replace('d', ''));
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
          date: date.toISOString().split('T')[0],
          newUsers,
          activeUsers: Math.floor(Math.random() * 100) + 50,
          totalUsers
        });
      }

      const summary = {
        totalNewUsers: growth.reduce((sum, item) => sum + item.newUsers, 0),
        averageActiveUsers: Math.round(growth.reduce((sum, item) => sum + item.activeUsers, 0) / growth.length),
        growthRate: growth.length > 1 
          ? Math.round(((growth[growth.length - 1].totalUsers - growth[0].totalUsers) / growth[0].totalUsers) * 100 * 100) / 100
          : 0
      };

      return {
        success: true,
        data: {
          growth,
          summary
        }
      };
    } catch (error) {
      console.error('获取用户增长趋势失败:', error);
      return { success: false, error: error as Error };
    }
  }
}

// 导出服务实例
export const statisticsService = new StatisticsService();