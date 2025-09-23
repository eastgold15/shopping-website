import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./product.model";
import { UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 商品评价表 - 存储用户对商品的评价信息
 * 包含评分、评价内容和审核状态
 */
export const reviewsTable = pgTable("reviews", {
	id: serial("id").primaryKey(), // 评价唯一标识
	productId: integer("product_id")
		.references(() => productsTable.id)
		.notNull(), // 关联商品ID
	userName: varchar("user_name", { length: 100 }).notNull(), // 用户姓名
	userEmail: varchar("user_email", { length: 255 }).default(""), // 用户邮箱
	rating: integer("rating").notNull(), // 评分(1-5星)
	title: varchar("title", { length: 255 }).default(""), // 评价标题
	content: text("content").notNull(), // 评价内容
	isVerified: boolean("is_verified").default(false), // 是否为认证购买用户
	isApproved: boolean("is_approved").default(false), // 评价是否已审核通过
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertReviewSchema = createInsertSchema(reviewsTable, {
	rating: z.number().min(1).max(5), // 评分必须在1-5之间
	content: z.string().min(10, "评价内容至少10个字符"), // 评价内容最少10个字符
});
export const updateReviewSchema = createUpdateSchema(reviewsTable, {
	rating: z.number().min(1).max(5).optional(),
	content: z.string().min(10, "评价内容至少10个字符").optional(),
});
export const selectReviewSchema = createSelectSchema(reviewsTable);

// 评价模型定义
export const reviewsModel = {
	selectReviewTable: selectReviewSchema,
	// 创建评价请求参数
	insertReviewDto: insertReviewSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),

	updateReviewDto: updateReviewSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	}),

	// 审核评价DTO
	approveReviewDto: z.object({
		isApproved: z.boolean(),
	}),

	// 评价列表查询参数
	queryReviewListDto: UnoPageQueryZod.extend({
		productId: z.string().optional(),
		rating: z.number().min(1).max(5).optional(),
		isVerified: z.boolean().optional(),
		isApproved: z.boolean().optional(),
	}),

	// 评价统计查询参数
	queryReviewStatsDto: z.object({
		productId: z.number(),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
// 类型来源于 Zod 推断，但用更语义化的名字导出
export type InsertReviewDto = z.infer<typeof reviewsModel.insertReviewDto>; // 请求用
export type UpdateReviewDto = z.infer<typeof reviewsModel.updateReviewDto>; // 请求用
export type ApproveReviewDto = z.infer<typeof reviewsModel.approveReviewDto>; // 审核用
export type SelectReviewType = z.infer<typeof reviewsModel.selectReviewTable>; // 查询返回原始类型
export type ReviewListQueryDto = z.infer<
	typeof reviewsModel.queryReviewListDto
>;
export type ReviewStatsQueryDto = z.infer<
	typeof reviewsModel.queryReviewStatsDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectReviewVo = SelectReviewType; // 可直接复用，或扩展字段（比如格式化日期等）

// 5. 关系定义
export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
	product: one(productsTable, {
		fields: [reviewsTable.productId],
		references: [productsTable.id],
	}),
}));
