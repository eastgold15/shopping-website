// 前端布局相关类型定义



// 分类数据类型定义
export interface CategoryTree {
	children?: Omit<CategoryTree, 'children'> | null | undefined;
	createdAt: string;
	description: string;
	icon: string;
	id: string;
	image: string;
	isVisible: boolean;
	name: string;
	parentId: string;
	slug: string;
	sortOrder: number;
	updatedAt: string;
	[property: string]: any;
}


export interface FooterConfig {
	category: string;
	createdAt: string;
	description: string;
	id: number;
	key: string;
	updatedAt: string;
	value: string;

}
export interface FooterSection {
	title: string;
	links: FooterLink[];
}


// 帮助链接
export interface FooterLink {
	text: string;
	url: string;
}

