import type {
  CreatePartnerDto,
  PartnerQueryDto,
  UpdatePartnerDto,
  UpdateSortDto,
} from "@backend/modules/partner";
import type {
  ImageQueryDto,
  UpdateImageDto,
  UploadImageDto,
  UploadImagesDto,
} from "@backend/types";
// import { useToast } from "primevue/usetoast"; // 暂时不使用toast
import { handleApiRes } from "./handleApiRes";
import { client } from "./useTreaty";

// 导出 handleApiRes 供其他文件使用
export { handleApiRes };
const res =client.api.advertisements.get()

// 便捷的API调用方法
export const api = {
  // 商品相关
  products: {
    list: (params?: any) =>
      handleApiRes(client.api.products.get({ query: params })),
    search: (params?: any) =>
      handleApiRes(client.api.products.get({ query: params })),
    getById: (id: number) => handleApiRes(client.api.products({ id }).get()),
    getBySlug: (slug: string) =>
      handleApiRes(client.api.products.slug({ slug }).get()),
    create: (data: any) => handleApiRes(client.api.products.post(data)),
    update: (id: number, data: any) =>
      handleApiRes(client.api.products({ id }).put(data)),
    delete: (id: string) => handleApiRes(client.api.products({ id }).delete()),
  },

  // 分类相关
  categories: {
    list: (params?: any) =>
      handleApiRes(client.api.categories.get({ query: params })),
    tree: () => handleApiRes(client.api.categories.tree.get()),
    getById: (id: string) => handleApiRes(client.api.categories({ id }).get()),
    create: (data: any) => handleApiRes(client.api.categories.post(data)),
    update: (id: string, data: any) =>
      handleApiRes(client.api.categories({ id }).put(data)),
    delete: (id: string) =>
      handleApiRes(client.api.categories({ id }).delete()),
    getChildren: (id: string) =>
      handleApiRes(client.api.categories({ id }).children.get()),
    updateSort: (id: string, data: any) =>
      handleApiRes(client.api.categories({ id }).sort.patch(data)),
    toggleVisibility: (id: string) =>
      handleApiRes(client.api.categories({ id })["toggle-visibility"].patch()),
    moveUp: (id: string) =>
      handleApiRes(client.api.categories({ id })["move-up"].patch()),
    moveDown: (id: string) =>
      handleApiRes(client.api.categories({ id })["move-down"].patch()),
  },

  // 订单相关 - 后端只支持查询和状态更新
  orders: {
    list: (params?: any) =>
      handleApiRes(client.api.orders.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.orders({ id }).get()),
    updateStatus: (id: string, data: any) =>
      handleApiRes(client.api.orders({ id }).status.patch(data)),
    updateShipping: (id: string, data: any) =>
      handleApiRes(client.api.orders({ id }).shipping.patch(data)),
    getRefunds: (params?: any) =>
      handleApiRes(client.api.orders.refunds.get({ query: params })),
    createRefund: (id: string, data: any) =>
      handleApiRes(client.api.orders({ id }).refunds.post(data)),
    processRefund: (refundId: string, data: any) =>
      handleApiRes(client.api.orders.refunds({ refundId }).patch(data)),
    getStatistics: (params?: any) =>
      handleApiRes(client.api.orders.statistics.get({ query: params })),
  },

  // 用户相关
  users: {
    list: (params?: any) =>
      handleApiRes(client.api.users.get({ query: params })),
    getById: (id: string) => handleApiRes(client.api.users({ id }).get()),
    create: (data: any) => handleApiRes(client.api.users.post(data)),
    update: (id: string, data: any) =>
      handleApiRes(client.api.users({ id }).put(data)),
    delete: (id: string) => handleApiRes(client.api.users({ id }).delete()),
    batchUpdateStatus: (data: any) =>
      handleApiRes(client.api.users["batch-status"].patch(data)),
    getAdmins: (params?: any) =>
      handleApiRes(client.api.users.admins.get({ query: params })),
    getStatistics: () => handleApiRes(client.api.users.statistics.get()),
    getByUsername: (username: string) =>
      handleApiRes(client.api.users["by-username"]({ username }).get()),
    getActive: () => handleApiRes(client.api.users.active.get()),
  },

  // 站点配置相关
  siteConfigs: {
    list: (params?: any) =>
      handleApiRes(client.api["site-configs"].get({ query: params })),
    getByCategory: (category: string) =>
      handleApiRes(
        client.api["site-configs"].category({ category: category }).get(),
      ),

    batchUpdate: (data: any) =>
      handleApiRes(client.api["site-configs"].batch.patch(data)),
  },

  // 广告相关
  advertisements: {
    list: (params?: any) =>
      handleApiRes(client.api.advertisements.get({ query: params })),
    getById: (id: string) =>
      handleApiRes(client.api.advertisements({ id }).get()),
    create: (data: any) => handleApiRes(client.api.advertisements.post(data)),
    update: (id: string, data: any) =>
      handleApiRes(client.api.advertisements({ id }).put(data)),
    delete: (id: string) =>
      handleApiRes(client.api.advertisements({ id }).delete()),
    carousel: () => handleApiRes(client.api.advertisements.carousels.get()),
    banner: (params?: any) =>
      handleApiRes(client.api.advertisements.banners.get({ query: params })),

    
  },

  // 合作伙伴相关
  partners: {
    list: (params?: any) =>
      handleApiRes(client.api.partners.get({ query: params })),
    getById: (id: string) =>
      handleApiRes(client.api.partners({ id: id }).get()),
    create: (data: any) => handleApiRes(client.api.partners.post(data)),
    update: (id: string, data: any) =>
      handleApiRes(client.api.partners({ id: id }).put(data)),
    delete: (id: string) =>
      handleApiRes(client.api.partners({ id: id }).delete()),
    toggleActive: (id: string) =>
      handleApiRes(client.api.partners({ id: id })["toggle-active"].patch()),
    updateSort: (id: string, data: any) =>
      handleApiRes(client.api.partners({ id: id }).sort.patch(data)),
  },

  // 上传相关 - 对应后端 /upload 路由
  upload: {
    image: (data: UploadImageDto) =>
      handleApiRes(client.api.upload.image.post(data)), // 单个图片上传
    images: (data: UploadImagesDto) =>
      handleApiRes(client.api.upload.images.post(data)), // 批量上传图片
    deleteFile: (url: string) =>
      handleApiRes(client.api.upload.file.delete({ query: { url } })),
    fileExists: (url: string) =>
      handleApiRes(client.api.upload.file.exists.get({ query: { url } })),
    fileInfo: (url: string) =>
      handleApiRes(client.api.upload.file.info.get({ query: { url } })),
  },
};


