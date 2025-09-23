import { relations } from "drizzle-orm";
import {
	index,
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
import { UnoPageQueryZod } from "./utils";

// 用户状态枚举
export enum UserStatus {
	ACTIVE = "active",
	DISABLED = "disabled",
	PENDING = "pending",
	SUSPENDED = "suspended",
}

/**
 * 1. Drizzle 表定义
 * 用户表 - 存储用户基本信息
 */
export const usersTable = pgTable(
	"users",
	{
		id: serial("id").primaryKey(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(), // 存储加密后的密码
		email: varchar("email", { length: 100 }).unique().notNull(), // @typebox { format: 'email' }
		role: varchar("role", { length: 50 }).notNull().default("user"),
		nickname: varchar("nickname", { length: 50 }).notNull(),
		avatar: varchar("avatar", { length: 255 }),
		status: integer("status").notNull().default(1), // 1: 正常, 0: 禁用
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(users) => [index("user_id_idx").on(users.id)],
);

// 2. Zod Schema（基于 Drizzle 表生成，并可扩展校验）
export const insertUsersSchema = createInsertSchema(usersTable, {
	username: z
		.string()
		.min(3, "用户名至少3个字符")
		.max(50, "用户名不能超过50个字符")
		.regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
	password: z.string().min(6, "密码至少6个字符"),
	nickname: z.string().max(50, "昵称不能超过50个字符").optional(),
});

export const selectUsersSchema = createSelectSchema(usersTable);
export const updateUsersSchema = createUpdateSchema(usersTable);

// 3. 业务相关的 Zod Schema
export const usersModel = {
	// 基础 Schema
	insertUsersDto: insertUsersSchema,
	updateUsersDto: updateUsersSchema,
	selectUsersTable: selectUsersSchema,

	// 查询列表DTO
	queryUsersListDto: UnoPageQueryZod.extend({
		username: z.string().optional(),
		email: z.string().optional(),
		isActive: z.boolean().optional(),
		isVerified: z.boolean().optional(),
	}),

	// 用户注册DTO
	registerUserDto: z.object({
		username: z
			.string()
			.min(3, "用户名至少3个字符")
			.max(50, "用户名不能超过50个字符")
			.regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
		password: z.string().min(6, "密码至少6个字符"),
		nickname: z.string().max(50, "昵称不能超过50个字符").optional(),
	}),

	// 用户登录DTO
	loginUserDto: z.object({
		username: z.string().min(1, "用户名不能为空"),
		password: z.string().min(1, "密码不能为空"),
	}),

	// 更新用户资料DTO
	updateProfileDto: z.object({
		nickname: z.string().max(50, "昵称不能超过50个字符").optional(),
		avatar: z.string().url("头像必须是有效的URL").optional(),
		phone: z
			.string()
			.regex(/^1[3-9]\d{9}$/, "手机号格式不正确")
			.optional(),
		gender: z.enum(["male", "female", "other"]).optional(),
		birthday: z.string().datetime().optional(),
		bio: z.string().max(500, "个人简介不能超过500个字符").optional(),
	}),
	// 修改密码DTO
	changePasswordDto: z.object({
		oldPassword: z.string().min(1, "原密码不能为空"),
		newPassword: z.string().min(6, "新密码至少6个字符"),
	}),
};

// 3. 类型定义（可选，但推荐） 导出 TypeScript 类型（方便路由、service 等使用）
export type InsertUsersDto = z.infer<typeof usersModel.insertUsersDto>;
export type UpdateUsersDto = z.infer<typeof usersModel.updateUsersDto>;
export type SelectUsersType = z.infer<typeof usersModel.selectUsersTable>;
export type UsersListQueryDto = z.infer<typeof usersModel.queryUsersListDto>;
export type RegisterUserDto = z.infer<typeof usersModel.registerUserDto>;
export type LoginUserDto = z.infer<typeof usersModel.loginUserDto>;
export type UpdateProfileDto = z.infer<typeof usersModel.updateProfileDto>;
export type ChangePasswordDto = z.infer<typeof usersModel.changePasswordDto>;

// 4. 推荐再包装一层，用于前端展示（加 Vo 后缀，大驼峰）
export type SelectUsersVo = Omit<SelectUsersType, "password"> & {
	// 可以添加计算字段
	ageText?: string; // 年龄文本
	genderText?: string; // 性别文本
	statusText?: string; // 状态文本
	registrationDays?: number; // 注册天数
};

// 5. 额外的业务类型定义
export interface UserQueryFilters {
	username?: string;
	email?: string;
	status?: number; // 使用数字类型匹配数据库字段
	search?: string; // 搜索关键词
	isActive?: boolean;
	isVerified?: boolean;
	createdAfter?: Date;
	createdBefore?: Date;
}

export interface UserSortOptions {
	field: "id" | "username" | "email" | "createdAt" | "lastLoginAt";
	direction: "asc" | "desc";
}

export interface UserListResponse {
	users: SelectUsersVo[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const tokenTable = pgTable(
	"tokens",
	{
		id: serial("id").primaryKey(),
		ownerId: integer("owner_id")
			.notNull()
			.references(() => usersTable.id),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(token) => [index("token_id_idx").on(token.id)],
);
export const tokenRelations = relations(tokenTable, ({ one }) => ({
	owner: one(usersTable, {
		fields: [tokenTable.ownerId],
		references: [usersTable.id],
	}),
}));
