import { DbType } from '@backend/types';
import { t, file } from 'elysia';
import { SUPPORTED_IMAGE_TYPES, UPLOAD_TYPE } from '../oss';


// Elysia模型定义
export const uploadsModel = {

  ImageInfo: DbType.typebox.select.imagesSchema,
  // 文件信息类型
  FileInfo: t.Object({
    url: t.String(),
    fileName: t.String(),
    size: t.Number(),
    type: t.String(),
    uploadedAt: t.String()
  }),

  // 通用文件上传请求参数
  GeneralFileUploadDto: t.Object({
    file: t.File({
      type: [...SUPPORTED_IMAGE_TYPES],
      maxSize: 5 * 1024 * 1024 // 5MB
    }),
    folder: t.Optional(t.UnionEnum([UPLOAD_TYPE.ADVERTISEMENT, UPLOAD_TYPE.CATEGORY, UPLOAD_TYPE.GENERAL, UPLOAD_TYPE.PRODUCT, UPLOAD_TYPE.USER_AVATAR]))
  }),


  // 通用文件上传请求参数
  GeneralFilesUploadDto: t.Object({
    files: t.Files({
      type: [...SUPPORTED_IMAGE_TYPES],
      maxSize: 5 * 1024 * 1024 // 5MB
    }),
    folder: t.Optional(t.UnionEnum([UPLOAD_TYPE.ADVERTISEMENT, UPLOAD_TYPE.CATEGORY, UPLOAD_TYPE.GENERAL, UPLOAD_TYPE.PRODUCT, UPLOAD_TYPE.USER_AVATAR]))
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


};

// 导出类型
export type GeneralFilesUploadDto = typeof uploadsModel.GeneralFilesUploadDto.static;
export type UploadResponse = typeof uploadsModel.UploadResponse.static;
export type BatchUploadResponse = typeof uploadsModel.BatchUploadResponse.static;
export type FileInfo = typeof uploadsModel.FileInfo.static;