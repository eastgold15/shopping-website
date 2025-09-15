import { NotFoundError } from "@backend/utils/error/customError";
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
import { orderItemsTable } from "../../db/models/orderItems.model";
import { ordersTable } from "../../db/models/orders.model";
import { refundsTable } from "../../db/models/refunds.model";
import { ProcessRefundDto, UpdateOrderStatusDto, OrdersListQueryDto } from "@backend/db/models";
import { paginate } from "@backend/utils/services/pagination";



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
   * 获取订单列表 - 使用统一分页函数
   */
  async getList(query: OrdersListQueryDto) {
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

      // 构建基础查询
      let queryBuilder = db
        .select({
          ...getTableColumns(ordersTable),
        })
        .from(ordersTable);

      // 构建查询条件
      const conditions = [];

      if (status) {
        conditions.push(eq(ordersTable.status, status));
      }
      if (paymentStatus) {
        conditions.push(eq(ordersTable.paymentStatus, paymentStatus));
      }
      if (customerEmail) {
        conditions.push(
          ilike(ordersTable.customerEmail, `%${customerEmail}%`),
        );
      }
      if (orderNumber) {
        conditions.push(ilike(ordersTable.orderNumber, `%${orderNumber}%`));
      }

      // 应用查询条件
      if (conditions.length > 0) {
        queryBuilder.where(and(...conditions));
      }

      // 排序字段映射
      const sortFieldMap: Record<string, any> = {
        totalAmount: sql`CAST(${ordersTable.totalAmount} AS DECIMAL)`,
        customerName: ordersTable.customerName,
        createdAt: ordersTable.createdAt,
      };

      const sortField = sortFieldMap[sortBy] || ordersTable.createdAt;
      const sortDirection = sortOrder === "desc" ? "desc" : "asc";

      // 使用统一分页函数
      const result = await paginate(queryBuilder, {
        page,
        pageSize,
        sortField,
        sortDirection,
      });

      // 转换返回格式以保持兼容性
      return {
        data: result.items,
        pagination: {
          page: result.meta.page,
          pageSize: result.meta.pageSize,
          total: result.meta.total,
          totalPages: result.meta.totalPages,
        
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
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .limit(1);

      if (order.length === 0) {
        throw new NotFoundError("订单不存在");
      }

      // 获取订单项
      const orderItems = await db
        .select({
          id: orderItemsTable.id,
          productId: orderItemsTable.productId,
          productName: orderItemsTable.productName,
          productSku: orderItemsTable.productSku,
          quantity: orderItemsTable.quantity,
          unitPrice: orderItemsTable.unitPrice,
          totalPrice: orderItemsTable.totalPrice,
          productImage: orderItemsTable.productImage,
        })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, id));

      // 获取退款记录
      const refunds = await db
        .select()
        .from(refundsTable)
        .where(eq(refundsTable.orderId, id))
        .orderBy(desc(refundsTable.createdAt));

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
        .update(ordersTable)
        .set(updateData)
        .where(eq(ordersTable.id, id))
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
  async updateShipping(id: number, data: UpdateShippingDto): Promise<Order> {
    try {
      const updateData: any = {
        trackingNumber: data.trackingNumber,
        updatedAt: new Date(),
      };

      if (data.shippingMethod) {
        updateData.shippingMethod = data.shippingMethod;
      }

      const result = await db
        .update(ordersTable)
        .set(updateData)
        .where(eq(ordersTable.id, id))
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
   * 获取退款列表 - 使用统一分页函数
   */
  async getRefundList(query: RefundQuery) {
    try {
      const { page = 1, pageSize = 20, status, orderId } = query;

      // 构建基础查询
      let queryBuilder = db
        .select({
          id: refundsTable.id,
          orderId: refundsTable.orderId,
          amount: refundsTable.amount,
          reason: refundsTable.reason,
          status: refundsTable.status,
          refundMethod: refundsTable.refundMethod,
          processedAt: refundsTable.processedAt,
          notes: refundsTable.notes,
          createdAt: refundsTable.createdAt,
          updatedAt: refundsTable.updatedAt,
          orderNumber: ordersTable.orderNumber,
          customerName: ordersTable.customerName,
          customerEmail: ordersTable.customerEmail,
        })
        .from(refundsTable)
        .leftJoin(ordersTable, eq(refundsTable.orderId, ordersTable.id));

      // 构建查询条件
      const conditions = [];

      if (status) {
        conditions.push(eq(refundsTable.status, status));
      }
      if (orderId) {
        conditions.push(eq(refundsTable.orderId, orderId));
      }

      // 应用查询条件
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions));
      }

      // 使用统一分页函数
      const result = await paginate(queryBuilder, {
        page,
        pageSize,
        sortField: refundsTable.createdAt,
        sortDirection: "desc",
      });

      // 转换返回格式以保持兼容性
      return {
        data: result.items,
        pagination: {
          page: result.meta.page,
          pageSize: result.meta.pageSize,
          total: result.meta.total,
          totalPages: result.meta.totalPages,
          hasNext: result.meta.page < result.meta.totalPages,
          hasPrev: result.meta.page > 1,
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
  async createRefund(orderId: number, data: CreateRefundDto): Promise<Refund> {
    try {
      // 检查订单是否存在
      const order = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
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
        .insert(refundsTable)
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
        .update(refundsTable)
        .set(updateData)
        .where(eq(refundsTable.id, id))
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
        conditions.push(sql`${ordersTable.createdAt} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`${ordersTable.createdAt} <= ${endDate}`);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // 获取总订单数和总金额
      const totalStats = await db
        .select({
          totalOrders: count(),
          totalAmount: sql<string>`COALESCE(SUM(CAST(${ordersTable.totalAmount} AS DECIMAL)), 0)`,
        })
        .from(ordersTable)
        .where(whereClause);

      // 获取各状态订单数量
      const statusStats = await db
        .select({
          status: ordersTable.status,
          count: count(),
        })
        .from(ordersTable)
        .where(whereClause)
        .groupBy(ordersTable.status);

      // 获取各支付状态订单数量
      const paymentStats = await db
        .select({
          paymentStatus: ordersTable.paymentStatus,
          count: count(),
        })
        .from(ordersTable)
        .where(whereClause)
        .groupBy(ordersTable.paymentStatus);

      // 获取退款统计
      const refundStats = await db
        .select({
          totalRefunds: count(),
          totalRefundAmount: sql<string>`COALESCE(SUM(CAST(${refundsTable.amount} AS DECIMAL)), 0)`,
        })
        .from(refundsTable)
        .leftJoin(ordersTable, eq(refundsTable.orderId, ordersTable.id))
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
