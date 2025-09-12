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
import {
  categoriesSchema,
  imagesSchema,
  productImagesSchema,
  productsSchema,
} from "../../db/schema";
import { handleDatabaseError, NotFoundError } from "../../utils/error/customError";
import type {
  CreateProductDto,
  ProductQuery,
  UpdateProductDto,
  UpdateSortDto,
} from "./products.model";

/**
 * 商品服务类
 * 处理所有商品相关的业务逻辑
 */
export class ProductsService {
  /**
   * 创建商品
   */
  static async create(data: CreateProductDto) {
    try {
      const [newProduct] = await db
        .insert(productsSchema)
        .values(data)
        .returning();

      return newProduct;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 更新商品排序
   */
  static async updateSort(id: number, data: UpdateSortDto) {
    try {
      const [updatedProduct] = await db
        .update(productsSchema)
        .set({ 
          sortOrder: data.sortOrder,
          updatedAt: new Date() 
        })
        .where(eq(productsSchema.id, id))
        .returning();

      if (!updatedProduct) {
        throw new NotFoundError("商品不存在");
      }

      return updatedProduct;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * 获取商品列表
   */
  static async getList(query: ProductQuery) {
    try {
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
            like(productsSchema.name, `%${search}%`),
            like(productsSchema.sku, `%${search}%`),
            like(productsSchema.description, `%${search}%`),
          ),
        );
      }

      if (categoryId) {
        conditions.push(
          eq(productsSchema.categoryId, parseInt(categoryId as string)),
        );
      }

      if (isActive !== undefined) {
        conditions.push(eq(productsSchema.isActive, isActive === true));
      }
      if (isFeatured !== undefined) {
        conditions.push(eq(productsSchema.isFeatured, isFeatured === true));
      }

      // 定义允许排序的字段（白名单）
      const sortFieldMap: Record<string, any> = {
        id: productsSchema.id,
        name: productsSchema.name,
        price: productsSchema.price,
        createdAt: productsSchema.createdAt,
        updatedAt: productsSchema.updatedAt,
        // 可根据需要添加更多字段
      };

      // 确定排序字段和方向
      const sortField = sortFieldMap[sortBy] || productsSchema.id;
      // 排序
      const orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);


      db  // 构建查询
      const queryBuilder = db
        .select({
          ...getTableColumns(productsSchema),
          categoryName: categoriesSchema.name,
        })
        .from(productsSchema)
        .leftJoin(
          categoriesSchema,
          eq(productsSchema.categoryId, categoriesSchema.id),
        )


      // 获取总数
      const totalBuilder = db
        .select({ count: count() })
        .from(productsSchema)
        .leftJoin(
          categoriesSchema,
          eq(productsSchema.categoryId, categoriesSchema.id),
        )

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
        totalBuilder.where(and(...conditions));
      }

      // 分页
      const offset = (page - 1) * pageSize;
      queryBuilder.limit(pageSize).offset(offset);


      // 查询数据和总数
      const [products, totalResult] = await Promise.all([
        queryBuilder,
        totalBuilder
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        items: products,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        }
      }
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
      const product = await db
        .select({
          ...getTableColumns(productsSchema),
          categoryName: categoriesSchema.name,
        })
        .from(productsSchema)
        .leftJoin(
          categoriesSchema,
          eq(productsSchema.categoryId, categoriesSchema.id),
        )
        .where(eq(productsSchema.id, id))
        .limit(1);

      if (!product.length) {
        throw new NotFoundError("商品不存在");
      }

      // 获取商品关联的图片
      const productImages = await db
        .select({
          id: imagesSchema.id,
          url: imagesSchema.url,
          fileName: imagesSchema.fileName,
          isMain: productImagesSchema.isMain,
        })
        .from(productImagesSchema)
        .leftJoin(
          imagesSchema,
          eq(productImagesSchema.imageId, imagesSchema.id),
        )
        .where(eq(productImagesSchema.productId, id));

      const productData = {
        ...product[0],
        imageUrls: productImages.map(img => img.url),
        mainImageUrl: productImages.find(img => img.isMain)?.url,
      };

      return productData;
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
          ...getTableColumns(productsSchema),
          categoryName: categoriesSchema.name,
        })
        .from(productsSchema)
        .leftJoin(
          categoriesSchema,
          eq(productsSchema.categoryId, categoriesSchema.id),
        )
        .where(eq(productsSchema.slug, slug))
        .limit(1);

      if (!product.length) {
        throw new NotFoundError("商品不存在");
      }

      // 获取商品关联的图片
      const productImages = await db
        .select({
          id: imagesSchema.id,
          url: imagesSchema.url,
          fileName: imagesSchema.fileName,
          isMain: productImagesSchema.isMain,
        })
        .from(productImagesSchema)
        .leftJoin(
          imagesSchema,
          eq(productImagesSchema.imageId, imagesSchema.id),
        )
        .where(eq(productImagesSchema.productId, product[0].id));

      const productData = {
        ...product[0],
        imageUrls: productImages.map(img => img.url),
        mainImageUrl: productImages.find(img => img.isMain)?.url,
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
      // 准备更新数据，自动设置更新时间
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const [updatedProduct] = await db
        .update(productsSchema)
        .set(updateData)
        .where(eq(productsSchema.id, id))
        .returning();

      if (!updatedProduct) {
        throw new NotFoundError("商品不存在");
      }

      return updatedProduct;
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
        .delete(productImagesSchema)
        .where(eq(productImagesSchema.productId, id));

      // 删除商品
      const [deletedProduct] = await db
        .delete(productsSchema)
        .where(eq(productsSchema.id, id))
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
          .update(productImagesSchema)
          .set({ isMain: false })
          .where(eq(productImagesSchema.productId, productId));
      }

      const [productImage] = await db
        .insert(productImagesSchema)
        .values({ productId, imageId, isMain })
        .returning();

      return productImage
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
        .delete(productImagesSchema)
        .where(
          and(
            eq(productImagesSchema.productId, productId),
            eq(productImagesSchema.imageId, imageId),
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
        .update(productImagesSchema)
        .set({ isMain: false })
        .where(eq(productImagesSchema.productId, productId));

      // 设置指定图片为主图
      return await db
        .update(productImagesSchema)
        .set({ isMain: true })
        .where(
          and(
            eq(productImagesSchema.productId, productId),
            eq(productImagesSchema.imageId, imageId),
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
        .delete(productImagesSchema)
        .where(eq(productImagesSchema.productId, productId));

      // 添加新的图片关联
      if (imageIds.length > 0) {
        const imageData = imageIds.map((imageId) => ({
          productId,
          imageId,
          isMain: imageId === mainImageId,
        }));

        return await db.insert(productImagesSchema).values(imageData);
      }


    } catch (error) {
      console.error("批量设置商品图片失败:", error);
      throw handleDatabaseError(error);
    }
  }
}
