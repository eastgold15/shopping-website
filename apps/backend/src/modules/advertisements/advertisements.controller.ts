import { commonRes } from "@backend/types";
import { Elysia, t } from "elysia";
import { advertisementsModel } from "./advertisements.model";
import { AdvertisementsService } from "./advertisements.service";

/**
 * 广告控制器
 * 处理广告相关的HTTP请求
 */
export const advertisementsController = new Elysia({
  prefix: "/advertisements",
})

  .model(advertisementsModel)
  .decorate("advertisementsService", new AdvertisementsService())
  .guard({
    beforeHandle({ params }) {
      // 转换路径参数中的 parentId 为数字
      if (params && "id" in params) {
        params.id = Number(params.id);
      }
    },
  })

  // 获取广告列表（分页）
  .get(
    "/",
    async ({ query, advertisementsService }) => {
      const result = await advertisementsService.getAdvertisementList(query);
      return commonRes(result)
    },
    {
      query: "ADQueryDto",
      detail: {
        summary: "获取广告列表",
        description: "分页获取广告列表，支持搜索和筛选",
        tags: ["Advertisements"],
      },
    },
  )

  // 获取Banner广告
  .get(
    "/banners",
    async ({ query, advertisementsService }) => {
      const banners = await advertisementsService.getBannerAdvertisements(
        query.position,
      );
      return commonRes(banners);
    },
    {
      query: 'positionDto',
      detail: {
        summary: "获取Banner广告",
        description: "获取所有激活的Banner广告",
        tags: ["Advertisements"],
      },
    },
  )

  // 获取轮播图广告
  .get(
    "/carousels",
    async ({ advertisementsService }) => {
      const carousels = await advertisementsService.getCarouselAdvertisements();
      return commonRes(carousels)
    },
    {
      detail: {
        summary: "获取轮播图广告",
        description: "获取所有激活的轮播图广告",
        tags: ["Advertisements"],
      },
    },
  )

  // 根据ID获取广告详情
  .get(
    "/:id",
    async ({ params: { id }, advertisementsService }) => {
      const advertisement =
        await advertisementsService.getAdvertisementById(id);
      return commonRes(advertisement)
    },
    {
      params: t.Object({
        id: t.Number({ description: "广告ID" }),
      }),
      detail: {
        summary: "获取广告详情",
        description: "根据ID获取广告详细信息",
        tags: ["Advertisements"],
      },
    },
  )

  // 创建广告
  .post(
    "/",
    async ({ body, advertisementsService }) => {
      const advertisement =
        await advertisementsService.createAdvertisement(body);
      return commonRes(advertisement, 201)
    },
    {
      body: "CreateADDto",
      detail: {
        summary: "创建广告",
        description: "创建新的广告",
        tags: ["Advertisements"],
      },
    },
  )

  // 更新广告
  .put(
    "/:id",
    async ({ params: { id }, body, advertisementsService }) => {
      const advertisement = await advertisementsService.updateAdvertisement(
        id,
        body,
      );
      return commonRes(advertisement)
    },
    {
      params: t.Object({
        id: t.Number({ description: "广告ID" }),
      }),
      body: "UpdateADDto",
      detail: {
        summary: "更新广告",
        description: "更新指定ID的广告信息",
        tags: ["Advertisements"],
      },
    },
  )

  // 删除广告
  .delete(
    "/:id",
    async ({ params: { id }, advertisementsService }) => {
      const advertisement = await advertisementsService.deleteAdvertisement(id);
      return commonRes(advertisement)
    },
    {
      params: t.Object({
        id: t.Number({ description: "广告ID" }),
      }),
      detail: {
        summary: "删除广告",
        description: "删除指定ID的广告",
        tags: ["Advertisements"],
      },
    },
  )

  // 切换广告状态
  .patch(
    "/:id/toggle",
    async ({ params: { id }, advertisementsService }) => {
      const advertisement =
        await advertisementsService.toggleAdvertisementStatus(id);
      return commonRes(advertisement)
    },
    {
      params: t.Object({
        id: t.Number({ description: "广告ID" }),
      }),
      detail: {
        summary: "切换广告状态",
        description: "切换广告的激活/停用状态",
        tags: ["Advertisements"],
      },
    },
  )

  // 获取激活的广告
  .get(
    "/active/list",
    async ({ query, advertisementsService }) => {
      const advertisements =
        await advertisementsService.getActiveAdvertisements(
          query.type,
          query.position,
        );
      return commonRes(advertisements)
    },
    {
      query: t.Object({
        type: t.Optional(t.String({ description: "广告类型" })),
        position: t.Optional(t.String({ description: "广告位置" })),
      }),
      detail: {
        summary: "获取激活的广告",
        description: "获取所有激活状态的广告，支持按类型和位置筛选",
        tags: ["Advertisements"],
      },
    },
  )

  // 更新广告排序
  .patch(
    "/:id/sort",
    async ({ params: { id }, body, advertisementsService }) => {
      const advertisement = await advertisementsService.updateAdvertisementSort(
        id,
        body,
      );
      return commonRes(advertisement)
    },
    {
      params: t.Object({
        id: t.Number({ description: "广告ID" }),
      }),
      body: "UpdateSortDto",
      detail: {
        summary: "更新广告排序",
        description: "更新指定广告的排序值",
        tags: ["Advertisements"],
      },
    },
  );
