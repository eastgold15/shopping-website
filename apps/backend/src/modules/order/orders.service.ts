import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	ilike,
	sql,
} from "drizzle-orm";
import { db } from "../../db/connection";
import {
	orderItemsSchema,
	ordersSchema,
	refundsSchema,
} from "../../db/schema/schema";
import { NotFoundError } from "../../utils/errors";
import { UnoQuery } from "../../db/common.model";
import type { Order, NewOrder, OrderItem, Refund, NewRefund, OrderQuery, RefundQuery, StatisticsQuery, UpdateOrderStatusDto, UpdateShippingDto, CreateRefundDto, ProcessRefundDto } from "./orders.model";

// 订单状态枚举
export const ORDER_STATUS = {
	PENDING: "pending",
	CONFIRMED: "confirmed",
	PROCESSING: "processing",
	SHIPPED: "shipped",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
} as const;

// 支付状态枚举
export const PAYMENT_STATUS = {
	PENDING: "pending",
	PAID: "paid",
	FAILED: "failed",
	REFUNDED: "refunded",
} as const;

// 退款状态枚举
export const REFUND_STATUS = {
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
	PROCESSED: "processed",
} as const;

/**
 * 订单服务类
 * 处理订单相关的业务逻辑
 */
export class OrdersService {
	/**
	 * 获取订单列表（分页）
	 */
	async getList(query: OrderQuery) {
		try {
			const {
				page = 1,
				pageSize = 20,
				status,
				paymentStatus,
				customerEmail,
				orderNumber,
				sortBy = "createdAt",
				sortOrder = "desc",
			} = query;

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
				conditions.push(
					ilike(ordersSchema.customerEmail, `%${customerEmail}%`),
				);
			}
			if (orderNumber) {
				conditions.push(ilike(ordersSchema.orderNumber, `%${orderNumber}%`));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			// 排序
			let orderBy;
			if (sortBy === "totalAmount") {
				orderBy =
					sortOrder === "asc"
						? asc(sql`CAST(${ordersSchema.totalAmount} AS DECIMAL)`)
						: desc(sql`CAST(${ordersSchema.totalAmount} AS DECIMAL)`);
			} else if (sortBy === "customerName") {
				orderBy =
					sortOrder === "asc"
						? asc(ordersSchema.customerName)
						: desc(ordersSchema.customerName);
			} else {
				orderBy =
					sortOrder === "asc"
						? asc(ordersSchema.createdAt)
						: desc(ordersSchema.createdAt);
			}

			// 获取订单列表
			const orders = await db
				.select({
					...getTableColumns(ordersSchema),
				})
				.from(ordersSchema)
				.where(whereClause)
				.orderBy(orderBy)
				.limit(pageSize)
				.offset(offset);

			// 获取总数
			const totalQueryBuilder = db
				.select({ count: count() })
				.from(ordersSchema);

			if (whereClause) {
				totalQueryBuilder.where(whereClause);
			}

			const [{ count: total }] = await totalQueryBuilder;
			const totalPages = Math.ceil(total / pageSize);

			return {
				data: orders,
				pagination: {
					page,
					pageSize,
					total,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			console.error("获取订单列表失败:", error);
			throw new Error("获取订单列表失败");
		}
	}

	/**
	 * 根据ID获取订单详情
	 */
	async getOrderById(id: number) {
		try {
			// 获取订单基本信息
			const order = await db
				.select()
				.from(ordersSchema)
				.where(eq(ordersSchema.id, id))
				.limit(1);

			if (order.length === 0) {
				throw new NotFoundError("订单不存在");
			}

			// 获取订单项
			const orderItems = await db
				.select({
					id: orderItemsSchema.id,
					productId: orderItemsSchema.productId,
					productName: orderItemsSchema.productName,
					productSku: orderItemsSchema.productSku,
					quantity: orderItemsSchema.quantity,
					unitPrice: orderItemsSchema.unitPrice,
					totalPrice: orderItemsSchema.totalPrice,
					productImage: orderItemsSchema.productImage,
				})
				.from(orderItemsSchema)
				.where(eq(orderItemsSchema.orderId, id));

			// 获取退款记录
			const refunds = await db
				.select()
				.from(refundsSchema)
				.where(eq(refundsSchema.orderId, id))
				.orderBy(desc(refundsSchema.createdAt));

			return {
				...order[0],
				orderItems,
				refunds,
			};
		} catch (error) {
			console.error("获取订单详情失败:", error);
			throw error;
		}
	}

	/**
	 * 更新订单状态
	 */
	async updateStatus(id: number, data: UpdateOrderStatusDto): Promise<Order> {
		try {
			const updateData: any = {
				status: data.status,
				updatedAt: new Date(),
			};

			if (data.notes) {
				updateData.notes = data.notes;
			}

			const result = await db
				.update(ordersSchema)
				.set(updateData)
				.where(eq(ordersSchema.id, id))
				.returning();

			if (result.length === 0) {
				throw new NotFoundError("订单不存在");
			}

			return result[0];
		} catch (error) {
			console.error("更新订单状态失败:", error);
			throw error;
		}
	}

	/**
	 * 更新订单物流信息
	 */
	async updateShipping(
		id: number,
		data: UpdateShippingDto,
	): Promise<Order> {
		try {
			const updateData: any = {
				trackingNumber: data.trackingNumber,
				updatedAt: new Date(),
			};

			if (data.shippingMethod) {
				updateData.shippingMethod = data.shippingMethod;
			}

			const result = await db
				.update(ordersSchema)
				.set(updateData)
				.where(eq(ordersSchema.id, id))
				.returning();

			if (result.length === 0) {
				throw new NotFoundError("订单不存在");
			}

			return result[0];
		} catch (error) {
			console.error("更新订单物流信息失败:", error);
			throw error;
		}
	}

	/**
	 * 获取退款列表
	 */
	async getRefundList(query: RefundQuery) {
		try {
			const { page = 1, pageSize = 20, status, orderId } = query;

			const offset = (page - 1) * pageSize;
			const conditions = [];

			if (status) {
				conditions.push(eq(refundsSchema.status, status));
			}
			if (orderId) {
				conditions.push(eq(refundsSchema.orderId, orderId));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			//

			// 获取退款列表，包含订单信息
			const refunds = await db
				.select({
					id: refundsSchema.id,
					orderId: refundsSchema.orderId,
					amount: refundsSchema.amount,
					reason: refundsSchema.reason,
					status: refundsSchema.status,
					refundMethod: refundsSchema.refundMethod,
					processedAt: refundsSchema.processedAt,
					notes: refundsSchema.notes,
					createdAt: refundsSchema.createdAt,
					updatedAt: refundsSchema.updatedAt,
					orderNumber: ordersSchema.orderNumber,
					customerName: ordersSchema.customerName,
					customerEmail: ordersSchema.customerEmail,
				})
				.from(refundsSchema)
				.leftJoin(ordersSchema, eq(refundsSchema.orderId, ordersSchema.id))
				.where(whereClause)
				.orderBy(desc(refundsSchema.createdAt))
				.limit(pageSize)
				.offset(offset);

			// 获取总数
			const totalQueryBuilder = db
				.select({ count: count() })
				.from(refundsSchema);

			if (whereClause) {
				totalQueryBuilder.where(whereClause);
			}

			const [{ count: total }] = await totalQueryBuilder;
			const totalPages = Math.ceil(total / pageSize);

			return {
				data: refunds,
				pagination: {
					page,
					pageSize,
					total,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			console.error("获取退款列表失败:", error);
			throw new Error("获取退款列表失败");
		}
	}

	/**
	 * 创建退款申请
	 */
	async createRefund(
		orderId: number,
		data: CreateRefundDto,
	): Promise<Refund> {
		try {
			// 检查订单是否存在
			const order = await db
				.select()
				.from(ordersSchema)
				.where(eq(ordersSchema.id, orderId))
				.limit(1);

			if (order.length === 0) {
				throw new NotFoundError("订单不存在");
			}
			// 生成退款编号（示例：基于时间戳 + 随机数）
			const refundNumber = `REFUND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

			// 创建退款记录
			const refundData = {
				orderId,
				amount: data.amount,
				refundNumber,
				reason: data.reason,
				status: REFUND_STATUS.PENDING,
				refundMethod: data.refundMethod || "original",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await db
				.insert(refundsSchema)
				.values(refundData)
				.returning();

			return result[0];
		} catch (error) {
			console.error("创建退款申请失败:", error);
			throw error;
		}
	}

	/**
	 * 处理退款申请
	 */
	async processRefund(id: number, data: ProcessRefundDto): Promise<Refund> {
		try {
			const updateData: any = {
				status: data.status,
				updatedAt: new Date(),
			};

			if (data.notes) {
				updateData.notes = data.notes;
			}

			if (data.status === REFUND_STATUS.PROCESSED) {
				updateData.processedAt = new Date();
			}

			const result = await db
				.update(refundsSchema)
				.set(updateData)
				.where(eq(refundsSchema.id, id))
				.returning();

			if (result.length === 0) {
				throw new NotFoundError("退款申请不存在");
			}

			return result[0];
		} catch (error) {
			console.error("处理退款申请失败:", error);
			throw error;
		}
	}

	/**
	 * 获取订单统计信息
	 */
	async getOrderStatistics(query: StatisticsQuery) {
		try {
			const { startDate, endDate } = query;
			const conditions = [];

			if (startDate) {
				conditions.push(sql`${ordersSchema.createdAt} >= ${startDate}`);
			}
			if (endDate) {
				conditions.push(sql`${ordersSchema.createdAt} <= ${endDate}`);
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			// 获取总订单数和总金额
			const totalStats = await db
				.select({
					totalOrders: count(),
					totalAmount: sql<string>`COALESCE(SUM(CAST(${ordersSchema.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(ordersSchema)
				.where(whereClause);

			// 获取各状态订单数量
			const statusStats = await db
				.select({
					status: ordersSchema.status,
					count: count(),
				})
				.from(ordersSchema)
				.where(whereClause)
				.groupBy(ordersSchema.status);

			// 获取各支付状态订单数量
			const paymentStats = await db
				.select({
					paymentStatus: ordersSchema.paymentStatus,
					count: count(),
				})
				.from(ordersSchema)
				.where(whereClause)
				.groupBy(ordersSchema.paymentStatus);

			// 获取退款统计
			const refundStats = await db
				.select({
					totalRefunds: count(),
					totalRefundAmount: sql<string>`COALESCE(SUM(CAST(${refundsSchema.amount} AS DECIMAL)), 0)`,
				})
				.from(refundsSchema)
				.leftJoin(ordersSchema, eq(refundsSchema.orderId, ordersSchema.id))
				.where(whereClause);

			return {
				total: totalStats[0],
				statusDistribution: statusStats,
				paymentDistribution: paymentStats,
				refunds: refundStats[0],
			};
		} catch (error) {
			console.error("获取订单统计信息失败:", error);
			throw new Error("获取订单统计信息失败");
		}
	}
}
