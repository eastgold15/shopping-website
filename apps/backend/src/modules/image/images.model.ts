import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { type Static, t } from "elysia";

// 图片管理模型定义
export const imagesModel = {
  // 创建图片请求参数
  CreateImageDto: t.Omit(DbType.typebox.insert.imagesSchema, [
    "id",
    "createdAt",
    "updatedAt",
  ]),

  // 更新图片请求参数
  UpdateImageDto: t.Omit(DbType.typebox.insert.imagesSchema, [
    "id",
    "createdAt",
    "updatedAt",
  ]),

  // 图片列表查询参数
  ImageQueryDto: t.Composite([
    UnoQuery,
    t.Pick(DbType.typebox.insert.imagesSchema, ["category"])
  ]),




};

// 导出类型
export type ImageModel = Static<typeof DbType.typebox.insert.imagesSchema>;
export type CreateImageDto = typeof imagesModel.CreateImageDto.static;
export type UpdateImageDto = typeof imagesModel.UpdateImageDto.static;
export type ImageQueryDto = typeof imagesModel.ImageQueryDto.static;


