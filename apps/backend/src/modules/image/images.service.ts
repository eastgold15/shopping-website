// 图片管理服务

import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../db/connection";
import { imagesTable, productImagesTable } from "../../db/models";

// 导入模型类型
import type {
  InsertImagesDto,
  ListImagesQueryDto,
  QueryOptions,
  SelectImagesType,
  UpdateImagesDto
} from "../../types";
import {
  CustomeError,
  handleDatabaseError,
  NotFoundError,
} from "../../utils/error/customError";
import { commonRes } from "../../utils/Res";
import BaseService from "../../utils/services";


export class ImageService extends BaseService<
  SelectImagesType,
  InsertImagesDto,
  UpdateImagesDto
> {
  protected readonly table = imagesTable;
  protected readonly tableName = 'images';

  constructor() {
    super();
  }

  /**
   * 创建图片记录
   */
  static async create(data: InsertImagesDto): Promise<SelectImagesType> {
    try {
      const imageData = {
        ...data,
        createdAt: new Date(),
      };

      // 使用 BaseService 的 create 方法
      return await new ImageService().create(imageData);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 分页获取图片列表
   * @param query 查询参数
   * @returns 图片列表
   */
  static async getList(query: ListImagesQueryDto) {
    try {
      // 处理查询参数
      const {
        page = 1,
        pageSize = 12,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
        category,
        mimeType,
        filename,
      } = query;

      // 构建查询选项
      const queryOptions: QueryOptions = {
        filters: [],
        sort: []
      };

      // 处理搜索条件
      if (search) {
        queryOptions.filters?.push({
          field: 'fileName',
          operator: 'like',
          value: `%${search}%`
        });
      }

      // 处理分类过滤
      if (category) {
        queryOptions.filters?.push({
          field: 'category',
          operator: 'eq',
          value: category
        });
      }

      // 处理文件类型过滤
      if (mimeType) {
        queryOptions.filters?.push({
          field: 'mimeType',
          operator: 'eq',
          value: mimeType
        });
      }

      // 处理文件名过滤
      if (filename) {
        queryOptions.filters?.push({
          field: 'fileName',
          operator: 'like',
          value: `%${filename}%`
        });
      }

      // 处理排序
      const sortFieldMap: Record<string, string> = {
        id: 'id',
        fileName: 'fileName',
        category: 'category',
        fileSize: 'fileSize',
        mimeType: 'mimeType',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };

      const sortField = sortFieldMap[sortBy] || 'createdAt';

      queryOptions.sort?.push({
        field: sortField,
        direction: sortOrder || 'desc'
      });

      // 调用 BaseService 的 findPaginated 方法
      return await new ImageService().findPaginated({ page, pageSize }, queryOptions);
    } catch (error) {
      console.error('获取图片列表失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据ID获取图片详情
   */
  static async getById(id: number) {
    try {
      // 使用 BaseService 的 findById 方法
      return await new ImageService().findById(id);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新图片信息
   */
  static async update(id: number, data: UpdateImagesDto) {
    try {
      // 使用 BaseService 的 update 方法
      return await new ImageService().update(id, data);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 删除图片
   */
  static async delete(id: number): Promise<boolean> {
    try {
      // 使用 BaseService 的 delete 方法
      return await new ImageService().delete(id);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 批量删除图片
   */
  static async deleteBatch(imageIds: number[]): Promise<number> {
    try {
      // 使用 BaseService 的 deleteBatch 方法
      return await new ImageService().deleteBatch(imageIds);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据分类查询图片
   */
  static async findByCategory(category: string) {
    try {
      const queryOptions: QueryOptions = {
        filters: [{
          field: "category",
          operator: "eq",
          value: category,
        }]
      };

      // 使用 BaseService 的 findMany 方法
      return await new ImageService().findMany(queryOptions);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 搜索图片
   */
  static async searchImages(searchTerm: string) {
    try {
      const queryOptions: QueryOptions = {
        filters: [
          {
            field: "fileName",
            operator: "like",
            value: `%${searchTerm}%`
          }
        ]
      };

      // 使用 BaseService 的 findMany 方法
      return await new ImageService().findMany(queryOptions);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取商品关联的图片
   */
  static async findByProductId(productId: number) {
    try {
      const column = getTableColumns(imagesTable);
      const images = await db
        .select({
          ...column,
          isMain: productImagesTable.isMain,
        })
        .from(productImagesTable)
        .leftJoin(
          imagesTable,
          eq(productImagesTable.imageId, imagesTable.id),
        )
        .where(eq(productImagesTable.productId, productId));

      if (images.length <= 0) {
        throw new NotFoundError("未找到该商品图片");
      }

      return commonRes(images);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }
}