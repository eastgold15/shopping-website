import { db } from "@backend/db/connection";
import { paramIdZod } from "@backend/types";
import { NotFoundError } from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { usersModel, usersTable } from "../../db/models/users.model";
import { UsersService } from "./users.service";
/**
 * 用户管理控制器
 * 处理用户相关的HTTP请求
 */
export const usersController = new Elysia({ prefix: "/users" })
  .decorate("usersService", new UsersService())
  .model(usersModel)
  .guard({
    detail: {
      tags: ["Users"],
    },
  })

  // 获取用户列表 - RESTful标准设计，支持角色和状态筛选
  .get(
    "/",
    async ({ query, usersService }) => {
      const users = await usersService.getUsers({
        search: query.search,

      });
      return commonRes(users);
    },
    {
      query: "queryUsersListDto",
      detail: {
        summary: "获取用户列表",
        description: "分页获取用户列表，支持搜索、角色筛选、状态筛选和排序。使用role=admin获取管理员列表，status=active获取活跃用户",
      },
    },
  )

  // 根据ID获取用户详情
  .get(
    "/:id",
    async ({ params, usersService }) => {
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, params.id));

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
      body: "insertUsersDto",
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
      params: paramIdZod,
      body: "updateUsersDto",
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

  // // 批量更新用户状态
  // .patch(
  //   "/batch-status",
  //   async ({ body, usersService }) => {
  //     const updatedCount = await usersService.updateStatusBatch(
  //       body.userIds,
  //       body.status,
  //     );

  //     return commonRes({ updatedCount });
  //   },
  //   {
  //     body: "updateUsersDto",
  //     detail: {
  //       summary: "批量更新用户状态",
  //       description: "批量更新多个用户的状态（启用/禁用）",
  //     },
  //   },
  // )

  // 获取用户统计信息 - 作为子资源
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

  // 根据用户名查找用户 - 保留特殊查询接口
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
  );
