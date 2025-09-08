import { Elysia, t } from 'elysia';

import { usersModel } from './users.model';
import { UserService } from './users.service';
import { NotFoundError } from '@backend/utils/error/customError';
import { commonRes } from '@backend/utils/Res';

/**
 * 用户管理控制器
 * 处理用户相关的HTTP请求
 */
export const usersController = new Elysia({ prefix: '/users' })
  .decorate('usersService', new UserService())
  .model(usersModel)
  .guard({
    detail: {
      tags: ['Users']
    }
  })

  // 获取用户列表
  .get('/', async ({ query, usersService }) => {
    const result = await usersService.findPaginated(
      { page: query.page || 1, pageSize: query.pageSize || 10 },
      {
        filters: query.search ?
          [{ field: 'username', operator: 'like', value: query.search }] : [],
        sort: query.sortBy ? [{ field: query.sortBy, direction: query.sortBy || 'desc' }] : []
      }
    );
    return result
  }, {
    query: 'userQuery',
    detail: {
      summary: '获取用户列表',
      description: '分页获取用户列表，支持搜索、状态筛选和排序'
    }
  })

  // 根据ID获取用户详情
  .get('/:id', async ({ params, usersService }) => {
    const result = await usersService.findById(params.id);



    if (!result.data) {
      throw new NotFoundError('用户不存在');
    }

    return result
  }, {
    params: t.Object({
      id: t.Number()
    }),
    detail: {
      summary: '获取用户详情',
      description: '根据用户ID获取用户详细信息'
    }
  })

  // 创建新用户
  .post('/', async ({ body, usersService }) => {
    const result = await usersService.create(body as any);



    return commonRes(result.data);
  }, {
    body: 'createUser',
    detail: {
      summary: '创建用户',
      description: '创建新用户账户'
    }
  })

  // 更新用户信息
  .put('/:id', async ({ params, body, usersService }) => {
    const result = await usersService.update(params.id, body as any);



    return commonRes(result.data);
  }, {
    params: t.Object({
      id: t.Number()
    }),
    body: 'updateUser',
    detail: {
      summary: '更新用户信息',
      description: '根据用户ID更新用户信息'
    }
  })

  // 删除用户（软删除，设置状态为禁用）
  .delete('/:id', async ({ params, usersService }) => {
    const result = await usersService.delete(params.id);



    return commonRes({ success: true });
  }, {
    params: t.Object({
      id: t.Number()
    }),
    detail: {
      summary: '删除用户',
      description: '根据用户ID删除用户账户（软删除）'
    }
  })

  // 批量更新用户状态
  .patch('/batch-status', async ({ body, usersService }) => {
    const result = await usersService.batchUpdateStatus(body.userIds, body.status);

    return commonRes({
      success: true,
      updatedCount: result.data
    });
  }, {
    body: 'batchUpdate',
    detail: {
      summary: '批量更新用户状态',
      description: '批量更新多个用户的状态（启用/禁用）'
    }
  })

  // 获取管理员列表
  .get('/admins', async ({ query, usersService }) => {
    const result = await usersService.findPaginated(
      { page: query.page || 1, pageSize: query.pageSize || 10 },
      {
        filters: query.search ?
          [{ field: 'username', operator: 'like', value: query.search },
          { field: 'role', operator: 'eq', value: 'admin' }
          ] : [],
      }
    );
    return result

  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String())
    }),
    detail: {
      summary: '获取管理员列表',
      description: '分页获取管理员用户列表，支持搜索'
    }
  })

  // 获取用户统计信息
  .get('/statistics', async ({ usersService }) => {
    const result = await usersService.getStatistics();



    return result
  }, {
    detail: {
      summary: '获取用户统计信息',
      description: '获取用户总数、活跃用户数、禁用用户数等统计信息'
    }
  })

  // 根据用户名查找用户
  .get('/by-username/:username', async ({ params, usersService }) => {
    const result = await usersService.findByUsername(params.username);


    if (!result.data) {
      throw new NotFoundError('用户不存在');

    }

    return result
  }, {
    params: t.Object({
      username: t.String()
    }),
    detail: {
      summary: '根据用户名查找用户',
      description: '根据用户名获取用户信息'
    }
  })

  // 获取活跃用户列表
  .get('/active', async ({ usersService }) => {
    const result = await usersService.findActiveUsers();



    return result
  }, {
    detail: {
      summary: '获取活跃用户列表',
      description: '获取所有状态为活跃的用户列表'
    }
  });