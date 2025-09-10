import { handleApiRes } from "./handleApiRes";
import { client } from "./useTreaty";

// 导出统一的API处理函数
export { handleApiRes };

// 导出客户端实例
export { client };

// 便捷的API调用方法
export const api = {
	// 商品相关
	products: {
		list: (params?: any) =>
			handleApiRes(client.api.products.get({ query: params })),
		search: (params?: any) =>
			handleApiRes(client.api.products.get({ query: params })),
		getById: (id: string) => handleApiRes(client.api.products({ id }).get()),
		getBySlug: (slug: string) =>
			handleApiRes(client.api.products.slug({ slug }).get()),
		create: (data: any) => handleApiRes(client.api.products.post(data)),
		update: (id: string, data: any) =>
			handleApiRes(client.api.products({ id }).put(data)),
		delete: (id: string) => handleApiRes(client.api.products({ id }).delete()),
		// filterOptions: () => handleApiRes(client.api.products['filter-options'].get()),
		// popularTerms: () => handleApiRes(client.api.products['popular-terms'].get()),
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

	// 图片相关
	images: {
		list: (params?: any) =>
			handleApiRes(client.api.images.get({ query: params })),
		getById: (id: string) => handleApiRes(client.api.images({ id }).get()),
		update: (id: string, data: any) =>
			handleApiRes(client.api.images({ id }).put(data)),
		delete: (id: string) => handleApiRes(client.api.images({ id }).delete()),
		batchDelete: (data: any) =>
			handleApiRes(client.api.images.batch.delete(data)),
		getStats: () => handleApiRes(client.api.images.stats.overview.get()),
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

interface UploadImageDto {
	folder: Folder;
	file: File;
}

interface UploadImagesDto {
	folder: Folder;
	files: File[];
}
type Folder =
	| "avatar"
	| "category"
	| "general"
	| "product"
	| "advertisement"
	| undefined;
