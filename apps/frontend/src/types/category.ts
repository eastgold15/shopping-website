

export interface CategoryForm {
	name: string;
	slug?: string;
	parentId?: string;
	description?: string;
	sortOrder: number;
	isVisible: boolean;
	icon?: string;
	image?: string;
}
