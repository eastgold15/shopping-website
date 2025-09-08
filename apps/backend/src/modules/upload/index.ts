import { Elysia } from 'elysia';
import { uploadService } from './service';
import { uploadModel } from './model';
import { formatSuccess } from '../../middleware';

/**
 * 文件上传管理路由
 */
export const uploadController = new Elysia({ prefix: '/upload' })
  .model(uploadModel)
  
  // 上传广告图片
  .post('/advertisement', async ({ body }) => {
    const formData = body as any;
    const file = formData.file;

    if (!file) {
      return {
        success: false,
        error: '没有上传文件'
      };
    }

    const result = await uploadService.uploadAdvertisement(file);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '上传广告图片失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    body: 'FileUploadDto',
    detail: {
      tags: ['Upload'],
      summary: '上传广告图片',
      description: '上传广告图片到OSS存储'
    }
  })

  // 上传商品图片
  .post('/product', async ({ body }) => {
    const formData = body as any;
    const files = formData.file;

    if (!files) {
      return {
        success: false,
        error: '没有上传文件'
      };
    }

    const result = await uploadService.uploadProductImages(files);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '上传商品图片失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    body: 'FileUploadDto',
    detail: {
      tags: ['Upload'],
      summary: '上传商品图片',
      description: '上传商品图片到OSS存储，支持批量上传'
    }
  })

  // 上传分类图片
  .post('/category', async ({ body }) => {
    const formData = body as any;
    const file = formData.file;

    if (!file) {
      return {
        success: false,
        error: '没有上传文件'
      };
    }

    const result = await uploadService.uploadCategoryImage(file);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '上传分类图片失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    body: 'FileUploadDto',
    detail: {
      tags: ['Upload'],
      summary: '上传分类图片',
      description: '上传分类图片到OSS存储'
    }
  })

  // 上传通用图片
  .post('/general', async ({ body }) => {
    const formData = body as any;
    const file = formData.file;
    const folder = formData.folder || 'general';

    if (!file) {
      return {
        success: false,
        error: '没有上传文件'
      };
    }

    const result = await uploadService.uploadGeneralFile(file, folder);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '上传文件失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    body: 'GeneralFileUploadDto',
    detail: {
      tags: ['Upload'],
      summary: '上传通用图片',
      description: '上传通用图片到指定文件夹'
    }
  })

  // 删除文件
  .delete('/file', async ({ query }) => {
    const { url } = query as any;

    if (!url) {
      return {
        success: false,
        error: '缺少文件URL参数'
      };
    }

    const result = await uploadService.deleteFile(url);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '删除文件失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    detail: {
      tags: ['Upload'],
      summary: '删除文件',
      description: '根据URL删除OSS中的文件'
    }
  })

  // 检查文件是否存在
  .get('/file/exists', async ({ query }) => {
    const { url } = query as any;

    if (!url) {
      return {
        success: false,
        error: '缺少文件URL参数'
      };
    }

    const result = await uploadService.fileExists(url);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '检查文件存在性失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    detail: {
      tags: ['Upload'],
      summary: '检查文件是否存在',
      description: '检查指定URL的文件是否存在'
    }
  })

  // 获取文件信息
  .get('/file/info', async ({ query }) => {
    const { url } = query as any;

    if (!url) {
      return {
        success: false,
        error: '缺少文件URL参数'
      };
    }

    const result = await uploadService.getFileInfo(url);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取文件信息失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    detail: {
      tags: ['Upload'],
      summary: '获取文件信息',
      description: '获取指定URL文件的详细信息'
    }
  });

export default uploadController;