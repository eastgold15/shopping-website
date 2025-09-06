// 前端广告相关类型定义

// 广告类型枚举
export type AdvertisementType = 'banner' | 'carousel';

// 广告位置枚举
export type AdvertisementPosition = 'home-hero' | 'home-banner' | 'product-detail' | 'category-top' | 'sidebar';

// 广告基础信息
export interface Advertisement {
	id: number;
	title: string;
	type: AdvertisementType;
	image: string;
	link?: string;
	position?: string;
	sortOrder: number;
	isActive: boolean;
	startDate?: string;
	endDate?: string;
	createdAt: string;
	updatedAt: string;
}

// 创建广告表单
export interface AdvertisementForm {
	title: string;
	type: AdvertisementType;
	image: string;
	link?: string;
	position?: string;
	sortOrder: number;
	isActive: boolean;
	startDate?: string;
	endDate?: string;
}

// 广告查询参数
export interface AdvertisementQuery {
	type?: AdvertisementType;
	position?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
}

// 广告API响应
export interface AdvertisementResponse {
	success: boolean;
	data?: Advertisement;
	message?: string;
	error?: string;
}

export interface AdvertisementListResponse {
	success: boolean;
	data?: {
		advertisements: Advertisement[];
		total: number;
		page: number;
		limit: number;
	};
	message?: string;
	error?: string;
}

// 文件上传响应
export interface FileUploadResponse {
	success: boolean;
	data?: {
		filename: string;
		url: string;
		size: number;
	};
	message?: string;
	error?: string;
}

// 广告位置选项
export const ADVERTISEMENT_POSITIONS = [
	{ label: '首页轮播', value: 'home-hero' },
	{ label: '首页横幅', value: 'home-banner' },
	{ label: '商品详情页', value: 'product-detail' },
	{ label: '分类页顶部', value: 'category-top' },
	{ label: '侧边栏', value: 'sidebar' },
] as const;

// 广告类型选项
export const ADVERTISEMENT_TYPES = [
	{ label: '轮播图', value: 'carousel' },
	{ label: 'Banner横幅', value: 'banner' },
] as const;