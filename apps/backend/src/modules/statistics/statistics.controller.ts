import { Elysia } from 'elysia';

import { statisticsModel } from './statistics.model';
import { statisticsService } from './statistics.service';
import { commonRes } from '@backend/utils/Res';

/**
 * 统计控制器
 * 处理统计报表相关的HTTP请求
 */
export const statisticsController = new Elysia({ prefix: '/statistics' })
  .model(statisticsModel)
  .decorate('statisticsService', statisticsService)
  .guard({
    detail: {
      tags: ['Statistics']
    }
  })

  // 获取仪表板统计数据
  .get('/dashboard', async ({ query, statisticsService }) => {
    const result = await statisticsService.getDashboardStats(query);
    
    if (!result.success) {
      console.error('获取仪表板统计数据失败:', result.error);
      return commonRes(null, 500, '获取仪表板统计数据失败');
    }

    return commonRes(result.data);
  }, {
    query: 'dashboardQuery',
    detail: {
      summary: '获取仪表板统计数据',
      description: '获取用户、订单、商品、分类、广告等综合统计数据'
    }
  })

  // 获取销售趋势数据
  .get('/sales-trend', async ({ query, statisticsService }) => {
    const result = await statisticsService.getSalesTrend(query);
    
    if (!result.success) {
      console.error('获取销售趋势数据失败:', result.error);
      return commonRes(null, 500, '获取销售趋势数据失败');
    }

    return commonRes(result.data);
  }, {
    query: 'salesTrendQuery',
    detail: {
      summary: '获取销售趋势数据',
      description: '获取指定时间段内的销售趋势数据，支持按日期分组'
    }
  })

  // 获取热门商品统计
  .get('/popular-products', async ({ query, statisticsService }) => {
    const result = await statisticsService.getPopularProducts(query);
    
    if (!result.success) {
      console.error('获取热门商品统计失败:', result.error);
      return commonRes(null, 500, '获取热门商品统计失败');
    }

    return commonRes(result.data);
  }, {
    query: 'popularProductsQuery',
    detail: {
      summary: '获取热门商品统计',
      description: '获取销量最高的商品列表'
    }
  })

  // 获取分类销售统计
  .get('/category-sales', async ({ query, statisticsService }) => {
    const result = await statisticsService.getCategorySales(query);
    
    if (!result.success) {
      console.error('获取分类销售统计失败:', result.error);
      return commonRes(null, 500, '获取分类销售统计失败');
    }

    return commonRes(result.data);
  }, {
    query: 'categorySalesQuery',
    detail: {
      summary: '获取分类销售统计',
      description: '获取各分类的销售统计数据'
    }
  })

  // 获取用户增长趋势
  .get('/user-growth', async ({ query, statisticsService }) => {
    const result = await statisticsService.getUserGrowth(query);
    
    if (!result.success) {
      console.error('获取用户增长趋势失败:', result.error);
      return commonRes(null, 500, '获取用户增长趋势失败');
    }

    return commonRes(result.data);
  }, {
    query: 'userGrowthQuery',
    detail: {
      summary: '获取用户增长趋势',
      description: '获取指定时间段内的用户注册和活跃趋势数据'
    }
  });