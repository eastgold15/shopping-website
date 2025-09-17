import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { skusModel } from "@backend/db/models/sku.model";
import { paramIdZod } from "@backend/types";
import { SkusService } from "./index";

/**
 * SKU控制器
 * 处理HTTP请求和响应
 */
export const skusController = new Elysia({
  prefix: "/skus",
  tags: ["SKUs"],
})
  .model(skusModel)
  .decorate("skusService", new SkusService())
  
  // 创建SKU
  .post(
    "/",
    async ({ body, skusService }) => {
      const result = await skusService.create(body);
      return commonRes(result, 200, "SKU创建成功");
    },
    {
      body: "insertSkuDto",
      detail: {
        tags: ["SKUs"],
        summary: "创建SKU",
        description: "创建新的SKU",
      },
    },
  )

  // 获取SKU列表
  .get(
    "/",
    async ({ query, skusService }) => {
      try {
        const result = await skusService.getList(query);
        return commonRes(result, 200, "获取SKU列表成功");
      } catch (error) {
        console.error("获取SKU列表失败:", error);
        return commonRes(
          null,
          500,
          error instanceof Error ? error.message : "获取SKU列表失败",
        );
      }
    },
    {
      query: "querySkuListDto",
      detail: {
        tags: ["SKUs"],
        summary: "获取SKU列表",
        description: "获取SKU列表，支持分页、搜索、筛选和排序",
      },
    },
  )

  // 根据ID获取SKU详情
  .get(
    "/:id",
    async ({ params: { id }, skusService }) => {
      if (!id) {
        return commonRes(null, 400, "ID参数不能为空");
      }
      const result = await skusService.getById(parseInt(id));
      return commonRes(result);
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["SKUs"],
        summary: "根据ID获取SKU详情",
        description: "根据SKU ID获取SKU的详细信息",
      },
    },
  )

  // 根据商品ID获取所有SKU
  .get(
    "/product/:productId",
    async ({ params: { productId }, skusService }) => {
      const result = await skusService.getByProductId(productId);
      return commonRes(result);
    },
    {
      params: t.Object({
        productId: t.Number(),
      }),
      detail: {
        tags: ["SKUs"],
        summary: "根据商品ID获取所有SKU",
        description: "根据商品ID获取所有相关的SKU信息",
      },
    },
  )

  // 更新SKU
  .put(
    "/:id",
    async ({ params: { id }, body, skusService }) => {
      const result = await skusService.update(id, body);
      return commonRes(result, 200, "SKU更新成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "updateSkuDto",
      detail: {
        tags: ["SKUs"],
        summary: "更新SKU",
        description: "根据SKU ID更新SKU信息",
      },
    },
  )

  // 删除SKU
  .delete(
    "/:id",
    async ({ params: { id }, skusService }) => {
      const result = await skusService.delete(id);
      return commonRes(result, 200, "SKU删除成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["SKUs"],
        summary: "删除SKU",
        description: "根据SKU ID删除SKU",
      },
    },
  );