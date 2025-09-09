import { DbType } from '@backend/db/database.types';
import { t } from 'elysia';

/**
 * 统计模块模型定义
 */
export const statisticsModel = {
  // 仪表板查询参数
  dashboardQuery: t.Object({
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String())
  }),

  // 销售趋势查询参数
  salesTrendQuery: t.Object({
    period: t.Optional(t.Union([
      t.Literal('7d'),
      t.Literal('30d'),
      t.Literal('90d'),
      t.Literal('custom')
    ])),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String())
  }),

  // 热门商品查询参数
  popularProductsQuery: t.Object({
    pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50 }))
  }),

  // 分类销售查询参数
  categorySalesQuery: t.Object({
    pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String())
  }),

  // 用户增长查询参数
  userGrowthQuery: t.Object({
    period: t.Optional(t.Union([
      t.Literal('7d'),
      t.Literal('30d'),
      t.Literal('90d')
    ]))
  }),

  // 商品统计数据
  productStats: t.Object({
    totalProducts: t.Number(),
    activeProducts: t.Number(),
    featuredProducts: t.Number()
  }),

  // 商品信息（用于最新商品列表）
  productInfo: t.Object({
    id: t.Number(),
    name: t.String(),
    slug: t.String(),
    price: t.Number(),
    images: t.Array(t.String()),
    isActive: t.Boolean(),
    isFeatured: t.Boolean(),
    createdAt: t.Date(),
    detailUrl: t.String(),
    adminUrl: t.String()
  }),

  // 仪表板统计数据
  dashboardStats: t.Object({
    productStats: t.Ref('productStats'),
    recentProducts: t.Array(t.Ref('productInfo')),
    extensions: t.Object({})
  }),

  // 销售趋势数据点
  salesTrendPoint: t.Object({
    date: t.String(),
    sales: t.Number(),
    orders: t.Number(),
    revenue: t.Number()
  }),


  // 热门商品项
  popularProductItem: t.Pick(DbType.typebox.select.productsSchema, ['id', 'name', 'slug', 'price', 'salesCount', 'image', 'revenue']),



  // 分类销售项
  categorySalesItem: t.Object({
    categoryId: t.Number(),
    categoryName: t.String(),
    salesCount: t.Number(),
    revenue: t.Number(),
    percentage: t.Number()
  }),

  // 用户增长数据点
  userGrowthPoint: t.Object({
    date: t.String(),
    newUsers: t.Number(),
    activeUsers: t.Number(),
    totalUsers: t.Number()
  }),

} as const;

// 导出类型
export type DashboardQuery = typeof statisticsModel.dashboardQuery.static;
export type SalesTrendQuery = typeof statisticsModel.salesTrendQuery.static;
export type PopularProductsQuery = typeof statisticsModel.popularProductsQuery.static;
export type CategorySalesQuery = typeof statisticsModel.categorySalesQuery.static;
export type UserGrowthQuery = typeof statisticsModel.userGrowthQuery.static;
export type ProductStats = typeof statisticsModel.productStats.static;
export type ProductInfo = typeof statisticsModel.productInfo.static;
export type DashboardStats = typeof statisticsModel.dashboardStats.static;

export type SalesTrendPoint = typeof statisticsModel.salesTrendPoint.static;

export type PopularProductItem = typeof statisticsModel.popularProductItem.static;
export type CategorySalesItem = typeof statisticsModel.categorySalesItem.static;
export type UserGrowthPoint = typeof statisticsModel.userGrowthPoint.static;
