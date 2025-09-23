import {
	decimal,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { UnoPageQueryZod } from "./utils";

/**
 * 1. Drizzle 表定义
 * 统计表 - 存储网站统计数据
 */
export const statisticsTable = pgTable("statistics", {
	id: serial("id").primaryKey(), // 统计记录唯一标识
	date: varchar("date", { length: 10 }).notNull(), // 统计日期 (YYYY-MM-DD)
	type: varchar("type", { length: 50 }).notNull(), // 统计类型
	category: varchar("category", { length: 50 }), // 统计分类
	value: decimal("value", { precision: 15, scale: 2 }).notNull(), // 统计值
	count: integer("count").default(0), // 计数
	metadata: varchar("metadata", { length: 1000 }), // 元数据 (JSON格式)
	createdAt: timestamp("created_at").defaultNow(), // 创建时间
	updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertStatisticsSchema = createInsertSchema(statisticsTable, {
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为YYYY-MM-DD"),
	type: z
		.string()
		.min(1, "统计类型不能为空")
		.max(50, "统计类型不能超过50个字符"),
	category: z.string().max(50, "统计分类不能超过50个字符").optional(),
	value: z.string().regex(/^\d+(\.\d{1,2})?$/, "统计值格式不正确"),
	count: z.number().int().min(0, "计数不能为负数").optional(),
});

export const selectStatisticsSchema = createSelectSchema(statisticsTable);
export const updateStatisticsSchema = createUpdateSchema(statisticsTable);

// 3. 业务相关的 Zod Schema
export const statisticsModel = {
	// 基础 Schema
	insertStatisticsDto: insertStatisticsSchema,
	updateStatisticsDto: updateStatisticsSchema.partial(),
	selectStatisticsTable: selectStatisticsSchema,

	// 查询列表DTO
	queryStatisticsListDto: UnoPageQueryZod.extend({
		date: z.string().optional(),
		type: z.string().optional(),
		category: z.string().optional(),
		startDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "开始日期格式必须为YYYY-MM-DD")
			.optional(),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "结束日期格式必须为YYYY-MM-DD")
			.optional(),
	}),

	// 统计概览DTO
	statisticsOverviewDto: z.object({
		period: z.enum(["today", "week", "month", "year"]).default("today"),
		types: z.array(z.string()).optional(),
	}),

	// 统计图表DTO
	statisticsChartDto: z.object({
		type: z.string().min(1, "统计类型不能为空"),
		period: z.enum(["7days", "30days", "90days", "year"]).default("30days"),
		category: z.string().optional(),
	}),

	// 批量插入统计DTO
	batchInsertStatisticsDto: z.object({
		statistics: z
			.array(
				z.object({
					date: z
						.string()
						.regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为YYYY-MM-DD"),
					type: z.string().min(1, "统计类型不能为空"),
					category: z.string().optional(),
					value: z.string().regex(/^\d+(\.\d{1,2})?$/, "统计值格式不正确"),
					count: z.number().int().min(0, "计数不能为负数").optional(),
					metadata: z.string().optional(),
				}),
			)
			.min(1, "至少需要一条统计数据"),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
export type InsertStatisticsDto = z.infer<
	typeof statisticsModel.insertStatisticsDto
>;
export type UpdateStatisticsDto = z.infer<
	typeof statisticsModel.updateStatisticsDto
>;
export type SelectStatisticsType = z.infer<
	typeof statisticsModel.selectStatisticsTable
>;
export type StatisticsListQueryDto = z.infer<
	typeof statisticsModel.queryStatisticsListDto
>;
export type StatisticsOverviewDto = z.infer<
	typeof statisticsModel.statisticsOverviewDto
>;
export type StatisticsChartDto = z.infer<
	typeof statisticsModel.statisticsChartDto
>;
export type BatchInsertStatisticsDto = z.infer<
	typeof statisticsModel.batchInsertStatisticsDto
>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectStatisticsVo = SelectStatisticsType & {
	// 可以添加计算字段
	typeText?: string; // 类型文本
	categoryText?: string; // 分类文本
	formattedValue?: string; // 格式化的值
	trend?: "up" | "down" | "stable"; // 趋势
	changeRate?: number; // 变化率
	parsedMetadata?: Record<string, any>; // 解析后的元数据
};

// 统计类型常量
export const STATISTICS_TYPES = {
	// 用户相关
	USER_REGISTRATION: "user_registration", // 用户注册
	USER_LOGIN: "user_login", // 用户登录
	USER_ACTIVE: "user_active", // 活跃用户

	// 订单相关
	ORDER_CREATE: "order_create", // 订单创建
	ORDER_PAYMENT: "order_payment", // 订单支付
	ORDER_COMPLETE: "order_complete", // 订单完成

	// 商品相关
	PRODUCT_VIEW: "product_view", // 商品浏览
	PRODUCT_SEARCH: "product_search", // 商品搜索
	PRODUCT_FAVORITE: "product_favorite", // 商品收藏

	// 收入相关
	REVENUE_DAILY: "revenue_daily", // 日收入
	REVENUE_MONTHLY: "revenue_monthly", // 月收入
	REVENUE_YEARLY: "revenue_yearly", // 年收入

	// 流量相关
	TRAFFIC_PV: "traffic_pv", // 页面浏览量
	TRAFFIC_UV: "traffic_uv", // 独立访客
	TRAFFIC_SESSION: "traffic_session", // 会话数
} as const;
