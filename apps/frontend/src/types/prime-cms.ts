/**
 * PrimeVue CMS 类型定义
 */

import type { CommonRes, PageData, PageRes } from "@backend/types";
import type { FormInstance } from "@primevue/forms";

// CRUD 操作模式
export type CrudMode = "NEW" | "EDIT" | "READ";

/**
 * CRUD 控制器权限
 */
export const CurdController = {
	CREATE: 1,
	REVIEW: 2,
	UPDATE: 4,
	DELETE: 8,
} as const;

/**
 * CRUD 对话框选项
 */
export interface CrudDialogOptions<T = unknown> {
	visible: boolean;
	mode: CrudMode;
	data: T | null;
	loading: boolean;
	meta?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

/**
 * 表单验证器类型
 */
export type FormResolver = (values: Record<string, unknown>) =>
	| PromiseLike<{
			errors?: Record<string, { type?: string; message?: string }>;
	  }>
	| {
			errors?: Record<string, { type?: string; message?: string }>;
	  };

/**
 * 数据转换函数类型
 */
export type TransformSubmitData<T> = (data: T, mode: CrudMode) => void;

/**
 * PrimeVue 表单实例引用类型
 */
export type FormInstanceRef = Ref<FormInstance | null>;

/**
 * 查询参数基础接口
 */
export interface BaseQueryParams {
	page?: number;
	limit?: number;
}

/**
 * 通用CRUD处理器接口 - 至少需要提供 getList 或 getTree 方法之一
 */
export type PrimeTemplateCrudHandler<
	T extends { id: number },
	PageQuery extends BaseQueryParams,
	TForm extends Record<string, any> = T,
> = {
	// 新增 → 必须用 TForm（禁止传入id）
	create: (data: Omit<TForm, "id">) => Promise<CommonRes<null>>;
	// 修改 → 必须用 TForm（强制要求id）
	update: (id: number, data: TForm) => Promise<CommonRes<null>>;
	delete?: (id: number) => Promise<CommonRes<null>>;
	deletes?: (ids: number[]) => Promise<CommonRes<null>>;
	// 外部处理内部弹窗的方法
	handleCrudDialog?: (data: T, mode: CrudMode) => void;
	getDeleteBoxTitle: (id: number) => string;
	getDeleteBoxTitles: (ids: Array<number>) => string;
	// 获取空模型的方法
	getEmptyModel: () => T;
	// 回调
	onFetchSuccess?: (data: PageData<T[]>) => Promise<void>;
	// 转换提交数据的方法
	transformSubmitData?: TransformSubmitData<TForm>;
} & ( // 要求至少提供 getList 或 getTree 方法之一
	| {
			// 查询 → 返回带id的数据 (普通列表)
			getList: (query: Partial<PageQuery>) => Promise<PageRes<T[]>>;
			getTree?: (query: Partial<PageQuery>) => Promise<CommonRes<T[]>>;
	  }
	| {
			// 查询 → 返回带id的数据 (树形数据)
			getTree: (query: Partial<PageQuery>) => Promise<CommonRes<T[]>>;
			getList?: (query: Partial<PageQuery>) => Promise<PageRes<T[]>>;
	  }
);

/**
 * 模板数据返回类型
 */
export interface GenCmsTemplateData<
	T extends { id: number },
	PageQuery extends BaseQueryParams,
	TForm extends Record<string, any> = T,
> {
	tableData: Ref<PageData<T[]>>;
	treeData: Ref<T[]>;
	queryForm: Partial<PageQuery>;
	formLoading: Ref<boolean>;
	crudDialogOptions: Ref<CrudDialogOptions<T>>;
	resetForm: (formEl: FormInstance | null) => void;
	FormSearch: (
		formEl: FormInstance | null,
		param?: Partial<PageQuery>,
	) => Promise<void>;
	handleCrudDialog: (data: T | null, mode: CrudMode) => void;
	fetchList: (param?: Partial<PageQuery>) => Promise<void>;
	fetchTree: (param?: Partial<PageQuery>) => Promise<void>;
	fetchData: (
		useTreeTable?: boolean,
		param?: Partial<PageQuery>,
	) => Promise<void>; // 统一数据获取方法
	submitForm: (formEl: FormInstance | null) => Promise<void>;
	handleDeletes: (ids: Array<number>) => Promise<void>;
	// 添加CRUD操作方法
	create: (data: Omit<TForm, "id">) => Promise<CommonRes<null>>;
	update: (id: number, data: TForm) => Promise<CommonRes<null>>;
	transformSubmitData?: TransformSubmitData<TForm>;
}
