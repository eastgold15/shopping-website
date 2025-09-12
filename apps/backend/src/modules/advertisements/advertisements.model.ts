import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";

// 广告模型定义
export const advertisementsModel = {
	// 创建广告请求参数
	CreateADDto: t.Omit(DbType.typebox.insert.advertisementsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新广告请求参数
	UpdateADDto: t.Omit(DbType.typebox.insert.advertisementsSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),
	positionDto: t.Object({
		position: t.Optional(t.String({ description: "广告位置" })),
	}),

	// 排序更新请求
	UpdateSortDto: t.Object({
		sortOrder: t.Number(),
	}),
	// 广告列表查询参数
	ADQueryDto: t.Composite([
		UnoQuery,
		t.Object({
			type: t.Optional(t.String()),
			position: t.Optional(t.String()),
			isActive: t.Optional(t.Boolean()),
		}),
	]),
};
export type ADModel = typeof DbType.typebox.select.advertisementsSchema.static;
// 导出类型
export type CreateADDto = typeof advertisementsModel.CreateADDto.static;
export type UpdateADDto = typeof advertisementsModel.UpdateADDto.static;
export type ADQueryDto = typeof advertisementsModel.ADQueryDto.static;
