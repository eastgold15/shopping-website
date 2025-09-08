// 图片管理服务

import { and, eq, like, inArray } from 'drizzle-orm';

import { db } from '../../db/connection';
import { imagesSchema } from '../../db/schema';



// 导入数据库类型
import type {
  DbType
} from '../../db/database.types';

// 导入模型类型
import type {
  CreateImageDto,
  UpdateImageDto,
  ImageListQueryDto
} from './model';

// 图片实体类型
export interface ImageEntity {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  category: string;
  fileSize: number;
  mimeType: string;
  altText: string;
  uploadDate: string;
  updatedDate: string;
}

// 图片统计信息类型
export interface ImageStats {
  total: number;
  byCategory: Record<string, number>;
  byMimeType: Record<string, number>;
  totalSize: number;
}
import { CustomeError, handleDatabaseError, ValidationError, NotFoundError, DatabaseError } from '@backend/utils/error/customError';
import BaseService, { CreateOptions, PaginatedServiceResponse, QueryOptions, ServiceResponse, validateRequired } from '@backend/utils/services';
import { commonRes } from '@backend/utils/Res';

export interface ImageQueryOptions extends QueryOptions {
  category?: string;
  search?: string;
  mimeType?: string;
  startDate?: string;
  endDate?: string;
}

export interface ImageCreateInput extends Omit<CreateImageDto, 'id'> {
  file?: Buffer;
  originalName?: string;
}

export interface ImageUpdateInput extends Partial<UpdateImageDto> {
  id: string;
}

export class ImageService extends BaseService<
  ImageEntity,
  ImageCreateInput,
  ImageUpdateInput
> {
  constructor() {
    super(imagesSchema, 'images');
  }

  /**
   * 创建图片记录
   */
  async createImage(
    data: ImageCreateInput,
    options: CreateOptions = {}
  ): Promise<ServiceResponse<ImageEntity>> {
    try {
      // 验证必填字段
      validateRequired(data, ['fileName', 'url', 'category', 'fileSize', 'mimeType']);

      // 生成ID
      const imageData = {
        ...data,
        id: this.generateImageId(),
        uploadDate: new Date().toISOString(),
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
  ): Promise<PaginatedServiceResponse<any>> {
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
  ): Promise<ServiceResponse<ImageEntity[]>> {
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
  ): Promise<ServiceResponse<ImageEntity[]>> {
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
    id: string,
    data: ImageUpdateInput,
    options: UpdateOptions = {}
  ): Promise<ServiceResponse<ImageEntity>> {
    try {
      // 检查图片是否存在
      const existing = await this.findById(id);
      if (!existing.success || !existing.data) {
        throw new NotFoundError(`Image with id ${id} not found`);
      }

      // 验证更新数据
      if (data.category && !this.isValidCategory(data.category)) {
        throw new ValidationError(`Invalid category: ${data.category}`);
      }

      return await this.update(id, data, options);
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
  async deleteImages(imageIds: string[]): Promise<ServiceResponse<number>> {
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

      if (!existingImages.success || !existingImages.data) {
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
      if (!allImagesResult.success || !allImagesResult.data) {
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
  ): Promise<ServiceResponse<ImageEntity[]>> {
    try {
      const filters = [
        {
          field: 'uploadDate',
          operator: 'gte' as const,
          value: startDate
        },
        {
          field: 'uploadDate',
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
   * 生成图片ID
   */
  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  /**
   * 验证创建数据
   */
  protected async validateCreate(data: ImageCreateInput): Promise<void> {
    validateRequired(data, ['fileName', 'url', 'category', 'fileSize', 'mimeType']);

    if (!this.isValidCategory(data.category)) {
      throw new ValidationError(`Invalid category: ${data.category}`);
    }

    if (data.fileSize <= 0) {
      throw new ValidationError('File size must be greater than 0');
    }

    if (!data.mimeType || !data.mimeType.includes('image/')) {
      throw new ValidationError('Invalid MIME type for image');
    }
  }

  /**
   * 验证更新数据
   */
  protected async validateUpdate(data: ImageUpdateInput): Promise<void> {
    if (data.category && !this.isValidCategory(data.category)) {
      throw new ValidationError(`Invalid category: ${data.category}`);
    }

    if (data.fileSize !== undefined && data.fileSize <= 0) {
      throw new ValidationError('File size must be greater than 0');
    }

    if (data.mimeType && !data.mimeType.includes('image/')) {
      throw new ValidationError('Invalid MIME type for image');
    }
  }
}

// 导出服务实例
export const imageService = new ImageService();