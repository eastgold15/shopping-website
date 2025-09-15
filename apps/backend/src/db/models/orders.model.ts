import { relations } from "drizzle-orm";
import { decimal, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { imagesTable } from ".";
import { orderItemsTable } from "./orderItems.model";
import { productsTable } from "./product.model";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 订单表 - 存储用户的订单信息
 * 包含订单基本信息、状态管理和支付信息
 */
export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(), // 订单唯一标识
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // 订单编号
  customerName: varchar("customer_name", { length: 100 }).notNull(), // 客户姓名
  customerEmail: varchar("customer_email", { length: 255 }).notNull(), // 客户邮箱
  customerPhone: varchar("customer_phone", { length: 20 }).default(""), // 客户电话
  shippingAddress: json("shipping_address").notNull(), // 收货地址信息
  billingAddress: json("billing_address").default({}), // 账单地址信息
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // 商品小计金额
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default(
    "0.00",
  ), // 运费
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"), // 税费
  discountAmount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).default("0.00"), // 折扣金额
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // 订单总金额
  currency: varchar("currency", { length: 3 }).default("USD"), // 货币类型
  status: varchar("status", { length: 20 }).default("pending"), // 订单状态: pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // 支付状态: pending, paid, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }).default(""), // 支付方式
  paymentId: varchar("payment_id", { length: 255 }).default(""), // 支付平台交易ID
  trackingNumber: varchar("tracking_number", { length: 100 }).default(""), // 物流追踪号
  shippingMethod: varchar("shipping_method", { length: 50 }).default(""), // 配送方式
  notes: text("notes").default(""), // 订单备注
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertOrdersSchema = createInsertSchema(ordersTable, {
  orderNumber: z.string().min(1, "订单号不能为空").max(50, "订单号不能超过50个字符"),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "总金额格式不正确"),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "折扣金额格式不正确").optional(),

  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "税费格式不正确").optional(),

  paymentMethod: z.enum(["alipay", "wechat", "credit_card", "bank_transfer", "cod"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded", "failed"]).optional(),

});
export const updateOrdersSchema = createUpdateSchema(ordersTable, {
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  paymentMethod: z.enum(["alipay", "wechat", "credit_card", "bank_transfer", "cod"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded", "failed"]).optional(),
  shippingName: z.string().min(1, "收货人姓名不能为空").max(100, "收货人姓名不能超过100个字符").optional(),
  shippingPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码").optional(),
  shippingAddress: z.string().min(1, "收货地址不能为空").optional(),
  shippingCity: z.string().min(1, "收货城市不能为空").optional(),
  shippingProvince: z.string().min(1, "收货省份不能为空").optional(),
});
export const selectOrdersSchema = createSelectSchema(ordersTable);

// 订单模型定义
export const ordersModel = {
  selectOrdersTable: selectOrdersSchema,
  // 创建订单请求参数
  insertOrdersDto: insertOrdersSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  updateOrdersDto: updateOrdersSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  // 订单列表查询参数
  queryOrdersListDto: UnoQueryZod.extend({
    userId: z.number().int().positive().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    orderNumber: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
  }),

  // 更新订单状态DTO
  updateOrderStatusDto: z.object({
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    notes: z.string().optional(),
  }),

  // 更新支付状态DTO
  updatePaymentStatusDto: z.object({
    paymentStatus: z.enum(["unpaid", "paid", "refunded", "failed"]),
    paymentMethod: z.enum(["alipay", "wechat", "credit_card", "bank_transfer", "cod"]).optional(),
    paidAt: z.iso.datetime().optional(),
  }),

  // 更新物流信息DTO
  updateShippingInfoDto: z.object({
    trackingNumber: z.string().optional(),
    shippedAt: z.iso.datetime().optional(),
    deliveredAt: z.iso.datetime().optional(),
  }),

  // 取消订单DTO
  cancelOrderDto: z.object({
    cancelReason: z.string().min(1, "取消原因不能为空"),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertOrdersDto = z.infer<typeof ordersModel.insertOrdersDto>;  // 请求用
export type UpdateOrdersDto = z.infer<typeof ordersModel.updateOrdersDto>;  // 请求用
export type SelectOrdersType = z.infer<typeof ordersModel.selectOrdersTable>; // 查询返回原始类型
export type OrdersListQueryDto = z.infer<typeof ordersModel.queryOrdersListDto>;
export type UpdateOrderStatusDto = z.infer<typeof ordersModel.updateOrderStatusDto>;
export type UpdatePaymentStatusDto = z.infer<typeof ordersModel.updatePaymentStatusDto>;
export type UpdateShippingInfoDto = z.infer<typeof ordersModel.updateShippingInfoDto>;
export type CancelOrderDto = z.infer<typeof ordersModel.cancelOrderDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectOrdersVo = SelectOrdersType & {
  // 可以添加计算字段
  statusText?: string; // 状态文本
  paymentStatusText?: string; // 支付状态文本
  itemCount?: number; // 商品数量
  canCancel?: boolean; // 是否可以取消
  canRefund?: boolean; // 是否可以退款
};

// 5. 关系定义
// export const ordersRelations = relations(ordersTable, ({ many, one }) => ({
//   orderItems: many(orderItemsTable), // 一个订单包含多个订单项
//   user: one(usersTable, {
//     fields: [ordersTable.userId],
//     references: [usersTable.id],
//   }), // 订单属于一个用户
//   refunds: many(refundsTable), // 一个订单可能有多个退款记录
// }));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.productId],
    references: [productsTable.id],
  }),
  // 订单项商品图片快照关联到图片管理表 - 外键在order_items表中
  productImageRef: one(imagesTable, {
    fields: [orderItemsTable.productImage],
    references: [imagesTable.url],
  }),
}));