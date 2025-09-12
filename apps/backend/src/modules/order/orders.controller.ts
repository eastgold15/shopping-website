import { Elysia, t } from "elysia";
import { OrderModel } from "./orders.model";
import { OrdersService } from "./orders.service";
import { commonRes } from "@backend/utils/Res";

/**
 * 订单控制器
 * 处理订单相关的HTTP请求
 */
export const ordersController = new Elysia({ prefix: "/orders" })
	.model(OrderModel)
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

	// 获取订单列表
	.get("/", async ({ query, ordersService }) => {
		const result = await ordersService.getList(query);
		return commonRes(result, 200, "获取订单列表成功");
	}, {
		query: "OrderQuery"
	})

	// 获取订单详情
	.get("/:id", async ({ params: { id }, ordersService }) => {
		const result = await ordersService.getById(Number(id));
		return commonRes(result, 200, "获取订单详情成功");
	}, {
		params: "id"
	})

	// 更新订单状态
	.put("/:id/status", async ({ params: { id }, body, ordersService }) => {
		const result = await ordersService.updateStatus(Number(id), body);
		return commonRes(result, 200, "更新订单状态成功");
	}, {
		params: "id",
		body: "UpdateOrderStatusDto"
	})

	// 更新物流信息
	.put("/:id/shipping", async ({ params: { id }, body, ordersService }) => {
		const result = await ordersService.updateShipping(Number(id), body);
		return commonRes(result, 200, "更新物流信息成功");
	}, {
		params: "id",
		body: "UpdateShippingDto"
	})

	// 获取退款列表
	.get("/refunds", async ({ query, ordersService }) => {
		const result = await ordersService.getRefundList(query);
		return commonRes(result, 200, "获取退款列表成功");
	}, {
		query: "RefundQuery"
	})

	// 创建退款申请
	.post("/:id/refunds", async ({ params: { id }, body, ordersService }) => {
		const result = await ordersService.createRefund(Number(id), body);
		return commonRes(result, 200, "创建退款申请成功");
	}, {
		params: "id",
		body: "CreateRefundDto"
	})

	// 处理退款申请
	.put("/refunds/:refundId", async ({ params: { refundId }, body, ordersService }) => {
		const result = await ordersService.processRefund(Number(refundId), body);
		return commonRes(result, 200, "处理退款申请成功");
	}, {
		params: "refundId",
		body: "ProcessRefundDto"
	})

	// 获取订单统计数据
	.get("/statistics", async ({ query, ordersService }) => {
		const result = await ordersService.getOrderStatistics(query);
		return commonRes(result, 200, "获取订单统计成功");
	}, {
		query: "StatisticsQuery"
	});
