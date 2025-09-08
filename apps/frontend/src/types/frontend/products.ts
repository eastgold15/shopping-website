// 产品管理相关的类型定义示例
// 展示如何复用后端类型并扩展前端特定需求

import type { 
  // 从后端导入的基础类型
  CreateProductDto, 
  UpdateProductDto,
  ProductListQueryDto,
  ProductSearchQueryDto,
  // 从后端导入的数据库类型
  productsSchema,
  categoriesSchema
} from '@frontend/types/models';

import type { 
  ApiResponse,
  ApiListResponse,
  FormState,
  ModalState,
  PaginationState
} from '@frontend/types/api';

// 扩展的产品类型 - 包含前端特有的字段
export interface ProductItem extends productsSchema {
  id: string;
  category?: categoriesSchema; // 关联的分类信息
  formattedPrice?: string;     // 前端格式化显示
  discountPercentage?: number; // 折扣百分比
  averageRating?: number;      // 平均评分
  reviewCount?: number;       // 评价数量
  isInWishlist?: boolean;      // 是否在收藏夹
  isInCart?: boolean;          // 是否在购物车
  images?: ProductImage[];     // 产品图片
  variants?: ProductVariant[]; // 产品变体
  tags?: string[];            // 标签
}

// 产品图片类型
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

// 产品变体类型
export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  comparePrice?: number;
  inventory: number;
  options: VariantOption[];
  isActive: boolean;
}

export interface VariantOption {
  name: string;
  value: string;
}

// 产品表单状态类型
export interface ProductFormState extends FormState<Partial<CreateProductDto>> {
  variantGroups: VariantGroup[];
  uploadedImages: ProductImage[];
  selectedCategory?: string;
  selectedTags: string[];
}

// 变体组类型
export interface VariantGroup {
  name: string;
  options: string[];
}

// 产品模态框状态类型
export interface ProductModalState extends ModalState<ProductItem> {
  mode: 'create' | 'edit' | 'view' | 'duplicate';
  activeTab: 'basic' | 'variants' | 'images' | 'seo';
}

// 产品查询参数扩展
export interface ProductQueryParams extends ProductListQueryDto {
  minRating?: number;
  maxRating?: number;
  hasDiscount?: boolean;
  inStock?: boolean;
  tags?: string[];
}

// 产品搜索参数扩展
export interface ProductSearchParams extends ProductSearchQueryDto {
  searchFields?: ('name' | 'description' | 'tags' | 'sku')[];
}

// 产品API响应类型
export interface ProductApiResponse extends ApiResponse<ProductItem> {}
export interface ProductListApiResponse extends ApiListResponse<ProductItem> {}

// 产品筛选器类型
export interface ProductFilter {
  categories?: string[];
  priceRange?: [number, number];
  ratingRange?: [number, number];
  tags?: string[];
  inStock?: boolean;
  hasDiscount?: boolean;
  sortBy?: 'price' | 'rating' | 'newest' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// 产品卡片组件类型
export interface ProductCardProps {
  product: ProductItem;
  showQuickView?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  onQuickView?: (product: ProductItem) => void;
  onAddToCart?: (product: ProductItem) => void;
  onWishlist?: (product: ProductItem) => void;
}