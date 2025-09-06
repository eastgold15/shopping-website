import { Elysia } from "elysia";
import { eq, desc, asc, and, or, sql, ilike, like, count } from 'drizzle-orm';
import { db } from '../db/connection';
import { productsSchema, categoriesSchema } from '../db/schema';
import { commonRes, pageRes } from '../plugins/Res';
import { productsModel } from './products.model';

export const productsRoute = new Elysia({ prefix: 'products', tags: ['Products'] })
    .model(productsModel)
    .guard({
        transform({ body }) {


            console.log(body)
            // 处理parentId：如果是对象格式{"key":true}，提取key作为parentId
            if (body.parentId) {
                if (typeof body.parentId === 'object' && body.parentId !== null) {
                    // 从对象中提取第一个key作为parentId
                    const keys = Object.keys(body.parentId);
                    if (keys.length > 0) {
                        body.parentId = parseInt(keys[0]);
                    }
                } else {
                    body.parentId = parseInt(body.parentId.toString());
                }
            }

            body.price = '' + body.price
            body.comparePrice = '' + body.comparePrice
            body.cost = '' + body.cost
            body.weight = '' + body.weight
        }

    }, (app) => app
        // 创建商品
        .post('/', async ({ body }) => {
            try {
                const productData = {
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    shortDescription: body.shortDescription,
                    price: body.price,
                    comparePrice: body.comparePrice,
                    cost: body.cost,
                    sku: body.sku,
                    barcode: body.barcode,
                    weight: body.weight,
                    dimensions: body.dimensions,
                    images: body.images,
                    videos: body.videos,
                    colors: body.colors,
                    sizes: body.sizes,
                    materials: body.materials,
                    careInstructions: body.careInstructions,
                    features: body.features,
                    specifications: body.specifications,
                    categoryId: body.categoryId,
                    stock: body.stock,
                    minStock: body.minStock,
                    isActive: body.isActive,
                    isFeatured: body.isFeatured,
                    metaTitle: body.metaTitle,
                    metaDescription: body.metaDescription,
                    metaKeywords: body.metaKeywords
                };

                const [newProduct] = await db
                    .insert(productsSchema)
                    .values(productData)
                    .returning();

                return commonRes(newProduct, 201, '商品创建成功');
            } catch (error) {
                console.error('创建商品失败:', error);
                if (error.code === '23505') { // 唯一约束违反
                    if (error.constraint?.includes('slug')) {
                        return commonRes(null, 400, 'URL标识符已存在');
                    }
                    if (error.constraint?.includes('sku')) {
                        return commonRes(null, 400, 'SKU已存在');
                    }
                }
                return commonRes(null, 500, '创建商品失败');
            }
        }, {
            body: 'CreateProductDto',
            detail: {
                tags: ['Products'],
                summary: '创建商品',
                description: '创建新的商品'
            }
        })
    )
    // 获取所有商品
    .get('/', async ({ query: { page, pageSize, sortBy, sortOrder, search, categoryId, isActive, isFeatured } }) => {
        try {
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

            // 允许的排序字段
            const allowedSortFields = {
                name: productsSchema.name,
                price: productsSchema.price,
                stock: productsSchema.stock,
                createdAt: productsSchema.createdAt,
                updatedAt: productsSchema.updatedAt
            };

            // 确定排序字段和方向
            const sortFields = allowedSortFields[sortBy as keyof typeof allowedSortFields] || productsSchema.createdAt;
            const sortOrderValue = sortOrder === 'asc' ? asc(sortFields) : desc(sortFields);

            // 构建查询
            const queryBuilder = db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(sortOrderValue);

            // 分页处理
            if (page && pageSize) {
                const offsetValue = ((Number(page) || 1) - 1) * pageSize;
                queryBuilder.limit(pageSize).offset(offsetValue);
            }

            // 执行查询
            const result = await queryBuilder;

            // 获取总数
            const total = await db
                .select({ value: count() })
                .from(productsSchema)
                .where(conditions.length > 0 ? and(...conditions) : undefined);

            // 返回结果
            return page
                ? pageRes(
                    result,
                    total[0]?.value || 0,
                    page,
                    pageSize,
                    "分页获取商品成功"
                )
                : commonRes(result, 200, "获取商品列表成功");
        } catch (error) {
            console.error('获取商品列表失败:', error);
            return commonRes(null, 500, '获取商品列表失败');
        }
    }, {
        query: 'ProductListQueryDto',
        detail: {
            tags: ['Products'],
            summary: '获取商品列表',
            description: '获取商品列表，支持分页、搜索和排序'
        }
    })

    // 根据ID获取商品详情
    .get('/:id', async ({ params: { id } }) => {
        try {
            const [dbProduct] = await db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(eq(productsSchema.id, parseInt(id)))
                .limit(1);

            if (!dbProduct) {
                return commonRes(null, 404, '商品不存在');
            }

            return commonRes(dbProduct, 200);
        } catch (error) {
            console.error('获取商品详情失败:', error);
            return commonRes(null, 500, '获取商品详情失败');
        }
    }, {
        params: 'IdParams',
        detail: {
            tags: ['Products'],
            summary: '根据ID获取商品详情',
            description: '根据商品ID获取商品的详细信息'
        }
    })

    // 根据slug获取商品详情
    .get('/slug/:slug', async ({ params: { slug } }) => {
        try {
            const [dbProduct] = await db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    features: productsSchema.features,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    // brand: productsSchema.brand, // 字段不存在
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(eq(productsSchema.slug, slug))
                .limit(1);

            if (!dbProduct) {
                return commonRes(null, 404, '商品不存在');
            }

            return commonRes(dbProduct, 200);
        } catch (error) {
            console.error('获取商品详情失败:', error);
            return commonRes(null, 500, '获取商品详情失败');
        }
    }, {
        params: 'SlugParams',
        detail: {
            tags: ['Products'],
            summary: '根据slug获取商品详情',
            description: '根据商品slug获取商品的详细信息'
        }
    })

    // 更新商品
    .put('/:id', async ({ params: { id }, body }) => {
        try {
            const updateData: any = {};

            // 只更新提供的字段
            if (body.name !== undefined) updateData.name = body.name;
            if (body.slug !== undefined) updateData.slug = body.slug;
            if (body.description !== undefined) updateData.description = body.description;
            if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
            if (body.price !== undefined) updateData.price = body.price;
            if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice;
            if (body.cost !== undefined) updateData.cost = body.cost;
            if (body.sku !== undefined) updateData.sku = body.sku;
            if (body.barcode !== undefined) updateData.barcode = body.barcode;
            if (body.weight !== undefined) updateData.weight = body.weight;
            if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
            if (body.images !== undefined) updateData.images = body.images;
            if (body.videos !== undefined) updateData.videos = body.videos;
            if (body.colors !== undefined) updateData.colors = body.colors;
            if (body.sizes !== undefined) updateData.sizes = body.sizes;
            if (body.materials !== undefined) updateData.materials = body.materials;
            if (body.careInstructions !== undefined) updateData.careInstructions = body.careInstructions;
            if (body.features !== undefined) updateData.features = body.features;
            if (body.specifications !== undefined) updateData.specifications = body.specifications;
            if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
            if (body.stock !== undefined) updateData.stock = body.stock;
            if (body.minStock !== undefined) updateData.minStock = body.minStock;
            if (body.isActive !== undefined) updateData.isActive = body.isActive;
            if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
            if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
            if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;
            if (body.metaKeywords !== undefined) updateData.metaKeywords = body.metaKeywords;

            // 添加更新时间
            updateData.updatedAt = new Date();

            const [updatedProduct] = await db
                .update(productsSchema)
                .set(updateData)
                .where(eq(productsSchema.id, parseInt(id)))
                .returning();

            if (!updatedProduct) {
                return commonRes(null, 404, '商品不存在');
            }

            return commonRes(updatedProduct, 200, '商品更新成功');
        } catch (error) {
            console.error('更新商品失败:', error);
            if (error.code === '23505') { // 唯一约束违反
                if (error.constraint?.includes('slug')) {
                    return commonRes(null, 400, 'URL标识符已存在');
                }
                if (error.constraint?.includes('sku')) {
                    return commonRes(null, 400, 'SKU已存在');
                }
            }
            return commonRes(null, 500, '更新商品失败');
        }
    }, {
        params: 'IdParams',
        body: 'UpdateProductDto',
        detail: {
            tags: ['Products'],
            summary: '更新商品',
            description: '根据商品ID更新商品信息'
        }
    })

    // 搜索商品
    .get('/search', async ({ query }) => {
        try {
            const searchQuery = query.q as string;
            const categoryId = query.categoryId as string;
            const minPrice = query.minPrice ? parseFloat(query.minPrice as string) : undefined;
            const maxPrice = query.maxPrice ? parseFloat(query.maxPrice as string) : undefined;
            const colors = query.colors ? (query.colors as string).split(',') : [];
            const sizes = query.sizes ? (query.sizes as string).split(',') : [];
            const features = query.features ? (query.features as string).split(',') : [];
            const isActive = query.isActive !== undefined ? query.isActive === 'true' : true;
            const isFeatured = query.isFeatured !== undefined ? query.isFeatured === 'true' : undefined;
            const sortBy = (query.sortBy as 'price' | 'name' | 'createdAt') || 'createdAt';
            const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';
            const page = query.page ? parseInt(query.page as string) : 1;
            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20;

            const offset = (page - 1) * pageSize;
            const conditions = [eq(productsSchema.isActive, isActive)];

            // 搜索条件
            if (searchQuery) {
                conditions.push(
                    or(
                        ilike(productsSchema.name, `%${searchQuery}%`),
                        ilike(productsSchema.description, `%${searchQuery}%`),
                        ilike(productsSchema.shortDescription, `%${searchQuery}%`)
                    )
                );
            }

            // 分类筛选
            if (categoryId) {
                conditions.push(eq(productsSchema.categoryId, parseInt(categoryId)));
            }

            // 价格范围筛选
            if (minPrice !== undefined) {
                conditions.push(sql`CAST(${productsSchema.price} AS DECIMAL) >= ${minPrice}`);
            }
            if (maxPrice !== undefined) {
                conditions.push(sql`CAST(${productsSchema.price} AS DECIMAL) <= ${maxPrice}`);
            }

            // 颜色筛选
            if (colors.length > 0) {
                const colorConditions = colors.map(color =>
                    sql`${productsSchema.colors} @> ${JSON.stringify([color])}`
                );
                conditions.push(or(...colorConditions));
            }

            // 尺寸筛选
            if (sizes.length > 0) {
                const sizeConditions = sizes.map(size =>
                    sql`${productsSchema.sizes} @> ${JSON.stringify([size])}`
                );
                conditions.push(or(...sizeConditions));
            }

            // 特性筛选
            if (features.length > 0) {
                const featureConditions = features.map(feature =>
                    sql`${productsSchema.features} @> ${JSON.stringify([feature])}`
                );
                conditions.push(or(...featureConditions));
            }

            // 推荐商品筛选
            if (isFeatured !== undefined) {
                conditions.push(eq(productsSchema.isFeatured, isFeatured));
            }

            const whereClause = and(...conditions);

            // 排序
            let orderBy;
            if (sortBy === 'price') {
                orderBy = sortOrder === 'asc' ? asc(sql`CAST(${productsSchema.price} AS DECIMAL)`) : desc(sql`CAST(${productsSchema.price} AS DECIMAL)`);
            } else if (sortBy === 'name') {
                orderBy = sortOrder === 'asc' ? asc(productsSchema.name) : desc(productsSchema.name);
            } else {
                orderBy = sortOrder === 'asc' ? asc(productsSchema.createdAt) : desc(productsSchema.createdAt);
            }

            // 获取商品列表
            const dbProducts = await db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    features: productsSchema.features,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(whereClause)
                .orderBy(orderBy)
                .limit(pageSize)
                .offset(offset);



            // 获取总数
            const total = await db
                .select({ value: count() })
                .from(productsSchema)
                .where(whereClause);

            return commonRes({
                products: dbProducts,
                total: count,
                page,
                pageSize,
                hasMore: offset + pageSize < count
            }, 200);
        } catch (error) {
            console.error('搜索商品失败:', error);
            return commonRes(null, 500, '搜索商品失败');
        }
    }, {
        query: 'ProductSearchQueryDto',
        detail: {
            tags: ['Products'],
            summary: '搜索商品',
            description: '根据关键词搜索商品，支持分页、排序和筛选'
        }
    })

    // 获取推荐商品
    .get('/featured', async ({ query }) => {
        try {
            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 8;

            const dbProducts = await db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    features: productsSchema.features,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    // brand: productsSchema.brand, // 字段不存在
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(and(
                    eq(productsSchema.isActive, true),
                    eq(productsSchema.isFeatured, true)
                ))
                .orderBy(desc(productsSchema.createdAt))
                .limit(pageSize);

            return commonRes(dbProducts, 200);
        } catch (error) {
            console.error('获取推荐商品失败:', error);
            return commonRes(null, 500, '获取推荐商品失败');
        }
    }, {
        query: 'RelatedProductsQueryDto',
        detail: {
            tags: ['Products'],
            summary: '获取推荐商品',
            description: '获取推荐的特色商品列表'
        }
    })

    // 获取相关商品
    .get('/:id/related', async ({ params: { id }, query }) => {
        try {
            // 先获取当前商品的分类信息
            const [currentProduct] = await db
                .select({ categoryId: productsSchema.categoryId })
                .from(productsSchema)
                .where(eq(productsSchema.id, parseInt(id)))
                .limit(1);

            if (!currentProduct || !currentProduct.categoryId) {
                return commonRes(null, 404, '商品不存在或无分类信息');
            }

            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 4;

            // 获取同分类的其他商品
            const dbProducts = await db
                .select({
                    id: productsSchema.id,
                    name: productsSchema.name,
                    slug: productsSchema.slug,
                    description: productsSchema.description,
                    shortDescription: productsSchema.shortDescription,
                    price: productsSchema.price,
                    comparePrice: productsSchema.comparePrice,
                    sku: productsSchema.sku,
                    stock: productsSchema.stock,
                    images: productsSchema.images,
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    features: productsSchema.features,
                    categoryId: productsSchema.categoryId,
                    categoryName: categoriesSchema.name,
                    isActive: productsSchema.isActive,
                    isFeatured: productsSchema.isFeatured,
                    weight: productsSchema.weight,
                    dimensions: productsSchema.dimensions,
                    materials: productsSchema.materials,
                    // brand: productsSchema.brand, // 字段不存在
                    metaTitle: productsSchema.metaTitle,
                    metaDescription: productsSchema.metaDescription,
                    metaKeywords: productsSchema.metaKeywords,
                    createdAt: productsSchema.createdAt,
                    updatedAt: productsSchema.updatedAt
                })
                .from(productsSchema)
                .leftJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
                .where(and(
                    eq(productsSchema.categoryId, currentProduct.categoryId),
                    eq(productsSchema.isActive, true),
                    sql`${productsSchema.id} != ${parseInt(id)}`
                ))
                .orderBy(desc(productsSchema.createdAt))
                .limit(pageSize);

            return commonRes(dbProducts, 200);
        } catch (error) {
            console.error('获取相关商品失败:', error);
            return commonRes(null, 500, '获取相关商品失败');
        }
    }, {
        query: 'RelatedProductsQueryDto',
        detail: {
            tags: ['Products'],
            summary: '获取相关商品',
            description: '根据商品ID获取同分类的相关商品'
        }
    })

    // 获取热门搜索关键词
    .get('/search/popular-terms', async ({ query }) => {
        try {
            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 10;

            // 从商品的标签和名称中提取热门搜索词
            const dbProducts = await db
                .select({
                    name: productsSchema.name,
                    tags: productsSchema.tags
                })
                .from(productsSchema)
                .where(eq(productsSchema.isActive, true));

            const termCounts = new Map<string, number>();

            dbProducts.forEach(product => {
                // 从商品名称中提取词汇
                const nameWords = product.name.toLowerCase().split(/\s+/);
                nameWords.forEach(word => {
                    if (word.length > 2) {
                        termCounts.set(word, (termCounts.get(word) || 0) + 2); // 名称权重更高
                    }
                });

                // 从标签中提取词汇
                if (product.tags && Array.isArray(product.tags)) {
                    product.tags.forEach((tag: string) => {
                        if (tag && tag.trim().length > 1) {
                            const cleanTag = tag.trim().toLowerCase();
                            termCounts.set(cleanTag, (termCounts.get(cleanTag) || 0) + 1);
                        }
                    });
                }
            });

            // 按频次排序并取前N个
            const sortedTerms = Array.from(termCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, pageSize)
                .map(([term]) => term);

            return commonRes(sortedTerms, 200);
        } catch (error) {
            console.error('获取热门搜索关键词失败:', error);
            return commonRes(null, 500, '获取热门搜索关键词失败');
        }
    }, {
        query: 'PopularTermsQueryDto',
        detail: {
            tags: ['Products'],
            summary: '获取热门搜索关键词',
            description: '获取基于商品数据的热门搜索关键词'
        }
    })

    // 获取商品筛选选项
    .get('/filter-options', async ({ query }) => {
        try {
            const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined;

            // 构建查询条件
            const conditions = [eq(productsSchema.isActive, true)];
            if (categoryId) {
                conditions.push(eq(productsSchema.categoryId, categoryId));
            }

            // 获取商品数据
            const dbProducts = await db
                .select({
                    colors: productsSchema.colors,
                    sizes: productsSchema.sizes,
                    tags: productsSchema.tags,
                    price: productsSchema.price
                })
                .from(productsSchema)
                .where(and(...conditions));

            // 提取唯一的颜色、尺寸、标签
            const colorsSet = new Set<string>();
            const sizesSet = new Set<string>();
            const tagsSet = new Set<string>();
            let minPrice = Infinity;
            let maxPrice = -Infinity;

            dbProducts.forEach(product => {
                // 处理颜色
                if (product.colors && Array.isArray(product.colors)) {
                    product.colors.forEach((color: string) => {
                        if (color && color.trim()) {
                            colorsSet.add(color.trim());
                        }
                    });
                }

                // 处理尺寸
                if (product.sizes && Array.isArray(product.sizes)) {
                    product.sizes.forEach((size: string) => {
                        if (size && size.trim()) {
                            sizesSet.add(size.trim());
                        }
                    });
                }

                // 处理标签
                if (product.tags && Array.isArray(product.tags)) {
                    product.tags.forEach((tag: string) => {
                        if (tag && tag.trim()) {
                            tagsSet.add(tag.trim());
                        }
                    });
                }

                // 处理价格范围
                if (product.price) {
                    const price = parseFloat(product.price.toString());
                    if (!isNaN(price)) {
                        minPrice = Math.min(minPrice, price);
                        maxPrice = Math.max(maxPrice, price);
                    }
                }
            });

            const options = {
                colors: Array.from(colorsSet).sort(),
                sizes: Array.from(sizesSet).sort(),
                tags: Array.from(tagsSet).sort(),
                priceRange: {
                    min: minPrice === Infinity ? 0 : minPrice,
                    max: maxPrice === -Infinity ? 0 : maxPrice
                }
            };

            return commonRes(options, 200);
        } catch (error) {
            console.error('获取筛选选项失败:', error);
            return commonRes(null, 500, '获取筛选选项失败');
        }
    }, {
        query: 'FilterOptionsQueryDto',
        detail: {
            tags: ['Products'],
            summary: '获取商品筛选选项',
            description: '获取商品的筛选选项，包括颜色、尺寸、标签和价格范围'
        }
    })