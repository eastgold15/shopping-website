import { UnoQuery, paramId } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";

// 网站配置模型定义
export const siteConfigsModel = {
	// 创建配置请求参数
	CreateSiteConfigDto: t.Omit(DbType.typebox.insert.siteConfigSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新配置请求参数
	UpdateSiteConfigDto: t.Omit(DbType.typebox.insert.siteConfigSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 批量更新配置请求参数
	BatchUpdateSiteConfigDto: t.Array(
		t.Object({
			key: t.String(),
			value: t.String(),
			description: t.Optional(t.String()),
			category: t.Optional(t.String()),
		}),
	),

	// 配置查询参数
	SiteConfigQuery: t.Object({
		...UnoQuery.properties,
		category: t.Optional(t.String()),
		key: t.Optional(t.String()),
	}),

	// 路径参数
	id: paramId,

	KeyParams: t.Object({
		key: t.String(),
	}),

	CategoryParams: t.Object({
		category: t.String(),
	}),
};

// SiteConfig实体类型
export type SiteConfig = typeof DbType.typebox.select.siteConfigSchema.static;
export type NewSiteConfig = typeof DbType.typebox.insert.siteConfigSchema.static;
export type SiteConfigModel = typeof siteConfigsModel;

// 导出类型
export type CreateSiteConfigDto =
	typeof siteConfigsModel.CreateSiteConfigDto.static;
export type UpdateSiteConfigDto =
	typeof siteConfigsModel.UpdateSiteConfigDto.static;
export type BatchUpdateSiteConfigDto =
	typeof siteConfigsModel.BatchUpdateSiteConfigDto.static;
export type SiteConfigQueryDto = typeof siteConfigsModel.SiteConfigQueryDto;
export type KeyParams = typeof siteConfigsModel.KeyParams;
export type CategoryParams = typeof siteConfigsModel.CategoryParams;
