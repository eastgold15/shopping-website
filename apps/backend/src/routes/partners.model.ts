import { t } from 'elysia';
import { UnoQuery } from '../utils/common.model';
import { DbType } from '../db/database.types';
import { dbSchema } from '../db/schema';

// 合作伙伴基础类型
export interface Partner {
  id: number;
  name: string; // 合作伙伴名称
  description: string; // 合作伙伴简介
  image: string; // 合作伙伴图片
  url: string; // 合作伙伴网站链接
  sortOrder: number; // 排序权重
  isActive: boolean; // 是否启用
  createdAt: Date;
  updatedAt: Date;
}

// Elysia模型定义
export const partnersModel = {
  // 创建合作伙伴请求参数
  CreatePartnerDto: DbType.typebox.insert.partnersSchema,

  // 更新合作伙伴请求参数
  UpdatePartnerDto: t.Object({
    ...DbType.spreads.insert.partnersSchema
  }),

  // 排序更新请求
  UpdateSortRequest: t.Object({
    sortOrder: t.Number({ minimum: 0 })
  }),

  // 统一查询参数
  UnifiedQueryParams: t.Object({
    ...UnoQuery.properties,
    name: t.Optional(t.String()), // 合作伙伴名称搜索
    isActive: t.Optional(t.Boolean()) // 启用状态筛选
  })
};

// 导出类型
export type CreatePartnerDto = typeof partnersModel.CreatePartnerDto.static;
export type UpdatePartnerDto = typeof partnersModel.UpdatePartnerDto.static;
export type UpdateSortRequest = {
  sortOrder: number;
};
export type UnifiedQueryParams = typeof partnersModel.UnifiedQueryParams.static;