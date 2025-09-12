import { Elysia } from "elysia";
import { commonRes } from "@backend/utils/Res";
import { productsModel } from "./products.model";
import { ProductsService } from "./products.service";
import { commonRes } from "@backend/types";

/**
 * 商品控制器
 * 处理HTTP请求和响应
 */
export const productsController = new Elysia({
  prefix: "/products",
  tags: ["Products"],
})
  .model(productsModel)
  .decorate("productsService", ProductsService)
  .guard(
    {
      transform({ body }: { body: any }) {
        // 只对有 body 的请求进行处理
        if (!body) return;

        // 处理数字字段的字符串转换
        if (body.categoryId && typeof body.categoryId === "string") {
          body.categoryId =
            body.categoryId === "" ? null : parseInt(body.categoryId, 10);
        }
        if (body.stock && typeof body.stock === "string") {
          body.stock = body.stock === "" ? null : parseInt(body.stock, 10);
        }
        if (body.minStock && typeof body.minStock === "string") {
          body.minStock =
            body.minStock === "" ? null : parseInt(body.minStock, 10);
        }

        // 处理布尔字段的字符串转换
        if (body.isActive && typeof body.isActive === "string") {
          body.isActive = body.isActive === "true";
        }
        if (body.isFeatured && typeof body.isFeatured === "string") {
          body.isFeatured = body.isFeatured === "true";
        }
      },
    },
    (app) =>
      app
        // 创建商品
        .post(
          "/",
          async ({ body, productsService }) => {
            const result = await productsService.create(body);
            return commonRes(result, "商品创建成功");
          },
          {
            body: "CreateProductDto",
            detail: {
              tags: ["Products"],
              summary: "创建商品",
              description: "创建新的商品",
            },
          },
        )

        // 获取商品列表
        .get(
          "/",
          async ({ query, productsService }) => {
            const result = await productsService.getList(query);
            return commonRes(result);
          },
          {
            query: "ProductQuery",
            detail: {
              tags: ["Products"],
              summary: "获取商品列表",
              description: "获取商品列表，支持分页、搜索和排序",
            },
          },
        )

        // 根据ID获取商品详情
        .get(
          "/:id",
          async ({ params: { id }, productsService }) => {
            const result = await productsService.getById(id);
            return commonRes(result);
          },
          {
            params: "id",
            detail: {
              tags: ["Products"],
              summary: "根据ID获取商品详情",
              description: "根据商品ID获取商品的详细信息",
            },
          },
        )

        // 根据slug获取商品详情
        .get(
          "/slug/:slug",
          async ({ params: { slug }, productsService }) => {
            const result = await productsService.getBySlug(slug);
            return commonRes(result);
          },
          {
            params: "SlugParams",
            detail: {
              tags: ["Products"],
              summary: "根据slug获取商品详情",
              description: "根据商品slug获取商品的详细信息",
            },
          },
        )

        // 更新商品
        .put(
          "/:id",
          async ({ params: { id }, body, productsService }) => {
            const result = await productsService.update(id, body);
            return commonRes(result, 200, "商品更新成功");
          },
          {
            params: "id",
            body: "UpdateProductDto",
            detail: {
              tags: ["Products"],
              summary: "更新商品",
              description: "根据商品ID更新商品信息",
            },
          },
        )

        // 更新商品排序
        .patch(
          "/:id/sort",
          async ({ params: { id }, body, productsService }) => {
            const result = await productsService.updateSort(id, body);
            return commonRes(result, 200, "商品排序更新成功");
          },
          {
            params: "id",
            body: "UpdateSortDto",
            detail: {
              tags: ["Products"],
              summary: "更新商品排序",
              description: "更新商品的排序权重",
            },
          },
        )

        // 删除商品
        .delete(
          "/:id",
          async ({ params: { id }, productsService }) => {
            const result = await productsService.delete(id);
            return commonRes(result, 200, "商品删除成功");
          },
          {
            params: "id",
            detail: {
              tags: ["Products"],
              summary: "删除商品",
              description: "根据商品ID删除商品",
            },
          },
        ),
  );
