import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod/v4";
import { imagesTable, SelectImageType } from "./images.model";
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
  // image_id: integer("image_id")
  //   .notNull()
  //   .references(() => imagesTable.id), // 合作伙伴Logo图片URL - 引用imagesSchema.url
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
export type SelectPartnersDto = z.infer<typeof partnersModel.selectPartnersTable>; // 查询返回原始类型
export type PartnersListQueryDto = z.infer<typeof partnersModel.queryPartnersListDto>;
export type PublicPartnersQueryDto = z.infer<typeof partnersModel.queryPublicPartnersDto>;
export type UpdatePartnerStatusDto = z.infer<typeof partnersModel.updatePartnerStatusDto>;
export type RecordClickDto = z.infer<typeof partnersModel.recordClickDto>;
export type BatchUpdateOrderDto = z.infer<typeof partnersModel.batchUpdateOrderDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰） 左连接一般都有null
export type SelectPartnersVo = Omit<SelectPartnersDto, 'image_id'> & {
  imageRef: SelectImageType
}



export const partnersRelations = relations(partnersTable, ({ one }) => ({
  // 合作伙伴Logo关联到图片管理表 - 外键在partners表中
  partnerImageRef: one(partnerImagesTable, {
    fields: [partnersTable.id],
    references: [partnerImagesTable.partnerId],
  }),
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
