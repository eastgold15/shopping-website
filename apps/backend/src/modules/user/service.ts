import { db } from "@backend/db/connection";
import { userSchema } from "@backend/db/schema";
import {
	CustomeError,
	handleDatabaseError,
	NotFoundError,
	ValidationError,
} from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import { BaseService } from "@backend/utils/services/BaseService";
import type { ServiceResponse } from "@backend/utils/services/types";
import { and, count, desc, eq, inArray, like } from "drizzle-orm";
import {
	type CreateUser,
	type UpdateUser,
	type UserEntity,
	type UserQueryFilters,
	type UserStats,
	UserStatus,
} from "./model";

export class UserService extends BaseService<
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
	async findByUsername(
		username: string,
	): Promise<ServiceResponse<UserEntity | null>> {
		try {
			const result = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.username, username))
				.limit(1);

			if (!result || result.length === 0) {
				return commonRes(null);
			}

			return commonRes(result[0]);
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
	async findByEmail(
		email: string,
	): Promise<ServiceResponse<UserEntity | null>> {
		try {
			const result = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.email, email))
				.limit(1);

			if (!result || result.length === 0) {
				return commonRes(null);
			}

			return commonRes(result[0]);
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
	async findUsers(
		filters: UserQueryFilters,
	): Promise<ServiceResponse<UserEntity[]>> {
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

			return commonRes(result);
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
	async getUserStats(): Promise<ServiceResponse<UserStats>> {
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

			return commonRes(stats);
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
	async batchUpdateStatus(
		userIds: number[],
		status: number,
	): Promise<ServiceResponse<number>> {
		try {
			if (!userIds || userIds.length === 0) {
				throw new ValidationError("用户ID列表不能为空");
			}

			const result = await db
				.update(userSchema)
				.set({
					status,
					updatedAt: new Date(),
				})
				.where(inArray(userSchema.id, userIds))
				.returning({ id: userSchema.id });

			const updatedCount = result.length;
			return commonRes(updatedCount);
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
	async softDelete(id: number): Promise<ServiceResponse<boolean>> {
		try {
			// 检查用户是否存在
			const existing = await this.findById(id);
			if (!existing.data || existing.data == null) {
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

			return commonRes(true);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 获取活跃用户列表
	 */
	async getActiveUsers(): Promise<ServiceResponse<UserEntity[]>> {
		try {
			const result = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.status, UserStatus.ACTIVE))
				.orderBy(desc(userSchema.createdAt));

			return commonRes(result);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			throw handleDatabaseError(error);
		}
	}
}
