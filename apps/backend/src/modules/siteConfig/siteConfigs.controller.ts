import { commonRes } from "@backend/utils/Res";
import { Elysia } from "elysia";
import { siteConfigsModel } from "./siteConfigs.model";
import { SiteConfigsService } from "./siteConfigs.service";

/**
 * 网站配置控制器
 * 处理网站配置相关的HTTP请求
 */
export const siteConfigsController = new Elysia({ prefix: "/site-configs" })
	.decorate("siteConfigsService", new SiteConfigsService())
	.model(siteConfigsModel)
	.guard({
		detail: {
			tags: ["SiteConfigs"],
		},
	})

	// 获取所有配置
	.get(
		"/",
		async ({ siteConfigsService }) => {
			try {
				const configs = await siteConfigsService.getAllConfigs();
				return commonRes(configs, 200);
			} catch (error) {
				console.error("获取网站配置失败:", error);
				return commonRes(null, 500, "获取网站配置失败");
			}
		},
		{
			detail: {
				summary: "获取所有配置",
				description: "获取所有网站配置信息",
			},
		},
	)

	// 根据分类获取配置
	.get(
		"/category/:category",
		async ({ params: { category }, siteConfigsService }) => {
			try {
				const configs = await siteConfigsService.getConfigsByCategory(category);
				return commonRes(configs, 200);
			} catch (error) {
				console.error("根据分类获取配置失败:", error);
				return commonRes(null, 500, "根据分类获取配置失败");
			}
		},
		{
			params: "CategoryParams",
			detail: {
				summary: "根据分类获取配置",
				description: "根据分类获取网站配置信息",
			},
		},
	)

	// 根据键获取配置
	.get(
		"/:key",
		async ({ params: { key }, siteConfigsService }) => {
			try {
				const config = await siteConfigsService.getConfigByKey(key);

				return commonRes(config, 200);
			} catch (error) {
				console.error("根据键获取配置失败:", error);
				return commonRes(null, 500, "根据键获取配置失败");
			}
		},
		{
			params: "KeyParams",
			detail: {
				summary: "根据键获取配置",
				description: "根据配置键获取特定配置信息",
			},
		},
	)

	// 创建配置
	.post(
		"/",
		async ({ body, siteConfigsService }) => {
			try {
				const newConfig = await siteConfigsService.createConfig(body);
				return commonRes(newConfig, 201);
			} catch (error) {
				console.error("创建配置失败:", error);
				return commonRes(null, 500, "创建配置失败");
			}
		},
		{
			body: "CreateSiteConfigDto",
			detail: {
				summary: "创建配置",
				description: "创建新的网站配置项",
			},
		},
	)

	// 更新配置
	.put(
		"/:key",
		async ({ params: { key }, body, siteConfigsService }) => {
			try {
				const updatedConfig = await siteConfigsService.updateConfig(key, body);

				if (!updatedConfig) {
					return commonRes(null, 404, "配置不存在");
				}

				return commonRes(updatedConfig, 200);
			} catch (error) {
				console.error("更新配置失败:", error);
				return commonRes(null, 500, "更新配置失败");
			}
		},
		{
			params: "KeyParams",
			body: "UpdateSiteConfigDto",
			detail: {
				summary: "更新配置",
				description: "根据键更新特定配置项",
			},
		},
	)

	// 删除配置
	.delete(
		"/:key",
		async ({ params: { key }, siteConfigsService }) => {
			try {
				const deletedConfig = await siteConfigsService.deleteConfig(key);

				if (!deletedConfig) {
					return commonRes(null, 404, "配置不存在");
				}

				return commonRes(deletedConfig, 200);
			} catch (error) {
				console.error("删除配置失败:", error);
				return commonRes(null, 500, "删除配置失败");
			}
		},
		{
			params: "KeyParams",
			detail: {
				summary: "删除配置",
				description: "根据键删除特定配置项",
			},
		},
	)

	// 批量更新配置
	.patch(
		"/batch",
		async ({ body, siteConfigsService }) => {
			try {
				const updatedConfigs =
					await siteConfigsService.batchUpdateConfigs(body);
				return commonRes(updatedConfigs, 200);
			} catch (error) {
				console.error("批量更新配置失败:", error);
				return commonRes(null, 500, "批量更新配置失败");
			}
		},
		{
			body: "BatchUpdateSiteConfigDto",
			detail: {
				summary: "批量更新配置",
				description: "批量更新多个配置项",
			},
		},
	)

	// 初始化默认配置
	.post(
		"/initialize",
		async ({ siteConfigsService }) => {
			try {
				const initializedConfigs =
					await siteConfigsService.initializeDefaultConfigs();
				return commonRes(initializedConfigs, 200);
			} catch (error) {
				console.error("初始化默认配置失败:", error);
				return commonRes(null, 500, "初始化默认配置失败");
			}
		},
		{
			detail: {
				summary: "初始化默认配置",
				description: "初始化网站的默认配置项",
			},
		},
	);
