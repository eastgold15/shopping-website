import { InsertProductDto, ListProductQueryDto, productImagesTable, productsModel, productsTable, SelectProductType, UpdateProductDto } from "@backend/db/models/product.model";

import { categoriesTable, imagesTable } from "@backend/db/models";
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
 * 商品服务类
 * 处理所有商品相关的业务逻辑
 */
export class ProductsService extends BaseService<
  SelectProductType,
  InsertProductDto,
  UpdateProductDto
> {
  protected readonly table = productsTable;
  protected readonly tableName = 'products';

  constructor() {
    super();
  }
  /**
   * 创建商品
   */
  static async create(data: InsertProductDto) {
    try {
      // 从数据中提取image_ids，其余数据用于创建商品

      const encode_date = productsModel.insertProductDto.decode(data)
      const { image_ids, ...productData } = encode_date;

      // 使用事务确保商品创建和图片关联的原子性
      const result = await db.transaction(async (tx) => {
        // 创建商品
        const [newProduct] = await tx
          .insert(productsTable)
          .values(productData)
          .returning();
        // 如果有图片ID，创建商品图片关联
        if (image_ids && image_ids.length > 0) {
          const productImageData = image_ids.map((imageId, index) => ({
            productId: newProduct.id,
            imageId: imageId,
            isMain: index === 0, // 第一个图片设为主图片
          }));

          await tx.insert(productImagesTable).values(productImageData);
        }

        return newProduct;
      });

      return result;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取分页商品列表
   */
  static async getList(query: ListProductQueryDto) {
    try {
      // 处理查询参数
      const {
        page = 1,
        pageSize = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
        categoryId,
        isActive,
        isFeatured,
      } = query;

      // 搜索条件：支持商品名称、SKU和描述搜索
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(productsTable.name, `%${search}%`),
            like(productsTable.sku, `%${search}%`),
            like(productsTable.description, `%${search}%`),
          ),
        );
      }

      if (categoryId) {
        conditions.push(
          eq(productsTable.categoryId, categoryId),
        );
      }

      if (isActive !== undefined) {
        conditions.push(eq(productsTable.isActive, isActive === true));
      }
      if (isFeatured !== undefined) {
        conditions.push(eq(productsTable.isFeatured, isFeatured === true));
      }

      // 定义允许排序的字段（白名单）
      const sortFieldMap: Record<string, any> = {
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
        // 可根据需要添加更多字段
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sortBy] || productsTable.id;
      // 排序
      const _orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

      // 构建查询 - 关联商品图片表获取图片信息
      const queryBuilder = db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
          images: {
            id: imagesTable.id,
            url: imagesTable.imageUrl,
            alt: imagesTable.alt,
            isMain: productImagesTable.isMain,
          },
        })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .leftJoin(
          productImagesTable,
          eq(productsTable.id, productImagesTable.productId),
        )
        .leftJoin(
          imagesTable,
          eq(productImagesTable.imageId, imagesTable.id),
        );

      // 获取总数
      const totalBuilder = db
        .select({ count: count() })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        );

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
        totalBuilder.where(and(...conditions));
      }

      // 添加排序
      queryBuilder.orderBy(_orderBy);

      // 分页
      const offset = (page - 1) * pageSize;
      queryBuilder.limit(pageSize).offset(offset);

      // 查询数据和总数
      const [rawProducts, totalResult] = await Promise.all([
        queryBuilder,
        totalBuilder,
      ]);

      // 聚合商品图片数据
      const productsMap = new Map();

      for (const row of rawProducts) {
        const productId = row.id;

        if (!productsMap.has(productId)) {
          // 创建商品基础信息，安全处理images字段
          const { images, ...productData } = row || {};
          productsMap.set(productId, {
            ...productData,
            images: [],
          });
        }

        // 添加图片信息（如果存在且有效）
        if (row.images && row.images.id) {
          const product = productsMap.get(productId);
          if (product) {
            product.images.push({
              id: row.images.id,
              url: row.images.url || "",
              alt: row.images.alt || "",
              isMain: row.images.isMain || false,
            });
          }
        }
      }

      // 转换为数组并排序图片（主图在前）
      const products = Array.from(productsMap.values()).map((product) => ({
        ...product,
        images: product.images.sort((a: any, b: any) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return 0;
        }),
      }));

      const total = totalResult[0]?.count || 0;

      return {
        items: products,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error("获取商品列表失败:", error);
      throw handleDatabaseError(error);
    }
  }
  /**
   * 根据ID获取商品详情
   */
  static async getById(id: number) {
    try {
      // 使用与列表查询相同的关联方式
      const rawProduct = await db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
          images: {
            id: imagesTable.id,
            url: imagesTable.imageUrl,
            alt: imagesTable.alt,
            isMain: productImagesTable.isMain,
          },
        })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .leftJoin(
          productImagesTable,
          eq(productsTable.id, productImagesTable.productId),
        )
        .leftJoin(
          imagesTable,
          eq(productImagesTable.imageId, imagesTable.id),
        )
        .where(eq(productsTable.id, id));

      if (!rawProduct.length) {
        throw new NotFoundError("商品不存在");
      }

      // 聚合图片数据
      const productData = rawProduct[0];
      const { images: _, ...baseProduct } = productData;

      const images = rawProduct
        .filter((row) => row.images.id) // 过滤掉没有图片的记录
        .map((row) => ({
          id: row.images.id,
          url: row.images.url,
          alt: row.images.alt,
          isMain: row.images.isMain,
        }))
        .sort((a, b) => {
          // 主图排在前面
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return 0;
        });

      return {
        ...baseProduct,
        images,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据slug获取商品详情
   */
  static async getBySlug(slug: string) {
    try {
      const product = await db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
        })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .where(eq(productsTable.slug, slug))
        .limit(1);

      if (!product.length) {
        throw new NotFoundError("商品不存在");
      }

      // 获取商品关联的图片
      const productImages = await db
        .select({
          id: imagesTable.id,
          url: imagesTable.imageUrl,
          fileName: imagesTable.fileName,
          isMain: productImagesTable.isMain,
        })
        .from(productImagesTable)
        .leftJoin(
          imagesTable,
          eq(productImagesTable.imageId, imagesTable.id),
        )
        .where(eq(productImagesTable.productId, product[0].id));

      const productData = {
        ...product[0],
        imageUrls: productImages.map((img) => img.url),
        mainImageUrl: productImages.find((img) => img.isMain)?.url,
      };

      return productData;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新商品
   */
  static async update(id: number, data: UpdateProductDto) {
    try {
      // 从数据中提取image_ids，其余数据用于更新商品

      const encode_data = productsModel.updateProductDto.decode(data)
      const { image_ids, ...productData } = encode_data;


      // 使用事务确保商品更新和图片关联的原子性
      const result = await db.transaction(async (tx) => {
        // 准备更新数据，自动设置更新时间
        const updateData = {
          ...productData,
          updatedAt: new Date(),
        };

        const [updatedProduct] = await tx
          .update(productsTable)
          .set(updateData)
          .where(eq(productsTable.id, id))
          .returning();

        if (!updatedProduct) {
          throw new NotFoundError("商品不存在");
        }

        // 如果提供了图片ID，更新商品图片关联
        if (image_ids !== undefined) {
          // 先删除现有的图片关联
          await tx
            .delete(productImagesTable)
            .where(eq(productImagesTable.productId, id));

          // 如果有新的图片ID，创建新的关联
          if (image_ids.length > 0) {
            const productImageData = image_ids.map((imageId, index) => ({
              productId: id,
              imageId: imageId,
              isMain: index === 0, // 第一个图片设为主图片
            }));

            await tx.insert(productImagesTable).values(productImageData);
          }
        }

        return updatedProduct;
      });

      return result;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 删除商品
   */
  static async delete(id: number) {
    try {
      // 先删除商品关联的图片
      await db
        .delete(productImagesTable)
        .where(eq(productImagesTable.productId, id));

      // 删除商品
      const [deletedProduct] = await db
        .delete(productsTable)
        .where(eq(productsTable.id, id))
        .returning();

      if (!deletedProduct) {
        throw new NotFoundError("商品不存在");
      }

      return deletedProduct;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 为商品添加图片关联
   */
  static async addProductImage(
    productId: number,
    imageId: number,
    isMain: boolean = false,
  ) {
    try {
      // 如果设置为主图，先将其他图片的主图状态取消
      if (isMain) {
        await db
          .update(productImagesTable)
          .set({ isMain: false })
          .where(eq(productImagesTable.productId, productId));
      }

      const [productImage] = await db
        .insert(productImagesTable)
        .values({ productId, imageId, isMain })
        .returning();

      return productImage;
    } catch (error) {
      console.error("添加商品图片关联失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 移除商品图片关联
   */
  static async removeProductImage(productId: number, imageId: number) {
    try {
      return await db
        .delete(productImagesTable)
        .where(
          and(
            eq(productImagesTable.productId, productId),
            eq(productImagesTable.imageId, imageId),
          ),
        );
    } catch (error) {
      console.error("移除商品图片关联失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 设置商品主图
   */
  static async setProductMainImage(productId: number, imageId: number) {
    try {
      // 先将所有图片的主图状态取消
      await db
        .update(productImagesTable)
        .set({ isMain: false })
        .where(eq(productImagesTable.productId, productId));

      // 设置指定图片为主图
      return await db
        .update(productImagesTable)
        .set({ isMain: true })
        .where(
          and(
            eq(productImagesTable.productId, productId),
            eq(productImagesTable.imageId, imageId),
          ),
        );
    } catch (error) {
      console.error("设置商品主图失败:", error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 批量设置商品图片
   */
  static async setProductImages(
    productId: number,
    imageIds: number[],
    mainImageId?: number,
  ) {
    try {
      // 先删除现有的图片关联
      await db
        .delete(productImagesTable)
        .where(eq(productImagesTable.productId, productId));

      // 添加新的图片关联
      if (imageIds.length > 0) {
        const imageData = imageIds.map((imageId) => ({
          productId,
          imageId,
          isMain: imageId === mainImageId,
        }));

        return await db.insert(productImagesTable).values(imageData);
      }
    } catch (error) {
      console.error("批量设置商品图片失败:", error);
      throw handleDatabaseError(error);
    }
  }
}
