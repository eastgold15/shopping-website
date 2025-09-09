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

// 图片文件扩展名到MIME类型的映射
export const IMAGE_MIME_TYPE_MAP: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp'
};

// 上传类型枚举
export const UPLOAD_TYPE = {
  ADVERTISEMENT: 'advertisement',
  PRODUCT: 'product',
  CATEGORY: 'category',
  GENERAL: 'general',
  USER_AVATAR: 'avatar'
} as const;

/**
 * OSS 模块模型定义
 */
export const ossModel = {
  // OSS 配置信息
  ossConfig: t.Object({
    region: t.String(),
    bucket: t.String(),
    accessKeyId: t.String(),
    accessKeySecret: t.String(),
    endpoint: t.Optional(t.String())
  }),

  // 文件上传参数
  uploadParams: t.Object({
    key: t.String({ description: '文件在OSS中的路径' }),
    contentType: t.Optional(t.String({ description: '文件MIME类型' })),
    expires: t.Optional(t.Number({ description: '签名过期时间(秒)' }))
  }),

  // 预签名URL响应
  presignedUrlResponse: t.Object({
    url: t.String({ description: '预签名上传URL' }),
    key: t.String({ description: '文件路径' }),
    expires: t.Number({ description: '过期时间戳' })
  }),

  // 文件信息
  fileInfo: t.Object({
    fileName: t.String({ description: '文件名' }),
    url: t.String({ description: '文件URL' }),
    size: t.Number({ description: '文件大小(字节)' }),
    contentType: t.Optional(t.String({ description: '文件MIME类型' }))
  }),

  // 删除文件参数
  deleteParams: t.Object({
    key: t.String({ description: '要删除的文件路径' })
  }),

  // 批量删除参数
  batchDeleteParams: t.Object({
    keys: t.Array(t.String(), { description: '要删除的文件路径列表' })
  }),

  // 文件存在性检查参数
  existsParams: t.Object({
    key: t.String({ description: '要检查的文件路径' })
  }),

  // 文件列表查询参数
  listParams: t.Object({
    prefix: t.Optional(t.String({ description: '文件路径前缀' })),
    maxKeys: t.Optional(t.Number({ description: '最大返回数量', default: 100 })),
    marker: t.Optional(t.String({ description: '分页标记' }))
  }),


} as const;

// 导出类型
export type OssConfig = typeof ossModel.ossConfig.static;
export type UploadParams = typeof ossModel.uploadParams.static;
export type PresignedUrlResponse = typeof ossModel.presignedUrlResponse.static;
export type FileInfo = typeof ossModel.fileInfo.static;
export type DeleteParams = typeof ossModel.deleteParams.static;
export type BatchDeleteParams = typeof ossModel.batchDeleteParams.static;
export type ExistsParams = typeof ossModel.existsParams.static;
export type ListParams = typeof ossModel.listParams.static;
