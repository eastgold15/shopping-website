// 前端自定义类型定义
// 这些类型是前端特有的，不直接依赖于后端数据库结构

// 表单相关类型
export interface FormState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  dirty: boolean;
  touched: Record<string, boolean>;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  rules?: ValidationRule[];
}

// UI组件相关类型
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => string | JSX.Element;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  [key: string]: any;
}

export interface MenuItem {
  label: string;
  icon?: string;
  command?: () => void;
  items?: MenuItem[];
  to?: string;
  disabled?: boolean;
}

// 状态管理相关类型
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 路由相关类型
export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: string[];
  layout?: string;
}

// 文件上传相关类型
export interface FileUploadOptions {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onBeforeUpload?: (file: File) => boolean;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

// 主题相关类型
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
}

// 工具函数相关类型
export interface FormatOptions {
  dateFormat?: string;
  currency?: string;
  locale?: string;
  numberFormat?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
}

// 事件处理相关类型
export interface EventHandlers {
  [key: string]: (...args: any[]) => void;
}

// 自定义Hook相关类型
export interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

export interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}