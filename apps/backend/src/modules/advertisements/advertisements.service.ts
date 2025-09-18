import type { UpdateSortDtoType } from "@backend/types";
import { and, asc, eq, getTableColumns, like, or } from "drizzle-orm";
import { db } from "../../db/connection";
import {
	type AdvertisementsListQueryDto,
	advertisementsTable,
	type InsertAdvertisementsDto,
	type UpdateAdvertisementsDto,
} from "../../db/models/advertisements.model";
import { imagesTable } from "../../db/models/images.model";
import { NotFoundError } from "../../utils/error/customError";
import { paginate } from "../../utils/services/pagination";

/**
 * 广告服务类
 * 处理广告相关的业务逻辑
 */
export class AdvertisementsService {
	private readonly columns = getTableColumns(advertisementsTable);
	/**
	 * 获取广告列表（分页）- 使用统一的分页函数
	 */
	async getAdvertisementList(params: AdvertisementsListQueryDto) {
		try {
			const {
				page = 1,
				pageSize = 10,
				sortBy = "sortOrder",
				sortOrder = "asc",
				search,
				type,
				position,
				isActive,
			} = params;

			const { image_id, ...rest } = this.columns;
			// 构建基础查询
			let baseQuery = db
				.select({
					imageUrl: imagesTable.imageUrl,
					...rest,
				})
				.from(advertisementsTable)
				.leftJoin(imagesTable, eq(advertisementsTable.image_id, imagesTable.id))
				.$dynamic();

			console.log("111");

			// 搜索条件：支持标题和链接搜索
			const conditions = [];
			if (search) {
				conditions.push(
					or(
						like(advertisementsTable.title, `%${search}%`),
						like(advertisementsTable.link, `%${search}%`),
					),
				);
			}
			if (type) {
				conditions.push(eq(advertisementsTable.type, type));
			}
			if (position) {
				conditions.push(eq(advertisementsTable.position, position));
			}
			if (isActive !== undefined) {
				conditions.push(eq(advertisementsTable.isActive, isActive));
			}

			// 应用查询条件
			if (conditions.length > 0) {
				baseQuery = baseQuery.where(and(...conditions));
			}

			// 允许的排序字段
			const allowedSortFields = {
				title: advertisementsTable.title,
				sortOrder: advertisementsTable.sortOrder,
				createdAt: advertisementsTable.createdAt,
				updatedAt: advertisementsTable.updatedAt,
			};

			// 确定排序字段和方向
			const orderBy =
				allowedSortFields[sortBy as keyof typeof allowedSortFields] ||
				advertisementsTable.sortOrder;
			const orderDirection = sortOrder as "asc" | "desc";

			// 使用统一的分页函数
			return await paginate(db, baseQuery, {
				page,
				pageSize,
				orderBy,
				orderDirection,
			});
		} catch (error) {
			console.error("获取广告列表失败:", error);
			throw new Error("获取广告列表失败");
		}
	}

	/**
	 * 获取Banner广告
	 */
	async getBannerAdvertisements(position?: string) {
		try {
			const conditions = [
				eq(advertisementsTable.type, "banner"),
				eq(advertisementsTable.isActive, true),
			];

			if (position) {
				conditions.push(eq(advertisementsTable.position, position));
			}

			const banners = await db
				.select()
				.from(advertisementsTable)
				.where(and(...conditions))
				.orderBy(asc(advertisementsTable.sortOrder));

			return banners;
		} catch (error) {
			console.error("获取Banner广告失败:", error);
			throw new Error("获取Banner广告失败");
		}
	}

	/**
	 * 获取轮播图广告
	 */
	async getCarouselAdvertisements() {
		try {
			const carousels = await db
				.select()
				.from(advertisementsTable)
				.where(
					and(
						eq(advertisementsTable.type, "carousel"),
						eq(advertisementsTable.isActive, true),
					),
				)
				.orderBy(asc(advertisementsTable.sortOrder));

			return carousels;
		} catch (error) {
			console.error("获取轮播图广告失败:", error);
			throw new Error("获取轮播图广告失败");
		}
	}

