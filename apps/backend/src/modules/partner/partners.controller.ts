import { partnersTable, UpdateSortDto } from "@backend/db/models";
import { paramIdZod } from "@backend/types";
import { NotFoundError } from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import { getTableColumns } from "drizzle-orm";
import { Elysia } from "elysia";
import { partnersModel } from "../../db/models/partners.model";
import { PartnersService } from "./partners.service";
/**
 * 合作伙伴控制器
 * 处理合作伙伴相关的HTTP请求
 */
export const partnersController = new Elysia({
  prefix: "/partners",
  tags: ["Partners"],
})
  .model(partnersModel)
  .decorate("partnersService", new PartnersService())
  // 获取所有合作伙伴（前台用）
  .get(
    "/all",
    async ({ partnersService }) => {
      try {
        const partners = await partnersService.getActivePartnersList()

        return commonRes(partners, 200, "获取合作伙伴列表成功");
      } catch (_error) {
        throw new NotFoundError("获取合作伙伴列表失败");
      }
    },
    {
      detail: {
        tags: ["Partners"],
        summary: "获取合作伙伴列表",
        description: "获取启用的合作伙伴列表，按排序权重排序",
      },
    },
  )

  // 获取所有合作伙伴（管理后台用）
  .get(
    "/list",
    async ({ query, partnersService }) => {
      try {
        const result = await partnersService.getPartnersList(query);
        return commonRes(result, 200, "获取合作伙伴列表成功");
      } catch (error) {
        console.log(error);
        throw new NotFoundError("获取合作伙伴列表失败");
      }
    },
    {
      query: "queryPartnersListDto",
      detail: {
        tags: ["Partners"],
        summary: "获取合作伙伴列表（管理后台）",
        description: "获取合作伙伴列表，支持分页、搜索、排序",
      },
    },
  )

  // 根据ID获取合作伙伴详情
  .get(
    "/:id",
    async ({ params: { id }, partnersService }) => {
      try {
        const partner = await partnersService.getPartnerById(id);
        if (!partner) {
          throw new NotFoundError("合作伙伴不存在");
        }
        return commonRes(partner, 200, "获取合作伙伴详情成功");
      } catch (_error) {
        throw new NotFoundError("获取合作伙伴详情失败");
      }
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["Partners"],
        summary: "获取合作伙伴详情",
        description: "根据ID获取合作伙伴详情",
      },
    },
  )

  // 创建合作伙伴
  .post(
    "/",
    async ({ body, partnersService }) => {
      try {
        const newPartner = await partnersService.createPartner(body);
        return commonRes(newPartner, 201, "创建合作伙伴成功");
      } catch (_error) {
        throw new NotFoundError("创建合作伙伴失败", "com");
      }
    },
    {
      body: "insertPartnersDto",
      detail: {
        tags: ["Partners"],
        summary: "创建合作伙伴",
        description: "创建新的合作伙伴",
      },
    },
  )

  // 更新合作伙伴
  .put(
    "/:id",
    async ({ params: { id }, body, partnersService }) => {
      try {
        const updatedPartner = await partnersService.updatePartner(id, body);
        return commonRes(updatedPartner, 200, "更新合作伙伴成功");
      } catch (_error) {
        throw new NotFoundError("创建合作伙伴失败");
      }
    },
    {
      params: paramIdZod,
      body: "updatePartnersDto",
      detail: {
        tags: ["Partners"],
        summary: "更新合作伙伴",
        description: "更新合作伙伴信息",
      },
    },
  )

  // 删除合作伙伴
  .delete(
    "/:id",
    async ({ params: { id }, partnersService }) => {
      await partnersService.deletePartner(id);
      return commonRes(null, 204, "删除合作伙伴成功");
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["Partners"],
        summary: "删除合作伙伴",
        description: "删除指定的合作伙伴",
      },
    },
  )

  // 更新合作伙伴排序
  .patch(
    "/:id/sort",
    async ({ params: { id }, body, partnersService }) => {
      try {
        const updatedPartner = await partnersService.updatePartnerSort(
          id,
          body,
        );
        return commonRes(updatedPartner, 200, "更新合作伙伴排序成功");
      } catch (_error) {
        throw new NotFoundError("创建合作伙伴失败");
      }
    },
    {
      params: paramIdZod,
      body: UpdateSortDto,
      detail: {
        tags: ["Partners"],
        summary: "更新合作伙伴排序",
        description: "更新合作伙伴的排序权重",
      },
    },
  )

  // 切换合作伙伴启用状态
  .patch(
    "/:id/toggle-active",
    async ({ params: { id }, partnersService }) => {
      try {
        const updatedPartner = await partnersService.togglePartnerActive(id);
        return commonRes(updatedPartner, 200, "切换合作伙伴状态成功");
      } catch (_error) {
        throw new NotFoundError("创建合作伙伴失败");
      }
    },
    {
      params: paramIdZod,
      detail: {
        tags: ["Partners"],
        summary: "切换合作伙伴启用状态",
        description: "切换合作伙伴的启用/禁用状态",
      },
    },
  );
