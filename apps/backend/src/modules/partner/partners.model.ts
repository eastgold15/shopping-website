import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";



// Elysia模型定义
export const partnersModel = {

  // 创建合作伙伴请求参数
  CreatePartnerDto: t.Omit
    (DbType.typebox.insert.partnersSchema, ['id', 'createdAt', 'updatedAt', 'sortOrder']),

  // 更新合作伙伴请求参数
  UpdatePartnerDto: t.Partial(t.Omit
    (DbType.typebox.insert.partnersSchema, ['id', 'createdAt', 'updatedAt', 'sortOrder'])),

  // 排序更新请求
  UpdateSortDto: t.Object({
    sortOrder: t.Number({ minimum: 0 }),
  }),

  // 统一查询参数
  partnerQuery: t.Composite([UnoQuery, t.Object({
    name: t.Optional(t.String()), // 合作伙伴名称搜索
    isActive: t.Optional(t.Boolean()), // 启用状态筛选
  }),])


};

// 导出类型
export type PartnerModel = typeof DbType.typebox.select.partnersSchema.static & { image: string }
export type CreatePartnerDto = typeof partnersModel.CreatePartnerDto.static;
export type UpdatePartnerDto = typeof partnersModel.UpdatePartnerDto.static;

export type UpdateSortDto = {
  sortOrder: number;
};
export type PartnerQueryDto = typeof partnersModel.partnerQuery.static;
