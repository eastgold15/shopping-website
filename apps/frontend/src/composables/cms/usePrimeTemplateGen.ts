//哲学： 怎么做
import type { CommonRes, PageData, PageRes } from "@backend/types";
import type {
  BaseQueryParams,
  CrudDialogOptions,
  CrudMode,
  PrimeTemplateCrudHandler,
} from "@frontend/types/prime-cms";
import type { UnPromisify } from "@frontend/utils/handleApi";
import type { FormInstance, FormSubmitEvent } from "@primevue/forms";
import { omitBy } from "lodash-es";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, reactive, ref, toRaw } from "vue";

/**
 * 重置表单
 * @param formEl 表单实例
 */
export function resetForm(formEl: FormInstance | null) {
  if (formEl) {
    formEl.reset?.();
  }
}

/**
 * 提交表单
 * @param formEl 表单实例
 */
export async function submitForm(formEl: FormInstance | null) {
  if (formEl) {
    await formEl.submit?.();
  }
}

/**
 * PrimeVue版本的CMS模板数据生成器
 * 泛型：
 * - T：数据模型类型，必须包含 id 字段
 * - PageQuery：分页查询参数类型，必须继承 BaseQueryParams
 * - TForm：表单数据类型，默认与 T 相同
 * @param dataCrudHandler CRUD处理器
 * @param initQueryData 初始化查询表单  查询参数
 * @param useTreeTable 是否使用树形表格
 * @returns 模板数据
 */
export async function genPrimeCmsTemplateData<
  T extends { id: number },
  PageQuery extends BaseQueryParams,
  TForm extends Record<string, any> = T,
