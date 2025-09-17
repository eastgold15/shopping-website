import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { attributesModel } from "@backend/db/models/attribute.model";
import { paramIdZod } from "@backend/types";
import { ColorsService } from "./colors.service";


/**
 * 颜色控制器
 * 处理HTTP请求和响应
 */
export const colorsController = new Elysia({
  prefix: "/colors",
  tags: ["Colors"],
})
  .model(attributesModel)
  .decorate("colorsService", new ColorsService())

  // 创建颜色
  .post(
    "/",
    async ({ body, colorsService }) => {
      const result = await colorsService.create(body);
      return commonRes(result, 200, "颜色创建成功");
    },
    {
      body: "insertColorDto",
      detail: {
        tags: ["Colors"],
        summary: "创建颜色",
        description: "创建新的颜色",
      },
    },
  )

  // 获取颜色列表
  .get(
    "/",
    async ({ query, colorsService }) => {
      try {
        const result = await colorsService.getList(query);
        return commonRes(result, 200, "获取颜色列表成功");
      } catch (error) {
        console.error("获取颜色列表失败:", error);
        return commonRes(
          null,
          500,
          error instanceof Error ? error.message : "获取颜色列表失败",
        );
      }
    },
    {
      query: "queryColorListDto",
      detail: {
        tags: ["Colors"],
        summary: "获取颜色列表",
        description: "获取颜色列表，支持分页、搜索、筛选和排序",
      },
    },
  )

  // 根据ID获取颜色详情
  .get(
    "/:id",
    async ({ params: { id }, colorsService }) => {
      if (!id) {
        return commonRes(null, 400, "ID参数不能为空");
      }
      const result = await colorsService.getById(parseInt(id));
      return commonRes(result);
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["Colors"],
        summary: "根据ID获取颜色详情",
        description: "根据颜色ID获取颜色的详细信息",
      },
    },
  )

  // 更新颜色
  .put(
    "/:id",
    async ({ params: { id }, body, colorsService }) => {
      const result = await colorsService.update(id, body);
      return commonRes(result, 200, "颜色更新成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "updateColorDto",
      detail: {
        tags: ["Colors"],
        summary: "更新颜色",
        description: "根据颜色ID更新颜色信息",
      },
    },
  )

  // 删除颜色
  .delete(
    "/:id",
    async ({ params: { id }, colorsService }) => {
      const result = await colorsService.delete(id);
      return commonRes(result, 200, "颜色删除成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Colors"],
        summary: "删除颜色",
        description: "根据颜色ID删除颜色",
      },
    },
  );