import { siteConfigModel } from "@backend/db/models/siteConfig.model";
import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";

import { SiteConfigsService } from "./siteConfigs.service";

/**
 * 网站配置控制器
 * 处理网站配置相关的HTTP请求
 */
export const siteConfigsController = new Elysia({ prefix: "/site-configs", tags: ["SiteConfigs"] })
  .decorate("siteConfigsService", new SiteConfigsService())
  .model(siteConfigModel)
  .get(
    "/list",
    async ({ query, siteConfigsService }) => {
      const configs = await siteConfigsService.getList(query);
      return commonRes(configs, 200, "获取配置成功");
    },
    {
      query: "querySiteConfigListDto",
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, siteConfigsService }) => {
      const config = await siteConfigsService.getById(id);
      return commonRes(config, 200, "获取详细配置成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    },
  )

  .get(
    "/keys",
    async ({ query: { keys }, siteConfigsService }) => {
      const config = await siteConfigsService.getByKeys(keys);
      return commonRes(config, 200, "获取分类配置成功");
    },
    {
      query: t.Object({
        keys: t.Array(t.String()),
      }),
    },
  )

  // 获取分类配置
  .get(
    "/Category/:Category",
    async ({ params: { Category }, siteConfigsService }) => {
      const config = await siteConfigsService.getByCategory(Category);
      return commonRes(config, 200, "获取分类配置成功");
    },
    {
      params: t.Object({
        Category: t.String(),
      }),
    },
  )

  .put(
    "/:id",
    async ({ params: { id }, body, siteConfigsService }) => {
      const config = await siteConfigsService.updateById(id, body);
      return commonRes(config, 200, "更新配置成功");
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "updateSiteConfigDto",
    },
  )

  .put(
    "/key/:key",
    async ({ params: { key }, body, siteConfigsService }) => {
      const config = await siteConfigsService.updateByKey(key, body);
      return commonRes(config, 200, "更新分类配置成功");
    },
    {
      body: "updateSiteConfigDto",
    },
  )

  .post(
    "/batch",
    async ({ body, siteConfigsService }) => {
      const configs = await siteConfigsService.batchUpdate(body);
      return commonRes(configs, 200, "批量更新配置成功");
    },
    {
      body: "batchUpdateSiteConfigDto",
    },
  )

  .post("/init", async ({ siteConfigsService }) => {
    const configs = await siteConfigsService.initialize();
    return commonRes(configs, 200, "初始化配置成功");
  });
