// API 请求/响应相关的类型定义
// 这些类型基于后端模型，但可能包含前端特定的字段

// API 请求/响应相关的类型定义
// 这些类型基于后端模型，但可能包含前端特定的字段
import type {
  CreateImageDto,
  UpdateImageDto,
  ImageListQueryDto,
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ProductSearchQueryDto
} from '../models';

// 扩展的API请求类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success?: boolean;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 图片相关的API类型
export interface ImageUploadRequest {
  file: File;
  category: string;
  altText?: string;
}

export interface ImageUpdateRequest extends Partial<UpdateImageDto> {
  id: string;
}

// 产品相关的API类型
export interface ProductCreateRequest extends Omit<CreateProductDto, 'id'> {}
export interface ProductUpdateRequest extends Partial<UpdateProductDto> {
  id: string;
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 搜索参数
export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, any>;
}

// 通用查询参数
export interface QueryParams extends PaginationParams {
  [key: string]: any;
}