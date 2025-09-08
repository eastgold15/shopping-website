import { commonRes } from '@backend/utils/Res';
import { Elysia, t } from 'elysia';
import { partnersModel } from './partners.model';
import { PartnersService } from './partners.service';

/**
 * 合作伙伴控制器
 * 处理合作伙伴相关的HTTP请求
 */
export const partnersController = new Elysia({ prefix: '/partners', tags: ['Partners'] })
  .model(partnersModel)
  .decorate('partnersService', new PartnersService())
  .guard({
    beforeHandle({ params }) {
      // 转换路径参数 id 为数字
      if ('id' in params) {
        params.id = parseInt(params.id as string);
      }
    }
  })

  // 获取所有合作伙伴（前台用）
  .get('/list', async ({ partnersService }) => {
    try {
      const partners = await partnersService.getActivePartnersList();
      return commonRes(partners, 200, '获取合作伙伴列表成功');
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
      return commonRes(null, 500, '获取合作伙伴列表失败');
    }
  }, {
    detail: {
      tags: ['Partners'],
      summary: '获取合作伙伴列表',
      description: '获取启用的合作伙伴列表，按排序权重排序'
    }
  })

  // 获取所有合作伙伴（管理后台用）
  .get('', async ({ query, partnersService }) => {
    try {
      const result = await partnersService.getPartnersList(query);
      return pageRes(result.data, result.total, result.page, result.pageSize, '获取合作伙伴列表成功');
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
      return commonRes(null, 500, '获取合作伙伴列表失败');
    }
  }, {
    query: 'UnifiedQueryParams',
    detail: {
      tags: ['Partners'],
      summary: '获取合作伙伴列表（管理后台）',
      description: '获取合作伙伴列表，支持分页、搜索、排序'
    }
  })

  // 根据ID获取合作伙伴详情
  .get('/:id', async ({ params: { id }, partnersService }) => {
    try {
      const partner = await partnersService.getPartnerById(id);
      if (!partner) {
        return commonRes(null, 404, '合作伙伴不存在');
      }
      return commonRes(partner, 200, '获取合作伙伴详情成功');
    } catch (error) {
      console.error('获取合作伙伴详情失败:', error);
      return commonRes(null, 500, '获取合作伙伴详情失败');
    }
  }, {
    params: t.Object({
      id: t.Number()
    }),
    detail: {
      tags: ['Partners'],
      summary: '获取合作伙伴详情',
      description: '根据ID获取合作伙伴详情'
    }
  })

  // 创建合作伙伴
  .post('', async ({ body, partnersService }) => {
    try {
      const newPartner = await partnersService.createPartner(body);
      return commonRes(newPartner, 201, '创建合作伙伴成功');
    } catch (error) {
      console.error('创建合作伙伴失败:', error);
      return commonRes(null, 500, '创建合作伙伴失败');
    }
  }, {
    body: 'CreatePartnerDto',
    detail: {
      tags: ['Partners'],
      summary: '创建合作伙伴',
      description: '创建新的合作伙伴'
    }
  })

  // 更新合作伙伴
  .put('/:id', async ({ params: { id }, body, partnersService }) => {
    try {
      const updatedPartner = await partnersService.updatePartner(id, body);
      if (!updatedPartner) {
        return commonRes(null, 404, '合作伙伴不存在');
      }
      return commonRes(updatedPartner, 200, '更新合作伙伴成功');
    } catch (error) {
      console.error('更新合作伙伴失败:', error);
      return commonRes(null, 500, '更新合作伙伴失败');
    }
  }, {
    params: t.Object({
      id: t.Number()
    }),
    body: 'UpdatePartnerDto',
    detail: {
      tags: ['Partners'],
      summary: '更新合作伙伴',
      description: '更新合作伙伴信息'
    }
  })

  // 删除合作伙伴
  .delete('/:id', async ({ params: { id }, partnersService }) => {
    try {
      const success = await partnersService.deletePartner(id);
      if (!success) {
        return commonRes(null, 404, '合作伙伴不存在');
      }
      return commonRes(null, 200, '删除合作伙伴成功');
    } catch (error) {
      console.error('删除合作伙伴失败:', error);
      return commonRes(null, 500, '删除合作伙伴失败');
    }
  }, {
    params: t.Object({
      id: t.Number()
    }),
    detail: {
      tags: ['Partners'],
      summary: '删除合作伙伴',
      description: '删除指定的合作伙伴'
    }
  })

  // 更新合作伙伴排序
  .patch('/:id/sort', async ({ params: { id }, body, partnersService }) => {
    try {
      const updatedPartner = await partnersService.updatePartnerSort(id, body);
      if (!updatedPartner) {
        return commonRes(null, 404, '合作伙伴不存在');
      }
      return commonRes(updatedPartner, 200, '更新合作伙伴排序成功');
    } catch (error) {
      console.error('更新合作伙伴排序失败:', error);
      return commonRes(null, 500, '更新合作伙伴排序失败');
    }
  }, {
    body: 'UpdateSortRequest',
    detail: {
      tags: ['Partners'],
      summary: '更新合作伙伴排序',
      description: '更新合作伙伴的排序权重'
    }
  })

  // 切换合作伙伴启用状态
  .patch('/:id/toggle-active', async ({ params: { id }, partnersService }) => {
    try {
      const updatedPartner = await partnersService.togglePartnerActive(id);
      if (!updatedPartner) {
        return commonRes(null, 404, '合作伙伴不存在');
      }
      return commonRes(updatedPartner, 200, '切换合作伙伴状态成功');
    } catch (error) {
      console.error('切换合作伙伴状态失败:', error);
      return commonRes(null, 500, '切换合作伙伴状态失败');
    }
  }, {
    params: t.Object({
      id: t.Number()
    }),
    detail: {
      tags: ['Partners'],
      summary: '切换合作伙伴启用状态',
      description: '切换合作伙伴的启用/禁用状态'
    }
  });

function pageRes(data: { id: number; name: string; description: string; image: string; url: string; sortOrder: number | null; isActive: boolean | null; createdAt: Date | null; updatedAt: Date | null; }[], total: number, page: number, pageSize: number, arg4: string): any {
  throw new Error('Function not implemented.');
}
