/**
 * 用户管理路由
 * 提供用户列表、用户详情、管理员管理等功能
 */

import { Elysia, t } from "elysia";
import { UserService } from "./service";
import { userModel, UserStatus } from "./model";
import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import path from "path";
export const userController = new Elysia({ prefix: "/users" })
  .model(userModel)
  .decorate("userService", new UserService())
  .get("xx/:id", async ({ params, userService }) => "sss", {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.Number()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
    })
  })
  // 获取用户列表
  .get("/", async ({ query, userService }) => {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filters = {
      search: search || undefined,
      status: status !== undefined ? Number(status) : undefined
    };

    return await userService.findPaginated(
      { page: Number(page), pageSize: Number(pageSize) },
      {
        filters: search ? [{ field: 'username', operator: 'like', value: search }] : [],
        sort: sortBy ? [{ field: sortBy, direction: sortOrder as 'asc' | 'desc' }] : []
      }
    );
  }, {
    query: 'userQuery',
    detail: {
      tags: ['用户管理'],
      summary: '获取用户列表',
      description: '分页获取用户列表，支持搜索、状态筛选和排序'
    },

  })

  // 根据ID获取用户详情
  .get("/:id", async ({ params, userService }) => {
    return await userService.findById(params.id);
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
  .post("/", async ({ body, userService }) => {
    return await userService.create(body);
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '创建用户',
      description: '创建新用户账户'
    },
    body: 'createUser'
  })

  // 更新用户信息
  .put("/:id", async ({ params, body, userService }) => {
    return await userService.update(params.id, body);
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '更新用户信息',
      description: '根据用户ID更新用户信息'
    },
    params: t.Object({
      id: t.String({ format: 'uuid' })
    }),
    body: 'updateUser'
  })

  // 删除用户（软删除，设置状态为禁用）
  .delete("/:id", async ({ params, userService }) => {
    return await userService.softDelete(params.id);
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '删除用户',
      description: '根据用户ID删除用户账户（软删除）'
    },
    params: t.Object({
      id: t.String({ format: 'uuid' })
    })
  })

  // 批量更新用户状态
  .patch("/batch-status", async ({ body, userService }) => {
    return await userService.batchUpdateStatus(body.userIds, body.status);
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '批量更新用户状态',
      description: '批量更新多个用户的状态（启用/禁用）'
    },
    body: 'batchUpdate'
  })

  // 获取管理员列表
  .get("/admins", async ({ query, userService }) => {
    const { page = 1, pageSize = 10, search = '' } = query;

    const filters = {
      search: search || undefined,
      status: UserStatus.ACTIVE
    };

    return await userService.findPaginated(
      { page: Number(page), pageSize: Number(pageSize) },
      {
        filters: search ? [{ field: 'username', operator: 'like', value: search }] : [],
        sort: [{ field: 'createdAt', direction: 'desc' }]
      }
    );
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
  .get("/statistics", async ({ userService }) => {
    return await userService.getUserStats();
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取用户统计信息',
      description: '获取用户总数、活跃用户数、禁用用户数等统计信息'
    }
  })

  // 根据用户名查找用户
  .get("/by-username/:username", async ({ params, userService }) => {
    return await userService.findByUsername(params.username);
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '根据用户名查找用户',
      description: '根据用户名获取用户信息'
    },
    params: t.Object({
      username: t.String()
    })
  })

  // 获取活跃用户列表
  .get("/active", async ({ userService }) => {
    return await userService.getActiveUsers();
  }, {
    detail: {
      tags: ['用户管理'],
      summary: '获取活跃用户列表',
      description: '获取所有状态为活跃的用户列表'
    }
  });