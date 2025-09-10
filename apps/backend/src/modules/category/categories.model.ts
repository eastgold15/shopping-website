import { t } from "elysia";
import { UnoQuery } from "../../db/common.model";
import { DbType } from "../../db/database.types";

// Elysia模型定义
export const categoriesModel = {
	// 创建分类请求参数
	CreateCategoryDto: t.Omit(DbType.typebox.insert.categoriesSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),

	// 更新分类请求参数
	UpdateCategoryDto: t.Omit(DbType.typebox.insert.categoriesSchema, [
		"id",
		"createdAt",
		"updatedAt",
	]),
	// 排序更新请求
	UpdateSortRequest: t.Object({
		sortOrder: t.Number({ minimum: 0 }),
	}),

	// 统一查询参数
	UnifiedQueryParams: t.Composite([
		UnoQuery,
		t.Object({
			name: t.Optional(t.String()), // 分类名称搜索
			parentId: t.Optional(t.String()), // 父分类ID筛选
			isVisible: t.Optional(t.Boolean()), // 显示状态筛选
		}),
	]),
};

// 导出类型
export type CreateCategoryDto = typeof categoriesModel.CreateCategoryDto.static;
export type UpdateCategoryDto = typeof categoriesModel.UpdateCategoryDto.static;
export type UpdateSortRequest = typeof categoriesModel.UpdateSortRequest.static;
export type UnifiedQueryParams =
	typeof categoriesModel.UnifiedQueryParams.static;