	/**
	 * 根据ID获取广告详情
	 */
	async getAdvertisementById(id: number) {
		const [advertisement] = await db
			.select({
				...this.columns,
				image: imagesTable.imageUrl,
			})
			.from(advertisementsTable)
			.leftJoin(imagesTable, eq(advertisementsTable.image_id, imagesTable.id))
			.where(eq(advertisementsTable.id, id))
			.limit(1);

		if (!advertisement) {
			throw new NotFoundError("广告不存在", "com");
		}
		return advertisement;
	}

	/**
	 * 创建广告
	 */
	async createAdvertisement(data: InsertAdvertisementsDto) {
		// 设置默认值
		const advertisementData = {
			...data,
			startDate: data.startDate ? new Date(data.startDate) : new Date(),
			endDate: data.endDate ? new Date(data.endDate) : new Date(),
			sortOrder: data.sortOrder ?? 0,
			isActive: data.isActive ?? true,
		};

		const [newAd] = await db
			.insert(advertisementsTable)
			.values(advertisementData)
			.returning();
		if (!newAd) {
			throw new Error("创建广告失败,");
		}
		return newAd;
	}

	/**
	 * 更新广告
	 */
	async updateAdvertisement(id: number, data: UpdateAdvertisementsDto) {
		try {
			// 准备更新数据，添加更新时间
			const updateData = {
				...data,
				startDate: data.startDate ? new Date(data.startDate) : new Date(),
				endDate: data.endDate ? new Date(data.endDate) : new Date(),
				updatedAt: new Date(),
			};

			const result = await db
				.update(advertisementsTable)
				.set(updateData)
				.where(eq(advertisementsTable.id, id))
				.returning();

			if (result.length === 0) {
				throw new Error("广告不存在");
			}

			return result[0];
		} catch (error) {
			console.error("更新广告失败:", error);
			throw error;
		}
	}

	/**
	 * 删除广告
	 */
	async deleteAdvertisement(id: number) {
		try {
			const result = await db
				.delete(advertisementsTable)
				.where(eq(advertisementsTable.id, id))
				.returning();

			if (result.length === 0) {
				throw new Error("广告不存在");
			}

			return result[0];
		} catch (error) {
			console.error("删除广告失败:", error);
			throw error;
		}
	}

	/**
	 * 切换广告状态
	 */
	async toggleAdvertisementStatus(id: number) {
		try {
			// 先获取当前状态
			const current = await db
				.select({ isActive: advertisementsTable.isActive })
				.from(advertisementsTable)
				.where(eq(advertisementsTable.id, id))
				.limit(1);

			if (current.length === 0) {
				throw new Error("广告不存在");
			}

			const newStatus = !current[0].isActive;

			const result = await db
				.update(advertisementsTable)
				.set({
					isActive: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(advertisementsTable.id, id))
				.returning();

			return result[0];
		} catch (error) {
			console.error("切换广告状态失败:", error);
			throw error;
		}
	}

	/**
	 * 获取激活的广告
	 */
	async getActiveAdvertisements(position?: string) {
		try {
			const conditions = [eq(advertisementsTable.isActive, true)];

			if (position) {
				conditions.push(eq(advertisementsTable.position, position));
			}

			const advertisements = await db
				.select()
				.from(advertisementsTable)
				.where(and(...conditions))
				.orderBy(asc(advertisementsTable.sortOrder));

			return advertisements;
		} catch (error) {
			console.error("获取激活广告失败:", error);
			throw new Error("获取激活广告失败");
		}
	}

	/**
	 * 更新广告排序
	 */
	async updateAdvertisementSort(id: number, data: UpdateSortDtoType) {
		try {
			const result = await db
				.update(advertisementsTable)
				.set({
					sortOrder: data.sortOrder,
					updatedAt: new Date(),
				})
				.where(eq(advertisementsTable.id, id))
				.returning();

			if (result.length === 0) {
				throw new Error("广告不存在");
			}

			return result[0];
		} catch (error) {
			console.error("更新广告排序失败:", error);
			throw error;
		}
	}
}
