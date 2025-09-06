/**
 * 统计报表路由
 * 提供综合的统计数据，包括销售统计、用户统计、商品统计等
 */

import { Elysia, t } from "elysia";
import { db } from "../db/connection.ts";
import { 
  userSchema, 
  ordersSchema, 
  productsSchema, 
  categoriesSchema,
  advertisementsSchema
} from "../db/schema/index.ts";
import { eq, desc, asc, like, and, count, sum, sql, gte, lte } from "drizzle-orm";
import { commonRes } from '../plugins/Res';

export const statisticsRoute = new Elysia({ prefix: "/statistics" })
  // 获取仪表板统计数据
  .get("/dashboard", async ({ query }) => {
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

      return commonRes({
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
      });
    } catch (error) {
      console.error('获取仪表板统计数据失败:', error);
      return commonRes(null, 500, '获取仪表板统计数据失败');
    }
  }, {
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    }),
    detail: {
      tags: ['Statistics'],
      summary: '获取仪表板统计数据',
      description: '获取用户、订单、商品、分类、广告等综合统计数据'
    }
  })
  
  // 获取销售趋势数据
  .get("/sales-trend", async ({ query }) => {
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
            now.setTime(new Date(endDate).getTime());
          } else {
            dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }
          break;
        default:
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      // 按日期分组的销售数据
      const salesTrend = await db
        .select({
          date: sql<string>`date(${ordersSchema.createdAt})`,
          orderCount: count(),
          revenue: sql<string>`coalesce(sum(${ordersSchema.totalAmount}), 0)`
        })
        .from(ordersSchema)
        .where(and(
          gte(ordersSchema.createdAt, dateRange),
          lte(ordersSchema.createdAt, now)
        ))
        .groupBy(sql`date(${ordersSchema.createdAt})`)
        .orderBy(sql`date(${ordersSchema.createdAt})`);

      return commonRes({
        period,
        startDate: dateRange.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        data: salesTrend
      });
    } catch (error) {
      console.error('获取销售趋势数据失败:', error);
      return commonRes(null, 500, '获取销售趋势数据失败');
    }
  }, {
    query: t.Object({
      period: t.Optional(t.Union([
        t.Literal('7d'),
        t.Literal('30d'),
        t.Literal('90d'),
        t.Literal('custom')
      ])),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    }),
    detail: {
      tags: ['Statistics'],
      summary: '获取销售趋势数据',
      description: '获取指定时间段内的销售趋势数据，支持按日期分组'
    }
  })
  
  // 获取热门商品统计
  .get("/popular-products", async ({ query }) => {
    try {
      const { pageSize = 10 } = query;
      
      // 这里需要根据实际的订单商品关联表来查询
      // 暂时返回基础的商品统计
      const popularProducts = await db
        .select({
          id: productsSchema.id,
          name: productsSchema.name,
          slug: productsSchema.slug,
          price: productsSchema.price,
          image: productsSchema.image,
          // 这里需要根据实际的订单商品表来统计销量
          // salesCount: sql<number>`coalesce(sum(order_items.quantity), 0)`
        })
        .from(productsSchema)
        .where(eq(productsSchema.isActive, true))
        .orderBy(desc(productsSchema.createdAt))
        .limit(Number(pageSize));

      return commonRes({
        products: popularProducts,
        total: popularProducts.length
      });
    } catch (error) {
      console.error('获取热门商品统计失败:', error);
      return commonRes(null, 500, '获取热门商品统计失败');
    }
  }, {
    query: t.Object({
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50 }))
    }),
    detail: {
      tags: ['Statistics'],
      summary: '获取热门商品统计',
      description: '获取销量最高的商品列表'
    }
  })
  
  // 获取分类销售统计
  .get("/category-sales", async ({ query }) => {
    try {
      const { startDate, endDate } = query;
      
      // 构建时间范围条件
      const timeConditions = [];
      if (startDate) {
        timeConditions.push(gte(ordersSchema.createdAt, new Date(startDate)));
      }
      if (endDate) {
        timeConditions.push(lte(ordersSchema.createdAt, new Date(endDate)));
      }
      
      // 获取分类销售统计（这里需要根据实际的订单商品关联表来查询）
      const categorySales = await db
        .select({
          categoryId: categoriesSchema.id,
          categoryName: categoriesSchema.name,
          // 这里需要根据实际的订单商品表来统计
          // orderCount: sql<number>`count(distinct orders.id)`,
          // revenue: sql<string>`coalesce(sum(order_items.quantity * order_items.price), 0)`
        })
        .from(categoriesSchema)
        .where(eq(categoriesSchema.isActive, true))
        .orderBy(desc(categoriesSchema.createdAt));

      return commonRes({
        categories: categorySales,
        total: categorySales.length
      });
    } catch (error) {
      console.error('获取分类销售统计失败:', error);
      return commonRes(null, 500, '获取分类销售统计失败');
    }
  }, {
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    }),
    detail: {
      tags: ['Statistics'],
      summary: '获取分类销售统计',
      description: '获取各分类的销售统计数据'
    }
  })
  
  // 获取用户增长趋势
  .get("/user-growth", async ({ query }) => {
    try {
      const { period = '30d' } = query;
      
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
        default:
          dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      // 按日期分组的用户注册数据
      const userGrowth = await db
        .select({
          date: sql<string>`date(${userSchema.createdAt})`,
          newUsers: count(),
          activeUsers: sql<number>`count(case when ${userSchema.status} = 1 then 1 end)`
        })
        .from(userSchema)
        .where(and(
          gte(userSchema.createdAt, dateRange),
          lte(userSchema.createdAt, now)
        ))
        .groupBy(sql`date(${userSchema.createdAt})`)
        .orderBy(sql`date(${userSchema.createdAt})`);

      return commonRes({
        period,
        startDate: dateRange.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        data: userGrowth
      });
    } catch (error) {
      console.error('获取用户增长趋势失败:', error);
      return commonRes(null, 500, '获取用户增长趋势失败');
    }
  }, {
    query: t.Object({
      period: t.Optional(t.Union([
        t.Literal('7d'),
        t.Literal('30d'),
        t.Literal('90d')
      ]))
    }),
    detail: {
      tags: ['Statistics'],
      summary: '获取用户增长趋势',
      description: '获取指定时间段内的用户注册和活跃趋势数据'
    }
  });