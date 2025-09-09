import { UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.types";
import { Omit } from "@sinclair/typebox";
import { t } from "elysia";


// 订单模型定义
export const ordersModel = {
  // 订单列表查询参数
  orderListQuery: t.Composite([
    Omit(DbType.typebox.select.ordersSchema, ['id', 'createdAt', 'updatedAt']),
    UnoQuery,
    t.Object({
      status: t.Optional(t.String({ description: '订单状态' })),
      paymentStatus: t.Optional(t.String({ description: '支付状态' })),
      customerEmail: t.Optional(t.String({ description: '客户邮箱' })),
      orderNumber: t.Optional(t.String({ description: '订单编号' }))
    })
  ]),

  // 更新订单状态请求
  updateOrderStatus: t.Object({
    status: t.String({ description: '订单状态' }),
    notes: t.Optional(t.Union([t.String({ description: '备注' })]))
  }),

  // 更新物流信息请求
  updateShipping: t.Object({
    trackingNumber: t.String({ description: '物流单号' }),
    shippingMethod: t.Optional(t.String({ description: '物流方式' }))
  }),

  // 退款列表查询参数
  refundListQuery: t.Object({
    ...UnoQuery.properties,
    status: t.Optional(t.String({ description: '退款状态' })),
    orderId: t.Optional(t.Number())
  }),

  // 创建退款申请请求
  createRefund: t.Object({
    amount: t.String({ description: '退款金额' }),
    reason: t.String({ description: '退款原因' }),
    refundMethod: t.Optional(t.String({ description: '退款方式' }))
  }),

  // 处理退款申请请求
  processRefund: t.Object({
    status: t.String({ description: '退款状态' }),
    notes: t.Optional(t.Union([t.String({ description: '处理备注' })]))
  }),

  // 统计查询参数
  statisticsQuery: t.Object({
    startDate: t.Optional(t.String({ description: '开始日期' })),
    endDate: t.Optional(t.String({ description: '结束日期' }))
  })
};

// 导出类型
export type UpdateOrderStatusDto = typeof ordersModel.updateOrderStatus.static;
export type UpdateShippingDto = typeof ordersModel.updateShipping.static;
export type CreateRefundDto = typeof ordersModel.createRefund.static;
export type ProcessRefundDto = typeof ordersModel.processRefund.static;
