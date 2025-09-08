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

// 上传类型枚举
export const UPLOAD_TYPE = {
  ADVERTISEMENT: 'advertisement',
  PRODUCT: 'product',
  CATEGORY: 'category',
  GENERAL: 'general'
} as const;

// Elysia模型定义
export const uploadModel = {
  // 文件上传请求参数
  FileUploadDto: t.Object({
    file: t.Files({
      type: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    })
  }),

  // 通用文件上传请求参数
  GeneralFileUploadDto: t.Object({
    file: t.Files({
      type: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    }),
    folder: t.Optional(t.String())
  }),

  // 上传响应类型
  UploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String())
  }),

  // 批量上传响应类型
  BatchUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    urls: t.Optional(t.Array(t.String())),
    files: t.Optional(t.Array(t.Object({
      url: t.String(),
      fileName: t.String()
    }))),
    error: t.Optional(t.String())
  }),

  // 文件信息类型
  FileInfo: t.Object({
    url: t.String(),
    fileName: t.String(),
    size: t.Number(),
    type: t.String(),
    uploadedAt: t.String()
  })
};

// 导出类型
export type FileUploadDto = typeof uploadModel.FileUploadDto;
export type GeneralFileUploadDto = typeof uploadModel.GeneralFileUploadDto;
export type UploadResponse = typeof uploadModel.UploadResponse;
export type BatchUploadResponse = typeof uploadModel.BatchUploadResponse;
export type FileInfo = typeof uploadModel.FileInfo;