// 类型定义 - 基于数据库schema
export interface Products {
	barcode: string;
	careInstructions: string;
	categoryId: number;
	categoryName: string;
	colors: string[];
	comparePrice: string;
	cost: string;
	createdAt: string;
	description: string;
	dimensions: Dimensions;
	features: string[];
	id: number;
	images: string[];
	isActive: boolean;
	isFeatured: boolean;
	materials: string[];
	metaDescription: string;
	metaKeywords: string;
	metaTitle: string;
	minStock: number;
	name: string;
	price: string;
	shortDescription: string;
	sizes: string[];
	sku: string;
	slug: string;
	specifications: Specifications;
	stock: number;
	updatedAt: string;
	videos: string[];
	weight: string;
}



export interface Dimensions {
	height: number;
	length: number;
	width: number;
	[property: string]: any;
}

export interface Specifications {
	fabric: string;
	fit: string;
	weight: string;

}

export interface ProductForm {
	name: string;
	slug: string;
	description: string;
	shortDescription: string;
	price: number;
	comparePrice?: number;
	cost?: number;
	sku: string;
	barcode?: string;
	weight?: number;
	dimensions?: any;
	images: string[];
	videos?: string[];
	colors?: string[];
	sizes?: string[];
	materials?: string[];
	careInstructions?: string;
	features?: any;
	specifications?: any;
	categoryId: number | null;
	stock: number;
	minStock: number;
	isActive: boolean;
	isFeatured: boolean;
	metaTitle?: string;
	metaDescription?: string;
	metaKeywords?: string;
}

// export interface Category {
//     id: number
//     name: string
//     slug: string
//     description?: string
//     isActive: boolean
// }
