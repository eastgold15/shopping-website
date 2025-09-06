import { and, eq, inArray, like } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { nanoid } from 'nanoid';
import { db } from '../db/connection';
import { imagesSchema as images } from '../db/schema';
import { imagesModel } from './images.model';
import { ossService } from './oss';



/**
 * 图片管理路由
 */
export const imagesRoute = new Elysia({ prefix: '/images' })
  .model(imagesModel)
  // 获取图片列表
  .get('/', async ({ query }) => {
    try {
      const { category, search, page = '1', pageSize = '12' } = query as {
        category?: string;
        search?: string;
        page?: string;
        pageSize?: string;
      };

      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const offset = (pageNum - 1) * pageSizeNum;

      // 构建查询条件
      const conditions = [];

      if (category && category !== 'all') {
        conditions.push(eq(images.category, category));
      }

      if (search) {
        conditions.push(
          like(images.fileName, `%${search}%`)
        );
      }

      // 查询图片列表
      const imageList = await db
        .select()
        .from(images)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(images.uploadDate)
        .limit(pageSizeNum)
        .offset(offset);

      // 查询总数
      const totalResult = await db
        .select({ count: images.id })
        .from(images)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult.length;

      return {
        success: true,
        data: imageList,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum)
        }
      };
    } catch (error) {
      console.error('获取图片列表失败:', error);
      return {
        success: false,
        error: '获取图片列表失败'
      };
    }
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
    try {
      const { id } = params;

      const image = await db
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

      if (image.length === 0) {
        return {
          success: false,
          error: '图片不存在'
        };
      }

      return {
        success: true,
        data: image[0]
      };
    } catch (error) {
      console.error('获取图片信息失败:', error);
      return {
        success: false,
        error: '获取图片信息失败'
      };
    }
  }, {
    params: 'IdParams',
    detail: {
      tags: ['Images'],
      summary: '获取单个图片信息',
      description: '根据ID获取图片的详细信息'
    }
  })

  // 创建图片记录
  .post('/', async ({ body }) => {
    try {
      const {
        fileName,
        originalName,
        url,
        category,
        fileSize,
        mimeType,
        altText
      } = body as {
        fileName: string;
        originalName: string;
        url: string;
        category: string;
        fileSize: number;
        mimeType: string;
        altText?: string;
      };

      const imageId = nanoid();
      const now = new Date().toISOString();

      const newImage = {
        id: imageId,
        fileName,
        originalName,
        url,
        category,
        fileSize,
        mimeType,
        altText: altText || '',
        uploadDate: now,
        updatedDate: now
      };

      await db.insert(images).values(newImage);

      return {
        success: true,
        data: newImage
      };
    } catch (error) {
      console.error('创建图片记录失败:', error);
      return {
        success: false,
        error: '创建图片记录失败'
      };
    }
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
    try {
      const { id } = params;
      const { fileName, category, altText } = body as {
        fileName?: string;
        category?: string;
        altText?: string;
      };

      // 检查图片是否存在
      const existingImage = await db
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

      if (existingImage.length === 0) {
        return {
          success: false,
          error: '图片不存在'
        };
      }

      // 更新图片信息
      const updateData: any = {
        updatedDate: new Date().toISOString()
      };

      if (fileName !== undefined) updateData.fileName = fileName;
      if (category !== undefined) updateData.category = category;
      if (altText !== undefined) updateData.altText = altText;

      await db
        .update(images)
        .set(updateData)
        .where(eq(images.id, id));

      // 获取更新后的图片信息
      const updatedImage = await db
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

      return {
        success: true,
        data: updatedImage[0]
      };
    } catch (error) {
      console.error('更新图片信息失败:', error);
      return {
        success: false,
        error: '更新图片信息失败'
      };
    }
  }, {
    params: 'IdParams',
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
      const { id } = params;

      // 获取图片信息
      const image = await db
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

      if (image.length === 0) {
        return {
          success: false,
          error: '图片不存在'
        };
      }

      const imageData = image[0];

      try {
        // 从OSS删除文件
        const key = imageData.url.split('/').slice(-3).join('/');
        await ossService.deleteFile(key);
      } catch (ossError) {
        console.warn('从OSS删除文件失败:', ossError);
        // 继续删除数据库记录，即使OSS删除失败
      }

      // 从数据库删除记录
      await db.delete(images).where(eq(images.id, id));

      return {
        success: true,
        data: { deletedId: id }
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败'
      };
    }
  }, {
    params: 'IdParams',
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
      const imageList = await db
        .select()
        .from(images)
        .where(inArray(images.id, imageIds));

      if (imageList.length === 0) {
        return {
          success: false,
          error: '没有找到要删除的图片'
        };
      }

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
      await db.delete(images).where(inArray(images.id, imageIds));

      return {
        success: true,
        data: {
          deletedCount: imageList.length,
          ossDeletedCount: deletedCount,
          failedDeletes
        }
      };
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
    try {
      // 总图片数
      const totalImages = await db
        .select({ count: images.id })
        .from(images);

      // 按分类统计
      const categoryStats = await db
        .select({
          category: images.category,
          count: images.id
        })
        .from(images)
        .groupBy(images.category);

      // 计算总文件大小
      const sizeResult = await db
        .select({ totalSize: images.fileSize })
        .from(images);

      const totalSize = sizeResult.reduce((sum, item) => sum + (item.totalSize || 0), 0);

      return {
        success: true,
        data: {
          totalImages: totalImages.length,
          totalSize,
          categoryStats: categoryStats.map(stat => ({
            category: stat.category,
            count: 1 // 由于drizzle的限制，这里需要手动计算
          }))
        }
      };
    } catch (error) {
      console.error('获取图片统计失败:', error);
      return {
        success: false,
        error: '获取图片统计失败'
      };
    }
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

      return {
        success: true,
        data: {
          presignedUrl,
          publicUrl,
          key,
          fileName: uniqueFileName
        }
      };
    } catch (error) {
      console.error('生成预签名URL失败:', error);
      return {
        success: false,
        error: '生成预签名URL失败'
      };
    }
  }, {
    body: 'PresignedUrlRequestDto',
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
      const imageId = nanoid();
      const now = new Date().toISOString();
      const fileName = key.split('/').pop() || originalName;

      const newImage = {
        id: imageId,
        fileName,
        originalName,
        url: publicUrl,
        category,
        fileSize: fileStats?.size || fileSize,
        mimeType,
        altText: altText || '',
        uploadDate: now,
        updatedDate: now
      };

      await db.insert(images).values(newImage);

      return {
        success: true,
        data: newImage
      };
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