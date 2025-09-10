import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.types";
import { t } from "elysia";

// 广告模型定义
export const advertisementsModel = {
	// 创建广告请求参数
	CreateAdvertisementDto: t.Omit(DbType.typebox.insert.advertisementsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新广告请求参数
	UpdateAdvertisementDto: t.Omit(DbType.typebox.insert.advertisementsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 排序更新请求
	UpdateSortRequest: t.Object({
		sortOrder: t.Number(),
	}),
	// 广告列表查询参数
	AdvertisementListQueryDto: t.Composite([
		UnoQuery,
		t.Object({
			type: t.Optional(t.String()),
			position: t.Optional(t.String()),
			isActive: t.Optional(t.Boolean()),
		}),
	]),
};

// 导出类型
export type CreateAdvertisementDto =
	typeof advertisementsModel.CreateAdvertisementDto.static;
export type UpdateAdvertisementDto =
	typeof advertisementsModel.UpdateAdvertisementDto.static;
export type UpdateSortRequest =
	typeof advertisementsModel.UpdateSortRequest.static;
export type AdvertisementListQueryDto =
	typeof advertisementsModel.AdvertisementListQueryDto.static;
