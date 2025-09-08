// Service层类型定义

import { t } from 'elysia';

// 统一响应格式 - 与Res.ts保持一致
export interface ServiceResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页元数据 - 与Res.ts保持一致
export interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 分页数据格式 - 与Res.ts保持一致
export interface PaginatedData<T = any> {
  items: T[];
  meta: Meta;
}

// 分页响应格式 - 与Res.ts保持一致
export interface PaginatedServiceResponse<T = any> {
  code: number;
  message: string;
  data: PaginatedData<T>;
}

// 查询选项
export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: SortOption[];
}



// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 旧的分页结果格式 - 保持兼容性
export interface PaginatedResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询过滤器
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  value: any;
}

// 排序选项
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}



// 创建选项
export interface CreateOptions {
  validate?: boolean;
  transaction?: any;
}

// 更新选项
export interface UpdateOptions {
  validate?: boolean;
  transaction?: any;
}

// 删除选项
export interface DeleteOptions {
  transaction?: any;
  force?: boolean;
}



// 查询构建器选项
export interface QueryBuilderOptions {
  table: string;
  selects?: string[];
  joins?: Array<{
    table: string;
    on: string;
    type: 'left' | 'right' | 'inner';
  }>;
  where?: Record<string, any>;
  orderBy?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  groupBy?: string[];
  having?: Record<string, any>;

}

// 事务选项
export interface TransactionOptions {
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
}

// 批量操作选项
export interface BatchOptions {
  batchSize?: number;
  delay?: number;
  retryCount?: number;
  onError?: 'continue' | 'stop';
}

// 缓存选项
export interface CacheOptions {
  key: string;
  ttl?: number;
  tags?: string[];
}

