// 前端网站配置相关类型定义

// 网站配置
export interface SiteConfig {
	id: string;
	key: string;
	value: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

// 网站配置表单
export interface SiteConfigForm {
	key: string;
	value: string;
	description?: string;
}

// 创建网站配置请求
export interface CreateSiteConfigRequest {
	key: string;
	value: string;
	description?: string;
}

// 更新网站配置请求
export interface UpdateSiteConfigRequest {
	value: string;
	description?: string;
}

// 网站配置查询参数
export interface SiteConfigQuery {
	key?: string;
	page?: number;
	limit?: number;
}

// API响应类型
export interface SiteConfigResponse {
	success: boolean;
	data?: SiteConfig;
	message?: string;
	error?: string;
}

export interface SiteConfigListResponse {
	success: boolean;
	data?: {
		configs: SiteConfig[];
		total: number;
		page: number;
		limit: number;
	};
	message?: string;
	error?: string;
}

// 通用API响应类型
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}
