/**
 * PrimeVue CMS 框架类型定义
 */

import type { FormInstance } from '@primevue/forms/form'



// CRUD 操作模式
export type CrudMode = 'NEW' | 'EDIT' | 'READ'

/**
 * CRUD 操作类型枚举
 */
export const CurdController = {
  CREATE: 1,
  REVIEW: 2,
  UPDATE: 4,
  DELETE: 8,
} as const


/**
 * 数据转换函数类型
 */
export type TransformSubmitData<T> = (
  originData: T,
  mode: CrudMode
) => void

// /**
//  * PrimeVue 版本的 CRUD 处理器接口
//  */
// export interface PrimeTemplateCrudHandler<T, TBase, PageQuery, MetaData = any> {
//   // 查询 → 返回带id的数据
//   getList: (query: Partial<PageQuery>) => Promise<PageRes<T>>
//   // 新增 → 必须用 TBase（禁止传入id）
//   create: (data: TBase) => Promise<DataRes<void>>
//   // 修改 → 必须用 TModel（强制要求id）
//   update: (id: string, data: T) => Promise<DataRes<void>>
//   // 删除 - 单个
//   delete?: (id: string) => Promise<any>
//   // 删除 - 批量
//   deletes?: (ids: string[]) => Promise<any>
//   // 外部处理内部弹窗的方法
//   handleCrudDialog?: (data: T, mode: CrudMode, meta?: Partial<MetaData>) => void
//   // 获取删除确认框标题 - 单个
//   getDeleteBoxTitle: (id: string) => string
//   // 获取删除确认框标题 - 批量
//   getDeleteBoxTitles: (ids: Array<string>) => string
//   // 获取空模型的方法
//   getEmptyModel: () => T
//   // 成功获取数据后的回调
//   onFetchSuccess?: () => Promise<void>
//   // 转换提交数据的方法
//   transformSubmitData?: TransformSubmitData<any>
// }

/**
 * CRUD 对话框选项
 */
export interface CrudDialogOptions<T = any, MetaData = any> {
  visible: boolean
  mode: CrudMode
  data: T | null
  loading: boolean
  meta: Partial<MetaData> | undefined
}

/**
 * PrimeVue CMS 模板数据返回类型
 */
export interface PrimeCmsTemplateResult<T, PageQuery, MetaData = any> {
  // 表格数据
  tableData: Ref<PageModel<T[]>>
  // 查询表单数据
  queryForm: Ref<PageQuery>
  // 表单加载状态
  formLoading: Ref<boolean>
  // CRUD 对话框选项
  crudDialogOptions: Ref<CrudDialogOptions<T, MetaData>>

  // 方法
  // 重置表单
  resetForm: (formEl: FormInstance | undefined) => void
  // 搜索表单
  FormSearch: (formEl: FormInstance | undefined, param?: Partial<PageQuery>) => Promise<void>
  // 处理 CRUD 对话框
  handleCrudDialog: (data: T | null, mode: CrudMode, meta?: Partial<MetaData>) => void
  // 获取列表数据
  fetchList: (param?: Partial<PageQuery>) => Promise<void>
  // 提交表单
  submitForm: (formEl: FormInstance | undefined) => Promise<void>
  // 删除数据
  handleDeletes: (ids: Array<string>) => Promise<void>

  // 泛型标记
  __genericTypes: [T, PageQuery, MetaData]
}


// /**
//  * 自动提取的模板数据类型
//  */
// export type GenPrimeCmsTemplateData<T extends { id: string }, PageQuery, MetaData = any> =
//   UnPromisify<ReturnType<typeof import('./usePrimeTemplateGen').genPrimeCmsTemplateData<T, PageQuery, MetaData>>>

/**
 * PrimeVue 表单验证规则
 */
export interface PrimeFormRule {
  required?: boolean
  message?: string
  validator?: (value: any) => boolean | string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  type?: 'string' | 'number' | 'email' | 'url'
}

/**
 * PrimeVue 表单验证规则集合
 */