>(
  dataCrudHandler: PrimeTemplateCrudHandler<T, PageQuery, TForm>,
  initQueryData: Partial<PageQuery>,
  useTreeTable: boolean = false
) {
  // PrimeVue服务
  const confirm = useConfirm();
  const toast = useToast();
  // 表单加载状态
  const formLoading = ref(false);

  // ✅ 新增：queryFormRef，用于 onQueryFormSubmit
  const queryFormRef = ref<FormInstance | null>(null);
  /**
   * 是否分页
   * 默认true 分页
   */
  const isPage = ref(true)

  /**表格数据 */
  const tableData = ref<PageData<T>>({
    items: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });
  /**树形数据 */

  type TreeNodeData = T & {
    key: string;
    children?: TreeNodeData[];
  };
  const treeData = ref<TreeNodeData[]>([]);

  const expandedKeys = ref<Record<string, boolean>>({})

  // 类型守卫函数，用于检查是否提供了 getList 方法
  function hasGetList(
    handler: PrimeTemplateCrudHandler<T, PageQuery, TForm>,
  ): handler is PrimeTemplateCrudHandler<T, PageQuery, TForm> & {
    getList: (query: Partial<PageQuery>) => Promise<PageRes<T>>;
  } {
    return "getList" in handler;
  }

  // 类型守卫函数，用于检查是否提供了 getTree 方法
  function hasGetTree(
    handler: PrimeTemplateCrudHandler<T, PageQuery, TForm>,
  ): handler is PrimeTemplateCrudHandler<T, PageQuery, TForm> & {
    getTree: (query: Partial<PageQuery>) => Promise<CommonRes<T[]>>;
  } {
    return "getTree" in handler;
  }

  function hasGetAll(
    handler: PrimeTemplateCrudHandler<T, PageQuery, TForm>
  ): handler is PrimeTemplateCrudHandler<T, PageQuery, TForm> & {
    getAll: (query: Partial<PageQuery>) => Promise<CommonRes<T[]>>
  } {
    return "getAll" in handler
  }



  // 获取分页数据方法
  const fetchList = async (params: Partial<PageQuery> = queryParams.value) => {
    try {
      formLoading.value = true;
      const safeParams = omitBy(
        params,
        (v) => v == null || v === "",
      ) as Partial<PageQuery>;

      // 使用类型守卫确保 getList 存在
      if (!hasGetList(dataCrudHandler)) {
        throw new Error("getList 方法未定义");
      }
      const { code, data, message } = await dataCrudHandler.getList(safeParams);
      if (code === 200) {
        if (dataCrudHandler.onFetchSuccess) {
          await dataCrudHandler.onFetchSuccess(data);
          tableData.value = data;
        } else {
          tableData.value = data;
        }
      } else {
        toast.add({
          severity: "error",
          summary: "查询失败",
          detail: message || "数据获取失败",
          life: 3000,
        });
      }
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "查询异常",
        detail: "网络异常，请稍后重试",
        life: 3000,
      });
    } finally {
      formLoading.value = false;
    }
  };

  // 获取树形数据方法
  const fetchTree = async (params: Partial<PageQuery> = queryParams.value) => {
    isPage.value = false
    try {
      formLoading.value = true;
      const safeParams = omitBy(
        params,
        (v) => v == null || v === "",
      ) as Partial<PageQuery>;
      // 使用类型守卫确保 getTree 存在
      if (!hasGetTree(dataCrudHandler)) {
        throw new Error("getTree 方法未定义");
      }
      const { code, data, message } = await dataCrudHandler.getTree(safeParams);
      if (code === 200) {
        const addKeys = (items: T[], parentKey = ""): TreeNodeData[] => {
          return items.map((item, index) => {
            const key = parentKey ? `${parentKey}-${index}` : String(index);
            const node: TreeNodeData = {
              ...item,
              key,
              children: (item as any).children ? addKeys((item as any).children, key) : undefined,
            };
            return node;
          });
        };
        console.log('addKeys(data):', addKeys(data))
        treeData.value = addKeys(data);
      } else {
        toast.add({
          severity: "error",
          summary: "查询失败",
          detail: message || "树形数据获取失败",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("fetchTree error:", error);
      toast.add({
        severity: "error",
        summary: "查询异常",
        detail: "网络异常，请稍后重试",
        life: 3000,
      });
    } finally {
      formLoading.value = false;
    }
  };

  // 获取全部数据方法 (不分页)
  const fetchAll = async (params: Partial<PageQuery> = queryParams.value) => {
    isPage.value = false
    try {
      formLoading.value = true;
      const safeParams = omitBy(
        params,
        (v) => v == null || v === "",
      ) as Partial<PageQuery>;

      if (!hasGetAll(dataCrudHandler)) {
        throw new Error("getAll 方法未定义");
      }

      const { code, data, message } = await dataCrudHandler.getAll(safeParams);

      if (code === 200) {
        // 同步更新 tableData 以支持在普通表格中展示全部数据（无分页）
        tableData.value = {
          items: data, // 所有数据
          meta: {
            page: 1,
            limit: data.length, // 一次性显示所有
            total: data.length,
            totalPages: 1, // 只有一页
          },
        };
      } else {
        toast.add({
          severity: "error",
          summary: "查询失败",
          detail: message || "数据获取失败",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("fetchAll error:", error);
      toast.add({
        severity: "error",
        summary: "查询异常",
        detail: "网络异常，请稍后重试",
        life: 3000,
      });
    } finally {
      formLoading.value = false;
    }
  };

  // 统一数据获取方法 - 根据表格类型自动选择
  const fetchData = async (
    useTreeTable: boolean = false
  ) => {
    if (useTreeTable) {
      // 优先尝试获取树形数据
      if (hasGetTree(dataCrudHandler)) {
        await fetchTree();
      } else if (hasGetAll(dataCrudHandler)) {
        // 如果没有树形接口，尝试获取全部数据 (可能用于扁平化树或简单列表)
        await fetchAll();
      } else {
        throw new Error("getTree 或 getAll 方法未定义");
      }
    } else {
      // 普通表格模式
      if (hasGetList(dataCrudHandler)) {
        await fetchList();
      } else if (hasGetAll(dataCrudHandler)) {
        // 如果没有分页接口，获取全部数据
        await fetchAll();
      } else {
        throw new Error("getList 或 getAll 方法未定义");
      }
    }
  };
  /**
   * 搜索表单
   * 响应式
   * 需要绑定表单 获取查询的值
   */
  const queryForm = reactive<Partial<PageQuery>>({ ...initQueryData });



  /**
   *  查询参数
   * 这个是每一个查询的默认参数
   */
  const queryParams = computed<Partial<PageQuery>>(() => {
    const rawQueryForm = toRaw(queryForm);
    return {
      page: isPage ? tableData.value.meta.page : undefined,
      limit: isPage ? tableData.value.meta.limit : undefined,
      ...(rawQueryForm as Partial<PageQuery>),
    };
  });



  /**
   * 搜索表单
   * 因为查询有默认参数，所以不需要管传参
   * @param formEl 
   * @param isPage 
   */
  const FormSearch = async (
    formEl: FormInstance | null, //表单实例
    isPage: boolean = false, //默认true分页
  ) => {
    try {
      if (!isPage) {
        // 树形或全部数据模式
        if (hasGetTree(dataCrudHandler)) {
          await fetchTree();
        } else if (hasGetAll(dataCrudHandler)) {
          await fetchAll();
        } else {
          throw new Error("当前模式下无可调用的数据获取方法");
        }
      } else {
        // 分页表格模式
        if (hasGetList(dataCrudHandler)) {
          await fetchList();
        } else {
          throw new Error("当前模式下无可调用的数据获取方法");
        }
      }
    } catch (error) {
      console.error("表单搜索错误:", error);
      toast.add({
        severity: "error",
        summary: "搜索失败",
        detail: "请检查网络或联系管理员",
        life: 3000,
      });
    }
  };
  // CRUD对话框选项
  const crudDialogOptions = ref<CrudDialogOptions<T>>({
    visible: false,
    mode: "NEW",
    data: null,
    loading: false,
    meta: null
  });


  // 处理CRUD对话框
  function handleCrudDialog(data: T | null, mode: CrudMode) {
    crudDialogOptions.value = {
      ...crudDialogOptions.value,
      mode,
      // ✅ 安全调用 getEmptyModel
      data: data || (typeof dataCrudHandler.getEmptyModel === 'function' ? dataCrudHandler.getEmptyModel() : {} as T),
      visible: true,
    };
    dataCrudHandler.handleCrudDialog?.(data!, mode);
  }

  // 删除数据
  async function handleDeletes(ids: Array<number>) {
    console.log("handleDeletes", ids);
    confirm.require({
      message: `你确定要删除${dataCrudHandler.getDeleteBoxTitles(ids)} 吗？删除后这个${dataCrudHandler.getDeleteBoxTitles(ids)}永久无法找回。`,
      header: "确认删除",
      icon: "pi pi-exclamation-triangle",
      rejectClass: "p-button-secondary p-button-outlined",
      rejectLabel: "取消",
      acceptLabel: "确定删除",
      acceptClass: "p-button-danger",
      accept: async () => {
        try {
          let res: CommonRes<null>;
          if (ids.length === 1) {
            res = await dataCrudHandler.delete!(ids[0]!);
          } else {
            res = await dataCrudHandler.deletes!(ids);
          }

          if (res.code !== 204) {
            toast.add({
              severity: "error",
              summary: "删除失败",
              detail: res.message || "删除失败！",
              life: 3000,
            });
            return;
          }

          await fetchData(); // ✅ 刷新数据
          toast.add({
            severity: "info",
            summary: "删除成功",
            detail: `你永久删除了${dataCrudHandler.getDeleteBoxTitles(ids)}！`,
            life: 3000,
          });
        } catch (error) {
          console.error("删除失败:", error);
          toast.add({
            severity: "error",
            summary: "删除异常",
            detail: "删除操作异常，请稍后重试",
            life: 3000,
          });
        }
      },
      reject: () => {
        toast.add({
          severity: "info",
          summary: "已取消",
          detail: `已取消删除${dataCrudHandler.getDeleteBoxTitles(ids)}！`,
          life: 3000,
        });
      },
    });
  }


  /**
   *  查询表单提交处理
   */
  const onQueryFormSubmit = async (event: FormSubmitEvent) => {
    if (event.valid) {
      await FormSearch(queryFormRef.value, isPage.value || true);
    } else {
      toast.add({
        severity: "error",
        summary: "查询表单验证失败",
        detail: "请检查输入内容",
        life: 3000,
      });
    }
  };
  // 表单提交处理
  const onFormSubmit = async (event: FormSubmitEvent) => {
    if (event.valid) {
      try {
        crudDialogOptions.value.loading = true;

        const formData = event.values as TForm;

        // 获取当前表单数据
        const currentData = crudDialogOptions.value.data || {};
        const submitData = { ...currentData, ...formData } as TForm;


        // ✅ 安全调用 transformSubmitData
        if (typeof dataCrudHandler.transformSubmitData === 'function') {
          dataCrudHandler.transformSubmitData(submitData, crudDialogOptions.value.mode);
        }

        // 提交数据
        const rawSubmitData = toRaw(submitData) as TForm;
        let res;

        if (crudDialogOptions.value.mode === "EDIT") {
          if (!dataCrudHandler.update) {
            throw new Error("未提供 update 方法");
          }
          // ✅ 安全获取 id
          const id = (currentData as T).id;
          if (!id) {
            throw new Error("编辑项缺少 id");
          }

          res = await dataCrudHandler.update(id, rawSubmitData);
          if (res.code === 200) {
            toast.add({
              severity: "success",
              summary: "修改成功",
              detail: "数据已成功修改",
              life: 3000,
            });


          } else {
            toast.add({
              severity: "error",
              summary: "修改失败",
              detail: res.message ?? "修改失败！",
              life: 3000,
            });
          }
        } else {
          if (!dataCrudHandler.create) {
            throw new Error("未提供 create 方法");
          }

          // @ts-ignore
          const { id, ...createData } = rawSubmitData;
          res = await dataCrudHandler.create(createData as Omit<TForm, "id">);


          if (res.code === 201) {
            toast.add({
              severity: "success",
              summary: "添加成功",
              detail: "数据已成功添加",
              life: 3000,
            });
          } else {
            toast.add({
              severity: "error",
              summary: "添加失败",
              detail: res.message ?? "添加失败！",
              life: 3000,
            });
          }
        }

        // 统一处理成功后的逻辑
        if (res?.code === 200 || res?.code === 201) {
          crudDialogOptions.value.visible = false;
          await fetchData(); // ✅ 刷新数据
        }
      } catch (error) {
        console.error("表单提交失败:", error);
        toast.add({
          severity: "error",
          summary: "提交失败",
          detail: "表单提交失败，请稍后重试",
          life: 3000,
        });
      } finally {
        crudDialogOptions.value.loading = false;
      }
    } else {
      toast.add({
        severity: "error",
        summary: "表单验证失败",
        detail: "请检查输入内容",
        life: 3000,
      });
    }
  };


  // 分页事件
  const onPageChange = (event: { first: number; rows: number }) => {
    if (!useTreeTable) { // ✅ 使用传入的 useTreeTable
      tableData.value.meta.page = Math.floor(event.first / event.rows) + 1;
      tableData.value.meta.limit = event.rows;
      fetchList();
    }
  };


  const result = {
    tableData,
    treeData,
    queryForm,
    formLoading,
    crudDialogOptions,
    onFormSubmit,
    onQueryFormSubmit,
    onPageChange,
    isPage,
    resetForm,
    FormSearch,
    handleCrudDialog,
    fetchList,
    fetchTree,
    fetchAll, // ✅ 新增导出
    fetchData,
    submitForm,
    handleDeletes,
    create: dataCrudHandler.create,
    update: dataCrudHandler.update,
    transformSubmitData: dataCrudHandler.transformSubmitData,
    expandedKeys,
    useTreeTable,
  };
  return result;
}

// 自动提取类型
export type GenCmsTemplateData<
  T extends { id: number },
  PageQuery extends BaseQueryParams,
  TForm extends Record<string, any> = T,
> = UnPromisify<
  ReturnType<typeof genPrimeCmsTemplateData<T, PageQuery, TForm>>
>;
