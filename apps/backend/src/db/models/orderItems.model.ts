import { pgTable, serial, integer, decimal, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 订单项表 - 存储订单中的具体商品信息
 * 记录每个订单包含的商品详情和数量
 */
export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(), // 订单项唯一标识
  orderId: integer("order_id").notNull(), // 订单ID，外键关联orders表
  productId: integer("product_id").notNull(), // 商品ID，外键关联products表
  productName: varchar("product_name", { length: 200 }).notNull(), // 商品名称（冗余存储，防止商品信息变更）
  productSku: varchar("product_sku", { length: 100 }), // 商品SKU
  productImage: varchar("product_image", { length: 500 }), // 商品图片URL
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // 单价
  quantity: integer("quantity").notNull(), // 数量
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // 小计金额
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"), // 折扣金额
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // 最终金额
  // 商品规格信息（JSON格式存储）
  specifications: varchar("specifications", { length: 1000 }), // 商品规格（如颜色、尺寸等）
  // 退款相关
  refundableQuantity: integer("refundable_quantity").notNull(), // 可退款数量
  refundedQuantity: integer("refunded_quantity").default(0), // 已退款数量
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertOrderItemsSchema = createInsertSchema(orderItemsTable, {
  orderId: z.number().int().positive("订单ID必须为正整数"),
  productId: z.number().int().positive("商品ID必须为正整数"),
  productName: z.string().min(1, "商品名称不能为空").max(200, "商品名称不能超过200个字符"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "单价格式不正确"),
  quantity: z.number().int().positive("数量必须为正整数"),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "总价格式不正确"),
  finalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "最终价格格式不正确"),
  refundableQuantity: z.number().int().min(0, "可退款数量不能为负数"),
});
export const updateOrderItemsSchema = createUpdateSchema(orderItemsTable, {
  quantity: z.number().int().positive("数量必须为正整数").optional(),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "总价格式不正确").optional(),
  finalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "最终价格格式不正确").optional(),
  refundableQuantity: z.number().int().min(0, "可退款数量不能为负数").optional(),
  refundedQuantity: z.number().int().min(0, "已退款数量不能为负数").optional(),
});
export const selectOrderItemsSchema = createSelectSchema(orderItemsTable);

// 订单项模型定义
export const orderItemsModel = {
  selectOrderItemsTable: selectOrderItemsSchema,
  // 创建订单项请求参数
  insertOrderItemsDto: insertOrderItemsSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  
  updateOrderItemsDto: updateOrderItemsSchema.omit({ id: true, orderId: true, productId: true, createdAt: true, updatedAt: true }),
  
  // 订单项列表查询参数
  queryOrderItemsListDto: UnoQueryZod.extend({
    orderId: z.number().int().positive().optional(),
    productId: z.number().int().positive().optional(),
    productName: z.string().optional(),
  }),
  
  // 按订单ID查询订单项参数
  queryOrderItemsByOrderIdDto: z.object({
    orderId: z.number().int().positive(),
  }),
  
  // 批量创建订单项DTO
  batchInsertOrderItemsDto: z.object({
    orderId: z.number().int().positive(),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      productName: z.string().min(1),
      productSku: z.string().optional(),
      productImage: z.string().optional(),
      unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
      quantity: z.number().int().positive(),
      specifications: z.string().optional(),
    })),
  }),
  
  // 更新退款数量DTO
  updateRefundQuantityDto: z.object({
    refundedQuantity: z.number().int().min(0),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertOrderItemsDto = z.infer<typeof orderItemsModel.insertOrderItemsDto>;  // 请求用
export type UpdateOrderItemsDto = z.infer<typeof orderItemsModel.updateOrderItemsDto>;  // 请求用
export type SelectOrderItemsType = z.infer<typeof orderItemsModel.selectOrderItemsTable>; // 查询返回原始类型
export type OrderItemsListQueryDto = z.infer<typeof orderItemsModel.queryOrderItemsListDto>;
export type OrderItemsByOrderIdQueryDto = z.infer<typeof orderItemsModel.queryOrderItemsByOrderIdDto>;
export type BatchInsertOrderItemsDto = z.infer<typeof orderItemsModel.batchInsertOrderItemsDto>;
export type UpdateRefundQuantityDto = z.infer<typeof orderItemsModel.updateRefundQuantityDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectOrderItemsVo = SelectOrderItemsType & {
  // 可以添加计算字段
  canRefund?: boolean; // 是否可以退款
  remainingRefundableQuantity?: number; // 剩余可退款数量
  discountRate?: number; // 折扣率
  parsedSpecifications?: Record<string, any>; // 解析后的规格信息
};

// 5. 关系定义
// export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
//   order: one(ordersTable, {
//     fields: [orderItemsTable.orderId],
//     references: [ordersTable.id],
//   }), // 订单项属于一个订单
//   product: one(productsTable, {
//     fields: [orderItemsTable.productId],
//     references: [productsTable.id],
//   }), // 订单项关联一个商品
// }));