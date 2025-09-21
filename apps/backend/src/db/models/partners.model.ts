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
  // 基本
  partnersTable: selectPartnersSchema,
  // 创建合作伙伴参数
  insertPartners: insertPartnersSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
    image_ids: z.array(z.coerce.number()).optional()
  }),
  // 更新
  updatePartners: updatePartnersSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
    image_ids: z.array(z.coerce.number()).optional()
  }),
  // 合作伙伴列表查询参数
  queryPartnersList: UnoQueryZod.extend({
    isActive: z.boolean().optional(),
  }),
  // 更新合作伙伴状态DTO
  updatePartnerStatus: z.object({
    isActive: z.boolean().optional(),
  }),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出

export type UpdatePartnersDto = z.infer<typeof partnersModel.updatePartners>;  // 请求用
export type PartnersListQueryDto = z.infer<typeof partnersModel.queryPartnersList>;
export type UpdatePartnerStatusDto = z.infer<typeof partnersModel.updatePartnerStatus>;
export type InsertPartners = z.infer<typeof partnersModel.insertPartners>

//4. 前端 表单类型和返回类型
export type PartnerlFormDto = z.infer<typeof partnersModel.insertPartners>;
// 返回类型，使用apifox生成
export type PartnersListVo = {
  id: number;
  name: string;
  description: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: {
    id: number;
    imageUrl: string;
    fileName: string;
    category: string;
    isMain: boolean;
  }[];
}





export const partnersRelations = relations(partnersTable, ({ one, many }) => ({
  // 合作伙伴Logo关联到图片管理表 - 外键在partners表中
  partnerImageRef: many(partnerImagesTable)
}));




/**
 * 伙伴图片关联表 - 处理伙伴与图片的多对多关系
 */
export const partnerImagesTable = pgTable("partner_images", {
  partnerId: integer("partner_id")
    .references(() => partnersTable.id)
    .notNull(),
  imageId: integer("image_id")
    .references(() => imagesTable.id)
    .notNull(),
  isMain: boolean("is_main").default(false),
});

export const partnerImagesRelations = relations(partnerImagesTable, ({ one }) => ({
  partnerRef: one(partnersTable, {
    fields: [partnerImagesTable.partnerId],
    references: [partnersTable.id],
  }),
  imageRef: one(imagesTable, {
    fields: [partnerImagesTable.imageId],
    references: [imagesTable.id],
  }),
}));
