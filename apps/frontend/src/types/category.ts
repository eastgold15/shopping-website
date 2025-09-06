

// 类型定义
export interface Category {
	id: string
	slug: string
	name: string
	parentId?: string
	level: number
	sortOrder: number
	isVisible: boolean
	description?: string
	icon?: string
	image?: string
	createdAt: Date
	updatedAt: Date
}

export interface CategoryTree {
	key: string
	data: Category
	children?: CategoryTree[]
}

export interface CategoryForm {
	name: string
	slug?: string
	parentId?: string
	description?: string
	sortOrder: number
	isVisible: boolean
	icon?: string
	image?: string
}