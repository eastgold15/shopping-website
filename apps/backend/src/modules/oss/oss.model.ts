import { t } from "elysia";

// 支持的图片类型
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const
export type SUPPORTED_IMAGE_TYPES = (typeof SUPPORTED_IMAGE_TYPES)[number];

// 最大文件大小 (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 图片文件扩展名到MIME类型的映射
export const IMAGE_MIME_TYPE_MAP: Record<string, string> = {
  jpeg: SUPPORTED_IMAGE_TYPES[0],
  jpg: SUPPORTED_IMAGE_TYPES[1],
  png: SUPPORTED_IMAGE_TYPES[2],
  gif: SUPPORTED_IMAGE_TYPES[3],
  webp: SUPPORTED_IMAGE_TYPES[4],
};

// 上传类型枚举
export const FOLDDER_TYPE = {
  ALL: "all",
  ADVERTISEMENT: "advertisement",
  PRODUCT: "product",
  CATEGORY: "category",
  GENERAL: "general",
  USER_AVATAR: "avatar",
} as const;
export type Folder_Type = keyof typeof FOLDDER_TYPE;

/**
 * OSS 模块模型定义
 */
export const ossModel = {


  // 文件上传参数
  uploadParams: t.Object({
    key: t.String({ description: "文件在OSS中的路径" }),
    contentType: t.Optional(t.String({ description: "文件MIME类型" })),
    expires: t.Optional(t.Number({ description: "签名过期时间(秒)" })),
  }),

  // 文件信息
  fileInfo: t.Object({
    fileName: t.String({ description: "文件名" }),
    url: t.String({ description: "文件URL" }),
    size: t.Number({ description: "文件大小(字节)" }),
    contentType: t.Optional(t.String({ description: "文件MIME类型" })),
  }),

  // 删除文件参数
  deleteParams: t.Object({
    key: t.String({ description: "要删除的文件路径" }),
  }),


  // 文件存在性检查参数
  existsParams: t.Object({
    key: t.String({ description: "要检查的文件路径" }),
  }),

} as const;

// 导出类型

export type UploadParams = typeof ossModel.uploadParams.static;

export type FileInfo = typeof ossModel.fileInfo.static;
export type DeleteParams = typeof ossModel.deleteParams.static;

export type ExistsParams = typeof ossModel.existsParams.static;

