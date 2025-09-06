import { Elysia } from "elysia";
import { eq, desc, asc, and, like, or, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { partnersSchema } from '../db/schema';
import { commonRes, pageRes } from '../plugins/Res';
import { partnersModel, type Partner } from './partners.model';

export const partnersRoute = new Elysia({ prefix: '/partners', tags: ['Partners'] })
    .model(partnersModel)
    // 获取所有合作伙伴（前台用）
    .get('/list', async () => {
        try {
            const partners = await db.select()
                .from(partnersSchema)
                .where(eq(partnersSchema.isActive, true))
                .orderBy(asc(partnersSchema.sortOrder));
            return commonRes(partners, 200, '获取合作伙伴列表成功');
        } catch (error) {
            console.error('获取合作伙伴列表失败:', error);
            return commonRes(null, 500, '获取合作伙伴列表失败');
        }
    }, {
        detail: {
            tags: ["Partners"],
            summary: "获取合作伙伴列表",
            description: '获取启用的合作伙伴列表，按排序权重排序',
        }
    })

    // 获取所有合作伙伴（管理后台用）
    .get('', async ({ query: { page, pageSize, sortBy, sortOrder, search, name, isActive } }) => {
        try {
            // 搜索条件构建
            const conditions = [];

            // search参数：使用or连接多个字段搜索
            if (search) {
                conditions.push(
                    or(
                        like(partnersSchema.name, `%${search}%`),
                        like(partnersSchema.description, `%${search}%`)
                    )
                );
            }
            // 独立的精确搜索条件
            if (name) {
                conditions.push(like(partnersSchema.name, `%${name}%`));
            }
            if (isActive !== undefined) {
                conditions.push(eq(partnersSchema.isActive, isActive));
            }

            // 构建where条件
            const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

            // 排序字段映射
            const sortFieldMap: Record<string, any> = {
                'name': partnersSchema.name,
                'sortOrder': partnersSchema.sortOrder,
                'createdAt': partnersSchema.createdAt,
                'updatedAt': partnersSchema.updatedAt
            };

            const sortField = sortFieldMap[sortBy || 'sortOrder'] || partnersSchema.sortOrder;
            const orderBy = sortOrder === 'desc' ? desc(sortField) : asc(sortField);

            // 计算总数
            const totalQuery = db.select({ count: sql`count(*)` })
                .from(partnersSchema);
            
            if (whereCondition) {
                totalQuery.where(whereCondition);
            }
            
            const [{ count }] = await totalQuery;
            const total = Number(count);

            // 分页查询
            const offset = ((page || 1) - 1) * (pageSize || 10);
            const dataQuery = db.select()
                .from(partnersSchema)
                .orderBy(orderBy)
                .limit(pageSize || 10)
                .offset(offset);
            
            if (whereCondition) {
                dataQuery.where(whereCondition);
            }
            
            const data = await dataQuery;

            return pageRes(data, total, page || 1, pageSize || 10, '获取合作伙伴列表成功');
        } catch (error) {
            console.error('获取合作伙伴列表失败:', error);
            return commonRes(null, 500, '获取合作伙伴列表失败');
        }
    }, {
        query: 'UnifiedQueryParams',
        detail: {
            tags: ["Partners"],
            summary: "获取合作伙伴列表（管理后台）",
            description: '获取合作伙伴列表，支持分页、搜索、排序',
        }
    })

    // 获取单个合作伙伴
    .get('/:id', async ({ params: { id } }) => {
        try {
            const partner = await db.select()
                .from(partnersSchema)
                .where(eq(partnersSchema.id, parseInt(id)))
                .limit(1);
            if (partner.length === 0) {
                return commonRes(null, 404, '合作伙伴不存在');
            }
            return commonRes(partner[0], 200, '获取合作伙伴详情成功');
        } catch (error) {
            console.error('获取合作伙伴详情失败:', error);
            return commonRes(null, 500, '获取合作伙伴详情失败');
        }
    }, {
        detail: {
            tags: ["Partners"],
            summary: "获取合作伙伴详情",
            description: '根据ID获取合作伙伴详情',
        }
    })

    // 创建合作伙伴
    .post('', async ({ body }) => {
        try {
            const [newPartner] = await db.insert(partnersSchema)
                .values({
                    ...body,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
                .returning();

            return commonRes(newPartner, 201, '创建合作伙伴成功');
        } catch (error) {
            console.error('创建合作伙伴失败:', error);
            return commonRes(null, 500, '创建合作伙伴失败');
        }
    }, {
        body: 'CreatePartnerDto',
        detail: {
            tags: ["Partners"],
            summary: "创建合作伙伴",
            description: '创建新的合作伙伴',
        }
    })

    // 更新合作伙伴
    .put('/:id', async ({ params: { id }, body }) => {
        try {
            const [updatedPartner] = await db.update(partnersSchema)
                .set({
                    ...body,
                    updatedAt: new Date()
                })
                .where(eq(partnersSchema.id, parseInt(id)))
                .returning();

            if (!updatedPartner) {
                return commonRes(null, 404, '合作伙伴不存在');
            }

            return commonRes(updatedPartner, 200, '更新合作伙伴成功');
        } catch (error) {
            console.error('更新合作伙伴失败:', error);
            return commonRes(null, 500, '更新合作伙伴失败');
        }
    }, {
        body: 'UpdatePartnerDto',
        detail: {
            tags: ["Partners"],
            summary: "更新合作伙伴",
            description: '更新合作伙伴信息',
        }
    })

    // 删除合作伙伴
    .delete('/:id', async ({ params: { id } }) => {
        try {
            await db.delete(partnersSchema)
                .where(eq(partnersSchema.id, parseInt(id)));

            return commonRes(null, 200, '删除合作伙伴成功');
        } catch (error) {
            console.error('删除合作伙伴失败:', error);
            return commonRes(null, 500, '删除合作伙伴失败');
        }
    }, {
        detail: {
            tags: ["Partners"],
            summary: "删除合作伙伴",
            description: '删除指定的合作伙伴',
        }
    })

    // 更新排序
    .patch('/:id/sort', async ({ params: { id }, body }) => {
        try {
            const [updatedPartner] = await db.update(partnersSchema)
                .set({
                    sortOrder: body.sortOrder,
                    updatedAt: new Date()
                })
                .where(eq(partnersSchema.id, parseInt(id)))
                .returning();

            if (!updatedPartner) {
                return commonRes(null, 404, '合作伙伴不存在');
            }

            return commonRes(updatedPartner, 200, '更新排序成功');
        } catch (error) {
            console.error('更新排序失败:', error);
            return commonRes(null, 500, '更新排序失败');
        }
    }, {
        body: 'UpdateSortRequest',
        detail: {
            tags: ["Partners"],
            summary: "更新合作伙伴排序",
            description: '更新合作伙伴的排序权重',
        }
    })

    // 切换启用状态
    .patch('/:id/toggle-active', async ({ params: { id } }) => {
        try {
            // 先获取当前状态
            const [currentPartner] = await db.select()
                .from(partnersSchema)
                .where(eq(partnersSchema.id, parseInt(id)))
                .limit(1);

            if (!currentPartner) {
                return commonRes(null, 404, '合作伙伴不存在');
            }

            // 切换状态
            const [updatedPartner] = await db.update(partnersSchema)
                .set({
                    isActive: !currentPartner.isActive,
                    updatedAt: new Date()
                })
                .where(eq(partnersSchema.id, parseInt(id)))
                .returning();

            return commonRes(updatedPartner, 200, '切换状态成功');
        } catch (error) {
            console.error('切换状态失败:', error);
            return commonRes(null, 500, '切换状态失败');
        }
    }, {
        detail: {
            tags: ["Partners"],
            summary: "切换合作伙伴启用状态",
            description: '切换合作伙伴的启用/禁用状态',
        }
    });