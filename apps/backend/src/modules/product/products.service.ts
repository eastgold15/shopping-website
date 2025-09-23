import {
	type InsertProductDto,
	type ListProductQueryDto,
	productImagesTable,
	productsModel,
	productsTable,
	type SelectProductDetailVo,
	type SelectProductType,
	type UpdateProductDto,
} from "@backend/db/models/product.model";
import { skusTable } from "@backend/db/models/sku.model";
import {
	handleDatabaseError,
	NotFoundError,
} from "@backend/utils/error/customError";
import BaseService from "@backend/utils/services";
import { and, count, eq, like, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { SkusService } from "./skus.service";

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
	protected readonly tableName = "products";

	constructor() {
		super();
	}
	/**
	 * 创建商品
	 */
	static async create(data: InsertProductDto) {
		try {
			// 从数据中提取image_ids，其余数据用于创建商品
			// 精髓，将前端类型转为后端需要的类型
			const encode_date = productsModel.insertProductDto.decode(data);
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
				limit = 10,
				sort = "createdAt",
				sortOrder = "desc",
				search,
				categoryId,
				isActive,
				isFeatured,
			} = query;

			// 使用Drizzle ORM的关联查询功能
			const products = await db.query.productsTable.findMany({
				with: {
					category: true, // 关联查询分类信息
					productImages: {
						with: {
							image: true, // 关联查询图片信息
						},
					},
				},
				where: (products, { and, like, eq, or }) => {
					const conditions = [];

					// 搜索条件：支持商品名称、SKU和描述搜索
					if (search) {
						conditions.push(
							or(
								like(products.name, `%${search}%`),
								like(products.sku, `%${search}%`),
								like(products.description, `%${search}%`),
							),
						);
					}

					if (categoryId) {
						conditions.push(eq(products.categoryId, categoryId));
					}

					if (isActive !== undefined) {
						conditions.push(
							eq(products.isActive, isActive === true || isActive === true),
						);
					}

					if (isFeatured !== undefined) {
						conditions.push(
							eq(
								products.isFeatured,
								isFeatured === true || isFeatured === true,
							),
						);
					}

					return conditions.length > 0 ? and(...conditions) : undefined;
				},
				orderBy: (products, { asc, desc }) => {
					// 定义允许排序的字段（白名单）
					const sortFieldMap: Record<string, any> = {
						id: products.id,
						name: products.name,
						price: products.price,
						createdAt: products.createdAt,
						updatedAt: products.updatedAt,
					};

					const sortField = sortFieldMap[sort] || products.id;
					return sortOrder === "desc" ? desc(sortField) : asc(sortField);
				},
				limit: limit,
				offset: (page - 1) * limit,
			});

			// 构建计算总数的查询，考虑搜索条件
			const countQuery = db.select({ count: count() }).from(productsTable);

			// 搜索条件构建（用于总数查询）
			const whereConditions = [];
			if (search) {
				whereConditions.push(
					or(
						like(productsTable.name, `%${search}%`),
						like(productsTable.sku, `%${search}%`),
						like(productsTable.description, `%${search}%`),
					),
				);
			}

			if (categoryId) {
				whereConditions.push(eq(productsTable.categoryId, categoryId));
			}

			if (isActive !== undefined) {
				whereConditions.push(eq(productsTable.isActive, isActive === true));
			}

			if (isFeatured !== undefined) {
				whereConditions.push(eq(productsTable.isFeatured, isFeatured === true));
			}

			// 应用查询条件
			if (whereConditions.length > 0) {
				countQuery.where(and(...whereConditions));
			}

			// @ts-expect-error
			const totalResult = await countQuery;
			const total = Number(totalResult[0].count);

			// 转换数据格式，处理图片信息
			const formattedProducts = products.map((product) => {
				// 提取图片信息并排序（主图在前）
				const images = product.productImages
					.map((pi) => ({
						id: pi.image.id,
						url: pi.image.imageUrl,
						alt: pi.image.alt,
						isMain: pi.isMain,
					}))
					.sort((a, b) => {
						if (a.isMain && !b.isMain) return -1;
						if (!a.isMain && b.isMain) return 1;
						return 0;
					});

				const productData = {
					...product,
					categoryRef: {
						id: product.category?.id || 0,
						name: product.category?.name || "",
					},
					imageRef: images,
					// 移除嵌套的关联对象
					category: undefined,
					productImages: undefined,
				};

				// 使用 Zod 转换数据
				return productsModel.listProductRes.parse(productData);
			});

			return {
				items: formattedProducts,
				meta: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error("获取商品列表失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据ID获取商品详情（包含SKU信息）
	 */
	static async getById(id: number): Promise<SelectProductDetailVo> {
		try {
			// 使用Drizzle ORM的关联查询功能
			const product = await db.query.productsTable.findFirst({
				with: {
					category: true, // 关联查询分类信息
					productImages: {
						with: {
							image: true, // 关联查询图片信息
						},
					},
				},
				where: (products, { eq }) => eq(products.id, id),
			});

			if (!product) {
				throw new NotFoundError("商品不存在");
			}

			// 转换数据格式，处理图片信息
			const images = product.productImages
				.map((pi) => ({
					id: pi.image.id,
					url: pi.image.imageUrl,
					alt: pi.image.alt || "",
					isMain: pi.isMain || false,
				}))
				.sort((a, b) => {
					if (a.isMain && !b.isMain) return -1;
					if (!a.isMain && b.isMain) return 1;
					return 0;
				});

			// 获取商品的SKU信息
			const skus = await SkusService.getByProductId(id);

			const result: any = {
				...product,
				categoryName: product.category?.name || "",
				images,
				skus, // 添加SKU信息
				hasVariants: skus && skus.length > 0, // 添加是否有变体的标识
			};

			return result;
		} catch (error) {
			console.error("获取商品详情失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据slug获取商品详情
	 */
	static async getBySlug(slug: string) {
		try {
			// 由于商品表中没有slug字段，这个方法暂时不可用
			throw new NotFoundError("商品slug功能暂未实现");
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

			// 精髓，将前端类型转为后端需要的类型
			const encode_data = productsModel.updateProductDto.decode(data);
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

	/**
	 * 解析尺寸字段，提取多尺寸信息
	 */
	private static parseSizeFields(size: any) {
		const result: any = {};

		if (typeof size === "object") {
			// 如果size是对象，直接提取字段
			result.ukSize = size.ukSize || null;
			result.euSize = size.euSize || null;
			result.usSize = size.usSize || null;
		} else {
			// 如果size是字符串，尝试解析格式如 "UK:6,EU:39,US:7" 或单独的尺寸值
			const sizeStr = size.value || size.toString();

			// 尝试解析包含冒号的格式
			if (sizeStr.includes(":")) {
				const parts = sizeStr.split(",");
				parts.forEach((part: string) => {
					const [key, value] = part.split(":").map((s: string) => s.trim());
					switch (key.toUpperCase()) {
						case "UK":
							result.ukSize = value;
							break;
						case "EU":
							result.euSize = value;
							break;
						case "US":
							result.usSize = value;
							break;
					}
				});
			}
		}

		return result;
	}

	/**
	 * 批量创建SKU
	 * 根据颜色和尺寸组合自动生成所有SKU
	 */
	static async batchCreateSkus(data: any) {
		try {
			const {
				productId,
				colors,
				sizes,
				defaultPrice,
				defaultComparePrice,
				defaultCost,
				defaultStock,
				defaultWeight,
				skuCodePattern = "{productId}-{colorValue}-{sizeValue}",
			} = data;

			// 验证商品是否存在
			const product = await db.query.productsTable.findFirst({
				where: eq(productsTable.id, productId),
			});

			if (!product) {
				throw new NotFoundError("商品不存在");
			}

			// 生成所有SKU组合
			const skuCombinations: any[] = [];

			for (const color of colors) {
				for (const size of sizes) {
					// 生成SKU编码
					const skuCode = skuCodePattern
						.replace("{productId}", productId.toString())
						.replace("{colorName}", color.name)
						.replace("{colorValue}", color.value || color.name)
						.replace("{sizeName}", size.name)
						.replace("{sizeValue}", size.value || size.name);

					// 解析多尺寸字段
					const sizeFields = ProductsService.parseSizeFields(size);

					skuCombinations.push({
						productId,
						name: `${product.name} ${color.name} ${size.name}`,
						skuCode,
						colorName: color.name,
						colorValue: color.value || color.name,
						sizeName: size.name,
						sizeValue: size.value || size.name,
						ukSize: sizeFields.ukSize || null,
						euSize: sizeFields.euSize || null,
						usSize: sizeFields.usSize || null,
						price: defaultPrice,
						comparePrice: defaultComparePrice || null,
						cost: defaultCost || null,
						stock: defaultStock,
						weight: defaultWeight || null,
						isActive: true,
						sortOrder: 0,
					});
				}
			}

			// 使用事务批量创建SKU
			const createdSkus = await db.transaction(async (tx) => {
				const results = [];

				for (const skuData of skuCombinations) {
					try {
						const [newSku] = await tx
							.insert(skusTable)
							.values(skuData)
							.returning();
						results.push(newSku);
					} catch (error) {
						// 如果SKU编码重复，跳过并记录警告
						console.warn(`SKU编码重复，跳过创建: ${skuData.skuCode}`);
					}
				}

				return results;
			});

			return {
				createdCount: createdSkus.length,
				totalCombinations: skuCombinations.length,
				skus: createdSkus,
			};
		} catch (error) {
			console.error("批量创建SKU失败:", error);
			throw handleDatabaseError(error);
		}
	}
}
