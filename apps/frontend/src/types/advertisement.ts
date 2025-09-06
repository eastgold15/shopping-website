// 前端广告相关类型定义


export interface Advertisement {
	createdAt: string;
	endDate: string;
	id: number;
	image: string;
	isActive: boolean;
	link: string;
	position: string;
	sortOrder: number;
	startDate: string;
	title: string;
	type: string;
	updatedAt: string;
}
