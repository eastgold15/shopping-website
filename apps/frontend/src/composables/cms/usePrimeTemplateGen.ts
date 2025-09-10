
import { omitBy } from 'lodash-es'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

type TransformSubmitData<T> = (
  originData: T,
  mode: CrudMode
) => void

// 定义通用的模板接口
export interface PrimeTemplateCrudHandler<T, TBase, PageQuery, MetaData> {
  // 查询 → 返回带id的数据
  getList: (query: Partial<PageQuery>) => Promise<PageRes<T>>
  // 新增 → 必须用 TBase（禁止传入id）
  create: (data: TBase) => Promise<DataRes<void>>
  // 修改 → 必须用 TModel（强制要求id）
  update: (id: string, data: T) => Promise<DataRes<void>>
  delete?: (id: string) => Promise<any>
  deletes?: (ids: string[]) => Promise<any>
  // 外部处理内部弹窗的方法
  handleCrudDialog?: (data: T, mode: CrudMode, meta?: Partial<MetaData>) => void
  getDeleteBoxTitle: (id: string) => string
  getDeleteBoxTitles: (ids: Array<string>) => string
  // 获取空模型的方法
  getEmptyModel: () => T
  // 回调
  onFetchSuccess?: () => Promise<void>
  // 转换提交数据的方法
  transformSubmitData?: TransformSubmitData<any>
}

export type CrudMode = 'NEW' | 'EDIT' | 'READ'

/**
 * CRUD 操作类型枚举
 */
export enum CurdController {
  CREATE = 1,
  REVIEW = 2,
  UPDATE = 4,
  DELETE = 8,
}

/**
 * PrimeVue版本的CMS模板数据生成器
 * @param dataCrudHandler CRUD处理器
 * @param queryData 查询参数
 * @returns 模板数据
 */
