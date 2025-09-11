import { DbType } from "@backend/types";
import { t } from "elysia";
import { FOLDDER_TYPE, SUPPORTED_IMAGE_TYPES } from "../oss";

// Elysia模型定义
export const uploadsModel = {
  ImageInfo: DbType.typebox.select.imagesSchema,
  // 文件信息类型
  FileInfo: t.Object({
    url: t.String(),
    fileName: t.String(),
    size: t.Number(),
    type: t.String(),
    uploadedAt: t.String(),
  }),


  // 通用文件上传请求参数
  UploadImageDto: t.Object({
    file: t.File({
      type: [...SUPPORTED_IMAGE_TYPES],
      maxSize: 5 * 1024 * 1024, // 5MB
    }),
    folder: t.Optional(
      t.UnionEnum([
        FOLDDER_TYPE.ADVERTISEMENT,
        FOLDDER_TYPE.CATEGORY,
        FOLDDER_TYPE.GENERAL,
        FOLDDER_TYPE.PRODUCT,
        FOLDDER_TYPE.USER_AVATAR,
      ]),
    ),
  }),

  // 通用文件上传请求参数
  UploadImagesDto: t.Object({
    files: t.Files({
      type: [...SUPPORTED_IMAGE_TYPES],
      maxSize: 5 * 1024 * 1024, // 5MB
    }),
    folder: t.Optional(
      t.UnionEnum([
        FOLDDER_TYPE.ADVERTISEMENT,
        FOLDDER_TYPE.CATEGORY,
        FOLDDER_TYPE.GENERAL,
        FOLDDER_TYPE.PRODUCT,
        FOLDDER_TYPE.USER_AVATAR,
      ]),
    ),
  }),

  // 上传响应类型
  UploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    url: t.Optional(t.String()),
    fileName: t.Optional(t.String()),
    error: t.Optional(t.String()),
  }),

  // 批量上传响应类型
  BatchUploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    urls: t.Optional(t.Array(t.String())),
    files: t.Optional(
      t.Array(
        t.Object({
          url: t.String(),
          fileName: t.String(),
        }),
      ),
    ),
    error: t.Optional(t.String()),
  }),
};




// 导出类型
export type UploadImageDto =
  typeof uploadsModel.UploadImageDto.static;
export type UploadImagesDto =
  typeof uploadsModel.UploadImagesDto.static;



export type UploadResponse = typeof uploadsModel.UploadResponse.static;
export type BatchUploadResponse =
  typeof uploadsModel.BatchUploadResponse.static;
export type FileInfo = typeof uploadsModel.FileInfo.static;
