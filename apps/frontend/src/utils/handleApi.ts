
import type { InsertPartnersDto, ListImagesQueryDto, ListProductQueryDto, PartnersListQueryDto, SiteConfigListQueryDto, UpdateImagesDto, UpdatePartnersDto, UpdateSortDtoType } from "@backend/types";
import { client } from "./useTreaty";

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
      list: async (params: PartnersListQueryDto) => {
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
      create: async (data: InsertPartnersDto) => {
        const { data: result, error } = await client.api.partners.post(data)
        if (error) {
          console.error('Partner create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: number, data: UpdatePartnersDto) => {
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

      updateSort: async (id: number, data: UpdateSortDtoType) => {
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
        const { data, error } = await client.api.categories.get({ query: { format: 'tree' } })
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
      list: async (params?: Record<string, any>) => {
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
        const { data, error } = await client.api.advertisements.get({ query: { type: 'carousel' } })
        if (error) {
          console.error('Advertisements carousel error:', error)
          return pageDefaultValue
        }
        return data
      },

      banner: async (params?: any) => {
        const { data, error } = await client.api.advertisements.get({ query: { ...params, type: 'banner' } })
        if (error) {
          console.error('Advertisements banner error:', error)
          return pageDefaultValue
        }
        return data
      },
    },

    // 订单相关
    // orders: {
    //   list: async (params?: any) => {
    //     const { data, error } = await client.api.orders.get({ query: params })
    //     if (error) {
    //       console.error('Orders list error:', error)
    //       return pageDefaultValue
    //     }
    //     return data
    //   },

    //   getById: async (id: string) => {
    //     const { data, error } = await client.api.orders({ id }).get()
    //     if (error) {
    //       console.error('Orders getById error:', error)
    //       return comDefaultValue
    //     }
    //     return data
    //   },

    //   updateStatus: async (id: string, data: any) => {
    //     const { data: result, error } = await client.api.orders({ id }).status.put(data)
    //     if (error) {
    //       console.error('Orders updateStatus error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   updateShipping: async (id: string, data: any) => {
    //     const { data: result, error } = await client.api.orders({ id }).shipping.put(data)
    //     if (error) {
    //       console.error('Orders updateShipping error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   getRefunds: async (params?: any) => {
    //     const { data, error } = await client.api.orders.refunds.get({ query: params })
    //     if (error) {
    //       console.error('Orders getRefunds error:', error)
    //       return pageDefaultValue
    //     }
    //     return data
    //   },

    //   createRefund: async (id: number, data: any) => {
    //     const { data: result, error } = await client.api.orders({ id }).refunds.post(data)
    //     if (error) {
    //       console.error('Orders createRefund error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   // processRefund: async (refundId: number, data: any) => {
    //   //   const { data: result, error } = await client.api.orders.refunds.
    //   //   if (error) {
    //   //     console.error('Orders processRefund error:', error)
    //   //     return comDefaultValue
    //   //   }
    //   //   return result
    //   // },

    //   getStatistics: async (params?: any) => {
    //     const { data, error } = await client.api.orders.statistics.get({ query: params })
    //     if (error) {
    //       console.error('Orders getStatistics error:', error)
    //       return comDefaultValue
    //     }
    //     return data
    //   },
    // },

    // 用户相关
    // users: {
    //   list: async (params?: any) => {
    //     const { data, error } = await client.api.users.get({ query: params })
    //     if (error) {
    //       console.error('Users list error:', error)
    //       return pageDefaultValue
    //     }
    //     return data
    //   },

    //   getById: async (id: number) => {
    //     const { data, error } = await client.api.users({ id }).get()
    //     if (error) {
    //       console.error('Users getById error:', error)
    //       return comDefaultValue
    //     }
    //     return data
    //   },

    //   create: async (data: any) => {
    //     const { data: result, error } = await client.api.users.post(data)
    //     if (error) {
    //       console.error('Users create error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   update: async (id: number, data: any) => {
    //     const { data: result, error } = await client.api.users({ id }).put(data)
    //     if (error) {
    //       console.error('Users update error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   delete: async (id: number) => {
    //     const { data: result, error } = await client.api.users({ id }).delete()
    //     if (error) {
    //       console.error('Users delete error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   batchUpdateStatus: async (data: any) => {
    //     const { data: result, error } = await client.api.users["batch-status"].patch(data)
    //     if (error) {
    //       console.error('Users batchUpdateStatus error:', error)
    //       return comDefaultValue
    //     }
    //     return result
    //   },

    //   getAdmins: async (params?: any) => {
    //     const { data, error } = await client.api.users.admins.get({ query: params })
    //     if (error) {
    //       console.error('Users getAdmins error:', error)
    //       return pageDefaultValue
    //     }
    //     return data
    //   },

    //   getStatistics: async () => {
    //     const { data, error } = await client.api.users.statistics.get()
    //     if (error) {
    //       console.error('Users getStatistics error:', error)
    //       return comDefaultValue
    //     }
    //     return data
    //   },

    //   getByUsername: async (username: string) => {
    //     const { data, error } = await client.api.users["by-username"]({ username }).get()
    //     if (error) {
    //       console.error('Users getByUsername error:', error)
    //       return comDefaultValue
    //     }
    //     return data
    //   },

    //   getActive: async () => {
    //     const { data, error } = await client.api.users.active.get()
    //     if (error) {
    //       console.error('Users getActive error:', error)
    //       return pageDefaultValue
    //     }
    //     return data
    //   },
    // },

    // 产品相关
    products: {
      list: async (params?: ListProductQueryDto) => {
        const { data, error } = await client.api.products.get({ query: params })
        if (error) {
          console.error('Products list error:', error)
          return pageDefaultValue
        }
        return data
      },

      search: async (params?: any) => {
        const { data, error } = await client.api.products.get({ query: params })
        if (error) {
          console.error('Products search error:', error)
          return pageDefaultValue
        }
        return data
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.products({ id }).get()
        if (error) {
          console.error('Products getById error:', error)
          return comDefaultValue
        }
        return data
      },

      getBySlug: async (slug: string) => {
        const { data, error } = await client.api.products.slug({ slug }).get()
        if (error) {
          console.error('Products getBySlug error:', error)
          return comDefaultValue
        }
        return data
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.products.post(data)
        if (error) {
          console.error('Products create error:', error)
          return comDefaultValue
        }
        return result
      },

      update: async (id: number, data: any) => {
        const { data: result, error } = await client.api.products({ id }).put(data)
        if (error) {
          console.error('Products update error:', error)
          return comDefaultValue
        }
        return result
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api.products({ id }).delete()
        if (error) {
          console.error('Products delete error:', error)
          return comDefaultValue
        }
        return result
      },
    },

    // 站点配置相关
    siteConfigs: {
      list: async (params: SiteConfigListQueryDto) => {
        const { data, error } = await client.api["site-configs"].get({ query: params })
        if (error) {
          console.error('SiteConfigs list error:', error)
          return pageDefaultValue
        }
        return data
      },

      getByCategory: async (category: string) => {
        const { data, error } = await client.api["site-configs"].key({ key: category }).get()
        if (error) {
          console.error('SiteConfigs getByCategory error:', error)
          return comDefaultValue
        }
        return data
      },

      batchUpdate: async (data: any) => {
        const { data: result, error } = await client.api["site-configs"].batch.post(data)
        if (error) {
          console.error('SiteConfigs batchUpdate error:', error)
          return comDefaultValue
        }
        return result
      },
    },

    // 图片相关
    images: {
      list: async (params: ListImagesQueryDto) => {
        const { data, error } = await client.api.images.get({ query: params })
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

      update: async (id: number, data: UpdateImagesDto) => {
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

export const useFrontApi = () => {

  return {
    partner: {
      // 请求所有数据
      all: async () => {
        const { data, error } = await client.api.partners.all.get()
        if (error) {
          console.error('Partner list error:', error)
          return comDefaultValue
        }
        return data
      },
    },
    siteConfigs: {
      getByCategory: async (category: string) => {
        const { data, error } = await client.api["site-configs"].Category({ Category: category }).get()
        if (error) {
          console.error('SiteConfigs getByCategory error:', error)
          return comDefaultValue
        }
        return data
      },

      getByKeys: async (keys: string[]) => {
        const { data, error } = await client.api["site-configs"].keys.get({ query: { keys } })
        if (error) {
          console.error('SiteConfigs getByCategory error:', error)
          return comDefaultValue
        }
        return data
      },
    },
    categories: {
      tree: async () => {
        const { data, error } = await client.api.categories.get()
        if (error) {
          console.error('SiteConfigs getByCategory error:', error)
          return comDefaultValue
        }
        return data
      },
    },

    products: {
      getById: async (id: number) => {
        const { data, error } = await client.api.products({ id }).get()
        if (error) {
          console.error('SiteConfigs getByCategory error:', error)
          return comDefaultValue
        }
        return data
      },
      list: async (params?: ListProductQueryDto) => {
        const { data, error } = await client.api.products.get({ query: params })
        if (error) {
          console.error('Products list error:', error)
          return pageDefaultValue
        }
        return data
      }
    }
  }




};
export type UnPromisify<T> = T extends Promise<infer U> ? U : T;


const res = await useCmsApi().products.list()
console.log(res)
