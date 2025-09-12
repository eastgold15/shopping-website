import { paramId, UnoQuery } from "@backend/db/common.model";
import type { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";

// 订单模型定义
export const ordersModel = {
	// 路径参数
	id: paramId,
	refundId: paramId,

	// 订单列表查询参数
	OrderQuery: t.Composite([
		UnoQuery,
		t.Object({
			status: t.Optional(t.String({ description: "订单状态" })),
			paymentStatus: t.Optional(t.String({ description: "支付状态" })),
			customerEmail: t.Optional(t.String({ description: "客户邮箱" })),
			orderNumber: t.Optional(t.String({ description: "订单编号" })),
		}),
	]),

	// 更新订单状态请求
	UpdateOrderStatusDto: t.Object({
		status: t.String({ description: "订单状态" }),
		notes: t.Optional(t.String({ description: "备注" })),
	}),

	// 更新物流信息请求
	UpdateShippingDto: t.Object({
		trackingNumber: t.String({ description: "物流单号" }),
		shippingMethod: t.Optional(t.String({ description: "物流方式" })),
	}),

	// 退款列表查询参数
	RefundQuery: t.Composite([
		UnoQuery,
		t.Object({
			status: t.Optional(t.String({ description: "退款状态" })),
			orderId: t.Optional(t.Number()),
		}),
	]),

	// 创建退款申请请求
	CreateRefundDto: t.Object({
		amount: t.String({ description: "退款金额" }),
		reason: t.String({ description: "退款原因" }),
		refundMethod: t.Optional(t.String({ description: "退款方式" })),
	}),

	// 处理退款申请请求
	ProcessRefundDto: t.Object({
		status: t.String({ description: "退款状态" }),
		notes: t.Optional(t.String({ description: "处理备注" })),
	}),

	// 统计查询参数
	StatisticsQuery: t.Object({
		startDate: t.Optional(t.String({ description: "开始日期" })),
		endDate: t.Optional(t.String({ description: "结束日期" })),
	}),
};

// 导出实体类型
export type Order = typeof DbType.typebox.select.ordersSchema.static;
export type NewOrder = typeof DbType.typebox.insert.ordersSchema.static;
export type OrderItem = typeof DbType.typebox.select.orderItemsSchema.static;
export type NewOrderItem = typeof DbType.typebox.insert.orderItemsSchema.static;
export type Refund = typeof DbType.typebox.select.refundsSchema.static;
export type NewRefund = typeof DbType.typebox.insert.refundsSchema.static;

// 导出查询类型
export type OrderQuery = typeof ordersModel.OrderQuery.static;
export type RefundQuery = typeof ordersModel.RefundQuery.static;
export type StatisticsQuery = typeof ordersModel.StatisticsQuery.static;

// 导出DTO类型
export type UpdateOrderStatusDto =
	typeof ordersModel.UpdateOrderStatusDto.static;
export type UpdateShippingDto = typeof ordersModel.UpdateShippingDto.static;
export type CreateRefundDto = typeof ordersModel.CreateRefundDto.static;
export type ProcessRefundDto = typeof ordersModel.ProcessRefundDto.static;

// 导出模型类型
export const OrderModel = ordersModel;
