import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
// import { productsModel } from "./products.model";
import { productsModel } from "@backend/db/models/product.model";
import { paramIdZod } from "@backend/types";
import { z } from "zod/v4";
import { ProductsService } from "./products.service";

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
  // 创建商品
  .post(
    "/",
    async ({ body, productsService }) => {
      const result = await productsService.create(body);
      return commonRes(result, 200, "商品创建成功");
    },
    {
      body: "insertProductDto",
      detail: {
        tags: ["Products"],
        summary: "创建商品",
        description: "创建新的商品",
      },
    },
  )

  // 获取分页商品列表 - RESTful标准设计
  .get(
    "/",
    async ({ query, productsService }) => {
      console.log("ssssss", query)
      try {
        const result = await productsService.getList(query);
        return commonRes(result, 200, "获取商品列表成功");
      } catch (error) {
        console.error("获取商品列表失败:", error);
        return commonRes(
          null,
          500,
          error instanceof Error ? error.message : "获取商品列表失败",
        );
      }
    },
    {
      transform: ({ body, query }) => {

        console.log("1122224444", query)
      },
      query: "queryProductListDto",
      detail: {
        tags: ["Products"],
        summary: "获取商品列表",
        description: "获取商品列表，支持分页、搜索、筛选和排序",
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
      params: paramIdZod,
      detail: {
        tags: ["Products"],
        summary: "根据ID获取商品详情",
        description: "根据商品ID获取商品的详细信息",
      },
    },
  )

  // 根据slug获取商品详情 - 暂时注释，因为商品表中没有slug字段
  // .get(
  //   "/slug/:slug",
  //   async ({ params: { slug }, productsService }) => {
  //     const result = await productsService.getBySlug(slug);
  //     return commonRes(result);
  //   },
  //   {
  //     params: z.object({
  //       slug: z.string()
  //     }),
  //     detail: {
  //       tags: ["Products"],
  //       summary: "根据slug获取商品详情",
  //       description: "根据商品slug获取商品的详细信息",
  //     },
  //   },
  // )

  // 更新商品
  .put(
    "/:id",
    async ({ params: { id }, body, productsService }) => {
      const result = await productsService.update(id, body);
      return commonRes(result, 200, "商品更新成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "updateProductDto",
      detail: {
        tags: ["Products"],
        summary: "更新商品",
        description: "根据商品ID更新商品信息",
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
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Products"],
        summary: "删除商品",
        description: "根据商品ID删除商品",
      },
    },
  );
