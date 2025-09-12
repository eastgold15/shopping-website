import type { CommonRes, PageData } from "@backend/types";
import type {
  BaseQueryParams,
  CrudDialogOptions,
  CrudMode,

  PrimeTemplateCrudHandler
} from "@frontend/types/prime-cms";
import type { UnPromisify } from "@frontend/utils/handleApi";
import type { FormInstance } from "@primevue/forms";
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
 * @param dataCrudHandler CRUD处理器
 * @param queryData 查询参数
 * @returns 模板数据
 */
export async function genPrimeCmsTemplateData<
  T extends { id: number },
  PageQuery extends BaseQueryParams,
>(
  dataCrudHandler: PrimeTemplateCrudHandler<T, Omit<T, "id">, PageQuery>,
  queryData: Partial<PageQuery>,
) {
  // PrimeVue服务
  const confirm = useConfirm();
  const toast = useToast();

  // 表单加载状态
  const formLoading = ref(false);

  /**表格数据 */
  const tableData = ref<PageData<T[]>>({
    items: [],
    meta: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
  });

  /**树形数据 */
  const treeData = ref<T[]>([]);

  /**
   * 搜索表单
   */
  const queryForm = reactive<Partial<PageQuery>>({ ...queryData });

  // 查询参数计算属性

  const queryParams = computed<Partial<PageQuery>>(() => {
    const rawQueryForm = toRaw(queryForm);
    return {
      page: tableData.value.meta.page,
      pageSize: tableData.value.meta.pageSize,
      ...(rawQueryForm as Partial<PageQuery>),
    };
  });

  // 获取数据方法
  const fetchList = async (params: Partial<PageQuery> = queryParams.value) => {
    try {
      formLoading.value = true;
      const safeParams = omitBy(
        params,
        (v) => v == null || v === "",
      ) as Partial<PageQuery>;
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
      console.error("fetchList error:", error);
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
    try {
      formLoading.value = true;
      const safeParams = omitBy(
        params,
        (v) => v == null || v === "",
      ) as Partial<PageQuery>;
      const { code, data, message } = await dataCrudHandler.getTree(safeParams);

      if (code === 200) {
        treeData.value = data;
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

  // 搜索表单
  const FormSearch = async (
    formEl: FormInstance | null,
    param: Partial<PageQuery> = queryParams.value,
  ) => {
    try {
      // 表单验证现在由Form组件自动处理，我们只需要调用fetchList
      await fetchList(param);
    } catch (error) {
      console.error("表单搜索错误:", error);
      await fetchList(param);
    }
  };

  // CRUD对话框选项
  const crudDialogOptions = ref<CrudDialogOptions<T>>({
    visible: false,
    mode: "NEW",
    data: null,
    loading: false,
  });

  // 处理CRUD对话框
  function handleCrudDialog(data: T | null, mode: CrudMode) {
    crudDialogOptions.value = {
      ...crudDialogOptions.value,
      mode,
      data: data || dataCrudHandler.getEmptyModel(),
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

          if (res.code !== 200) {
            toast.add({
              severity: "error",
              summary: "删除失败",
              detail: res.message || "删除失败！",
              life: 3000,
            });
            return;
          }

          await fetchList(); // 刷新数据
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
   * 统一数据获取方法 - 根据表格类型自动选择getList或getTree
   * @param useTreeTable 是否使用树形表格
   * @param params 查询参数
   */
  const fetchData = async (useTreeTable: boolean = false, params: Partial<PageQuery> = queryParams.value) => {
    if (useTreeTable) {
      // 树形表格使用getTree方法
      if (dataCrudHandler.getTree) {
        await fetchTree(params);
      } else {
        console.warn('树形表格模式需要提供getTree方法');
      }
    } else {
      // 普通表格使用getList方法
      if (dataCrudHandler.getList) {
        await fetchList(params);
      } else {
        console.warn('列表表格模式需要提供getList方法');
      }
    }
  };

  const result = {
    tableData,
    treeData,
    queryForm,
    formLoading,
    crudDialogOptions,
    resetForm,
    FormSearch,
    handleCrudDialog,
    fetchList,
    fetchTree,
    fetchData, // 新增统一数据获取方法
    submitForm,
    handleDeletes,
    // 添加CRUD操作方法
    create: dataCrudHandler.create,
    update: dataCrudHandler.update,
    transformSubmitData: dataCrudHandler.transformSubmitData,
  };

  return result;
}

// 自动提取类型
export type GenCmsTemplateData<
  T extends { id: number },
  PageQuery extends BaseQueryParams,
> = UnPromisify<ReturnType<typeof genPrimeCmsTemplateData<T, PageQuery>>>;
