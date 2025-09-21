import { db } from "@backend/db/connection";
import {
	CustomError,
	handleDatabaseError,
	NotFoundError,
	ValidationError,
} from "@backend/utils/error/customError";
import { BaseService } from "@backend/utils/services/BaseService";
import { and, count, desc, eq, inArray, like } from "drizzle-orm";
import {
	type InsertUsersDto,
	type SelectUsersType,
	type UpdateUsersDto,
	type UserQueryFilters,
	UserStatus,
	usersTable,
} from "../../db/models/users.model";

// 用户统计信息接口
export interface UserStats {
	totalUsers: number;
	activeUsers: number;
	disabledUsers: number;
	newUsersThisMonth: number;
	todayNewUsers: number;
	userGrowthRate: string;
}

export class UsersService extends BaseService<
	SelectUsersType,
	InsertUsersDto,
	UpdateUsersDto
> {
	protected readonly table = usersTable;
	protected readonly tableName = "users";
	/**
	 * 创建用户前的验证
	 */
	protected async validateCreate(data: InsertUsersDto): Promise<void> {
		// 检查用户名是否已存在
		const existingUser = await db
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(eq(usersTable.username, data.username))
			.limit(1);

		if (existingUser.length > 0) {
			throw new ValidationError("用户名已存在");
		}

		// 检查邮箱是否已存在（如果提供了邮箱）
		if (data.email) {
			const existingEmail = await db
				.select({ id: usersTable.id })
				.from(usersTable)
				.where(eq(usersTable.email, data.email))
				.limit(1);

			if (existingEmail.length > 0) {
				throw new ValidationError("邮箱已存在");
			}
		}
	}

	/**
	 * 更新用户前的验证
	 */
	protected async validateUpdate(data: UpdateUsersDto): Promise<void> {
		// 这里可以添加更新前的验证逻辑
		// 例如：如果更新用户名，检查是否重复
		if (data.username) {
			// 注意：这里需要在实际更新时排除当前用户
			// 具体逻辑会在update方法中处理
		}
	}

	/**
	 * 根据用户名查找用户
	 */
	async getByUsername(username: string): Promise<SelectUsersType> {
		try {
			const result = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.username, username))
				.limit(1);

			if (!result[0]) {
				throw new NotFoundError(`用户名为 ${username} 的用户不存在`);
			}

			return result[0];
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	async getActiveUsers(): Promise<SelectUsersType[]> {
		try {
			const result = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.status, 1)) // 1: 正常状态
				.orderBy(desc(usersTable.createdAt));

			return result;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据邮箱查找用户
	 */
	async getByEmail(email: string): Promise<SelectUsersType> {
		try {
			const result = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.email, email))
				.limit(1);

			if (!result[0]) {
				throw new NotFoundError(`邮箱为 ${email} 的用户不存在`);
			}

			return result[0];
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 获取用户列表（带搜索和筛选）
	 */
	async getUsers(filters: UserQueryFilters): Promise<SelectUsersType[]> {
		try {
			const conditions = [];

			if (filters.search) {
				conditions.push(like(usersTable.username, `%${filters.search}%`));
			}

			if (filters.status !== undefined) {
				conditions.push(eq(usersTable.status, filters.status));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const result = await db
				.select()
				.from(usersTable)
				.where(whereClause)
				.orderBy(desc(usersTable.createdAt));

			return result;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 获取用户统计信息
	 */
	async getStatistics(): Promise<UserStats> {
		try {
			// 总用户数
			const [{ totalUsers }] = await db
				.select({ totalUsers: count() })
				.from(usersTable);

			// 活跃用户数
			const [{ activeUsers }] = await db
				.select({ activeUsers: count() })
				.from(usersTable)
				.where(eq(usersTable.status, 1)); // 1: 正常状态

			// 禁用用户数
			const [{ disabledUsers }] = await db
				.select({ disabledUsers: count() })
				.from(usersTable)
				.where(eq(usersTable.status, 0)); // 0: 禁用状态

			// 今日新增用户数
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const [{ todayNewUsers }] = await db
				.select({ todayNewUsers: count() })
				.from(usersTable)
				.where(eq(usersTable.createdAt, today));

			const stats: UserStats = {
				totalUsers,
				activeUsers,
				disabledUsers,
				newUsersThisMonth: 0, // TODO: 实现本月新用户统计
				todayNewUsers,
				userGrowthRate:
					totalUsers > 0
						? ((todayNewUsers / totalUsers) * 100).toFixed(2)
						: "0.00",
			};

			return stats;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 批量更新用户状态
	 */
	async updateStatusBatch(userIds: number[], status: number): Promise<number> {
		try {
			if (!userIds || userIds.length === 0) {
				throw new ValidationError("用户ID列表不能为空");
			}

			if (!Object.values(UserStatus).includes(status as any)) {
				throw new ValidationError("无效的用户状态");
			}

			const result = await db
				.update(usersTable)
				.set({
					status,
					updatedAt: new Date(),
				})
				.where(inArray(usersTable.id, userIds))
				.returning({ id: usersTable.id });

			return result.length;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 软删除用户（设置状态为禁用）
	 */
	async softDelete(id: number): Promise<boolean> {
		try {
			if (!id || id <= 0) {
				throw new ValidationError("无效的用户ID");
			}

			// 检查用户是否存在
			const [existing] = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, id));
			if (!existing) {
				throw new NotFoundError(`用户不存在`);
			}

			// 软删除：设置状态为禁用
			await db
				.update(usersTable)
				.set({
					status: 0, // 0: 禁用状态
					updatedAt: new Date(),
				})
				.where(eq(usersTable.id, id));

			return true;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}
}
