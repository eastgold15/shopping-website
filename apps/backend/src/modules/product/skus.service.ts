import { InsertSkuDto, SelectSkuType, skusModel, skusTable, UpdateSkuDto } from "@backend/db/models/sku.model";
import { imagesTable, productImagesTable, skuImagesTable } from "@backend/db/models";
import {
  handleDatabaseError,
  NotFoundError,
} from "@backend/utils/error/customError";
import BaseService from "@backend/utils/services";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  like,
  or,
} from "drizzle-orm";
import { db } from "../../db/connection";

/**
 * SKU服务类
 * 处理所有SKU相关的业务逻辑
 */
export class SkusService extends BaseService<
  SelectSkuType,
  InsertSkuDto,
  UpdateSkuDto
> {
  protected readonly table = skusTable;
  protected readonly tableName = 'skus';

  constructor() {
    super();
  }

  /**
   * 创建SKU
   */
  static async create(data: InsertSkuDto) {
    try {
      const result = await db.insert(skusTable).values(data).returning();
      return result[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取SKU列表
   */
  static async getList(query: any) {
    try {
      const {
        page = 1,
        pageSize = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        productId,
        colorId,
        sizeId,
        isActive,
      } = query;

      // 查询条件
      const conditions = [];
      if (productId) {
        conditions.push(eq(skusTable.productId, parseInt(productId)));
      }
      if (colorId) {
        conditions.push(eq(skusTable.colorId, parseInt(colorId)));
      }
      if (sizeId) {
        conditions.push(eq(skusTable.sizeId, parseInt(sizeId)));
      }
      if (isActive !== undefined) {
        conditions.push(eq(skusTable.isActive, isActive === 'true'));
      }

      // 定义允许排序的字段
      const sortFieldMap: Record<string, any> = {
        id: skusTable.id,
        name: skusTable.name,
        price: skusTable.price,
        createdAt: skusTable.createdAt,
        updatedAt: skusTable.updatedAt,
        sortOrder: skusTable.sortOrder,
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sortBy] || skusTable.id;
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(skusTable),
          images: {
            id: imagesTable.id,
            url: imagesTable.url,
            alt: imagesTable.alt,
            isMain: skuImagesTable.isMain,
          },
        })
        .from(skusTable)
        .leftJoin(
          skuImagesTable,
          eq(skusTable.id, skuImagesTable.skuId),
        )
        .leftJoin(
          imagesTable,
          eq(skuImagesTable.imageId, imagesTable.id),
        );

      // 获取总数
      const totalBuilder = db
        .select({ count: count() })
        .from(skusTable);

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
        totalBuilder.where(and(...conditions));
      }

      // 添加排序
      queryBuilder.orderBy(_orderBy);

      // 分页
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      queryBuilder.limit(parseInt(pageSize)).offset(offset);

      // 查询数据和总数
      const [rawSkus, totalResult] = await Promise.all([
        queryBuilder,
        totalBuilder,
      ]);

      // 聚合SKU图片数据
      const skusMap = new Map();

      for (const row of rawSkus) {
        const skuId = row.id;

        if (!skusMap.has(skuId)) {
          const { images, ...skuData } = row;
          skusMap.set(skuId, {
            ...skuData,
            images: [],
          });
        }

        // 添加图片信息
        if (row.images && row.images.id) {
          const sku = skusMap.get(skuId);
          if (sku) {
            sku.images.push({
              id: row.images.id,
              url: row.images.url || "",
              alt: row.images.alt || "",
              isMain: row.images.isMain || false,
            });
          }
        }
      }

      // 转换为数组并排序图片
      const skus = Array.from(skusMap.values()).map((sku) => ({
        ...sku,
        images: sku.images.sort((a: any, b: any) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return 0;
        }),
      }));

      const total = totalResult[0]?.count || 0;

      return {
        items: skus,
        meta: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      };
    } catch (error) {
      console.error("获取SKU列表失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据ID获取SKU详情
   */
  static async getById(id: number) {
    try {
      const rawSku = await db
        .select({
          ...getTableColumns(skusTable),
          images: {
            id: imagesTable.id,
            url: imagesTable.url,
            alt: imagesTable.alt,
            isMain: skuImagesTable.isMain,
          },
        })
        .from(skusTable)
        .leftJoin(
          skuImagesTable,
          eq(skusTable.id, skuImagesTable.skuId),
        )
        .leftJoin(
          imagesTable,
          eq(skuImagesTable.imageId, imagesTable.id),
        )
        .where(eq(skusTable.id, id));

      if (!rawSku.length) {
        throw new NotFoundError("SKU不存在");
      }

      // 聚合图片数据
      const skuData = rawSku[0];
      const { images: _, ...baseSku } = skuData;

      const images = rawSku
        .filter((row) => row.images.id)
        .map((row) => ({
          id: row.images.id,
          url: row.images.url,
          alt: row.images.alt,
          isMain: row.images.isMain,
        }))
        .sort((a, b) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return 0;
        });

      return {
        ...baseSku,
        images,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据商品ID获取所有SKU
   */
  static async getByProductId(productId: number) {
    try {
      const rawSkus = await db
        .select({
          ...getTableColumns(skusTable),
          images: {
            id: imagesTable.id,
            url: imagesTable.url,
            alt: imagesTable.alt,
            isMain: skuImagesTable.isMain,
          },
        })
        .from(skusTable)
        .leftJoin(
          skuImagesTable,
          eq(skusTable.id, skuImagesTable.skuId),
        )
        .leftJoin(
          imagesTable,
          eq(skuImagesTable.imageId, imagesTable.id),
        )
        .where(
          and(
            eq(skusTable.productId, productId),
            eq(skusTable.isActive, true)
          )
        )
        .orderBy(asc(skusTable.sortOrder));

      // 聚合SKU图片数据
      const skusMap = new Map();

      for (const row of rawSkus) {
        const skuId = row.id;

        if (!skusMap.has(skuId)) {
          const { images, ...skuData } = row;
          skusMap.set(skuId, {
            ...skuData,
            images: [],
          });
        }

        // 添加图片信息
        if (row.images && row.images.id) {
          const sku = skusMap.get(skuId);
          if (sku) {
            sku.images.push({
              id: row.images.id,
              url: row.images.url || "",
              alt: row.images.alt || "",
              isMain: row.images.isMain || false,
            });
          }
        }
      }

      // 转换为数组并排序图片
      const skus = Array.from(skusMap.values()).map((sku) => ({
        ...sku,
        images: sku.images.sort((a: any, b: any) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return 0;
        }),
      }));

      return skus;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新SKU
   */
  static async update(id: number, data: UpdateSkuDto) {
    try {
      const [updatedSku] = await db
        .update(skusTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(skusTable.id, id))
        .returning();

      if (!updatedSku) {
        throw new NotFoundError("SKU不存在");
      }

      return updatedSku;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 删除SKU
   */
  static async delete(id: number) {
    try {
      // 先删除SKU关联的图片
      await db
        .delete(skuImagesTable)
        .where(eq(skuImagesTable.skuId, id));

      // 删除SKU
      const [deletedSku] = await db
        .delete(skusTable)
        .where(eq(skusTable.id, id))
        .returning();

      if (!deletedSku) {
        throw new NotFoundError("SKU不存在");
      }

      return deletedSku;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 为SKU添加图片关联
   */
  static async addSkuImage(
    skuId: number,
    imageId: number,
    isMain: boolean = false,
  ) {
    try {
      // 如果设置为主图，先将其他图片的主图状态取消
      if (isMain) {
        await db
          .update(skuImagesTable)
          .set({ isMain: false })
          .where(eq(skuImagesTable.skuId, skuId));
      }

      const [skuImage] = await db
        .insert(skuImagesTable)
        .values({ skuId, imageId, isMain })
        .returning();

      return skuImage;
    } catch (error) {
      console.error("添加SKU图片关联失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 设置SKU主图
   */
  static async setSkuMainImage(skuId: number, imageId: number) {
    try {
      // 先将所有图片的主图状态取消
      await db
        .update(skuImagesTable)
        .set({ isMain: false })
        .where(eq(skuImagesTable.skuId, skuId));

      // 设置指定图片为主图
      return await db
        .update(skuImagesTable)
        .set({ isMain: true })
        .where(
          and(
            eq(skuImagesTable.skuId, skuId),
            eq(skuImagesTable.imageId, imageId),
          ),
        );
    } catch (error) {
      console.error("设置SKU主图失败:", error);
      throw handleDatabaseError(error);
    }
  }
}