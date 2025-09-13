import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";

// 商品模型定义
export const productsModel = {

	ProductModel: t.Composite([t.Omit(DbType.typebox.select.productsSchema, [
		"cost",
		"price",
		"comparePrice",
		"weight"
	]), t.Object({
		cost: t.Number(),
		price: t.Number(),
		comparePrice: t.Number(),
		weight: t.Number(),
	})
	]),
	// 创建商品请求参数
	CreateProductDto: t.Omit(DbType.typebox.insert.productsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新商品请求参数
	UpdateProductDto: t.Omit(DbType.typebox.insert.productsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 商品列表查询参数
	ProductListQueryDto: t.Composite([
		UnoQuery,
		t.Object({
			categoryId: t.Optional(t.String()),
			isActive: t.Optional(t.Boolean()),
			isFeatured: t.Optional(t.Boolean()),
		}),
	]),

	// 商品搜索查询参数
	ProductSearchQueryDto: t.Composite([
		UnoQuery,
		t.Object({
			categoryId: t.Optional(t.String()),
			minPrice: t.Optional(t.Number()),
			maxPrice: t.Optional(t.Number()),
			colors: t.Optional(t.Array(t.String())),
			sizes: t.Optional(t.Array(t.String())),
			tags: t.Optional(t.Array(t.String())),
			brand: t.Optional(t.String()),
			isActive: t.Optional(t.Boolean()),
			isFeatured: t.Optional(t.Boolean()),
		}),
	]),

	// 筛选选项查询参数
	FilterOptionsQueryDto: t.Object({
		categoryId: t.Optional(t.String()),
	}),

	// 路径参数
	IdParams: t.Object({
		id: t.Number(),
	}),
	SlugParams: t.Object({
		slug: t.String(),
	}),
	UpdateSortDto: t.Object({
		sortOrder: t.Number(),
	}),
};

// 导出类型
export type CreateProductDto = typeof productsModel.CreateProductDto.static;
export type UpdateProductDto = typeof productsModel.UpdateProductDto.static;
export type ProductSearchQueryDto =
	typeof productsModel.ProductSearchQueryDto.static;
export type FilterOptionsQueryDto =
	typeof productsModel.FilterOptionsQueryDto.static;
export type UpdateSortDto = typeof productsModel.UpdateSortDto.static;

// 商品实体模型 - 提供给前端展示的类型
export const ProductModel = t.Composite([
	DbType.typebox.select.productsSchema,
	t.Object({
		categoryName: t.Optional(t.String()), // 分类名称
		imageUrls: t.Optional(t.Array(t.String())), // 商品图片URL列表
		mainImageUrl: t.Optional(t.String()), // 主图片URL
	}),
]);


export type ProductModel = typeof productsModel.ProductModel.static

export type IdParams = typeof productsModel.IdParams.static;
export type SlugParams = typeof productsModel.SlugParams.static;
