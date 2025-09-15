import { relations } from "drizzle-orm";
import { decimal, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { orderItemsTable } from "./orderItems.model";
import { ordersTable } from "./orders.model";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 退款表 - 存储订单的退款申请和处理记录
 * 支持部分退款和全额退款
 */
export const refundsTable = pgTable("refunds", {
  id: serial("id").primaryKey(), // 退款申请唯一标识
  orderId: integer("order_id")
    .references(() => orderItemsTable.id)
    .notNull(), // 关联订单ID
  refundNumber: varchar("refund_number", { length: 50 }).notNull().unique(), // 退款编号
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 退款金额
  reason: text("reason").notNull(), // 退款原因
  status: varchar("status", { length: 20 }).default("pending"), // 退款状态: pending, approved, rejected, processed
  refundMethod: varchar("refund_method", { length: 50 }).default(""), // 退款方式
  processedAt: timestamp("processed_at"), // 处理时间
  notes: text("notes").default(""), // 处理备注
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertRefundsSchema = createInsertSchema(refundsTable, {
  refundNumber: z.string().min(1, "退款单号不能为空").max(50, "退款单号不能超过50个字符"),
  orderId: z.number().int().positive("订单ID必须为正整数"),

  status: z.enum(["pending", "approved", "rejected", "processing", "completed", "cancelled"]),
  reason: z.string().min(1, "退款原因不能为空").max(100, "退款原因不能超过100个字符"),

});
export const updateRefundsSchema = createUpdateSchema(refundsTable, {
  status: z.enum(["pending", "approved", "rejected", "processing", "completed", "cancelled"]).optional(),
  reason: z.string().min(1, "退款原因不能为空").max(100, "退款原因不能超过100个字符").optional(),
  refundAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "退款金额格式不正确").optional(),
  refundQuantity: z.number().int().positive("退款数量必须为正整数").optional(),
});
export const selectRefundsSchema = createSelectSchema(refundsTable);

// 退款模型定义
export const refundsModel = {
  selectRefundsTable: selectRefundsSchema,
  // 创建退款请求参数
  insertRefundsDto: insertRefundsSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  updateRefundsDto: updateRefundsSchema.omit({ id: true, refundNumber: true, createdAt: true, updatedAt: true }),

  // 退款列表查询参数
  queryRefundsListDto: UnoQueryZod.extend({
    orderId: z.number().int().positive().optional(),
    userId: z.number().int().positive().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    refundNumber: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
  }),

  // 申请退款DTO
  applyRefundDto: z.object({
    orderId: z.number().int().positive(),
    orderItemId: z.number().int().positive().optional(),
    type: z.enum(["refund", "return"]),
    reason: z.string().min(1, "退款原因不能为空"),
    description: z.string().optional(),
    refundAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    refundQuantity: z.number().int().positive().optional(),
    evidenceImages: z.array(z.string().url()).optional(),
  }),

  // 审核退款DTO
  reviewRefundDto: z.object({
    status: z.enum(["approved", "rejected"]),
    adminNotes: z.string().optional(),
    rejectedReason: z.string().optional(),
  }),

  // 处理退款DTO
  processRefundDto: z.object({
    refundMethod: z.enum(["original", "alipay", "wechat", "bank_transfer"]),
    refundAccount: z.string().optional(),
  }),

  // 更新退货物流信息DTO
  updateReturnShippingDto: z.object({
    returnTrackingNumber: z.string().optional(),
    returnShippedAt: z.iso.datetime().optional(),
    returnReceivedAt: z.iso.datetime().optional(),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertRefundsDto = z.infer<typeof refundsModel.insertRefundsDto>;  // 请求用
export type UpdateRefundsDto = z.infer<typeof refundsModel.updateRefundsDto>;  // 请求用
export type SelectRefundsType = z.infer<typeof refundsModel.selectRefundsTable>; // 查询返回原始类型
export type RefundsListQueryDto = z.infer<typeof refundsModel.queryRefundsListDto>;
export type ApplyRefundDto = z.infer<typeof refundsModel.applyRefundDto>;
export type ReviewRefundDto = z.infer<typeof refundsModel.reviewRefundDto>;
export type ProcessRefundDto = z.infer<typeof refundsModel.processRefundDto>;
export type UpdateReturnShippingDto = z.infer<typeof refundsModel.updateReturnShippingDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectRefundsVo = SelectRefundsType & {
  // 可以添加计算字段
  statusText?: string; // 状态文本
  typeText?: string; // 类型文本
  canCancel?: boolean; // 是否可以取消
  processingDays?: number; // 处理天数
  parsedEvidenceImages?: string[]; // 解析后的证据图片
};

// 5. 关系定义
// export const refundsRelations = relations(refundsTable, ({ one }) => ({
//   order: one(ordersTable, {
//     fields: [refundsTable.orderId],
//     references: [ordersTable.id],
//   }), // 退款属于一个订单
//   orderItem: one(orderItemsTable, {
//     fields: [refundsTable.orderItemId],
//     references: [orderItemsTable.id],
//   }), // 退款可能关联一个订单项
//   user: one(usersTable, {
//     fields: [refundsTable.userId],
//     references: [usersTable.id],
//   }), // 退款属于一个用户
// }));


export const refundsRelations = relations(refundsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [refundsTable.orderId],
    references: [ordersTable.id],
  }),
}));