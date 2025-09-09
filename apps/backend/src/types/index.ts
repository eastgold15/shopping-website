// 后端统一类型导出文件
// 为前端提供唯一的事实来源

// 数据库类型
export * from '../db/database.types';
export * from '../db/common.model';

// 模块类型导出
// export * from '../modules/auth/auth.model'; // auth模块暂未实现
export * from '../modules/category/categories.model';
export * from '../modules/product/products.model';
export * from '../modules/order/orders.model';
export * from '../modules/user/users.model';
export * from '@backend/modules/image/images.model';
export * from '../modules/statistics/statistics.model';

// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 常用工具类型
export type ID = string | number;
export type Timestamp = Date | string;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;