import { Elysia } from 'elysia';

import { imagesModel } from './images.model';
import { ImageService } from './images.service';
import { ossService } from '../oss';
import { commonRes } from '@backend/utils/Res';

/**
 * 图片管理控制器
 * 处理图片相关的HTTP请求
 */
export const imagesController = new Elysia({ prefix: '/images' })
  .decorate('imagesService', new ImageService())
  .model(imagesModel)
  .guard({
    detail: {
      tags: ['Images']
    }
  })

  // 获取图片列表
  .get('/', async ({ query, imagesService }) => {
    const result = await imagesService.findImagesByPage(query as any);



    return result
  }, {
    query: 'ImageListQueryDto',
    detail: {
      summary: '获取图片列表',
      description: '获取图片列表，支持分类筛选、搜索和分页'
    }
  })

  // 获取单个图片信息
  .get('/:id', async ({ params, imagesService }) => {
    const imageId = parseInt(params.id as string);
    if (isNaN(imageId)) {
      return {
        success: false,
        error: '无效的图片ID'
      };
    }
    const result = await imagesService.findById(imageId);

    if (result.code !== 200) {
      return {
        success: false,
        error: result.message || '获取图片信息失败'
      };
    }

    if (!result.data) {
      return {
        success: false,
        error: '图片不存在'
      };
    }

    return commonRes(result.data);
  }, {
    detail: {
      summary: '获取单个图片信息',
      description: '根据ID获取图片的详细信息'
    }
  })

  // 创建图片记录
  .post('/', async ({ body, imagesService }) => {
    const result = await imagesService.createImage(body as any);



    return commonRes(result.data);
  }, {
    body: 'CreateImageDto',
    detail: {
      summary: '创建图片记录',
      description: '在数据库中创建新的图片记录'
    }
  })

  // 更新图片信息
  .put('/:id', async ({ params, body, imagesService }) => {
    const result = await imagesService.updateImage(params.id, body as any);



    return commonRes(result.data);
  }, {
    body: 'UpdateImageDto',
    detail: {
      summary: '更新图片信息',
      description: '更新图片的基本信息'
    }
  })

  // 删除图片
  .delete('/:id', async ({ params, imagesService }) => {
    try {
      // 先获取图片信息
      const imageResult = await imagesService.findById(params.id);

      if (!imageResult.success || !imageResult.data) {
        return {
          success: false,
          error: '图片不存在'
        };
      }

      const image = imageResult.data;

      // 从OSS删除文件
      try {
        const ossKey = image.url.split('/').pop(); // 从URL提取key
        if (ossKey) {
          await ossService.deleteFile(ossKey);
        }
      } catch (ossError) {
        console.warn('OSS文件删除失败:', ossError);
        // 继续删除数据库记录，即使OSS删除失败
      }

      // 删除数据库记录
      const deleteResult = await imagesService.delete(params.id);

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error?.message || '删除图片记录失败'
        };
      }

      return commonRes({ success: true });
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败'
      };
    }
  }, {
    detail: {
      summary: '删除图片',
      description: '删除指定的图片记录和文件'
    }
  })

  // 批量删除图片
  .delete('/batch', async ({ body, imagesService }) => {
    try {
      const { imageIds } = body as any;

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        return {
          success: false,
          error: '请提供有效的图片ID列表'
        };
      }

      // 获取所有图片信息
      const images = [];
      for (const id of imageIds) {
        const result = await imagesService.findById(id);
        if (result.success && result.data) {
          images.push(result.data);
        }
      }

      // 从OSS批量删除文件
      const ossKeys = images
        .map(img => img.url.split('/').pop())
        .filter(Boolean);

      if (ossKeys.length > 0) {
        try {
          await Promise.all(ossKeys.map(key => ossService.deleteFile(key!)));
        } catch (ossError) {
          console.warn('OSS批量删除失败:', ossError);
          // 继续删除数据库记录
        }
      }

      // 批量删除数据库记录
      const deleteResult = await imagesService.deleteImages(imageIds);

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error?.message || '批量删除图片失败'
        };
      }

      return commonRes({
        success: true,
        deletedCount: deleteResult.data
      });
    } catch (error) {
      console.error('批量删除图片失败:', error);
      return {
        success: false,
        error: '批量删除图片失败'
      };
    }
  }, {
    body: 'BatchDeleteImageDto',
    detail: {
      summary: '批量删除图片',
      description: '批量删除多个图片记录和文件'
    }
  })

  // 获取图片统计信息
  .get('/stats/overview', async ({ imagesService }) => {
    const result = await imagesService.getImageStats();

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取统计信息失败'
      };
    }

    return commonRes(result.data);
  }, {
    detail: {
      summary: '获取图片统计信息',
      description: '获取图片的统计概览信息'
    }
  })

  // 获取预签名上传URL
  .post('/presigned-url', async ({ body }) => {
    try {
      const { fileName, category = 'general' } = body as any;

      if (!fileName) {
        return {
          success: false,
          error: '文件名不能为空'
        };
      }

      // 生成唯一的文件key
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = fileName.split('.').pop();
      const key = `${category}/${timestamp}_${randomStr}.${fileExtension}`;

      // 获取预签名URL
      const presignedUrl = await ossService.getPresignedUrl(key, 'PUT');

      return commonRes({
        uploadUrl: presignedUrl,
        key: key,
        fileName: fileName
      });
    } catch (error) {
      console.error('获取预签名URL失败:', error);
      return {
        success: false,
        error: '获取预签名URL失败'
      };
    }
  }, {
    detail: {
      summary: '获取预签名上传URL',
      description: '获取用于直接上传到OSS的预签名URL'
    }
  })

  // 确认上传完成
  .post('/confirm-upload', async ({ body, imagesService }) => {
    try {
      const { key, originalName, category, fileSize, mimeType, altText } = body as any;

      if (!key || !originalName || !category || !fileSize || !mimeType) {
        return {
          success: false,
          error: '缺少必要的上传信息'
        };
      }

      // 构建完整的文件URL
      const fileUrl = await ossService.getFileUrl(key);

      // 创建图片记录
      const imageData = {
        fileName: key.split('/').pop() || key,
        originalName,
        url: fileUrl,
        category,
        fileSize,
        mimeType,
        altText: altText || ''
      };

      const result = await imagesService.createImage(imageData);

      if (!result.success) {
        return {
          success: false,
          error: result.error?.message || '创建图片记录失败'
        };
      }

      return commonRes(result.data);
    } catch (error) {
      console.error('确认上传失败:', error);
      return {
        success: false,
        error: '确认上传失败'
      };
    }
  }, {
    body: 'ConfirmUploadDto',
    detail: {
      summary: '确认上传完成',
      description: '确认文件上传完成并创建数据库记录'
    }
  });