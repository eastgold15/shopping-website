import { t } from 'elysia';
import { UnoQuery } from '../utils/common.model';
import { DbType } from '../db/database.types';

// 图片管理模型定义
export const imagesModel = {
  // 创建图片请求参数
  CreateImageDto: DbType.typebox.insert.imagesSchema,

  // 更新图片请求参数
  UpdateImageDto: t.Object({
    ...DbType.spreads.insert.imagesSchema
  }),

  // 图片列表查询参数 
  ImageListQueryDto: t.Object({
    ...UnoQuery.properties,
    category: t.Optional(t.String()),
    search: t.Optional(t.String()),
    mimeType: t.Optional(t.String())
  }),

  // 批量删除请求参数
  BatchDeleteImageDto: t.Object({
    imageIds: t.Array(t.String())
  }),

  // 预签名URL请求参数
  PresignedUrlDto: t.Object({
    fileName: t.String(),
    category: t.Optional(t.String())
  }),

  // 确认上传请求参数
  ConfirmUploadDto: t.Object({
    key: t.String(),
    originalName: t.String(),
    category: t.String(),
    fileSize: t.Number(),
    mimeType: t.String(),
    altText: t.Optional(t.String())
  }),

  // 路径参数
  IdParams: t.Object({
    id: t.String()
  })
};

// 导出类型
export type CreateImageDto = typeof imagesModel.CreateImageDto;
export type UpdateImageDto = typeof imagesModel.UpdateImageDto;
export type ImageListQueryDto = typeof imagesModel.ImageListQueryDto;
export type BatchDeleteImageDto = typeof imagesModel.BatchDeleteImageDto;
export type PresignedUrlDto = typeof imagesModel.PresignedUrlDto;
export type ConfirmUploadDto = typeof imagesModel.ConfirmUploadDto;
export type IdParams = typeof imagesModel.IdParams;