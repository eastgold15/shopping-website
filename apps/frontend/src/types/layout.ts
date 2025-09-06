// 前端布局相关类型定义

// 帮助链接
export interface HelpLink {
	text: string;
	url: string;
}

// 顶部配置
export interface HeaderConfig {
	id: string;
	bannerText: string;
	bannerLink: string;
	trackOrderText: string;
	trackOrderLink: string;
	helpLinks: HelpLink[];
	createdAt: string;
	updatedAt: string;
}

// 底部链接
export interface FooterLink {
	text: string;
	url: string;
}

// 底部栏目
export interface FooterSection {
	title: string;
	links: FooterLink[];
}

// 底部配置
export interface FooterConfig {
	id: string;
	copyright: string;
	backToTopText: string;
	sections: FooterSection[];
	createdAt: string;
	updatedAt: string;
}

// 创建顶部配置请求
export interface CreateHeaderConfigRequest {
	bannerText: string;
	bannerLink: string;
	trackOrderText: string;
	trackOrderLink: string;
	helpLinks: HelpLink[];
}

// 更新顶部配置请求
export interface UpdateHeaderConfigRequest {
	bannerText?: string;
	bannerLink?: string;
	trackOrderText?: string;
	trackOrderLink?: string;
	helpLinks?: HelpLink[];
}

// 创建底部配置请求
export interface CreateFooterConfigRequest {
	copyright: string;
	backToTopText: string;
	sections: FooterSection[];
}

// 更新底部配置请求
export interface UpdateFooterConfigRequest {
	copyright?: string;
	backToTopText?: string;
	sections?: FooterSection[];
}

// API响应类型
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}