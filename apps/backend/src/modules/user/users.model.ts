import { paramId, UnoQuery } from "@backend/db/common.model";
import { DbType } from "@backend/db/database.typebox";
import { t } from "elysia";

// 用户模块的TypeBox模型定义
export const UsersModel = {
	// 路径参数
	id: paramId,
	// 创建用户 - 需要用户名和密码
	createUser: t.Composite([
		DbType.typebox.insert.userSchema,
		t.Object({
			username: t.String(),
			password: t.String(),
		}),
	]),

	// 更新用户 - 使用完整的insert schema
	updateUser: DbType.typebox.insert.userSchema,

	// 用户查询参数
	userQuery: t.Object({
		...UnoQuery.properties,
		status: t.Optional(t.Number({ description: "用户状态" })),
		sortBy: t.Optional(t.String({ description: "排序字段" })),
	}),

	// 批量操作
	batchUpdate: t.Object({
		userIds: t.Array(t.Number()),
		status: t.Number(),
	}),
};

// 从TypeBox模型获取TypeScript类型
export type CreateUser = typeof UsersModel.createUser.static;
export type UpdateUser = typeof UsersModel.updateUser.static;
export type UserQuery = typeof UsersModel.userQuery.static;
export type BatchUpdate = typeof UsersModel.batchUpdate.static;

// 从数据库schema获取实体类型
export type UserEntity = typeof DbType.typebox.select.userSchema.static;

// 用户查询过滤器
export interface UserQueryFilters {
	search?: string;
	status?: number;
}

// 用户统计信息
export interface UserStats {
	totalUsers: number;
	activeUsers: number;
	disabledUsers: number;
	todayNewUsers: number;
	userGrowthRate: string;
}

// 用户状态枚举 - 与数据库保持一致
export const UserStatus = {
	ACTIVE: 1,
	DISABLED: 0,
} as const;

// 用户角色枚举
export const UserRole = {
	ADMIN: "admin",
	USER: "user",
} as const;

// 导出模型类型
export type UsersModelType = typeof UsersModel;
