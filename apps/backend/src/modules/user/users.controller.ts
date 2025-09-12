import { db } from "@backend/db/connection";
import { userSchema } from "@backend/db/schema";
import { NotFoundError } from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { UsersModel } from "./users.model";
import { UsersService } from "./users.service";
/**
 * 用户管理控制器
 * 处理用户相关的HTTP请求
 */
export const usersController = new Elysia({ prefix: "/users" })
	.decorate("usersService", new UsersService())
	.model(UsersModel)
	.guard({
		detail: {
			tags: ["Users"],
		},
	})

	// 获取用户列表
	.get(
		"/",
		async ({ query, usersService }) => {
			const users = await usersService.getUsers({
				search: query.search,
				status: undefined, // 可以根据需要添加状态筛选
			});
			return commonRes(users);
		},
		{
			query: "userQuery",
			detail: {
				summary: "获取用户列表",
				description: "分页获取用户列表，支持搜索、状态筛选和排序",
			},
		},
	)

	// 根据ID获取用户详情
	.get(
		"/:id",
		async ({ params, usersService }) => {
			const user = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.id, params.id));

			if (!user) {
				throw new NotFoundError("用户不存在");
			}

			return commonRes(user);
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				summary: "获取用户详情",
				description: "根据用户ID获取用户详细信息",
			},
		},
	)

	// 创建新用户
	.post(
		"/",
		async ({ body, usersService }) => {
			const user = await usersService.create(body);

			return commonRes(user);
		},
		{
			body: "createUser",
			detail: {
				summary: "创建用户",
				description: "创建新用户账户",
			},
		},
	)

	// 更新用户信息
	.put(
		"/:id",
		async ({ params, body, usersService }) => {
			const user = await usersService.update(params.id, body);

			return commonRes(user);
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			body: "updateUser",
			detail: {
				summary: "更新用户信息",
				description: "根据用户ID更新用户信息",
			},
		},
	)

	// 删除用户（软删除，设置状态为禁用）
	.delete(
		"/:id",
		async ({ params, usersService }) => {
			await usersService.delete(params.id);
			return commonRes(null, 200, "User deleted successfully");
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
			detail: {
				summary: "删除用户",
				description: "根据用户ID删除用户账户（软删除）",
			},
		},
	)

	// 批量更新用户状态
	.patch(
		"/batch-status",
		async ({ body, usersService }) => {
			const updatedCount = await usersService.updateStatusBatch(
				body.userIds,
				body.status,
			);

			return commonRes({ updatedCount });
		},
		{
			body: "batchUpdate",
			detail: {
				summary: "批量更新用户状态",
				description: "批量更新多个用户的状态（启用/禁用）",
			},
		},
	)

	// 获取管理员列表
	.get(
		"/admins",
		async ({ query, usersService }) => {
			const result = await usersService.findPaginated(
				{ page: query.page || 1, pageSize: query.pageSize || 10 },
				{
					filters: query.search
						? [
								{ field: "username", operator: "like", value: query.search },
								{ field: "role", operator: "eq", value: "admin" },
							]
						: [],
				},
			);
			return result;
		},
		{
			query: t.Object({
				page: t.Optional(t.Number({ minimum: 1 })),
				pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
				search: t.Optional(t.String()),
			}),
			detail: {
				summary: "获取管理员列表",
				description: "分页获取管理员用户列表，支持搜索",
			},
		},
	)

	// 获取用户统计信息
	.get(
		"/statistics",
		async ({ usersService }) => {
			const stats = await usersService.getStatistics();

			return commonRes(stats);
		},
		{
			detail: {
				summary: "获取用户统计信息",
				description: "获取用户总数、活跃用户数、禁用用户数等统计信息",
			},
		},
	)

	// 根据用户名查找用户
	.get(
		"/by-username/:username",
		async ({ params, usersService }) => {
			const user = await usersService.getByUsername(params.username);
			return commonRes(user);
		},
		{
			params: t.Object({
				username: t.String(),
			}),
			detail: {
				summary: "根据用户名查找用户",
				description: "根据用户名获取用户信息",
			},
		},
	)

	// 获取活跃用户列表
	.get(
		"/active",
		async ({ usersService }) => {
			const result = await usersService.getActiveUsers();

			return result;
		},
		{
			detail: {
				summary: "获取活跃用户列表",
				description: "获取所有状态为活跃的用户列表",
			},
		},
	);
