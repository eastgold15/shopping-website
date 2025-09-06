import { client } from './useTreaty';
import { handleApiRes } from './handleApiRes';

// 导出统一的API处理函数
export { handleApiRes };

// 导出客户端实例
export { client };

// 便捷的API调用方法
export const api = {
  // 商品相关
  products: {
    list: (params?: any) => handleApiRes(client.api.products.get({ query: params })),
    search: (params?: any) => handleApiRes(client.api.products.search.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.products[':id'].get({ params: { id } })),
    getBySlug: (slug: string) => handleApiRes(client.api.products[':slug'].get({ params: { slug } })),
    create: (data: any) => handleApiRes(client.api.products.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.products[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.products[':id'].delete({ params: { id } })),
    filterOptions: () => handleApiRes(client.api.products['filter-options'].get()),
    popularTerms: () => handleApiRes(client.api.products.search['popular-terms'].get()),
  },
  
  // 分类相关
  categories: {
    list: (params?: any) => handleApiRes(client.api.categories.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.categories[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.categories.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.categories[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.categories[':id'].delete({ params: { id } })),
  },
  
  // 订单相关
  orders: {
    list: (params?: any) => handleApiRes(client.api.orders.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.orders[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.orders.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.orders[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.orders[':id'].delete({ params: { id } })),
  },
  
  // 用户相关
  users: {
    list: (params?: any) => handleApiRes(client.api.users.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.users[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.users.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.users[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.users[':id'].delete({ params: { id } })),
  },
  
  // 站点配置相关
  siteConfigs: {
    list: (params?: any) => handleApiRes(client.api.siteConfigs.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.siteConfigs[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.siteConfigs.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.siteConfigs[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.siteConfigs[':id'].delete({ params: { id } })),
  },
  
  // 图片相关
  images: {
    list: (params?: any) => handleApiRes(client.api.images.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.images[':id'].get({ params: { id } })),
    upload: (data: any) => handleApiRes(client.api.images.upload.post({ body: data })),
    delete: (id: string) => handleApiRes(client.api.images[':id'].delete({ params: { id } })),
  },
  
  // 广告相关
  advertisements: {
    list: (params?: any) => handleApiRes(client.api.advertisements.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.advertisements[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.advertisements.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.advertisements[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.advertisements[':id'].delete({ params: { id } })),
  },
  
  // 统计相关
  statistics: {
    get: (params?: any) => handleApiRes(client.api.statistics.get({ query: params })),
  },
  
  // 合作伙伴相关
  partners: {
    list: (params?: any) => handleApiRes(client.api.partners.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.partners[':id'].get({ params: { id } })),
    create: (data: any) => handleApiRes(client.api.partners.post({ body: data })),
    update: (id: string, data: any) => handleApiRes(client.api.partners[':id'].put({ params: { id }, body: data })),
    delete: (id: string) => handleApiRes(client.api.partners[':id'].delete({ params: { id } })),
  },
  
  // 上传相关
  upload: {
    post: (data: any) => handleApiRes(client.api.upload.post({ body: data })),
  },
};