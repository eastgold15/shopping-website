import { Elysia, t } from "elysia";
import { eq, desc, asc, and, or, sql, ilike, count } from 'drizzle-orm';
import { db } from '../db/connection';
import { ordersSchema, orderItemsSchema, refundsSchema, productsSchema } from '../db/schema';
import { commonRes, pageRes } from '../plugins/Res';

// 订单状态枚举
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
} as const;

// 支付状态枚举
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
} as const;

// 退款状态枚举
const REFUND_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PROCESSED: 'processed'
} as const;

export const ordersRoute = new Elysia({ prefix: 'orders', tags: ['Orders'] })
    // 获取订单列表
    .get('/', async ({ query }) => {
        try {
            const page = query.page ? parseInt(query.page as string) : 1;
            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20;
            const status = query.status as string;
            const paymentStatus = query.paymentStatus as string;
            const customerEmail = query.customerEmail as string;
            const orderNumber = query.orderNumber as string;
            const sortBy = query.sortBy as string || 'createdAt';
            const sortOrder = query.sortOrder as string || 'desc';

            const offset = (page - 1) * pageSize;
            const conditions = [];

            // 筛选条件
            if (status) {
                conditions.push(eq(ordersSchema.status, status));
            }
            if (paymentStatus) {
                conditions.push(eq(ordersSchema.paymentStatus, paymentStatus));
            }
            if (customerEmail) {
                conditions.push(ilike(ordersSchema.customerEmail, `%${customerEmail}%`));
            }
            if (orderNumber) {
                conditions.push(ilike(ordersSchema.orderNumber, `%${orderNumber}%`));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // 排序
            let orderBy;
            if (sortBy === 'totalAmount') {
                orderBy = sortOrder === 'asc' ? asc(sql`CAST(${ordersSchema.totalAmount} AS DECIMAL)`) : desc(sql`CAST(${ordersSchema.totalAmount} AS DECIMAL)`);
            } else if (sortBy === 'customerName') {
                orderBy = sortOrder === 'asc' ? asc(ordersSchema.customerName) : desc(ordersSchema.customerName);
            } else {
                orderBy = sortOrder === 'asc' ? asc(ordersSchema.createdAt) : desc(ordersSchema.createdAt);
            }

            // 获取订单列表
            const dbOrders = await db
                .select({
                    id: ordersSchema.id,
                    orderNumber: ordersSchema.orderNumber,
                    customerName: ordersSchema.customerName,
                    customerEmail: ordersSchema.customerEmail,
                    customerPhone: ordersSchema.customerPhone,
                    subtotal: ordersSchema.subtotal,
                    shippingCost: ordersSchema.shippingCost,
                    taxAmount: ordersSchema.taxAmount,
                    discountAmount: ordersSchema.discountAmount,
                    totalAmount: ordersSchema.totalAmount,
                    currency: ordersSchema.currency,
                    status: ordersSchema.status,
                    paymentStatus: ordersSchema.paymentStatus,
                    paymentMethod: ordersSchema.paymentMethod,
                    trackingNumber: ordersSchema.trackingNumber,
                    shippingMethod: ordersSchema.shippingMethod,
                    createdAt: ordersSchema.createdAt,
                    updatedAt: ordersSchema.updatedAt
                })
                .from(ordersSchema)
                .where(whereClause)
                .orderBy(orderBy)
                .limit(pageSize)
                .offset(offset);

            // 获取总数
            const [{ count: total }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(ordersSchema)
                .where(whereClause);

            return pageRes({
                orders: dbOrders,
                total,
                page,
                pageSize: pageSize
            });
        } catch (error) {
            console.error('获取订单列表失败:', error);
            return commonRes(null, 500, '获取订单列表失败');
        }
    }, {
        query: t.Object({
            page: t.Optional(t.String()),
            pageSize: t.Optional(t.String()),
            status: t.Optional(t.String()),
            paymentStatus: t.Optional(t.String()),
            customerEmail: t.Optional(t.String()),
            orderNumber: t.Optional(t.String()),
            sortBy: t.Optional(t.String()),
            sortOrder: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '获取订单列表',
            description: '获取订单列表，支持分页、排序和筛选'
        }
    })

    // 根据ID获取订单详情
    .get('/:id', async ({ params: { id } }) => {
        try {
            // 获取订单基本信息
            const [dbOrder] = await db
                .select()
                .from(ordersSchema)
                .where(eq(ordersSchema.id, parseInt(id)));

            if (!dbOrder) {
                return commonRes(null, 404, '订单不存在');
            }

            // 获取订单项
            const orderItems = await db
                .select({
                    id: orderItemsSchema.id,
                    productId: orderItemsSchema.productId,
                    productName: orderItemsSchema.productName,
                    productSku: orderItemsSchema.productSku,
                    productImage: orderItemsSchema.productImage,
                    unitPrice: orderItemsSchema.unitPrice,
                    quantity: orderItemsSchema.quantity,
                    totalPrice: orderItemsSchema.totalPrice,
                    selectedColor: orderItemsSchema.selectedColor,
                    selectedSize: orderItemsSchema.selectedSize,
                    productOptions: orderItemsSchema.productOptions
                })
                .from(orderItemsSchema)
                .where(eq(orderItemsSchema.orderId, parseInt(id)));

            // 获取退款记录
            const refunds = await db
                .select()
                .from(refundsSchema)
                .where(eq(refundsSchema.orderId, parseInt(id)))
                .orderBy(desc(refundsSchema.createdAt));

            return commonRes({
                ...dbOrder,
                items: orderItems,
                refunds
            });
        } catch (error) {
            console.error('获取订单详情失败:', error);
            return commonRes(null, 500, '获取订单详情失败');
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            tags: ['Orders'],
            summary: '获取订单详情',
            description: '根据订单ID获取订单详细信息，包括订单项和退款记录'
        }
    })

    // 更新订单状态
    .patch('/:id/status', async ({ params: { id }, body }) => {
        try {
            const { status, notes } = body;

            // 验证状态值
            const validStatuses = Object.values(ORDER_STATUS);
            if (!validStatuses.includes(status as any)) {
                return commonRes(null, 400, '无效的订单状态');
            }

            // 更新订单状态
            const [updatedOrder] = await db
                .update(ordersSchema)
                .set({
                    status,
                    notes: notes || null,
                    updatedAt: new Date()
                })
                .where(eq(ordersSchema.id, parseInt(id)))
                .returning();

            if (!updatedOrder) {
                return commonRes(null, 404, '订单不存在');
            }

            return commonRes(updatedOrder, 200, '订单状态更新成功');
        } catch (error) {
            console.error('更新订单状态失败:', error);
            return commonRes(null, 500, '更新订单状态失败');
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            status: t.String(),
            notes: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '更新订单状态',
            description: '更新指定订单的状态'
        }
    })

    // 更新订单物流信息
    .patch('/:id/shipping', async ({ params: { id }, body }) => {
        try {
            const { trackingNumber, shippingMethod } = body;

            const [updatedOrder] = await db
                .update(ordersSchema)
                .set({
                    trackingNumber,
                    shippingMethod,
                    status: 'shipped', // 添加物流信息时自动更新为已发货
                    updatedAt: new Date()
                })
                .where(eq(ordersSchema.id, parseInt(id)))
                .returning();

            if (!updatedOrder) {
                return commonRes(null, 404, '订单不存在');
            }

            return commonRes(updatedOrder, 200, '物流信息更新成功');
        } catch (error) {
            console.error('更新物流信息失败:', error);
            return commonRes(null, 500, '更新物流信息失败');
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            trackingNumber: t.String(),
            shippingMethod: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '更新订单物流信息',
            description: '更新指定订单的物流跟踪信息'
        }
    })

    // 获取退款列表
    .get('/refunds', async ({ query }) => {
        try {
            const page = query.page ? parseInt(query.page as string) : 1;
            const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20;
            const status = query.status as string;
            const orderId = query.orderId as string;

            const offset = (page - 1) * pageSize;
            const conditions = [];

            if (status) {
                conditions.push(eq(refundsSchema.status, status));
            }
            if (orderId) {
                conditions.push(eq(refundsSchema.orderId, parseInt(orderId)));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // 获取退款列表，关联订单信息
            const dbRefunds = await db
                .select({
                    id: refundsSchema.id,
                    orderId: refundsSchema.orderId,
                    orderNumber: ordersSchema.orderNumber,
                    customerName: ordersSchema.customerName,
                    customerEmail: ordersSchema.customerEmail,
                    refundNumber: refundsSchema.refundNumber,
                    amount: refundsSchema.amount,
                    reason: refundsSchema.reason,
                    status: refundsSchema.status,
                    refundMethod: refundsSchema.refundMethod,
                    processedAt: refundsSchema.processedAt,
                    notes: refundsSchema.notes,
                    createdAt: refundsSchema.createdAt,
                    updatedAt: refundsSchema.updatedAt
                })
                .from(refundsSchema)
                .leftJoin(ordersSchema, eq(refundsSchema.orderId, ordersSchema.id))
                .where(whereClause)
                .orderBy(desc(refundsSchema.createdAt))
                .limit(pageSize)
                .offset(offset);

            // 获取总数
            const [{ count: total }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(refundsSchema)
                .where(whereClause);

            return pageRes({
                refunds: dbRefunds,
                total,
                page,
                pageSize: pageSize
            });
        } catch (error) {
            console.error('获取退款列表失败:', error);
            return commonRes(null, 500, '获取退款列表失败');
        }
    }, {
        query: t.Object({
            page: t.Optional(t.String()),
            pageSize: t.Optional(t.String()),
            status: t.Optional(t.String()),
            orderId: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '获取退款列表',
            description: '获取退款申请列表，支持分页和筛选'
        }
    })

    // 创建退款申请
    .post('/:id/refunds', async ({ params: { id }, body }) => {
        try {
            const { amount, reason, refundMethod } = body;

            // 检查订单是否存在
            const [order] = await db
                .select()
                .from(ordersSchema)
                .where(eq(ordersSchema.id, parseInt(id)));

            if (!order) {
                return commonRes(null, 404, '订单不存在');
            }

            // 生成退款单号
            const refundNumber = `RF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            // 创建退款记录
            const [newRefund] = await db
                .insert(refundsSchema)
                .values({
                    orderId: parseInt(id),
                    refundNumber,
                    amount,
                    reason,
                    refundMethod,
                    status: REFUND_STATUS.PENDING
                })
                .returning();

            return commonRes(newRefund, 201, '退款申请创建成功');
        } catch (error) {
            console.error('创建退款申请失败:', error);
            return commonRes(null, 500, '创建退款申请失败');
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            amount: t.String(),
            reason: t.String(),
            refundMethod: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '创建退款申请',
            description: '为指定订单创建退款申请'
        }
    })

    // 处理退款申请
    .patch('/refunds/:refundId', async ({ params: { refundId }, body }) => {
        try {
            const { status, notes } = body;

            // 验证退款状态
            const validStatuses = Object.values(REFUND_STATUS);
            if (!validStatuses.includes(status as any)) {
                return commonRes(null, 400, '无效的退款状态');
            }

            const updateData: any = {
                status,
                notes: notes || null,
                updatedAt: new Date()
            };

            // 如果状态为已处理，记录处理时间
            if (status === REFUND_STATUS.PROCESSED) {
                updateData.processedAt = new Date();
            }

            const [updatedRefund] = await db
                .update(refundsSchema)
                .set(updateData)
                .where(eq(refundsSchema.id, parseInt(refundId)))
                .returning();

            if (!updatedRefund) {
                return commonRes(null, 404, '退款申请不存在');
            }

            // 如果退款已处理，更新订单支付状态
            if (status === REFUND_STATUS.PROCESSED) {
                await db
                    .update(ordersSchema)
                    .set({
                        paymentStatus: PAYMENT_STATUS.REFUNDED,
                        updatedAt: new Date()
                    })
                    .where(eq(ordersSchema.id, updatedRefund.orderId));
            }

            return commonRes(updatedRefund, 200, '退款状态更新成功');
        } catch (error) {
            console.error('处理退款申请失败:', error);
            return commonRes(null, 500, '处理退款申请失败');
        }
    }, {
        params: t.Object({
            refundId: t.String()
        }),
        body: t.Object({
            status: t.String(),
            notes: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '处理退款申请',
            description: '更新退款申请的状态'
        }
    })

    // 获取订单统计信息
    .get('/statistics', async ({ query }) => {
        try {
            const startDate = query.startDate as string;
            const endDate = query.endDate as string;

            const conditions = [];
            if (startDate) {
                conditions.push(sql`${ordersSchema.createdAt} >= ${startDate}`);
            }
            if (endDate) {
                conditions.push(sql`${ordersSchema.createdAt} <= ${endDate}`);
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // 订单总数和总金额
            const [orderStats] = await db
                .select({
                    totalOrders: sql<number>`count(*)`,
                    totalAmount: sql<string>`sum(CAST(${ordersSchema.totalAmount} AS DECIMAL))`,
                    avgOrderValue: sql<string>`avg(CAST(${ordersSchema.totalAmount} AS DECIMAL))`
                })
                .from(ordersSchema)
                .where(whereClause);

            // 按状态统计
            const statusStats = await db
                .select({
                    status: ordersSchema.status,
                    count: sql<number>`count(*)`
                })
                .from(ordersSchema)
                .where(whereClause)
                .groupBy(ordersSchema.status);

            // 按支付状态统计
            const paymentStats = await db
                .select({
                    paymentStatus: ordersSchema.paymentStatus,
                    count: sql<number>`count(*)`
                })
                .from(ordersSchema)
                .where(whereClause)
                .groupBy(ordersSchema.paymentStatus);

            return commonRes({
                orderStats,
                statusStats,
                paymentStats
            });
        } catch (error) {
            console.error('获取订单统计失败:', error);
            return commonRes(null, 500, '获取订单统计失败');
        }
    }, {
        query: t.Object({
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String())
        }),
        detail: {
            tags: ['Orders'],
            summary: '获取订单统计信息',
            description: '获取订单的统计数据，包括总数、金额、状态分布等'
        }
    });