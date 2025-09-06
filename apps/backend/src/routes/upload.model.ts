import { t } from 'elysia';

// 支持的图片类型
export const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp"
];

// 最大文件大小 (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 文件上传响应类型
export interface UploadResponse {
    success: boolean;
    message: string;
    url?: string;
    fileName?: string;
    error?: string;
}

// 文件上传模型定义
export const uploadModel = {
  // 文件上传请求参数
  FileUploadDto: t.Object({
    file: t.Files({
      type: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    })
  }),

  // 广告图片上传响应
  AdvertisementUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String())
  }),

  // 商品图片上传响应
  ProductUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String())
  }),

  // 分类图片上传响应
  CategoryUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String())
  }),

  // 通用图片上传响应
  GeneralUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String())
  })
};

// 导出类型
export type FileUploadDto = typeof uploadModel.FileUploadDto;
export type AdvertisementUploadResponse = typeof uploadModel.AdvertisementUploadResponse;
export type ProductUploadResponse = typeof uploadModel.ProductUploadResponse;
export type CategoryUploadResponse = typeof uploadModel.CategoryUploadResponse;
export type GeneralUploadResponse = typeof uploadModel.GeneralUploadResponse;