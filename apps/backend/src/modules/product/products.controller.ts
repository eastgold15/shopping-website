import { Elysia } from "elysia";

import { productsModel } from './products.model';
import { ProductsService } from './products.service';

/**
 * 商品控制器
 * 处理HTTP请求和响应
 */
export const productsController = new Elysia({ prefix: '/products', tags: ['Products'] })
  .model(productsModel)
  .guard({
    transform({ body }: { body: any }) {
      // 只对有 body 的请求进行处理
      if (!body) return;
      
      // 处理parentId：如果是对象格式{"key":true}，提取key作为parentId
      if (body?.parentId) {
        if (typeof body.parentId === 'string') {
          const parsed = parseInt(body.parentId);
          body.parentId = isNaN(parsed) ? null : parsed;
        } else if (typeof body.parentId === 'object' && body.parentId !== null) {
          // 从对象中提取第一个key作为parentId
          const keys = Object.keys(body.parentId);
          if (keys.length > 0) {
            body.parentId = parseInt(keys[0]);
          }
        }
      }
      
      // 处理数字字段的字符串转换
      if (body.categoryId && typeof body.categoryId === 'string') {
        body.categoryId = body.categoryId === '' ? null : parseInt(body.categoryId, 10);
      }
      if (body.stock && typeof body.stock === 'string') {
        body.stock = body.stock === '' ? null : parseInt(body.stock, 10);
      }
      if (body.minStock && typeof body.minStock === 'string') {
        body.minStock = body.minStock === '' ? null : parseInt(body.minStock, 10);
      }
      
      // 处理布尔字段的字符串转换
      if (body.isActive && typeof body.isActive === 'string') {
        body.isActive = body.isActive === 'true';
      }
      if (body.isFeatured && typeof body.isFeatured === 'string') {
        body.isFeatured = body.isFeatured === 'true';
      }
      
      // decimal 字段保持为字符串格式，不需要转换
      // price, comparePrice, cost, weight 等字段在数据库中是 decimal 类型
      // TypeBox 会将其转换为字符串类型进行验证
    }
  }, (app) => app
    // 创建商品
    .post('/', async ({ body }) => {
      const result = await ProductsService.createProduct(body);

      return result;
    }, {
      body: 'CreateProductDto',
      detail: {
        tags: ['Products'],
        summary: '创建商品',
        description: '创建新的商品'
      }
    })

    // 获取所有商品
    .get('/', async ({ query }) => {
      const result = await ProductsService.getProductList(query);

      return result;
    }, {
      query: 'ProductListQueryDto',
      detail: {
        tags: ['Products'],
        summary: '获取商品列表',
        description: '获取商品列表，支持分页、搜索和排序'
      }
    })

    // 根据ID获取商品详情
    .get('/:id', async ({ params: { id } }) => {
      const result = await ProductsService.getProductById(id);

      return result;
    }, {
      params: 'IdParams',
      detail: {
        tags: ['Products'],
        summary: '根据ID获取商品详情',
        description: '根据商品ID获取商品的详细信息'
      }
    })

    // 根据slug获取商品详情
    .get('/slug/:slug', async ({ params: { slug } }) => {
      const result = await ProductsService.getProductBySlug(slug);

      return result
    }, {
      params: 'SlugParams',
      detail: {
        tags: ['Products'],
        summary: '根据slug获取商品详情',
        description: '根据商品slug获取商品的详细信息'
      }
    })

    // 更新商品
    .put('/:id', async ({ params: { id }, body }) => {
      const result = await ProductsService.updateProduct(id, body);

      return result
    }, {
      params: 'IdParams',
      body: 'UpdateProductDto',
      detail: {
        tags: ['Products'],
        summary: '更新商品',
        description: '根据商品ID更新商品信息'
      }
    })

    // 删除商品
    .delete('/:id', async ({ params: { id } }) => {
      const result = await ProductsService.deleteProduct(id);

      return result
    }, {
      params: 'IdParams',
      detail: {
        tags: ['Products'],
        summary: '删除商品',
        description: '根据商品ID删除商品'
      }
    })
  );