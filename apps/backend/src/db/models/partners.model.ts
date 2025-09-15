import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { imagesTable } from "./images.model";
import { UnoQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 合作伙伴表 - 存储网站的合作伙伴信息
 * 用于展示合作伙伴logo、链接等信息
 */
export const partnersTable = pgTable("partners", {
  id: serial("id").primaryKey(), // 合作伙伴唯一标识
  name: varchar("name", { length: 255 }).notNull(), // 合作伙伴名称
  description: text("description").notNull(), // 合作伙伴描述
  url: varchar("url", { length: 255 }).notNull(), // 合作伙伴官网链接
  image_id: integer("image_id")
    .notNull()
    .references(() => imagesTable.id), // 合作伙伴Logo图片URL - 引用imagesSchema.url
  sortOrder: integer("sort_order").default(0), // 排序权重
  isActive: boolean("is_active").default(true), // 是否显示
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});
// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertPartnersSchema = createInsertSchema(partnersTable, {
  name: z.string().min(1, "合作伙伴名称不能为空").max(100, "合作伙伴名称不能超过100个字符")
});
export const updatePartnersSchema = createUpdateSchema(partnersTable, {
  name: z.string().min(1, "合作伙伴名称不能为空").max(100, "合作伙伴名称不能超过100个字符").optional(),
  description: z.string().max(1000, "描述不能超过1000个字符").optional(),
});
export const selectPartnersSchema = createSelectSchema(partnersTable);

// 合作伙伴模型定义
export const partnersModel = {
  selectPartnersTable: selectPartnersSchema,
  // 创建合作伙伴参数
  insertPartnersDto: insertPartnersSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  updatePartnersDto: updatePartnersSchema.omit({ id: true, createdAt: true, updatedAt: true }),

  // 合作伙伴列表查询参数
  queryPartnersListDto: UnoQueryZod.extend({
    name: z.string().optional(),
    partnershipType: z.string().optional(),
    partnershipLevel: z.string().optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
    showInFooter: z.boolean().optional(),
    tags: z.string().optional(),
  }),

  // 公开展示的合作伙伴查询参数
  queryPublicPartnersDto: z.object({
    type: z.enum(["homepage", "footer", "all"]).default("all"),
    level: z.enum(["bronze", "silver", "gold", "platinum", "diamond"]).optional(),
    limit: z.number().int().positive().max(50).default(20),
  }),

  // 更新合作伙伴状态DTO
  updatePartnerStatusDto: z.object({
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
    showInFooter: z.boolean().optional(),
  }),

  // 记录点击DTO
  recordClickDto: z.object({
    partnerId: z.number().int().positive(),
    userAgent: z.string().optional(),
    referer: z.string().optional(),
  }),

  // 批量更新显示顺序DTO
  batchUpdateOrderDto: z.object({
    partners: z.array(z.object({
      id: z.number().int().positive(),
      displayOrder: z.string().regex(/^\d+$/),
    })),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertPartnersDto = z.infer<typeof partnersModel.insertPartnersDto>;  // 请求用
export type UpdatePartnersDto = z.infer<typeof partnersModel.updatePartnersDto>;  // 请求用
export type SelectPartnersType = z.infer<typeof partnersModel.selectPartnersTable>; // 查询返回原始类型
export type PartnersListQueryDto = z.infer<typeof partnersModel.queryPartnersListDto>;
export type PublicPartnersQueryDto = z.infer<typeof partnersModel.queryPublicPartnersDto>;
export type UpdatePartnerStatusDto = z.infer<typeof partnersModel.updatePartnerStatusDto>;
export type RecordClickDto = z.infer<typeof partnersModel.recordClickDto>;
export type BatchUpdateOrderDto = z.infer<typeof partnersModel.batchUpdateOrderDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectPartnersVo = SelectPartnersType & {
  // 可以添加计算字段
  partnershipTypeText?: string; // 合作类型文本
  partnershipLevelText?: string; // 合作等级文本
  contractStatus?: string; // 合同状态
  daysUntilExpiry?: number; // 距离到期天数
  parsedTags?: string[]; // 解析后的标签
  isExpiringSoon?: boolean; // 是否即将到期
  totalClicks?: number; // 总点击数
};

// 5. 关系定义
// 合作伙伴表通常是独立的，不需要复杂的关系定义
// 如果需要关联其他表（如用户表、订单表等），可以在这里定义
// export const partnersRelations = relations(partnersTable, ({ many }) => ({
//   // 如果有合作伙伴相关的订单或其他关联数据
//   // orders: many(ordersTable),
// }));

export const partnersRelations = relations(partnersTable, ({ one }) => ({
  // 合作伙伴Logo关联到图片管理表 - 外键在partners表中
  imageRef: one(imagesTable, {
    fields: [partnersTable.image_id],
    references: [imagesTable.id],
  }),
}));
