// 图片管理服务


import { eq, getTableColumns } from 'drizzle-orm';
import { db } from '../../db/connection';
import { imagesSchema, productImagesSchema } from '../../db/schema';



// 导入数据库类型

// 导入模型类型
import { CustomeError, DatabaseError, handleDatabaseError, NotFoundError, ValidationError } from '@backend/utils/error/customError';
import { commonRes } from '@backend/utils/Res';
import BaseService, { CreateOptions, QueryOptions, ServiceResponse, UpdateOptions, validateRequired } from '@backend/utils/services';
import type {
  CreateImageDto,
  ImageEntity,
  ImageListQueryDto,
  UpdateImageDto
} from './images.model';



export interface ImageUpdateInput extends Partial<UpdateImageDto> {
  id: number;
}

export class ImageService extends BaseService<
  ImageEntity,
  CreateImageDto,
  ImageUpdateInput
> {
  constructor() {
    super(imagesSchema, 'images');
  }

  /**
   * 创建图片记录
   */
  async createImage(
    data: CreateImageDto,
    options: CreateOptions = {}
  ): Promise<ServiceResponse<ImageEntity>> {
    try {
      // 验证必填字段
      validateRequired(data, ['fileName', 'url', 'fileSize', 'mimeType']);

      const imageData = {
        ...data,
        createdAt: new Date(),
      };

      return await this.create(imageData, options);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 分页查询图片列表
   */
  async findImagesByPage(
    query: ImageListQueryDto
  ) {
    try {
      const { page = 1, pageSize = 12, category, search, mimeType } = query;

      // 构建查询条件
      const filters = [];

      if (category && category !== 'all') {
        filters.push({
          field: 'category',
          operator: 'eq' as const,
          value: category
        });
      }

      if (search) {
        filters.push({
          field: 'fileName',
          operator: 'like' as const,
          value: search
        });
      }

      if (mimeType) {
        filters.push({
          field: 'mimeType',
          operator: 'eq' as const,
          value: mimeType
        });
      }

      return await this.findPaginated(
        { page, pageSize },
        { filters }
      );
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据分类查询图片
   */
  async findByCategory(
    category: string,
    options: QueryOptions = {}
  ) {
    try {
      const filters = [{
        field: 'category',
        operator: 'eq' as const,
        value: category
      }];

      return await this.findMany({ ...options, filters });
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 搜索图片
   */
  async searchImages(
    searchTerm: string,
    options: QueryOptions = {}
  ) {
    try {
      const filters = [
        {
          field: 'fileName',
          operator: 'like' as const,
          value: searchTerm
        },
        {
          field: 'altText',
          operator: 'like' as const,
          value: searchTerm
        }
      ];

      return await this.findMany({ ...options, filters });
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新图片信息
   */
  async updateImage(
    id: number,
    data: ImageUpdateInput,
    options: UpdateOptions = {}
  ): Promise<ServiceResponse<ImageEntity>> {
    try {
      // 检查图片是否存在
      const imageId = id
      if (isNaN(imageId)) {
        throw new ValidationError(`Invalid image ID: ${id}`);
      }
      const existing = await this.findById(imageId);
      if (existing.code !== 200 || !existing.data) {
        throw new NotFoundError(`Image with id ${id} not found`);
      }

      // 验证更新数据
      if (data.category && !this.isValidCategory(data.category)) {
        throw new ValidationError(`Invalid category: ${data.category}`);
      }

      return await this.update(imageId, data, options);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 批量删除图片
   */
  async deleteImages(imageIds: number[]): Promise<ServiceResponse<number>> {
    try {
      if (!imageIds || imageIds.length === 0) {
        throw new ValidationError('No image IDs provided');
      }

      // 检查图片是否存在
      const existingImages = await this.findMany({
        filters: imageIds.map(id => ({
          field: 'id',
          operator: 'eq' as const,
          value: id
        }))
      });

      if (!existingImages.data) {
        throw new NotFoundError('One or more images not found');
      }

      const existingIds = existingImages.data.map(img => img.id);
      const missingIds = imageIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        throw new NotFoundError(`Images not found: ${missingIds.join(', ')}`);
      }

      return await this.deleteBatch(imageIds);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取图片统计信息
   */
  async getImageStats(): Promise<ServiceResponse<ImageStats>> {
    try {
      // 获取所有图片
      const allImagesResult = await this.findMany();
      if (!allImagesResult.data) {
        throw new DatabaseError('Failed to fetch images for statistics');
      }

      const images = allImagesResult.data;

      // 按分类统计
      const byCategory = images.reduce((acc, img) => {
        acc[img.category] = (acc[img.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 按MIME类型统计
      const byMimeType = images.reduce((acc, img) => {
        const mimeType = img.mimeType.split('/')[0];
        acc[mimeType] = (acc[mimeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 计算总大小
      const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);

      const stats = {
        total: images.length,
        byCategory,
        byMimeType,
        totalSize
      };

      return commonRes(stats);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取指定时间范围内的图片
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
    options: QueryOptions = {}
  ) {
    try {
      const filters = [
        {
          field: 'createdAt',
          operator: 'gte' as const,
          value: startDate
        },
        {
          field: 'createdAt',
          operator: 'lte' as const,
          value: endDate
        }
      ];

      return await this.findMany({ ...options, filters });
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取商品关联的图片
   */
  async findByProductId(productId: number) {
    try {

      const column = getTableColumns(imagesSchema);
      const images = await db.select({
        ...column,
        isMain: productImagesSchema.isMain
      })
        .from(productImagesSchema)
        .leftJoin(imagesSchema, eq(productImagesSchema.imageId, imagesSchema.id))
        .where(eq(productImagesSchema.productId, productId));

      if (images.length < 0) {
        throw new CustomeError('未找到该商品图片');
      }

      return commonRes(images)
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }



  /**
   * 验证分类
   */
  private isValidCategory(category: string): boolean {
    const validCategories = [
      'general',
      'carousel',
      'banner',
      'news',
      'product',
      'category',
      'avatar',
      'advertisement'
    ];
    return validCategories.includes(category);
  }


}

// 导出服务实例
export const imageService = new ImageService();