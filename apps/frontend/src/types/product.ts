// 类型定义 - 基于数据库schema
export interface Product {
    id: number
    name: string
    slug: string
    description: string
    shortDescription: string
    price: number
    comparePrice?: number
    cost?: number
    sku: string
    barcode?: string
    weight?: number
    dimensions?: any
    images: string[]
    videos?: string[]
    colors?: string[]
    sizes?: string[]
    materials?: string[]
    careInstructions?: string
    features?: any
    specifications?: any
    categoryId: number
    categoryName?: string
    stock: number
    minStock: number
    isActive: boolean
    isFeatured: boolean
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    createdAt: Date
    updatedAt: Date
}

export interface ProductForm {
    name: string
    slug: string
    description: string
    shortDescription: string
    price: number
    comparePrice?: number
    cost?: number
    sku: string
    barcode?: string
    weight?: number
    dimensions?: any
    images: string[]
    videos?: string[]
    colors?: string[]
    sizes?: string[]
    materials?: string[]
    careInstructions?: string
    features?: any
    specifications?: any
    categoryId: number | null
    stock: number
    minStock: number
    isActive: boolean
    isFeatured: boolean
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
}

// export interface Category {
//     id: number
//     name: string
//     slug: string
//     description?: string
//     isActive: boolean
// }