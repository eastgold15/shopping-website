import { Elysia } from "elysia";

import { productsModel } from './products.model';
import { ProductsService } from './products.service';

/**
 * 商品控制器
 * 处理HTTP请求和响应
 */
export const productsController = new Elysia({ prefix: 'products', tags: ['Products'] })
  .model(productsModel)
  .guard({
    transform({ body }: { body: any }) {

      // 处理parentId：如果是对象格式{"key":true}，提取key作为parentId
      if (body.parentId) {
        if (typeof body.parentId === 'object' && body.parentId !== null) {
          // 从对象中提取第一个key作为parentId
          const keys = Object.keys(body.parentId);
          if (keys.length > 0) {
            body.parentId = parseInt(keys[0]);
          }
        } else {
          body.parentId = parseInt(body.parentId.toString());
        }
      }

      body.price = '' + body.price;
      body.comparePrice = '' + body.comparePrice;
      body.cost = '' + body.cost;
      body.weight = '' + body.weight;
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
  );