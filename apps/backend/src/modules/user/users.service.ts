import { db } from "@backend/db/connection";
import { userSchema } from "@backend/db/schema";
import {
	CustomeError,
	handleDatabaseError,
	NotFoundError,
	ValidationError,
} from "@backend/utils/error/customError";
import { BaseService } from "@backend/utils/services/BaseService";
import { and, count, desc, eq, inArray, like } from "drizzle-orm";
import {
	type CreateUser,
	type UpdateUser,
	type UserEntity,
	type UserQueryFilters,
	type UserStats,
	UserStatus,
} from "./users.model";

export class UsersService extends BaseService<
	UserEntity,
	CreateUser,
	UpdateUser
> {
	constructor() {
		super(userSchema, "users");
	}

	/**
	 * 创建用户前的验证
	 */
	protected async validateCreate(data: CreateUser): Promise<void> {
		// 检查用户名是否已存在
		const existingUser = await db
			.select({ id: userSchema.id })
			.from(userSchema)
			.where(eq(userSchema.username, data.username))
			.limit(1);

		if (existingUser.length > 0) {
			throw new ValidationError("用户名已存在");
		}

		// 检查邮箱是否已存在（如果提供了邮箱）
		if (data.email) {
			const existingEmail = await db
				.select({ id: userSchema.id })
				.from(userSchema)
				.where(eq(userSchema.email, data.email))
				.limit(1);

			if (existingEmail.length > 0) {
				throw new ValidationError("邮箱已存在");
			}
		}
	}

	/**
	 * 更新用户前的验证
	 */
	protected async validateUpdate(data: UpdateUser): Promise<void> {
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
	async getByUsername(username: string): Promise<UserEntity> {
		try {
			const [result] = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.username, username));

			if (!result) {
				throw new NotFoundError(`用户名为 ${username} 的用户不存在`);
			}

			return result;
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	async getActiveUsers(): Promise<UserEntity[]> {
		try {
			const result = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.status, UserStatus.ACTIVE))
				.orderBy(desc(userSchema.createdAt));

			return result;
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 根据邮箱查找用户
	 */
	async getByEmail(email: string): Promise<UserEntity> {
		try {
			const result = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.email, email))
				.limit(1);

			if (!result[0]) {
				throw new NotFoundError(`邮箱为 ${email} 的用户不存在`);
			}

			return result[0];
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 获取用户列表（带搜索和筛选）
	 */
	async getUsers(filters: UserQueryFilters): Promise<UserEntity[]> {
		try {
			const conditions = [];

			if (filters.search) {
				conditions.push(like(userSchema.username, `%${filters.search}%`));
			}

			if (filters.status !== undefined) {
				conditions.push(eq(userSchema.status, filters.status));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const result = await db
				.select()
				.from(userSchema)
				.where(whereClause)
				.orderBy(desc(userSchema.createdAt));

			return result;
		} catch (error) {
			if (error instanceof CustomeError) {
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
				.from(userSchema);

			// 活跃用户数
			const [{ activeUsers }] = await db
				.select({ activeUsers: count() })
				.from(userSchema)
				.where(eq(userSchema.status, UserStatus.ACTIVE));

			// 禁用用户数
			const [{ disabledUsers }] = await db
				.select({ disabledUsers: count() })
				.from(userSchema)
				.where(eq(userSchema.status, UserStatus.DISABLED));

			// 今日新增用户数
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const [{ todayNewUsers }] = await db
				.select({ todayNewUsers: count() })
				.from(userSchema)
				.where(eq(userSchema.createdAt, today));

			const stats: UserStats = {
				totalUsers,
				activeUsers,
				disabledUsers,
				todayNewUsers,
				userGrowthRate:
					totalUsers > 0
						? ((todayNewUsers / totalUsers) * 100).toFixed(2)
						: "0.00",
			};

			return stats;
		} catch (error) {
			if (error instanceof CustomeError) {
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
				.update(userSchema)
				.set({
					status,
					updatedAt: new Date(),
				})
				.where(inArray(userSchema.id, userIds))
				.returning({ id: userSchema.id });

			return result.length;
		} catch (error) {
			if (error instanceof CustomeError) {
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
				.from(userSchema)
				.where(eq(userSchema.id, id));
			if (!existing) {
				throw new NotFoundError(`用户不存在`);
			}

			// 软删除：设置状态为禁用
			await db
				.update(userSchema)
				.set({
					status: UserStatus.DISABLED,
					updatedAt: new Date(),
				})
				.where(eq(userSchema.id, id));

			return true;
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}
}
