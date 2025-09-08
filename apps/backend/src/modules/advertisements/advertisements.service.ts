import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { advertisementsSchema } from '../../db/schema/schema';
import type { CreateAdvertisementDto, UpdateAdvertisementDto, UpdateSortRequest } from './advertisements.model';

/**
 * 广告服务类
 * 处理广告相关的业务逻辑
 */
export class AdvertisementsService {
  /**
   * 获取广告列表（分页）
   */
  async getAdvertisementList(params: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    type?: string;
    position?: string;
    isActive?: boolean;
  }) {
    try {
      const {
        page = 1,
        pageSize = 10,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
        search,
        type,
        position,
        isActive
      } = params;

      // 搜索条件：支持标题和链接搜索
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(advertisementsSchema.title, `%${search}%`),
            like(advertisementsSchema.link, `%${search}%`),
          ),
        );
      }
      if (type) {
        conditions.push(eq(advertisementsSchema.type, type));
      }
      if (position) {
        conditions.push(eq(advertisementsSchema.position, position));
      }
      if (isActive !== undefined) {
        conditions.push(eq(advertisementsSchema.isActive, isActive));
      }

      // 允许的排序字段
      const allowedSortFields = {
        title: advertisementsSchema.title,
        sortOrder: advertisementsSchema.sortOrder,
        createdAt: advertisementsSchema.createdAt,
        updatedAt: advertisementsSchema.updatedAt,
      };

      // 确定排序字段和方向
      const sortFields =
        allowedSortFields[sortBy as keyof typeof allowedSortFields] ||
        advertisementsSchema.sortOrder;
      const sortOrderValue =
        sortOrder === 'desc' ? desc(sortFields) : asc(sortFields);

      // 构建查询
      const queryBuilder = db
        .select()
        .from(advertisementsSchema)
        .orderBy(sortOrderValue);

      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
      }

      // 分页
      const offset = (page - 1) * pageSize;
      const advertisements = await queryBuilder.limit(pageSize).offset(offset);

      // 获取总数
      const totalQueryBuilder = db
        .select({ count: count() })
        .from(advertisementsSchema);

      if (conditions.length > 0) {
        totalQueryBuilder.where(and(...conditions));
      }

      const [{ count: total }] = await totalQueryBuilder;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: advertisements,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('获取广告列表失败:', error);
      throw new Error('获取广告列表失败');
    }
  }

  /**
   * 获取Banner广告
   */
  async getBannerAdvertisements(position?: string) {
    try {
      const conditions = [
        eq(advertisementsSchema.type, 'banner'),
        eq(advertisementsSchema.isActive, true)
      ];

      if (position) {
        conditions.push(eq(advertisementsSchema.position, position));
      }

      const banners = await db
        .select()
        .from(advertisementsSchema)
        .where(and(...conditions))
        .orderBy(asc(advertisementsSchema.sortOrder));

      return banners;
    } catch (error) {
      console.error('获取Banner广告失败:', error);
      throw new Error('获取Banner广告失败');
    }
  }

  /**
   * 获取轮播图广告
   */
  async getCarouselAdvertisements() {
    try {
      const carousels = await db
        .select()
        .from(advertisementsSchema)
        .where(
          and(
            eq(advertisementsSchema.type, 'carousel'),
            eq(advertisementsSchema.isActive, true)
          )
        )
        .orderBy(asc(advertisementsSchema.sortOrder));

      return carousels;
    } catch (error) {
      console.error('获取轮播图广告失败:', error);
      throw new Error('获取轮播图广告失败');
    }
  }

  /**
   * 根据ID获取广告详情
   */
  async getAdvertisementById(id: number) {
    try {
      const advertisement = await db
        .select()
        .from(advertisementsSchema)
        .where(eq(advertisementsSchema.id, id))
        .limit(1);

      if (advertisement.length === 0) {
        throw new Error('广告不存在');
      }

      return advertisement[0];
    } catch (error) {
      console.error('获取广告详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建广告
   */
  async createAdvertisement(data: CreateAdvertisementDto) {
    try {
      // 设置默认值
      const advertisementData = {
        ...data,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      };

      const result = await db.insert(advertisementsSchema).values(advertisementData).returning();
      return result[0];
    } catch (error) {
      console.error('创建广告失败:', error);
      throw new Error('创建广告失败');
    }
  }

  /**
   * 更新广告
   */
  async updateAdvertisement(id: number, data: UpdateAdvertisementDto) {
    try {
      // 准备更新数据，添加更新时间
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await db.update(advertisementsSchema)
        .set(updateData)
        .where(eq(advertisementsSchema.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error('广告不存在');
      }

      return result[0];
    } catch (error) {
      console.error('更新广告失败:', error);
      throw error;
    }
  }

  /**
   * 删除广告
   */
  async deleteAdvertisement(id: number) {
    try {
      const result = await db.delete(advertisementsSchema)
        .where(eq(advertisementsSchema.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error('广告不存在');
      }

      return result[0];
    } catch (error) {
      console.error('删除广告失败:', error);
      throw error;
    }
  }

  /**
   * 切换广告状态
   */
  async toggleAdvertisementStatus(id: number) {
    try {
      // 先获取当前状态
      const current = await db.select({ isActive: advertisementsSchema.isActive })
        .from(advertisementsSchema)
        .where(eq(advertisementsSchema.id, id))
        .limit(1);

      if (current.length === 0) {
        throw new Error('广告不存在');
      }

      const newStatus = !current[0].isActive;

      const result = await db.update(advertisementsSchema)
        .set({
          isActive: newStatus,
          updatedAt: new Date()
        })
        .where(eq(advertisementsSchema.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('切换广告状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取激活的广告
   */
  async getActiveAdvertisements(type?: string, position?: string) {
    try {
      const conditions = [eq(advertisementsSchema.isActive, true)];

      if (type) {
        conditions.push(eq(advertisementsSchema.type, type));
      }
      if (position) {
        conditions.push(eq(advertisementsSchema.position, position));
      }

      const advertisements = await db
        .select()
        .from(advertisementsSchema)
        .where(and(...conditions))
        .orderBy(asc(advertisementsSchema.sortOrder));

      return advertisements;
    } catch (error) {
      console.error('获取激活广告失败:', error);
      throw new Error('获取激活广告失败');
    }
  }

  /**
   * 更新广告排序
   */
  async updateAdvertisementSort(id: number, data: UpdateSortRequest) {
    try {
      const result = await db.update(advertisementsSchema)
        .set({
          sortOrder: data.sortOrder,
          updatedAt: new Date()
        })
        .where(eq(advertisementsSchema.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error('广告不存在');
      }

      return result[0];
    } catch (error) {
      console.error('更新广告排序失败:', error);
      throw error;
    }
  }
}