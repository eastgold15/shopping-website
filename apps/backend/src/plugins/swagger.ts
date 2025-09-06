import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

/**
 * Swagger 文档插件配置
 */
export const swaggerPlugin = new Elysia({ name: "swagger" }).use(
	swagger({
		documentation: {
			info: {
				title: "外贸电商网站 API",
				version: "1.0.0",
				description: "外贸电商网站后端API文档 - 提供商品管理、分类管理、网站配置等功能",
			},
			tags: [
				{
					name: "Categories",
					description: "商品分类管理相关接口",
				},
				{
					name: "Products",
					description: "商品管理相关接口",
				},
				{
					name: "Site Config",
					description: "网站配置管理相关接口",
				},
				{
					name: "Layout",
					description: "页面布局配置相关接口",
				},
				{
					name: "Advertisements",
					description: "广告管理相关接口",
				},
				{
					name: "Upload",
					description: "文件上传相关接口",
				},
			],
		},
	}),
);
