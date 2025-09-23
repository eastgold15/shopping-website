import type {
  ListImagesQueryDto,
  ListProductQueryDto,
  PartnersListQueryDto,
  SiteConfigByCategoryQueryDto,
  SiteConfigListQueryDto,
  UpdateImagesDto,
  UpdatePartnersDto
} from "@backend/types";
import { client } from "./useTreaty";

const pageDefaultValue = {
  code: 200,
  message: "操作成功",
  data: {
    items: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  },
};
const comDefaultValue = {
  code: 200,
  message: "操作成功",
  data: null,
};

export const useCmsApi = () => {
  // const toast = useToast() // 暂时不使用toast
  return {
    partner: {
      list: async (params: PartnersListQueryDto) => {
        const { data, error } = await client.api.partners.list.get({
          query: params,
        });
        if (error) {
          console.error("Partner list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.partners({ id: id }).get();
        if (error) {
          console.error("Partner getById error:", error);
          return comDefaultValue;
        }
        return data;
      },
      create: async (data: any) => {
        const { data: result, error } = await client.api.partners.post(data);
        if (error) {
          console.error("Partner create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      update: async (id: number, data: UpdatePartnersDto) => {
        const { data: result, error } = await client.api
          .partners({ id: id })
          .put(data);
        if (error) {
          console.error("Partner update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: number) => {
        const { data: result, error } = await client.api
          .partners({ id: id })
          .delete();
        if (error) {
          console.error("Partner delete error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },

    // 分类相关
    categories: {
      tree: async () => {
        const { data, error } = await client.api.categories.get();
        if (error) {
          console.error("Categories list error:", error);
          return comDefaultValue;
        }
        return data;
      },
      getById: async (id: number) => {
        const { data, error } = await client.api.categories({ id }).get();
        if (error) {
          console.error("Categories getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.categories.post(data);
        if (error) {
          console.error("Categories create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      update: async (id: string, data: any) => {
        const { data: result, error } = await client.api
          .categories({ id })
          .put(data);
        if (error) {
          console.error("Categories update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api
          .categories({ id })
          .delete();
        if (error) {
          console.error("Categories delete error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },

    // 广告相关
    advertisements: {
      list: async (params?: Record<string, any>) => {
        const defaultParams = { page: 1, limit: 10 };
        const { data, error } = await client.api.advertisements.get({
          query: { ...defaultParams, ...params },
        });
        if (error) {
          console.error("Advertisements list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      getById: async (id: string) => {
        const { data, error } = await client.api.advertisements({ id }).get();
        if (error) {
          console.error("Advertisements getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      create: async (data: any) => {
        const { data: result, error } =
          await client.api.advertisements.post(data);
        if (error) {
          console.error("Advertisements create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      update: async (id: string, data: any) => {
        const { data: result, error } = await client.api
          .advertisements({ id })
          .put(data);
        if (error) {
          console.error("Advertisements update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api
          .advertisements({ id })
          .delete();
        if (error) {
          console.error("Advertisements delete error:", error);
          return comDefaultValue;
        }
        return result;
      },

      carousel: async () => {
        const { data, error } = await client.api.advertisements.get({
          query: { type: "carousel", page: 1, limit: 10 },
        });
        if (error) {
          console.error("Advertisements carousel error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      banner: async (params?: any) => {
        const { data, error } = await client.api.advertisements.get({
          query: { ...params, type: "banner", page: 1, limit: 10 },
        });
        if (error) {
          console.error("Advertisements banner error:", error);
          return pageDefaultValue;
        }
        return data;
      },
    },
    // 产品相关
    products: {
      list: async (params?: ListProductQueryDto) => {
        const { data, error } = await client.api.products.get({
          query: params || { page: 1, limit: 10 },
        });
        if (error) {
          console.error("Products list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      search: async (params?: any) => {
        const { data, error } = await client.api.products.get({
          query: params,
        });
        if (error) {
          console.error("Products search error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.products({ id }).get();
        if (error) {
          console.error("Products getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      getBySlug: async (slug: string) => {
        // 注意：如果后端没有slug接口，可能需要改为使用ID或其他方式
        const { data, error } = await client.api.products.get({
          query: { slug } as any
        });
        if (error) {
          console.error("Products getBySlug error:", error);
          return comDefaultValue;
        }
        return data;
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.products.post(data);
        if (error) {
          console.error("Products create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      update: async (id: number, data: any) => {
        const { data: result, error } = await client.api
          .products({ id })
          .put(data);
        if (error) {
          console.error("Products update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: string) => {
        const { data: result, error } = await client.api
          .products({ id })
          .delete();
        if (error) {
          console.error("Products delete error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },

    // 颜色规格相关 (重构后新增)
    colorSpecs: {
      // 获取颜色规格列表
      list: async (params?: any) => {
        const { data, error } = await client.api["color-specs"].get({ query: params });
        if (error) {
          console.error("ColorSpecs list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      // 获取所有颜色规格（不分页）
      all: async (params?: any) => {
        const { data, error } = await client.api["color-specs"].all.get({ query: params });
        if (error) {
          console.error("ColorSpecs all error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 根据商品ID获取颜色规格
      getByProductId: async (productId: number) => {
        const { data, error } = await client.api["color-specs"]
          .product({ productId })
          .get();
        if (error) {
          console.error("ColorSpecs getByProductId error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 根据ID获取颜色规格详情
      getById: async (id: number) => {
        const { data, error } = await client.api["color-specs"]({ id }).get();
        if (error) {
          console.error("ColorSpecs getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 创建颜色规格
      create: async (data: any) => {
        const { data: result, error } = await client.api["color-specs"].post(data);
        if (error) {
          console.error("ColorSpecs create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      // 更新颜色规格
      update: async (id: number, data: any) => {
        const { data: result, error } = await client.api
        ["color-specs"]({ id })
          .put(data);
        if (error) {
          console.error("ColorSpecs update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      // 删除颜色规格
      delete: async (id: number) => {
        const { data: result, error } = await client.api
        ["color-specs"]({ id })
          .delete();
        if (error) {
          console.error("ColorSpecs delete error:", error);
          return comDefaultValue;
        }
        return result;
      },

      // 批量创建颜色规格
      batchCreate: async (productId: number, colorSpecs: any[]) => {
        const { data: result, error } = await client.api["color-specs"]
          .batch({ productId })
          .post({ colorSpecs });
        if (error) {
          console.error("ColorSpecs batchCreate error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },



    // SKU相关
    skus: {
      list: async (params?: any) => {
        const { data, error } = await client.api.skus.get({ query: params });
        if (error) {
          console.error("SKUs list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      getByProductId: async (productId: number) => {
        const { data, error } = await client.api.skus
          .product({ productId })
          .get();
        if (error) {
          console.error("SKUs getByProductId error:", error);
          return comDefaultValue;
        }
        return data;
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.skus({ id }).get();
        if (error) {
          console.error("SKUs getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      create: async (data: any) => {
        const { data: result, error } = await client.api.skus.post(data);
        if (error) {
          console.error("SKUs create error:", error);
          return comDefaultValue;
        }
        return result;
      },

      update: async (id: number, data: any) => {
        const { data: result, error } = await client.api.skus({ id }).put(data);
        if (error) {
          console.error("SKUs update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: number) => {
        const { data: result, error } = await client.api.skus({ id }).delete();
        if (error) {
          console.error("SKUs delete error:", error);
          return comDefaultValue;
        }
        return result;
      },

      // 基于颜色规格批量创建SKU (重构后新增)
      batchCreateByColorSpecs: async (productId: number, colorSpecs: any[]) => {
        const { data: result, error } = await client.api.skus
          .batch({ productId })
          .post({ colorSpecs });
        if (error) {
          console.error("SKUs batchCreateByColorSpecs error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },

    // 站点配置相关
    siteConfigs: {
      list: async (params: SiteConfigListQueryDto) => {
        const { data, error } = await client.api["site-configs"]["all"].get({
          query: params,
        });
        if (error) {
          console.error("SiteConfigs list error:", error);
          return pageDefaultValue;
        }
        return data;
      },
      all: async (params?: SiteConfigByCategoryQueryDto) => {
        const { data, error } = await client.api["site-configs"]["all"].get({
          query: params,
        });
        if (error) {
          console.error("SiteConfigs all error:", error);
          return comDefaultValue;
        }
        return data;
      },

      getByCategory: async (category: string) => {
        const { data, error } = await client.api["site-configs"]["all"].get({
          query: { category }
        });
        if (error) {
          console.error("SiteConfigs getByCategory error:", error);
          return comDefaultValue;
        }
        return data;
      },

      batchUpdate: async (data: any) => {
        const { data: result, error } =
          await client.api["site-configs"].batch.post(data);
        if (error) {
          console.error("SiteConfigs batchUpdate error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },

    // 图片相关
    images: {
      list: async (params: ListImagesQueryDto) => {
        const { data, error } = await client.api.images.get({ query: params });
        if (error) {
          console.error("Images list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      getById: async (id: number) => {
        const { data, error } = await client.api.images({ id }).get();
        if (error) {
          console.error("Images getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      update: async (id: number, data: UpdateImagesDto) => {
        const { data: result, error } = await client.api
          .images({ id })
          .put(data);
        if (error) {
          console.error("Images update error:", error);
          return comDefaultValue;
        }
        return result;
      },

      delete: async (id: number) => {
        const { data: result, error } = await client.api
          .images({ id })
          .delete();
        if (error) {
          console.error("Images delete error:", error);
          return comDefaultValue;
        }
        return result;
      },

      batchDelete: async (body: { ids: number[] }) => {
        const { data: result, error } =
          await client.api.images.batch.delete(body);
        if (error) {
          console.error("Images batchDelete error:", error);
          return comDefaultValue;
        }
        return result;
      },
    },
  };
};

export const useFrontApi = () => {
  return {
    partner: {
      // 请求所有数据
      all: async () => {
        const { data, error } = await client.api.partners.all.get();
        if (error) {
          console.error("Partner list error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },
    siteConfigs: {
      getByCategory: async (category: string) => {
        const { data, error } = await client.api["site-configs"]["all"].get({
          query: { category }
        });
        if (error) {
          console.error("SiteConfigs getByCategory error:", error);
          return comDefaultValue;
        }
        return data;
      },

      getByKeys: async (keys: string[]) => {
        const { data, error } = await client.api["site-configs"].keys.get({
          query: { keys },
        });
        if (error) {
          console.error("SiteConfigs getByCategory error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },
    categories: {
      tree: async () => {
        const { data, error } = await client.api.categories.get();
        if (error) {
          console.error("SiteConfigs getByCategory error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },

    products: {
      // 获取商品详情（前端展示用）
      getById: async (id: number) => {
        const { data, error } = await client.api.products({ id }).get();
        if (error) {
          console.error("Products getById error:", error);
          return comDefaultValue;
        }
        return data;
      },
      list: async (params?: ListProductQueryDto) => {
        const { data, error } = await client.api.products.get({
          query: params || { page: 1, limit: 10 },
        });
        if (error) {
          console.error("Products list error:", error);
          return pageDefaultValue;
        }
        return data;
      },

      // 根据slug获取商品详情（前端展示用）
      getBySlug: async (slug: string) => {
        // 注意：如果后端没有slug接口，可能需要改为使用ID或其他方式
        const { data, error } = await client.api.products.get({
          query: { slug } as any
        });
        if (error) {
          console.error("Products getBySlug error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },

    // SKU相关接口（前端展示用）
    skus: {
      // 根据商品ID获取所有SKU
      getByProductId: async (productId: number) => {
        const { data, error } = await client.api.skus
          .product({ productId })
          .get();
        if (error) {
          console.error("SKUs getByProductId error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 根据ID获取SKU详情
      getById: async (id: number) => {
        const { data, error } = await client.api.skus({ id }).get();
        if (error) {
          console.error("SKUs getById error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },

    // 颜色规格相关（前端展示用）
    colorSpecs: {
      // 根据商品ID获取颜色规格
      getByProductId: async (productId: number) => {
        const { data, error } = await client.api["color-specs"]
          .product({ productId })
          .get();
        if (error) {
          console.error("ColorSpecs getByProductId error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 根据ID获取颜色规格详情
      getById: async (id: number) => {
        const { data, error } = await client.api["color-specs"]({ id }).get();
        if (error) {
          console.error("ColorSpecs getById error:", error);
          return comDefaultValue;
        }
        return data;
      },

      // 获取所有颜色规格（不分页）
      all: async (params?: any) => {
        const { data, error } = await client.api["color-specs"].all.get({ query: params });
        if (error) {
          console.error("ColorSpecs all error:", error);
          return comDefaultValue;
        }
        return data;
      },
    },
  };
};
export type UnPromisify<T> = T extends Promise<infer U> ? U : T;