export async function genPrimeCmsTemplateData<T extends { id: string }, PageQuery, MetaData>(
  dataCrudHandler: PrimeTemplateCrudHandler<T, Omit<T, 'id'>, PageQuery, MetaData>,
  queryData: Partial<PageQuery>,
) {
  // PrimeVue服务
  const confirm = useConfirm()
  const toast = useToast()
  
  // 表单加载状态
  const formLoading = ref(false)

  // 表格数据
  const tableData = ref<PageModel<T>>({
    items: [],
    meta: {
      currentPage: 1,
      itemCount: 0,
      totalPages: 0,
      itemsPerPage: 20,
      totalItems: 0,
    },
  })

  // 搜索表单
  const queryForm = reactive<Partial<PageQuery>>({ ...queryData })
  
  // 查询参数计算属性
  const queryParams = computed<Partial<PageQuery>>(() => ({
    page: tableData.value.meta.currentPage,
    pageSize: tableData.value.meta.itemsPerPage,
    ...toRaw(queryForm),
  }) as Partial<PageQuery>)

  // 获取数据方法
  const fetchList = async (params: Partial<PageQuery> = queryParams.value) => {
    try {
      formLoading.value = true
      const safeParams = omitBy(params, v => v == null || v === '') as Partial<PageQuery>
      const { code, data, message } = await dataCrudHandler.getList(safeParams)

      if (code === 200) {
        await dataCrudHandler.onFetchSuccess?.()
        tableData.value = data
      } else {
        toast.add({
          severity: 'error',
          summary: '查询失败',
          detail: message || '数据获取失败',
          life: 3000
        })
      }
    } catch (error) {
      console.error('fetchList error:', error)
      toast.add({
        severity: 'error',
        summary: '查询异常',
        detail: '网络异常，请稍后重试',
        life: 3000
      })
    } finally {
      formLoading.value = false
    }
  }

  // 重置表单
  function resetForm(formEl: any) {
    if (!formEl) {
      console.error('表单实例未初始化')
      return
    }
    try {
      // PrimeVue表单重置
      if (formEl.reset) {
        formEl.reset()
      } else {
        // 手动重置queryForm
        Object.keys(queryForm).forEach(key => {
          if (queryData[key as keyof PageQuery] !== undefined) {
            (queryForm as any)[key] = queryData[key as keyof PageQuery]
          } else {
            delete (queryForm as any)[key]
          }
        })
      }
      // 重置后重新获取数据
      fetchList()
    } catch (error) {
      console.error('重置表单失败:', error)
    }
  }

  // 搜索表单
  const FormSearch = async (formEl: any, param: Partial<PageQuery> = queryParams.value) => {
    try {
      // PrimeVue表单验证
      if (formEl && formEl.validate) {
        const isValid = await formEl.validate()
        if (!isValid) {
          toast.add({
            severity: 'warn',
            summary: '表单验证失败',
            detail: '请检查输入内容',
            life: 3000
          })
          return
        }
      }
      await fetchList(param)
    } catch (error) {
      console.error('表单搜索错误:', error)
      await fetchList(param)
    }
  }

  // CRUD对话框选项
  interface CrudDialogOptions {
    visible: boolean
    mode: CrudMode
    data: T | null
    loading: boolean
    meta: Partial<MetaData> | undefined
  }

  const crudDialogOptions = ref<CrudDialogOptions>({
    visible: false,
    mode: 'NEW',
    data: null,
    loading: false,
    meta: undefined,
  })

  // 处理CRUD对话框
  function handleCrudDialog(data: T | null, mode: CrudMode, meta?: Partial<MetaData>) {
    crudDialogOptions.value = {
      ...crudDialogOptions.value,
      mode,
      meta,
      data: data || dataCrudHandler.getEmptyModel(),
      visible: true,
    }
    dataCrudHandler.handleCrudDialog?.(data!, mode, meta)
  }

  // 提交表单
  async function submitForm(formEl: any) {
    if (!formEl) return
    
    try {
      // PrimeVue表单验证
      let isValid = true
      if (formEl.validate) {
        isValid = await formEl.validate()
      }
      
      if (!isValid) {
        toast.add({
          severity: 'warn',
          summary: '表单验证失败',
          detail: '请检查输入内容',
          life: 3000
        })
        return
      }

      const data = crudDialogOptions.value.data
      if (!data) {
        toast.add({
          severity: 'error',
          summary: '数据错误',
          detail: '流程数据错误！',
          life: 3000
        })
        return
      }

      crudDialogOptions.value.loading = true

      // 转换提交数据
      dataCrudHandler.transformSubmitData?.(data as T, crudDialogOptions.value.mode)

      // 提交数据
      const submitData = toRaw(data) as T
      let res
      
      if (crudDialogOptions.value.mode === 'EDIT') {
        res = await dataCrudHandler.update(submitData.id!, submitData)
        if (res.code === 200) {
          toast.add({
            severity: 'success',
            summary: '修改成功',
            detail: '数据已成功修改',
            life: 3000
          })
        } else {
          toast.add({
            severity: 'error',
            summary: '修改失败',
            detail: res.message ?? '修改失败！',
            life: 3000
          })
        }
      } else {
        res = await dataCrudHandler.create(submitData)
        if (res.code === 200) {
          toast.add({
            severity: 'success',
            summary: '添加成功',
            detail: '数据已成功添加',
            life: 3000
          })
        } else {
          toast.add({
            severity: 'error',
            summary: '添加失败',
            detail: res.message ?? '添加失败！',
            life: 3000
          })
        }
      }

      // 统一处理成功后的逻辑
      if (res?.code === 200) {
        crudDialogOptions.value.visible = false
        await fetchList()
      }
    } catch (error) {
      console.error('表单提交失败:', error)
      toast.add({
        severity: 'error',
        summary: '提交失败',
        detail: '表单提交失败，请稍后重试',
        life: 3000
      })
    } finally {
      crudDialogOptions.value.loading = false
    }
  }

  // 删除数据
  async function handleDeletes(ids: Array<string>) {
    confirm.require({
      message: `你确定要删除${dataCrudHandler.getDeleteBoxTitles(ids)} 吗？删除后这个${dataCrudHandler.getDeleteBoxTitles(ids)}永久无法找回。`,
      header: '确认删除',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary p-button-outlined',
      rejectLabel: '取消',
      acceptLabel: '确定删除',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          let res
          if (ids.length === 1) {
            res = await dataCrudHandler.delete!(ids[0]!)
          } else {
            res = await dataCrudHandler.deletes!(ids)
          }

          if (res.code !== 200) {
            toast.add({
              severity: 'error',
              summary: '删除失败',
              detail: res.message || '删除失败！',
              life: 3000
            })
            return
          }
          
          await fetchList() // 刷新数据
          toast.add({
            severity: 'info',
            summary: '删除成功',
            detail: `你永久删除了${dataCrudHandler.getDeleteBoxTitles(ids)}！`,
            life: 3000
          })
        } catch (error) {
          console.error('删除失败:', error)
          toast.add({
            severity: 'error',
            summary: '删除异常',
            detail: '删除操作异常，请稍后重试',
            life: 3000
          })
        }
      },
      reject: () => {
        toast.add({
          severity: 'info',
          summary: '已取消',
          detail: `已取消删除${dataCrudHandler.getDeleteBoxTitles(ids)}！`,
          life: 3000
        })
      }
    })
  }

  const result = {
    tableData,
    queryForm,
    formLoading,
    crudDialogOptions,
    resetForm,
    FormSearch,
    handleCrudDialog,
    fetchList,
    submitForm,
    handleDeletes,
  }

  // 手动指定返回类型
  type ResultType<T, PQ, MD> = {
    tableData: Ref<PageModel<T[]>>
    formLoading: Ref<boolean>
    crudDialogOptions: Ref<CrudDialogOptions>
    queryForm: Ref<PageQuery>
    resetForm: (formEl: any) => void
    FormSearch: (formEl: any, param?: Partial<PQ>) => Promise<void>
    handleCrudDialog: (data: T | null, mode: CrudMode, meta?: Partial<MD>) => void
    fetchList: (param?: Partial<PQ>) => Promise<void>
    submitForm: (formEl: any) => Promise<void>
    handleDeletes: (ids: Array<string>) => Promise<void>
  } & { __genericTypes: [T, PQ, MD] }
  
  return result as unknown as ResultType<T, PageQuery, MetaData>
}

// 自动提取类型
export type GenCmsTemplateData<T extends { id: string }, PageQuery, MetaData> =
  UnPromisify<ReturnType<typeof genPrimeCmsTemplateData<T, PageQuery, MetaData>>>