// 图片管理服务

import {
	and,
	asc,
	desc,
	eq,
	getTableColumns,
	inArray,
	like,
	sql,
} from "drizzle-orm";
import { db } from "../../db/connection";
import { imagesTable, productImagesTable } from "../../db/models";

// 导入模型类型
import type {
	InsertImagesDto,
	ListImagesQueryDto,
	SelectImagesType,
	UpdateImagesDto,
} from "../../types";
import {
	CustomeError,
	handleDatabaseError,
	InternalServerError,
	NotFoundError,
} from "../../utils/error/customError";
import { commonRes } from "../../utils/Res";
import { ossService } from "../oss";

export class ImageService {
	static readonly table = imagesTable;

	/**
	 * 创建图片记录
	 */
	async create(data: InsertImagesDto): Promise<SelectImagesType> {
		try {
			const imageData = {
				...data,
				createdAt: new Date(),
			};

			const result = await db
				.insert(ImageService.table)
				.values(imageData)
				.returning();

			return result[0];
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
				limit = 12,
				sort = "createdAt",
				sortOrder = "desc",
				search,
				category,
				mimeType,
				filename,
			} = query;

			// 构建查询条件数组
			const conditions: any[] = [];

			// 处理搜索条件
			if (search) {
				conditions.push(like(ImageService.table.fileName, `%${search}%`));
			}

			// 处理分类过滤
			if (category) {
				conditions.push(eq(ImageService.table.category, category));
			}

			// 处理文件类型过滤
			if (mimeType) {
				conditions.push(eq(ImageService.table.mimeType, mimeType));
			}

			// 处理文件名过滤
			if (filename) {
				conditions.push(like(ImageService.table.fileName, `%${filename}%`));
			}

			// 合并所有条件
			const whereCondition =
				conditions.length > 0 ? and(...conditions) : undefined;

			// 处理排序
			const sortFieldMap: Record<string, any> = {
				id: ImageService.table.id,
				fileName: ImageService.table.fileName,
				category: ImageService.table.category,
				fileSize: ImageService.table.fileSize,
				mimeType: ImageService.table.mimeType,
				createdAt: ImageService.table.createdAt,
				updatedAt: ImageService.table.updatedAt,
			};

			const sortField = sortFieldMap[sort] || ImageService.table.createdAt;
			const orderDirection = sortOrder === "desc" ? desc : asc;

			// 计算偏移量
			const offset = (page - 1) * limit;

			// 并行执行数据查询和计数查询
			const [data, totalResult] = await Promise.all([
				db
					.select()
					.from(ImageService.table)
					.where(whereCondition)
					.orderBy(orderDirection(sortField))
					.limit(limit)
					.offset(offset),

				db
					.select({ count: sql`count(*)` })
					.from(ImageService.table)
					.where(whereCondition),
			]);

			const total = Number(totalResult[0]?.count || 0);
			const totalPages = Math.ceil(total / limit);

			return {
				items: data,
				meta: {
					total,
					page,
					limit,
					totalPages,
				},
			};
		} catch (error) {
			console.error("获取图片列表失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据ID获取图片详情
	 */
	static async getById(id: number) {
		try {
			const [result] = await db
				.select()
				.from(ImageService.table)
				.where(eq(ImageService.table.id, id))
				.limit(1);

			return result || null;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 更新图片信息
	 */
	static async update(id: number, data: UpdateImagesDto) {
		try {
			const [result] = await db
				.update(ImageService.table)
				.set(data)
				.where(eq(ImageService.table.id, id))
				.returning();

			return result;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 删除图片
	 */
	static async delete(id: number, tx?: typeof db): Promise<boolean> {
		try {
			const dbInstance = tx || db;

			const result = await dbInstance
				.delete(ImageService.table)
				.where(eq(ImageService.table.id, id))
				.returning({ id: ImageService.table.id });

			return result.length > 0;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 删除图片（包括OSS文件）
	 */
	static async deleteWithFile(id: number): Promise<boolean> {
		try {
			// 使用事务确保数据一致性
			return await db.transaction(async (tx) => {
				// 先获取图片信息
				const imageResult = await ImageService.getById(id);

				if (!imageResult) {
					throw new NotFoundError("图片不存在");
				}

				const imageUrl = imageResult.imageUrl;
				console.log("imageUrl:", imageUrl);

				// 从OSS删除文件
				const ossKey = imageUrl.replace(/^https?:\/\/[^/]+\//, ""); // 移除域名部分，保留完整路径
				console.log("ossKey:", ossKey);

				if (ossKey) {
					await ossService.deleteFile(ossKey);
				}

				// 删除数据库记录
				// @ts-ignore
				const deleteResult = await ImageService.delete(id, tx);

				if (!deleteResult) {
					throw new InternalServerError("删除图片记录失败");
				}

				return true;
			});
		} catch (error) {
			console.error("删除图片失败:", error);
			throw error;
		}
	}

	/**
	 * 批量删除图片
	 */
	static async deleteBatch(imageIds: number[]): Promise<number> {
		try {
			const result = await db
				.delete(ImageService.table)
				.where(inArray(ImageService.table.id, imageIds))
				.returning({ id: ImageService.table.id });

			return result.length;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 批量删除图片（包括OSS文件）
	 */
	static async deleteBatchWithFiles(imageIds: number[]): Promise<number> {
		try {
			if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
				throw new CustomeError("请提供有效的图片ID列表", 400);
			}

			// 获取所有图片信息
			const images = [];
			for (const id of imageIds) {
				const result = await ImageService.getById(id);
				if (result) {
					images.push(result);
				}
			}

			// 从OSS批量删除文件
			const ossKeys = images
				.map((img) => img.imageUrl.replace(/^https?:\/\/[^/]+\//, ""))
				.filter(Boolean);

			if (ossKeys.length > 0) {
				try {
					await Promise.all(ossKeys.map((key) => ossService.deleteFile(key!)));
				} catch (ossError) {
					console.warn("OSS批量删除失败:", ossError);
					// 继续删除数据库记录
				}
			}

			// 批量删除数据库记录
			const deleteResult = await ImageService.deleteBatch(imageIds);

			return deleteResult;
		} catch (error) {
			console.error("批量删除图片失败:", error);
			throw error;
		}
	}

	/**
	 * 根据分类查询图片
	 */
	static async findByCategory(category: string) {
		try {
			const result = await db
				.select()
				.from(ImageService.table)
				.where(eq(ImageService.table.category, category));

			return result;
		} catch (error) {
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 搜索图片
	 */
	static async searchImages(searchTerm: string) {
		try {
			const result = await db
				.select()
				.from(ImageService.table)
				.where(like(ImageService.table.fileName, `%${searchTerm}%`));

			return result;
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
				.leftJoin(imagesTable, eq(productImagesTable.imageId, imagesTable.id))
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
