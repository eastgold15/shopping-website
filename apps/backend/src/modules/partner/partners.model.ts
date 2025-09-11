import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.types";
import { t } from "elysia";



// Elysia模型定义
export const partnersModel = {

  // 前端实体命名
  partnersModel: DbType.typebox.select.partnersSchema,
  // 创建合作伙伴请求参数
  CreatePartnerDto: t.Omit
    (DbType.typebox.insert.partnersSchema, ['id', 'createdAt', 'updatedAt', 'sortOrder']),

  // 更新合作伙伴请求参数
  UpdatePartnerDto: t.Partial(t.Omit
    (DbType.typebox.insert.partnersSchema, ['id', 'createdAt', 'updatedAt', 'sortOrder'])),

  // 排序更新请求
  UpdateSortRequest: t.Object({
    sortOrder: t.Number({ minimum: 0 }),
  }),

  // 统一查询参数
  PartnerQuery: t.Object({
    ...UnoQuery.properties,
    name: t.Optional(t.String()), // 合作伙伴名称搜索
    isActive: t.Optional(t.Boolean()), // 启用状态筛选
  }),
};

// 导出类型
export type PartnerModel = typeof partnersModel.partnersModel.static;
export type CreatePartnerDto = typeof partnersModel.CreatePartnerDto.static;
export type UpdatePartnerDto = typeof partnersModel.UpdatePartnerDto.static;

export type UpdateSortDto = {
  sortOrder: number;
};
export type PartnerQuery = typeof partnersModel.PartnerQuery.static;
