import { and, asc, count, desc, eq, getTableColumns, like, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { categoriesSchema, productsSchema, productImagesSchema, imagesSchema } from '../../db/schema';
import { handleDatabaseError } from '../../utils/error/customError';
import type { CreateProductDto, ProductListQueryDto, UpdateProductDto } from './products.model';

/**
 * 商品服务类
 * 处理所有商品相关的业务逻辑
 */
export class ProductsService {
  /**
   * 创建商品
   */
  static async createProduct(data: CreateProductDto) {
    try {
      const [newProduct] = await db
        .insert(productsSchema)
        .values(data)
        .returning();

      return { success: true, data: newProduct };
    } catch (error) {
      console.error('创建商品失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取商品列表
   */
  static async getProductList(query: ProductListQueryDto) {
    try {
      const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, isActive, isFeatured } = query;

      // 搜索条件：支持商品名称、SKU和描述搜索
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(productsSchema.name, `%${search}%`),
            like(productsSchema.sku, `%${search}%`),
            like(productsSchema.description, `%${search}%`)
          )
        );
      }

      if (categoryId) {
        conditions.push(eq(productsSchema.categoryId, parseInt(categoryId as string)));
      }

      if (isActive !== undefined) {
        conditions.push(eq(productsSchema.isActive, isActive === true));
      }
      if (isFeatured !== undefined) {
        conditions.push(eq(productsSchema.isFeatured, isFeatured === true));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      // 定义允许排序的字段（白名单）
      const sortableFields: Record<string, any> = {
        id: productsSchema.id,
        name: productsSchema.name,
        price: productsSchema.price,
        createdAt: productsSchema.createdAt,
        updatedAt: productsSchema.updatedAt,
        // 可根据需要添加更多字段
      };
      // 确保 sortBy 是合法字段
      const sortField = sortableFields[sortBy];
      if (!sortField) {
        throw new Error(`无效的排序字段: ${sortBy}`);
      }


      // 排序
      const orderBy = sortOrder === 'desc' ? desc(sortField) : asc(sortField);

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 查询数据和总数
      const [products, totalResult] = await Promise.all([
        db.select({
          ...getTableColumns(productsSchema),
          categoryName: categoriesSchema.name
        })
          .from(productsSchema)
          .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(pageSize)
          .offset(offset),

        db.select({ count: count() })
          .from(productsSchema)
          .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
          .where(whereClause)
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        success: true,
        data: {
          data: products,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据ID获取商品详情
   */
  static async getProductById(id: string) {
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        return { success: false, error: '无效的商品ID', code: 400 };
      }

      const product = await db.select({
        ...getTableColumns(productsSchema),
        categoryName: categoriesSchema.name
      })
        .from(productsSchema)
        .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
        .where(eq(productsSchema.id, productId))
        .limit(1);

      if (!product.length) {
        return { success: false, error: '商品不存在', code: 404 };
      }

      // 获取商品关联的图片
      const productImages = await db.select({
        id: imagesSchema.id,
        url: imagesSchema.url,
        fileName: imagesSchema.fileName,
        altText: imagesSchema.altText,
        isMain: productImagesSchema.isMain
      })
        .from(productImagesSchema)
        .leftJoin(imagesSchema, eq(productImagesSchema.imageId, imagesSchema.id))
        .where(eq(productImagesSchema.productId, productId));

      const productData = {
        ...product[0],
        images: productImages
      };

      return { success: true, data: productData };
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 根据slug获取商品详情
   */
  static async getProductBySlug(slug: string) {
    try {
      const product = await db.select({
        ...getTableColumns(productsSchema),
        categoryName: categoriesSchema.name
      })
        .from(productsSchema)
        .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
        .where(eq(productsSchema.slug, slug))
        .limit(1);

      if (!product.length) {
        return { success: false, error: '商品不存在', code: 404 };
      }

      // 获取商品关联的图片
      const productImages = await db.select({
        id: imagesSchema.id,
        url: imagesSchema.url,
        fileName: imagesSchema.fileName,
        altText: imagesSchema.altText,
        isMain: productImagesSchema.isMain
      })
        .from(productImagesSchema)
        .leftJoin(imagesSchema, eq(productImagesSchema.imageId, imagesSchema.id))
        .where(eq(productImagesSchema.productId, product[0].id));

      const productData = {
        ...product[0],
        images: productImages
      };

      return { success: true, data: productData };
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新商品
   */
  static async updateProduct(id: string, data: UpdateProductDto) {
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        return { success: false, error: '无效的商品ID', code: 400 };
      }

      // 准备更新数据，自动设置更新时间
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const [updatedProduct] = await db
        .update(productsSchema)
        .set(updateData)
        .where(eq(productsSchema.id, productId))
        .returning();

      if (!updatedProduct) {
        return { success: false, error: '商品不存在', code: 404 };
      }

      return { success: true, data: updatedProduct };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 删除商品
   */
  static async deleteProduct(id: string) {
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        throw new Error('无效的商品ID');
      }

      // 先删除商品关联的图片
      await db
        .delete(productImagesSchema)
        .where(eq(productImagesSchema.productId, productId));

      // 删除商品
      const [deletedProduct] = await db
        .delete(productsSchema)
        .where(eq(productsSchema.id, productId))
        .returning();

      if (!deletedProduct) {
        throw new Error('商品不存在');
      }

      return { success: true, message: '商品删除成功', data: deletedProduct };
    } catch (error) {
      console.error('删除商品失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 为商品添加图片关联
   */
  static async addProductImage(productId: number, imageId: number, isMain: boolean = false) {
    try {
      // 如果设置为主图，先将其他图片的主图状态取消
      if (isMain) {
        await db.update(productImagesSchema)
          .set({ isMain: false })
          .where(eq(productImagesSchema.productId, productId));
      }

      const [productImage] = await db
        .insert(productImagesSchema)
        .values({ productId, imageId, isMain })
        .returning();

      return { success: true, data: productImage };
    } catch (error) {
      console.error('添加商品图片关联失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 移除商品图片关联
   */
  static async removeProductImage(productId: number, imageId: number) {
    try {
      await db.delete(productImagesSchema)
        .where(
          and(
            eq(productImagesSchema.productId, productId),
            eq(productImagesSchema.imageId, imageId)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('移除商品图片关联失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 设置商品主图
   */
  static async setProductMainImage(productId: number, imageId: number) {
    try {
      // 先将所有图片的主图状态取消
      await db.update(productImagesSchema)
        .set({ isMain: false })
        .where(eq(productImagesSchema.productId, productId));

      // 设置指定图片为主图
      await db.update(productImagesSchema)
        .set({ isMain: true })
        .where(
          and(
            eq(productImagesSchema.productId, productId),
            eq(productImagesSchema.imageId, imageId)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('设置商品主图失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 批量设置商品图片
   */
  static async setProductImages(productId: number, imageIds: number[], mainImageId?: number) {
    try {
      // 先删除现有的图片关联
      await db.delete(productImagesSchema)
        .where(eq(productImagesSchema.productId, productId));

      // 添加新的图片关联
      if (imageIds.length > 0) {
        const imageData = imageIds.map(imageId => ({
          productId,
          imageId,
          isMain: imageId === mainImageId
        }));

        await db.insert(productImagesSchema).values(imageData);
      }

      return { success: true };
    } catch (error) {
      console.error('批量设置商品图片失败:', error);
      throw handleDatabaseError(error);
    }
  }
}