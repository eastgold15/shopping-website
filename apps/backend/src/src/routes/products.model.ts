import { t } from 'elysia';
import { UnoQuery } from '../utils/common.model';
import { DbType } from '../db/database.types';

// 商品模型定义
export const productsModel = {
  // 创建商品请求参数
  CreateProductDto: DbType.typebox.insert.productsSchema,

  // 更新商品请求参数
  UpdateProductDto: t.Partial(DbType.typebox.insert.productsSchema),

  // 商品列表查询参数
  ProductListQueryDto: t.Object({
    ...UnoQuery.properties,
    categoryId: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    isFeatured: t.Optional(t.Boolean()),
  }),

  // 商品搜索查询参数
  ProductSearchQueryDto: t.Object({
    ...UnoQuery.properties,
    q: t.String({ minLength: 1 }), // 搜索关键词
    categoryId: t.Optional(t.String()),
    minPrice: t.Optional(t.Number()),
    maxPrice: t.Optional(t.Number()),
    colors: t.Optional(t.Array(t.String())),
    sizes: t.Optional(t.Array(t.String())),
    tags: t.Optional(t.Array(t.String())),
    brand: t.Optional(t.String()),
    sortBy: t.Optional(t.Union([
      t.Literal('price'),
      t.Literal('name'),
      t.Literal('createdAt'),
      t.Literal('updatedAt')
    ])),
    sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
  }),

  // 热门搜索词查询参数
  PopularTermsQueryDto: t.Object({
    pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 }))
  }),

  // 筛选选项查询参数
  FilterOptionsQueryDto: t.Object({
    categoryId: t.Optional(t.String())
  }),

  // 相关商品查询参数
  RelatedProductsQueryDto: t.Object({
    pageSize: t.Optional(t.Number({ minimum: 1, maximum: 20, default: 8 }))
  }),

  // 路径参数
  IdParams: t.Object({
    id: t.String()
  }),

  SlugParams: t.Object({
    slug: t.String()
  })
};

// 导出类型
export type CreateProductDto = typeof productsModel.CreateProductDto;
export type UpdateProductDto = typeof productsModel.UpdateProductDto;
export type ProductListQueryDto = typeof productsModel.ProductListQueryDto;
export type ProductSearchQueryDto = typeof productsModel.ProductSearchQueryDto;
export type PopularTermsQueryDto = typeof productsModel.PopularTermsQueryDto;
export type FilterOptionsQueryDto = typeof productsModel.FilterOptionsQueryDto;
export type RelatedProductsQueryDto = typeof productsModel.RelatedProductsQueryDto;
export type IdParams = typeof productsModel.IdParams;
export type SlugParams = typeof productsModel.SlugParams;