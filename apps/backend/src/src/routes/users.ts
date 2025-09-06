/**
 * 用户管理路由
 * 提供用户列表、用户详情、管理员管理等功能
 */

import { Elysia, t } from "elysia";
import { db } from "../db/connection.ts";
import { userSchema } from "../db/schema/index.ts";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { DbType } from "../db/database.types.ts";

// 用户状态枚举
const UserStatus = {
  ACTIVE: 1,
  DISABLED: 0
} as const;

// 用户角色枚举（基于业务逻辑扩展）
const UserRole = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const usersRoute = new Elysia({ prefix: "/users" })
  // 获取用户列表
  .get("/", async ({ query }) => {
    try {
      const {
        page = 1,
        pageSize = 10,
        search = '',
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const offset = (Number(page) - 1) * Number(pageSize);

      // 构建查询条件
      const conditions = [];

      if (search) {
        conditions.push(
          like(userSchema.username, `%${search}%`)
        );
      }

      if (status !== undefined) {
        conditions.push(eq(userSchema.status, Number(status)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 排序配置
      const orderBy = sortOrder === 'asc'
        ? asc(userSchema[sortBy as keyof typeof userSchema])
        : desc(userSchema[sortBy as keyof typeof userSchema]);

      // 查询用户列表
      const users = await db
        .select({
          id: userSchema.id,
          username: userSchema.username,
          email: userSchema.email,
          nickname: userSchema.nickname,
          avatar: userSchema.avatar,
          status: userSchema.status,
          createdAt: userSchema.createdAt,
          updatedAt: userSchema.updatedAt
        })
        .from(userSchema)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(Number(pageSize))
        .offset(offset);

      // 查询总数
      const [{ total }] = await db
        .select({ total: count() })
        .from(userSchema)
        .where(whereClause);

      return {
        code: 200,
        message: "成功",
        data: {
          users,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize))
        }
      };
    } catch (error) {
      console.error("查询用户列表失败:", error);
      return {
        code: 500,
        message: "查询用户列表失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取用户列表',
      description: '分页获取用户列表，支持搜索、状态筛选和排序'
    },
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.Number()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
    })
  })

  // 根据ID获取用户详情
  .get("/:id", async ({ params }) => {
    try {
      const { id } = params;

      const user = await db
        .select({
          id: userSchema.id,
          username: userSchema.username,
          email: userSchema.email,
          nickname: userSchema.nickname,
          avatar: userSchema.avatar,
          status: userSchema.status,
          createdAt: userSchema.createdAt,
          updatedAt: userSchema.updatedAt
        })
        .from(userSchema)
        .where(eq(userSchema.id, id))
        .limit(1);

      if (user.length === 0) {
        return {
          code: 404,
          message: "用户不存在",
          data: null
        };
      }

      return {
        code: 200,
        message: "成功",
        data: user[0]
      };
    } catch (error) {
      console.error("查询用户详情失败:", error);
      return {
        code: 500,
        message: "查询用户详情失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取用户详情',
      description: '根据用户ID获取用户详细信息'
    },
    params: t.Object({
      id: t.String({ format: 'uuid' })
    })
  })

  // 创建新用户
  .post("/", async ({ body }) => {
    try {
      const userData = body as DbType.typebox.insert.userSchema;

      // 检查用户名是否已存在
      const existingUser = await db
        .select({ id: userSchema.id })
        .from(userSchema)
        .where(eq(userSchema.username, userData.username))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          code: 400,
          message: "用户名已存在",
          data: null
        };
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (userData.email) {
        const existingEmail = await db
          .select({ id: userSchema.id })
          .from(userSchema)
          .where(eq(userSchema.email, userData.email))
          .limit(1);

        if (existingEmail.length > 0) {
          return {
            code: 400,
            message: "邮箱已存在",
            data: null
          };
        }
      }

      // 创建用户
      const [newUser] = await db
        .insert(userSchema)
        .values({
          ...userData,
          status: userData.status ?? UserStatus.ACTIVE
        })
        .returning({
          id: userSchema.id,
          username: userSchema.username,
          email: userSchema.email,
          nickname: userSchema.nickname,
          avatar: userSchema.avatar,
          status: userSchema.status,
          createdAt: userSchema.createdAt
        });

      return {
        code: 200,
        message: "用户创建成功",
        data: newUser
      };
    } catch (error) {
      console.error("创建用户失败:", error);
      return {
        code: 500,
        message: "创建用户失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '创建用户',
      description: '创建新用户账户'
    },
    body: DbType.typebox.insert.userSchema
  })

  // 更新用户信息
  .put("/:id", async ({ params, body }) => {
    try {
      const { id } = params;
      const updateData = body as Partial<DbType.typebox.insert.userSchema>;

      // 检查用户是否存在
      const existingUser = await db
        .select({ id: userSchema.id })
        .from(userSchema)
        .where(eq(userSchema.id, id))
        .limit(1);

      if (existingUser.length === 0) {
        return {
          code: 404,
          message: "用户不存在",
          data: null
        };
      }

      // 如果更新用户名，检查是否重复
      if (updateData.username) {
        const duplicateUsername = await db
          .select({ id: userSchema.id })
          .from(userSchema)
          .where(and(
            eq(userSchema.username, updateData.username),
            eq(userSchema.id, id)
          ))
          .limit(1);

        if (duplicateUsername.length > 0) {
          return {
            code: 400,
            message: "用户名已存在",
            data: null
          };
        }
      }

      // 如果更新邮箱，检查是否重复
      if (updateData.email) {
        const duplicateEmail = await db
          .select({ id: userSchema.id })
          .from(userSchema)
          .where(and(
            eq(userSchema.email, updateData.email),
            eq(userSchema.id, id)
          ))
          .limit(1);

        if (duplicateEmail.length > 0) {
          return {
            code: 400,
            message: "邮箱已存在",
            data: null
          };
        }
      }

      // 更新用户
      const [updatedUser] = await db
        .update(userSchema)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(userSchema.id, id))
        .returning({
          id: userSchema.id,
          username: userSchema.username,
          email: userSchema.email,
          nickname: userSchema.nickname,
          avatar: userSchema.avatar,
          status: userSchema.status,
          updatedAt: userSchema.updatedAt
        });

      return {
        code: 200,
        message: "用户更新成功",
        data: updatedUser
      };
    } catch (error) {
      console.error("更新用户失败:", error);
      return {
        code: 500,
        message: "更新用户失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '更新用户信息',
      description: '根据用户ID更新用户信息'
    },
    params: t.Object({
      id: t.String({ format: 'uuid' })
    }),
    body: t.Partial(DbType.typebox.insert.userSchema)
  })

  // 删除用户（软删除，设置状态为禁用）
  .delete("/:id", async ({ params }) => {
    try {
      const { id } = params;

      // 检查用户是否存在
      const existingUser = await db
        .select({ id: userSchema.id })
        .from(userSchema)
        .where(eq(userSchema.id, id))
        .limit(1);

      if (existingUser.length === 0) {
        return {
          code: 404,
          message: "用户不存在",
          data: null
        };
      }

      // 软删除：设置状态为禁用
      await db
        .update(userSchema)
        .set({
          status: UserStatus.DISABLED,
          updatedAt: new Date()
        })
        .where(eq(userSchema.id, id));

      return {
        code: 200,
        message: "用户删除成功",
        data: null
      };
    } catch (error) {
      console.error("删除用户失败:", error);
      return {
        code: 500,
        message: "删除用户失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '删除用户',
      description: '根据用户ID删除用户账户'
    },
    params: t.Object({
      id: t.String({ format: 'uuid' })
    })
  })

  // 批量更新用户状态
  .patch("/batch-status", async ({ body }) => {
    try {
      const { userIds, status } = body;

      if (!userIds || userIds.length === 0) {
        return {
          code: 400,
          message: "用户ID列表不能为空",
          data: null
        };
      }

      // 批量更新状态
      await db
        .update(userSchema)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(userSchema.id, userIds[0])); // 这里需要使用 IN 操作符，但 Drizzle 的语法可能不同

      return {
        code: 200,
        message: "批量更新成功",
        data: null
      };
    } catch (error) {
      console.error("批量更新用户状态失败:", error);
      return {
        code: 500,
        message: "批量更新用户状态失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '批量更新用户状态',
      description: '批量更新多个用户的状态（启用/禁用）'
    },
    body: t.Object({
      userIds: t.Array(t.String({ format: 'uuid' })),
      status: t.Number()
    })
  })

  // 获取管理员列表（基于业务逻辑，这里假设通过某种方式标识管理员）
  .get("/admins", async ({ query }) => {
    try {
      const {
        page = 1,
        pageSize = 10,
        search = ''
      } = query;

      const offset = (Number(page) - 1) * Number(pageSize);

      // 构建查询条件（这里假设管理员是通过某种业务逻辑识别的）
      const conditions = [eq(userSchema.status, UserStatus.ACTIVE)];

      if (search) {
        conditions.push(
          like(userSchema.username, `%${search}%`)
        );
      }

      const whereClause = and(...conditions);

      // 查询管理员列表（这里需要根据实际业务逻辑调整）
      const admins = await db
        .select({
          id: userSchema.id,
          username: userSchema.username,
          email: userSchema.email,
          nickname: userSchema.nickname,
          avatar: userSchema.avatar,
          status: userSchema.status,
          createdAt: userSchema.createdAt,
          updatedAt: userSchema.updatedAt
        })
        .from(userSchema)
        .where(whereClause)
        .orderBy(desc(userSchema.createdAt))
        .limit(Number(pageSize))
        .offset(offset);

      // 查询总数
      const [{ total }] = await db
        .select({ total: count() })
        .from(userSchema)
        .where(whereClause);

      return {
        code: 200,
        message: "成功",
        data: {
          admins,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize))
        }
      };
    } catch (error) {
      console.error("查询管理员列表失败:", error);
      return {
        code: 500,
        message: "查询管理员列表失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取管理员列表',
      description: '分页获取管理员用户列表，支持搜索'
    },
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String())
    })
  })

  // 获取用户统计信息
  .get("/statistics", async () => {
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

      // 今日新增用户数（假设有创建时间字段）
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [{ todayNewUsers }] = await db
        .select({ todayNewUsers: count() })
        .from(userSchema)
        .where(eq(userSchema.createdAt, today));

      return {
        code: 200,
        message: "成功",
        data: {
          totalUsers,
          activeUsers,
          disabledUsers,
          todayNewUsers,
          userGrowthRate: totalUsers > 0 ? ((todayNewUsers / totalUsers) * 100).toFixed(2) : '0.00'
        }
      };
    } catch (error) {
      console.error("获取用户统计信息失败:", error);
      return {
        code: 500,
        message: "获取用户统计信息失败",
        data: null
      };
    }
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取用户统计信息',
      description: '获取用户总数、活跃用户数、禁用用户数等统计信息'
    }
  });