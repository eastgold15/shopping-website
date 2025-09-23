import { colorSpecsModel } from "@backend/db/models/color-spec.model";
import { paramIdZod } from "@backend/types";
import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { ColorSpecsService } from "./color-specs.service";

/**
 * 颜色规格控制器
 * 处理HTTP请求和响应
 */
export const colorSpecsController = new Elysia({
  prefix: "/color-specs",
  tags: ["ColorSpecs"],
})
  .model(colorSpecsModel)
  .decorate("colorSpecsService", new ColorSpecsService())

  // 创建颜色规格
  .post(
    "/",
    async ({ body, colorSpecsService }) => {
      const result = await colorSpecsService.create(body);
      return commonRes(result, 201, "颜色规格创建成功");
    },
    {
      body: "insertColorSpecDto",
      detail: {
        tags: ["ColorSpecs"],
        summary: "创建颜色规格",
        description: "创建新的颜色规格",
      },
    },
  )

  // 获取颜色规格列表
  .get(
    "/",
    async ({ query, colorSpecsService }) => {
      const result = await colorSpecsService.getList(query);
      return commonRes(result, 200, "获取颜色规格列表成功");
    },
    {
      query: "queryColorSpecListDto",
      detail: {
        tags: ["ColorSpecs"],
        summary: "获取颜色规格列表",
        description: "获取颜色规格列表，支持分页、搜索、筛选和排序",
      },
    },
  )

  // 获取所有颜色规格（不分页）
  .get(
    "/all",
    async ({ query, colorSpecsService }) => {
      const result = await colorSpecsService.getAll(query);
      return commonRes(result, 200, "获取所有颜色规格成功");
    },
    {
      query: t.Object({
        productId: t.Optional(t.String()),
        name: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        sortOrder: t.Optional(t.String()),
      }),
      detail: {
        tags: ["ColorSpecs"],
        summary: "获取所有颜色规格",
        description: "获取所有颜色规格，不分页，用于下拉选择等场景",
      },
    },
  )

  // 根据ID获取颜色规格详情
  .get(
    "/:id",
    async ({ params: { id }, colorSpecsService }) => {
      if (!id) {
        return commonRes(null, 400, "ID参数不能为空");
      }
      const result = await colorSpecsService.getById(id);
      return commonRes(result);
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["ColorSpecs"],
        summary: "根据ID获取颜色规格详情",
        description: "根据颜色规格ID获取颜色规格的详细信息",
      },
    },
  )

  // 根据商品ID获取颜色规格列表
  .get(
    "/product/:productId",
    async ({ params: { productId }, colorSpecsService }) => {
      if (!productId) {
        return commonRes(null, 400, "商品ID参数不能为空");
      }
      const result = await colorSpecsService.getByProductId(productId);
      return commonRes(result, 200, "获取商品颜色规格成功");
    },
    {
      params: t.Object({
        productId: t.Number(),
      }),
      detail: {
        tags: ["ColorSpecs"],
        summary: "根据商品ID获取颜色规格列表",
        description: "根据商品ID获取该商品的所有颜色规格",
      },
    },
  )

  // 更新颜色规格
  .put(
    "/:id",
    async ({ params: { id }, body, colorSpecsService }) => {
      const result = await colorSpecsService.update(id, body);
      return commonRes(result, 200, "颜色规格更新成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "updateColorSpecDto",
      detail: {
        tags: ["ColorSpecs"],
        summary: "更新颜色规格",
        description: "根据颜色规格ID更新颜色规格信息",
      },
    },
  )

  // 删除颜色规格
  .delete(
    "/:id",
    async ({ params: { id }, colorSpecsService }) => {
      const result = await colorSpecsService.delete(id);
      return commonRes(result, 204, "颜色规格删除成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["ColorSpecs"],
        summary: "删除颜色规格",
        description: "根据颜色规格ID删除颜色规格",
      },
    },
  )

  // 批量创建颜色规格
  .post(
    "/batch/:productId",
    async ({ params: { productId }, body, colorSpecsService }) => {
      const result = await colorSpecsService.batchCreate(productId, body.colorSpecs);
      return commonRes(result, 201, `成功创建 ${result.createdCount} 个颜色规格`);
    },
    {
      params: t.Object({
        productId: t.Number(),
      }),
      body: t.Object({
        colorSpecs: t.Array(
          t.Object({
            name: t.String(),
            colorValue: t.Optional(t.String()),
            imageUrl: t.String(),
            description: t.Optional(t.String()),
            sortOrder: t.Optional(t.Number()),
          })
        ),
      }),
      detail: {
        tags: ["ColorSpecs"],
        summary: "批量创建颜色规格",
        description: "为指定商品批量创建颜色规格",
      },
    },
  );