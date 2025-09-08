// 前端项目类型定义统一导出
// 
// 使用说明：
// 1. 从 @frontend/types/models 导入后端数据库相关类型
// 2. 从 @frontend/types/api 导入API请求/响应相关类型  
// 3. 从 @frontend/types/frontend 导入前端自定义类型
// 4. 如果需要复用类型，请在此文件中创建组合类型

// 模块导出
export * from './models';
export * from './api';
export * from './frontend';

// 常用组合类型
import type { 
  CreateImageDto, 
  UpdateImageDto,
  CreateProductDto,
  UpdateProductDto 
} from './models';

import type { 
  ApiResponse, 
  ApiListResponse, 
  FormState, 
  AsyncState,
  PaginationState 
} from './api';

// 图片相关的组合类型
export interface ImageFormData extends Omit<CreateImageDto, 'id'> {
  file?: File;
}

export interface ImageWithForm extends UpdateImageDto {
  id: string;
  file?: File;
}

// 产品相关的组合类型
export interface ProductFormData extends Omit<CreateProductDto, 'id'> {
  images?: File[];
}

export interface ProductWithForm extends UpdateProductDto {
  id: string;
  images?: File[];
}

// 页面组件状态类型
export interface PageState<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: Record<string, any>;
}

// 表格组件状态类型
export interface TableState<T = any> extends PageState<T> {
  selectedRows: T[];
  sortColumn: keyof T | string;
  sortDirection: 'asc' | 'desc';
}

// 模态框状态类型
export interface ModalState<T = any> {
  visible: boolean;
  data: T | null;
  mode: 'create' | 'edit' | 'view';
  loading: boolean;
}

// 表单状态类型扩展
export interface FormStateWithData<T = any> extends FormState<T> {
  id?: string;
  mode: 'create' | 'edit';
}

// API状态类型扩展
export interface ApiState<T = any> extends AsyncState<T> {
  lastUpdated: Date | null;
  refetch: () => void;
}

// 类型工具函数
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 常用类型别名
export type ID = string;
export type Timestamp = string;
export type JSONObject = Record<string, any>;
export type StringMap = Record<string, string>;

// 状态枚举
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted',
  DRAFT = 'draft'
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 操作类型枚举
export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view'
}