export interface PrimeFormRules {
  [key: string]: PrimeFormRule[] | PrimeFormRule
}

/**
 * 分页配置
 */
export interface PaginationOptions {
  first: number
  rows: number
  totalRecords: number
  rowsPerPageOptions: number[]
}

/**
 * 分页事件参数
 */
export interface PageEvent {
  first: number
  rows: number
  page: number
  pageCount: number
}

/**
 * 树形选择器选项
 */
export interface TreeSelectOption {
  id: string | number
  label: string
  children?: TreeSelectOption[]
  data?: any
}

/**
 * 选择器选项
 */
export interface SelectOption {
  label: string
  value: any
  disabled?: boolean
  data?: any
}

/**
 * 表格列配置
 */
export interface TableColumnConfig {
  field?: string
  header?: string
  style?: string
  width?: string | number
  frozen?: boolean
  alignFrozen?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  exportable?: boolean
}

/**
 * 操作按钮配置
 */
export interface ActionButtonConfig {
  label: string
  icon: string
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast'
  size?: 'small' | 'large'
  tooltip?: string
  visible?: boolean
  disabled?: boolean
  action: (row: any) => void
}

/**
 * CRUD 控制器配置
 */
export interface CrudControllerConfig {
  create?: boolean
  review?: boolean
  update?: boolean
  delete?: boolean
  controllerValue?: number
}

// export interface PageModel<T> {
//   items: T[]
//   meta: {
//     total: number
//     page: number
//     pageSize: number
//     totalPages: number
//   }
// }

/**
 * PrimeVue CRUD 模板组件属性
 */
export interface PrimeCrudTemplateProps<T extends { id: string }, PageQuery, MetaData = any> {
  // 资源名称
  name: string
  // 标识符
  identifier?: string
  // 查询表单数据
  queryForm: Partial<PageQuery>
  // 表格数据
  tableData: PageModel<T[]>
  // 模板数据
  templateData: GenPrimeCmsTemplateData<T, PageQuery, MetaData>
  // 表单验证规则
  rules?: Record<string, any>
  // 查询表单验证规则
  queryRules?: Record<string, any>
  // CRUD 控制器
  crudController?: number
}

/**
 * 插槽作用域数据
 */
export interface CrudFormSlotData<T> {
  data: T
  mode: CrudMode
  disabled: boolean
}

/**
 * 表格行数据
 */
export interface TableRowData<T> {
  data: T
  index: number
}

/**
 * PrimeVue CMS 主题配置
 */
export interface PrimeCmsThemeConfig {
  // 主题颜色
  primaryColor?: string
  // 圆角
  borderRadius?: string
  // 字体
  fontFamily?: string
  // 间距
  spacing?: {
    small?: string
    medium?: string
    large?: string
  }
  // 阴影
  shadow?: {
    light?: string
    medium?: string
    dark?: string
  }
}

/**
 * 组件尺寸配置
 */
export interface ComponentSizeConfig {
  button?: 'small' | 'medium' | 'large'
  input?: 'small' | 'medium' | 'large'
  table?: 'small' | 'medium' | 'large'
  form?: 'small' | 'medium' | 'large'
}

/**
 * PrimeVue CMS 全局配置
 */
export interface PrimeCmsGlobalConfig {
  // 主题配置
  theme?: PrimeCmsThemeConfig
  // 组件尺寸
  size?: ComponentSizeConfig
  // 默认分页大小
  defaultPageSize?: number
  // 分页大小选项
  pageSizeOptions?: number[]
  // 是否显示确认对话框
  showConfirmDialog?: boolean
  // 是否使用 Toast 提示
  useToast?: boolean
  // 是否启用表单验证
  enableFormValidation?: boolean
  // 是否启用加载状态
  enableLoadingState?: boolean
  // 自定义文本
  text?: {
    create?: string
    edit?: string
    view?: string
    delete?: string
    search?: string
    reset?: string
    confirm?: string
    cancel?: string
    submit?: string
    loading?: string
    success?: string
    error?: string
  }
}


