import { t } from 'elysia';
import { UnoQuery } from '../utils/common.model';
import { DbType } from '../db/database.types';

// 网站配置模型定义
export const siteConfigsModel = {
  // 创建配置请求参数
  CreateSiteConfigDto: DbType.typebox.insert.siteConfigSchema,

  // 更新配置请求参数
  UpdateSiteConfigDto: t.Object({
    ...DbType.spreads.insert.siteConfigSchema
  }),

  // 批量更新配置请求参数
  BatchUpdateSiteConfigDto: t.Array(
    t.Object({
      key: t.String(),
      value: t.String(),
      description: t.Optional(t.String()),
      category: t.Optional(t.String())
    })
  ),

  // 配置查询参数
  SiteConfigQueryDto: t.Object({
    ...UnoQuery.properties,
    category: t.Optional(t.String()),
    key: t.Optional(t.String())
  }),

  // 路径参数
  KeyParams: t.Object({
    key: t.String()
  }),

  CategoryParams: t.Object({
    category: t.String()
  })
};

// 导出类型
export type CreateSiteConfigDto = typeof siteConfigsModel.CreateSiteConfigDto;
export type UpdateSiteConfigDto = typeof siteConfigsModel.UpdateSiteConfigDto;
export type BatchUpdateSiteConfigDto = typeof siteConfigsModel.BatchUpdateSiteConfigDto;
export type SiteConfigQueryDto = typeof siteConfigsModel.SiteConfigQueryDto;
export type KeyParams = typeof siteConfigsModel.KeyParams;
export type CategoryParams = typeof siteConfigsModel.CategoryParams;