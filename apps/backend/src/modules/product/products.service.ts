import { and, asc, count, desc, eq, getTableColumns, like, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { categoriesSchema, productsSchema } from '../../db/schema';
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

      return { success: true, data: product[0] };
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

      return { success: true, data: product[0] };
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

  // 其他方法可以继续添加...
}