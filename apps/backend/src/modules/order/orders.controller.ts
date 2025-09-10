import { Elysia, t } from "elysia";
import { ordersModel } from "./orders.model";
import { OrdersService } from "./orders.service";

/**
 * 订单控制器
 * 处理订单相关的HTTP请求
 */
export const ordersController = new Elysia({
	prefix: "/orders",
	tags: ["订单"],
})

	.model(ordersModel)
	.decorate("ordersService", new OrdersService())
	.guard({
		beforeHandle({ params }) {
			// 转换路径参数中的 id 为字符串（订单ID通常是字符串格式）
			if (params && "id" in params) {
				params.id = String(params.id);
			}
			if (params && "refundId" in params) {
				params.refundId = String(params.refundId);
			}
		},
	})

	// 获取订单列表（分页）
	.get(
		"/",
		async ({ query, ordersService }) => {
			const result = await ordersService.getOrderList({
				page: query.page ? query.page : undefined,
				pageSize: query.pageSize ? query.pageSize : undefined,
				status: query.status ?? undefined,
				paymentStatus: query.paymentStatus ?? undefined,
				customerEmail: query.customerEmail,
				orderNumber: query.orderNumber,
				sortBy: query.sortBy,
				sortOrder: query.sortOrder as "asc" | "desc",
			});
			return {
				success: true,
				data: result.data,
				pagination: result.pagination,
			};
		},
		{
			query: "orderListQuery",
			detail: {
				summary: "获取订单列表",
				description: "获取订单列表，支持分页、排序和筛选",
				tags: ["Orders"],
			},
		},
	)

	// 根据ID获取订单详情
	.get(
		"/:id",
		async ({ params: { id }, ordersService }) => {
			const order = await ordersService.getOrderById(id);
			return {
				success: true,
				data: order,
			};
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				summary: "获取订单详情",
				description: "根据订单ID获取订单详细信息，包括订单项和退款记录",
				tags: ["Orders"],
			},
		},
	)

	// 更新订单状态
	.patch(
		"/:id/status",
		async ({ params: { id }, body, ordersService }) => {
			const order = await ordersService.updateOrderStatus(
				id,
				body.status,
				body.notes,
			);
			return {
				success: true,
				data: order,
				message: "订单状态更新成功",
			};
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateOrderStatus",
			detail: {
				summary: "更新订单状态",
				description: "更新指定订单的状态",
				tags: ["Orders"],
			},
		},
	)

	// 更新订单物流信息
	.patch(
		"/:id/shipping",
		async ({ params: { id }, body, ordersService }) => {
			const order = await ordersService.updateOrderShipping(
				id,
				body.trackingNumber,
				body.shippingMethod,
			);
			return {
				success: true,
				data: order,
				message: "物流信息更新成功",
			};
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateShipping",
			detail: {
				summary: "更新订单物流信息",
				description: "更新指定订单的物流跟踪信息",
				tags: ["Orders"],
			},
		},
	)

	// 获取退款列表
	.get(
		"/refunds",
		async ({ query, ordersService }) => {
			const result = await ordersService.getRefundList({
				page: query.page ? query.page : undefined,
				pageSize: query.pageSize ? query.pageSize : undefined,
				status: query.status,
				orderId: query.orderId && undefined,
			});
			return {
				success: true,
				data: result.data,
				pagination: result.pagination,
			};
		},
		{
			query: "refundListQuery",
			detail: {
				summary: "获取退款列表",
				description: "获取退款申请列表，支持分页和筛选",
				tags: ["Orders"],
			},
		},
	)

	// 创建退款申请
	.post(
		"/:id/refunds",
		async ({ params: { id }, body, ordersService }) => {
			const refund = await ordersService.createRefund(
				id,
				body.amount,
				body.reason,
				body.refundMethod,
			);
			return {
				success: true,
				data: refund,
				message: "退款申请创建成功",
			};
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "createRefund",
			detail: {
				summary: "创建退款申请",
				description: "为指定订单创建退款申请",
				tags: ["Orders"],
			},
		},
	)

	// 处理退款申请
	.patch(
		"/refunds/:refundId",
		async ({ params: { refundId }, body, ordersService }) => {
			const refund = await ordersService.processRefund(
				refundId,
				body.status,
				body.notes,
			);
			return {
				success: true,
				data: refund,
				message: "退款申请处理成功",
			};
		},
		{
			params: t.Object({
				refundId: t.Number(),
			}),
			body: "processRefund",
			detail: {
				summary: "处理退款申请",
				description: "更新退款申请的状态",
				tags: ["Orders"],
			},
		},
	)

	// 获取订单统计信息
	.get(
		"/statistics",
		async ({ query, ordersService }) => {
			const statistics = await ordersService.getOrderStatistics(
				query.startDate,
				query.endDate,
			);
			return {
				success: true,
				data: statistics,
			};
		},
		{
			query: "statisticsQuery",
			detail: {
				summary: "获取订单统计信息",
				description: "获取订单的统计数据，包括总数、金额、状态分布等",
				tags: ["Orders"],
			},
		},
	);
