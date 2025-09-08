import { Elysia } from 'elysia';
import { imageService } from './service';
import { imagesModel } from './model';
import { ossService } from '../oss';
import { formatSuccess } from '../../middleware';

/**
 * 图片管理路由
 */
export const imageController = new Elysia({ prefix: '/images' })
  .model(imagesModel)

  // 获取图片列表
  .get('/', async ({ query }) => {
    const result = await imageService.findImagesByPage(query as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取图片列表失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    query: 'ImageListQueryDto',
    detail: {
      tags: ['Images'],
      summary: '获取图片列表',
      description: '获取图片列表，支持分类筛选、搜索和分页'
    }
  })

  // 获取单个图片信息
  .get('/:id', async ({ params }) => {
    const result = await imageService.findById(params.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取图片信息失败'
      };
    }

    if (!result.data) {
      return {
        success: false,
        error: '图片不存在'
      };
    }

    return formatSuccess(result.data);
  }, {
    detail: {
      tags: ['Images'],
      summary: '获取单个图片信息',
      description: '根据ID获取图片的详细信息'
    }
  })

  // 创建图片记录
  .post('/', async ({ body }) => {
    const result = await imageService.createImage(body as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '创建图片记录失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    body: 'CreateImageDto',
    detail: {
      tags: ['Images'],
      summary: '创建图片记录',
      description: '在数据库中创建新的图片记录'
    }
  })

  // 更新图片信息
  .put('/:id', async ({ params, body }) => {
    const result = await imageService.updateImage(params.id, body as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '更新图片信息失败'
      };
    }

    return formatSuccess(result.data);
  }, {

    body: 'UpdateImageDto',
    detail: {
      tags: ['Images'],
      summary: '更新图片信息',
      description: '更新图片的基本信息'
    }
  })

  // 删除单个图片
  .delete('/:id', async ({ params }) => {
    try {
      // 获取图片信息
      const existingResult = await imageService.findById(params.id);
      if (!existingResult.success || !existingResult.data) {
        return {
          success: false,
          error: '图片不存在'
        };
      }

      const imageData = existingResult.data;

      try {
        // 从OSS删除文件
        const key = imageData.url.split('/').slice(-3).join('/');
        await ossService.deleteFile(key);
      } catch (ossError) {
        console.warn('从OSS删除文件失败:', ossError);
        // 继续删除数据库记录，即使OSS删除失败
      }

      // 从数据库删除记录
      const deleteResult = await imageService.delete(params.id);

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error?.message || '删除图片失败'
        };
      }

      return formatSuccess({ deletedId: params.id });
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败'
      };
    }
  }, {

    detail: {
      tags: ['Images'],
      summary: '删除图片',
      description: '删除指定的图片记录和文件'
    }
  })

  // 批量删除图片
  .delete('/batch', async ({ body }) => {
    try {
      const { imageIds } = body as { imageIds: string[] };

      if (!imageIds || imageIds.length === 0) {
        return {
          success: false,
          error: '请选择要删除的图片'
        };
      }

      // 获取图片信息
      const existingResult = await imageService.findMany({
        filters: imageIds.map(id => ({
          field: 'id',
          operator: 'eq',
          value: id
        }))
      });

      if (!existingResult.success || !existingResult.data) {
        return {
          success: false,
          error: '没有找到要删除的图片'
        };
      }

      const imageList = existingResult.data;
      let deletedCount = 0;
      const failedDeletes: string[] = [];

      // 逐个删除文件
      for (const image of imageList) {
        try {
          // 从OSS删除文件
          const key = image.url.split('/').slice(-3).join('/');
          await ossService.deleteFile(key);
          deletedCount++;
        } catch (ossError) {
          console.warn(`从OSS删除文件失败 ${image.fileName}:`, ossError);
          failedDeletes.push(image.fileName);
        }
      }

      // 从数据库删除记录
      const deleteResult = await imageService.deleteBatch(imageIds);

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error?.message || '批量删除图片失败'
        };
      }

      return formatSuccess({
        deletedCount: imageList.length,
        ossDeletedCount: deletedCount,
        failedDeletes
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
      tags: ['Images'],
      summary: '批量删除图片',
      description: '批量删除多个图片记录和文件'
    }
  })

  // 获取图片统计信息
  .get('/stats/overview', async () => {
    const result = await imageService.getImageStats();

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取图片统计失败'
      };
    }

    return formatSuccess(result.data);
  }, {
    detail: {
      tags: ['Images'],
      summary: '获取图片统计信息',
      description: '获取图片的统计概览信息'
    }
  })

  // 生成预签名URL
  .post('/presigned-url', async ({ body }) => {
    try {
      const { fileName, category = 'general' } = body as {
        fileName: string;
        category?: string;
      };

      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${timestamp}_${randomStr}.${fileExtension}`;
      const key = `${category}/${uniqueFileName}`;

      // 生成预签名URL
      const presignedUrl = await ossService.generatePresignedUploadUrl(key, 3600, 'application/octet-stream'); // 1小时有效期
      const publicUrl = ossService.getPublicUrl(key);

      return formatSuccess({
        presignedUrl,
        publicUrl,
        key,
        fileName: uniqueFileName
      });
    } catch (error) {
      console.error('生成预签名URL失败:', error);
      return {
        success: false,
        error: '生成预签名URL失败'
      };
    }
  }, {

    detail: {
      tags: ['Images'],
      summary: '获取预签名上传URL',
      description: '获取用于直接上传到OSS的预签名URL'
    }
  })

  // 确认文件上传完成
  .post('/confirm-upload', async ({ body }) => {
    try {
      const {
        key,
        originalName,
        category,
        fileSize,
        mimeType,
        altText
      } = body as {
        key: string;
        originalName: string;
        category: string;
        fileSize: number;
        mimeType: string;
        altText?: string;
      };

      // 检查文件是否存在
      const exists = await ossService.fileExists(key);
      if (!exists) {
        return {
          success: false,
          error: '文件上传未完成或不存在'
        };
      }

      // 获取文件信息
      const fileStats = await ossService.getFileStats(key);
      const publicUrl = ossService.getPublicUrl(key);

      // 创建数据库记录
      const fileName = key.split('/').pop() || originalName;

      const imageData = {
        fileName,
        originalName,
        url: publicUrl,
        category,
        fileSize: fileStats?.size || fileSize,
        mimeType,
        altText: altText || ''
      };

      const result = await imageService.createImage(imageData);

      if (!result.success) {
        return {
          success: false,
          error: result.error?.message || '确认文件上传失败'
        };
      }

      return formatSuccess(result.data);
    } catch (error) {
      console.error('确认文件上传失败:', error);
      return {
        success: false,
        error: '确认文件上传失败'
      };
    }
  }, {
    body: 'ConfirmUploadDto',
    detail: {
      tags: ['Images'],
      summary: '确认上传完成',
      description: '确认文件上传完成并创建数据库记录'
    }
  });

