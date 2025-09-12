import { Elysia } from "elysia";
import { siteConfigsModel } from "./siteConfigs.model";
import { siteConfigsService } from "./siteConfigs.service";
import { commonRes } from "@backend/utils/Res";

/**
 * 网站配置控制器
 * 处理网站配置相关的HTTP请求
 */
export const siteConfigsController = new Elysia({ prefix: "/site-configs" })
	.decorate("siteConfigsService", new SiteConfigsService())
	.model(siteConfigsModel)
	.decorate("siteConfigsService", siteConfigsService)
	.guard({
		detail: {
			tags: ["SiteConfigs"],
		},
	})

	.get("/", async ({ query, siteConfigsService }) => {
		const configs = await siteConfigsService.getList(query);
		return commonRes(configs, 200, "获取配置成功");
	}, {
		query: "SiteConfigQuery",
	})

	.get("/:id", async ({ params: { id }, siteConfigsService }) => {
		const config = await siteConfigsService.getById(id);
		return commonRes(config, 200, "获取配置成功");
	}, {
		params: "id",
	})

	.get("/key/:key", async ({ params: { key }, siteConfigsService }) => {
		const config = await siteConfigsService.getByKey(key);
		return commonRes(config, 200, "获取配置成功");
	})

	.put("/:id", async ({ params: { id }, body, siteConfigsService }) => {
		const config = await siteConfigsService.updateById(id, body);
		return commonRes(config, 200, "更新配置成功");
	}, {
		params: "id",
		body: "UpdateSiteConfigDto",
	})

	.put("/key/:key", async ({ params: { key }, body, siteConfigsService }) => {
		const config = await siteConfigsService.updateByKey(key, body);
		return commonRes(config, 200, "更新配置成功");
	}, {
		body: "UpdateSiteConfigDto",
	})

	.post("/batch", async ({ body, siteConfigsService }) => {
		const configs = await siteConfigsService.batchUpdate(body);
		return commonRes(configs, 200, "批量更新配置成功");
	}, {
		body: "BatchUpdateSiteConfigDto",
	})

	.post("/init", async ({ siteConfigsService }) => {
		const configs = await siteConfigsService.initialize();
		return commonRes(configs, 200, "初始化配置成功");
	});