const pageDefaultValue = {
  code: 200,
  message: "操作成功",
  data: {
    items: [],
    meta: {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    }
  }
}
const comDefaultValue = {
  code: 200,
  message: "操作成功",
  data: null
}






export const useCmsApi = () => {
  // const toast = useToast() // 暂时不使用toast
  return {
    partner: {
      list: async (params: PartnerQueryDto) => {
        const { data, error } = await client.api.partners.list.get({ query: params })
        if (error) {
          console.error('Partner list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.partners({ id: id }).get()
        if (error) {
          console.error('Partner getById error:', error)
          return comDefaultValue
        }
        return data
      },
      create: async (data: CreatePartnerDto) => {
        const { data: result, error } = await client.api.partners.post(data)
        if (error) {
          console.error('Partner create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: number, data: UpdatePartnerDto) => {
        const { data: result, error } = await client.api.partners({ id: id }).put(data)
        if (error) {
          console.error('Partner update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: number) => {
        const { data: result, error } = await client.api.partners({ id: id }).delete()
        if (error) {
          console.error('Partner delete error:', error)
          return comDefaultValue
        }
        return result
      },

      toggleActive: async (id: number) => {
        const { data: result, error } = await client.api.partners({ id: id })["toggle-active"].patch()
        if (error) {
          console.error('Partner toggleActive error:', error)
          return comDefaultValue
        }
        return result
      },

      updateSort: async (id: number, data: UpdateSortDto) => {
        const { data: result, error } = await client.api.partners({ id: id }).sort.patch(data)
        if (error) {
          console.error('Partner updateSort error:', error)
          return comDefaultValue
        }
        return result
      },
    },

    // 分类相关
    categories: {
      list: async (params?: any) => {
        const { data, error } = await client.api.categories.get({ query: params })
        if (error) {
          console.error('Categories list error:', error)
          return pageDefaultValue
        }
        return data
      },

      tree: async () => {
        const { data, error } = await client.api.categories.tree.get()
        if (error) {
          console.error('Categories tree error:', error)
          return comDefaultValue
        }
        return data
      },

      getById: async (id: string) => {
        const { data, error } = await client.api.categories({ id }).get()
        if (error) {
          console.error('Categories getById error:', error)
          return comDefaultValue
        }
        return data
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.categories.post(data)
        if (error) {
          console.error('Categories create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: string, data: any) => {
        const { data: result, error } = await client.api.categories({ id }).put(data)
        if (error) {
          console.error('Categories update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api.categories({ id }).delete()
        if (error) {
          console.error('Categories delete error:', error)
          return comDefaultValue
        }
        return result
      },

      getChildren: async (id: string) => {
        const { data, error } = await client.api.categories({ id }).children.get()
        if (error) {
          console.error('Categories getChildren error:', error)
          return pageDefaultValue
        }
        return data
      },

      updateSort: async (id: string, data: any) => {
        const { data: result, error } = await client.api.categories({ id }).sort.patch(data)
        if (error) {
          console.error('Categories updateSort error:', error)
          return comDefaultValue
        }
        return result
      },

      toggleVisibility: async (id: string) => {
        const { data: result, error } = await client.api.categories({ id })["toggle-visibility"].patch()
        if (error) {
          console.error('Categories toggleVisibility error:', error)
          return comDefaultValue
        }
        return result
      },

      moveUp: async (id: string) => {
        const { data: result, error } = await client.api.categories({ id })["move-up"].patch()
        if (error) {
          console.error('Categories moveUp error:', error)
          return comDefaultValue
        }
        return result
      },

      moveDown: async (id: string) => {
        const { data: result, error } = await client.api.categories({ id })["move-down"].patch()
        if (error) {
          console.error('Categories moveDown error:', error)
          return comDefaultValue
        }
        return result
      },
    },

    // 广告相关
    advertisements: {
      list: async (params?: any) => {
        const { data, error } = await client.api.advertisements.get({ query: params })
        if (error) {
          console.error('Advertisements list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: string) => {
        const { data, error } = await client.api.advertisements({ id }).get()
        if (error) {
          console.error('Advertisements getById error:', error)
          return comDefaultValue
        }
        return data
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.advertisements.post(data)
        if (error) {
          console.error('Advertisements create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: string, data: any) => {
        const { data: result, error } = await client.api.advertisements({ id }).put(data)
        if (error) {
          console.error('Advertisements update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api.advertisements({ id }).delete()
        if (error) {
          console.error('Advertisements delete error:', error)
          return comDefaultValue
        }
        return result
      },

      carousel: async () => {
        const { data, error } = await client.api.advertisements.carousels.get()
        if (error) {
          console.error('Advertisements carousel error:', error)
          return pageDefaultValue
        }
        return data
      },

      banner: async (params?: any) => {
        const { data, error } = await client.api.advertisements.banners.get({ query: params })
        if (error) {
          console.error('Advertisements banner error:', error)
          return pageDefaultValue
        }
        return data
      },
    },

    // 订单相关
    orders: {
      list: async (params?: any) => {
        const { data, error } = await client.api.orders.get({ query: params })
        if (error) {
          console.error('Orders list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: string) => {
        const { data, error } = await client.api.orders({ id }).get()
        if (error) {
          console.error('Orders getById error:', error)
          return comDefaultValue
        }
        return data
      },

      updateStatus: async (id: string, data: any) => {
        const { data: result, error } = await client.api.orders({ id }).status.patch(data)
        if (error) {
          console.error('Orders updateStatus error:', error)
          return comDefaultValue
        }
        return result
      },

      updateShipping: async (id: string, data: any) => {
        const { data: result, error } = await client.api.orders({ id }).shipping.patch(data)
        if (error) {
          console.error('Orders updateShipping error:', error)
          return comDefaultValue
        }
        return result
      },

      getRefunds: async (params?: any) => {
        const { data, error } = await client.api.orders.refunds.get({ query: params })
        if (error) {
          console.error('Orders getRefunds error:', error)
          return pageDefaultValue
        }
        return data
      },

      createRefund: async (id: string, data: any) => {
        const { data: result, error } = await client.api.orders({ id }).refunds.post(data)
        if (error) {
          console.error('Orders createRefund error:', error)
          return comDefaultValue
        }
        return result
      },

      processRefund: async (refundId: string, data: any) => {
        const { data: result, error } = await client.api.orders.refunds({ refundId }).patch(data)
        if (error) {
          console.error('Orders processRefund error:', error)
          return comDefaultValue
        }
        return result
      },

      getStatistics: async (params?: any) => {
        const { data, error } = await client.api.orders.statistics.get({ query: params })
        if (error) {
          console.error('Orders getStatistics error:', error)
          return comDefaultValue
        }
        return data
      },
    },

    // 用户相关
    users: {
      list: async (params?: any) => {
        const { data, error } = await client.api.users.get({ query: params })
        if (error) {
          console.error('Users list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: string) => {
        const { data, error } = await client.api.users({ id }).get()
        if (error) {
          console.error('Users getById error:', error)
          return comDefaultValue
        }
        return data
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.users.post(data)
        if (error) {
          console.error('Users create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: string, data: any) => {
        const { data: result, error } = await client.api.users({ id }).put(data)
        if (error) {
          console.error('Users update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api.users({ id }).delete()
        if (error) {
          console.error('Users delete error:', error)
          return comDefaultValue
        }
        return result
      },

      batchUpdateStatus: async (data: any) => {
        const { data: result, error } = await client.api.users["batch-status"].patch(data)
        if (error) {
          console.error('Users batchUpdateStatus error:', error)
          return comDefaultValue
        }
        return result
      },

      getAdmins: async (params?: any) => {
        const { data, error } = await client.api.users.admins.get({ query: params })
        if (error) {
          console.error('Users getAdmins error:', error)
          return pageDefaultValue
        }
        return data
      },

      getStatistics: async () => {
        const { data, error } = await client.api.users.statistics.get()
        if (error) {
          console.error('Users getStatistics error:', error)
          return comDefaultValue
        }
        return data
      },

      getByUsername: async (username: string) => {
        const { data, error } = await client.api.users["by-username"]({ username }).get()
        if (error) {
          console.error('Users getByUsername error:', error)
          return comDefaultValue
        }
        return data
      },

      getActive: async () => {
        const { data, error } = await client.api.users.active.get()
        if (error) {
          console.error('Users getActive error:', error)
          return pageDefaultValue
        }
        return data
      },
    },

    // 产品相关
    products: {
      async list(params?: any) {
        try {
          const response = await client.api.products.get({ query: params });
          if (response.error) {
            console.error('获取产品列表失败:', response.error);
            return pageDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('获取产品列表失败:', error);
          return pageDefaultValue;
        }
      },

      async search(params?: any) {
        try {
          const response = await client.api.products.get({ query: params });
          if (response.error) {
            console.error('搜索产品失败:', response.error);
            return pageDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('搜索产品失败:', error);
          return pageDefaultValue;
        }
      },

      async getById(id: number) {
        try {
          const response = await client.api.products({ id }).get();
          if (response.error) {
            console.error('获取产品详情失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('获取产品详情失败:', error);
          return comDefaultValue;
        }
      },

      async getBySlug(slug: string) {
        try {
          const response = await client.api.products.slug({ slug }).get();
          if (response.error) {
            console.error('根据slug获取产品失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('根据slug获取产品失败:', error);
          return comDefaultValue;
        }
      },

      async create(data: any) {
        try {
          const response = await client.api.products.post(data);
          if (response.error) {
            console.error('创建产品失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('创建产品失败:', error);
          return comDefaultValue;
        }
      },

      async update(id: number, data: any) {
        try {
          const response = await client.api.products({ id }).put(data);
          if (response.error) {
            console.error('更新产品失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('更新产品失败:', error);
          return comDefaultValue;
        }
      },

      async delete(id: string) {
        try {
          const response = await client.api.products({ id }).delete();
          if (response.error) {
            console.error('删除产品失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('删除产品失败:', error);
          return comDefaultValue;
        }
      },
    },

    // 站点配置相关
    siteConfigs: {
      async list(params?: any) {
        try {
          const response = await client.api["site-configs"].get({ query: params });
          if (response.error) {
            console.error('获取站点配置列表失败:', response.error);
            return pageDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('获取站点配置列表失败:', error);
          return pageDefaultValue;
        }
      },

      async getByCategory(category: string) {
        try {
          const response = await client.api["site-configs"].category({ category }).get();
          if (response.error) {
            console.error('根据分类获取站点配置失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('根据分类获取站点配置失败:', error);
          return comDefaultValue;
        }
      },

      async batchUpdate(data: any) {
        try {
          const response = await client.api["site-configs"].batch.patch(data);
          if (response.error) {
            console.error('批量更新站点配置失败:', response.error);
            return comDefaultValue;
          }
          return response.data;
        } catch (error) {
          console.error('批量更新站点配置失败:', error);
          return comDefaultValue;
        }
      },
    },

    // 图片相关
    images: {
      list: async (params: ImageQueryDto) => {
        const { data, error } = await client.api.images.list.get({ query: params })
        if (error) {
          console.error('Images list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.images({ id }).get()
        if (error) {
          console.error('Images getById error:', error)
          return comDefaultValue
        }
        return data
      },

      update: async (id: number, data: UpdateImageDto) => {
        const { data: result, error } = await client.api.images({ id }).put(data)
        if (error) {
          console.error('Images update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: number) => {
        const { data: result, error } = await client.api.images({ id }).delete()
        if (error) {
          console.error('Images delete error:', error)
          return comDefaultValue
        }
        return result
      },

      batchDelete: async (body: { ids: number[] }) => {
        const { data: result, error } = await client.api.images.batch.delete(body)
        if (error) {
          console.error('Images batchDelete error:', error)
          return comDefaultValue
        }
        return result
      },
    },



  };
}

export const useFrontApi = {};
export type UnPromisify<T> = T extends Promise<infer U> ? U : T;
