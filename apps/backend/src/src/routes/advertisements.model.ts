
import { t } from "elysia";
import { UnoQuery } from "../utils/common.model"
import { DbType } from "../db/database.types";

// 广告模型定义
export const advertisementsModel = {
  // 创建广告请求参数
  CreateAdvertisementDto: DbType.typebox.insert.advertisementsSchema,

  // 更新广告请求参数
  UpdateAdvertisementDto: t.Object({
    ...DbType.spreads.insert.advertisementsSchema
  }),

  // 排序更新请求
  UpdateSortRequest: t.Object({
    sortOrder: t.Number()
  }),
  // 广告列表查询参数
  AdvertisementListQueryDto: t.Object({
    ...UnoQuery.properties,
    type: t.Optional(t.String()),
    position: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
  }),
};
