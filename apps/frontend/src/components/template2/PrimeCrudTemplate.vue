<script lang="ts"
  generic="T extends { id: number }, PageQuery extends BaseQueryParams, TForm extends Record<string, any> = T" setup>
import type { PageData } from "@backend/types";
import type {
	BaseQueryParams,
	FormResolver,
	GenCmsTemplateData,
} from "@frontend/types/prime-cms";
import type { FormInstance, FormSubmitEvent } from "@primevue/forms";
import { Form } from "@primevue/forms";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Drawer from "primevue/drawer";
import Paginator from "primevue/paginator";
import Panel from "primevue/panel";
import Tag from "primevue/tag";
import TreeTable from "primevue/treetable";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, toRaw } from "vue";

const props = defineProps<{
	name: string;
	identifier?: string;
	/**
	 * 表单数据
	 */
	queryForm: Partial<PageQuery>;
	tableData: PageData<T[]>;
	templateData: GenCmsTemplateData<T, PageQuery, TForm>;
	resolver: FormResolver | any;
	queryResolver: FormResolver | any;
	crudController?: number;
	/**
	 * 是否使用树形表格
	 */
	useTreeTable?: boolean;
	/**
	 * 树形表格的展开状态控制
	 */
	expandedKeys?: Record<string, boolean>;
	/**
	 * 树形表格数据
	 */
	treeData?: any[];
}>();

const templateDataRef = computed(() => props.templateData);
const {
	FormSearch,
	formLoading,
	handleCrudDialog,
	tableData: templateTableData,
	fetchList,
	fetchData, // 新增统一数据获取方法
	crudDialogOptions,
	resetForm,
	submitForm,
	handleDeletes,
} = templateDataRef.value;

// 确保使用正确的表单数据
const tableData = computed(() => templateTableData.value);

// 为 crudDialogOptions 添加类型注解
const crudDialogOptionsRef = crudDialogOptions;

const _crudController = computed(() => props.crudController || 15);
const toast = useToast();

// 表单引用
const queryFormRef = ref<FormInstance | null>(null);
const drawerFormRef = ref<FormInstance | null>(null);

// 分页配置
const paginationOptions = computed(() => ({
	first: (tableData.value.meta.page - 1) * tableData.value.meta.limit,
	rows: tableData.value.meta.limit,
	totalRecords: tableData.value.meta.total,
	rowsPerPageOptions: [20, 30, 50, 100],
}));

// 分页事件处理
const onPageChange = (event: { first: number; rows: number }) => {
	tableData.value.meta.page = Math.floor(event.first / event.rows) + 1;
	tableData.value.meta.limit = event.rows;
	// 根据表格类型调用对应的数据获取方法
	fetchData(props.useTreeTable || false);
};

// 组件挂载时自动加载数据
onMounted(async () => {
	// 根据useTreeTable属性自动选择数据获取方式
	await fetchData(props.useTreeTable || false);
});

// 查询表单提交处理
const onQueryFormSubmit = async (event: FormSubmitEvent) => {
	if (event.valid) {
		await FormSearch(queryFormRef.value);
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
			crudDialogOptionsRef.value.loading = true;

			const formData = event.values as TForm;

			// 获取当前表单数据
			const currentData = crudDialogOptionsRef.value.data || {};
			const submitData = { ...currentData, ...formData } as TForm;

			// 转换提交数据
			if (templateDataRef.value.transformSubmitData) {
				templateDataRef.value.transformSubmitData(
					submitData,
					crudDialogOptionsRef.value.mode,
				);
			}

			// 提交数据
			const rawSubmitData = toRaw(submitData) as TForm;
			let res;

			if (crudDialogOptionsRef.value.mode === "EDIT") {
				// 对于编辑操作，需要从表格数据中获取ID
				const tableItem = templateTableData.value.items
					.flat()
					.find((item) => item.id === (currentData as T).id);
				res = await templateDataRef.value.update(
					(tableItem as unknown as T).id!,
					rawSubmitData,
				);
				console.log("res", res);
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
				// 对于新建操作，需要移除id字段（如果存在）
				const { id, ...createData } = rawSubmitData;
				res = await templateDataRef.value.create(
					createData as Omit<TForm, "id">,
				);
				console.log("res", res);
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
			if (res?.code === 200) {
				crudDialogOptionsRef.value.visible = false;
				await fetchList();
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
			crudDialogOptionsRef.value.loading = false;
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

// 暴露表单引用给父组件使用
defineExpose({
	drawerFormRef,
	queryFormRef,
	crudDialogOptions, // 暴露 crudDialogOptions 给父组件
});
</script>

<template>
  <div class="prime-crud-template">
    <!-- 查询表单区域 -->
    <Panel header="查询条件" class="mb-4">
      <slot name="IHeader">
        <Form ref="queryFormRef" :initialValues="queryForm" :resolver="props.queryResolver" @submit="onQueryFormSubmit">
          <div class="md:flex md:justify-between md:items-center ">
            <div class="md:flex md:items-center  gap-4">
              <slot name="QueryForm" />
            </div>
            <div>
              <slot name="QueryFormAction">
                <div class=" md:col-auto">
                  <div class="flex gap-2">
                    <Button class="md:w-22  " label="重置" icon="pi pi-refresh" severity="secondary"
                      @click="resetForm(queryFormRef)" />
                    <Button class="w-22" label="查询" icon="pi pi-search" :loading="formLoading"
                      @click="queryFormRef?.submit?.()" />
                    <Button class="w-42" :label="`新建${name}`" icon="pi pi-plus" severity="success"
                      @click="handleCrudDialog(null, 'NEW')" />
                  </div>
                </div>
              </slot>
            </div>
          </div>
        </Form>
      </slot>
    </Panel>

    <!-- 表格区域 -->
    <Panel header="数据列表" class="mb-4">
      <slot name="ITable">
        <!-- 普通数据表格 -->
        <DataTable v-if="tableData && !props.useTreeTable" :value="tableData.items" :loading="formLoading" dataKey="id"
          stripedRows showGridlines responsiveLayout="scroll" class="p-datatable-sm">
          <slot name="TableColumn" />

          <slot name="TableColumnAction">
            <Column header="操作" :frozen="true" alignFrozen="right" style="min-width: 250px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button v-if="_crudController & 2" icon="pi pi-eye" severity="info" size="small" v-tooltip="'详情'"
                    @click="handleCrudDialog(data, 'READ')" />
                  <Button v-if="_crudController & 4" icon="pi pi-pencil" severity="warning" size="small"
                    v-tooltip="'编辑'" @click="handleCrudDialog(data, 'EDIT')" />
                  <Button v-if="_crudController & 8" icon="pi pi-trash" severity="danger" size="small" v-tooltip="'删除'"
                    @click="handleDeletes([data.id])" />
                </div>
              </template>
            </Column>
          </slot>
        </DataTable>

        <!-- 树形数据表格 -->
        <TreeTable v-else-if="props.useTreeTable && props.treeData" :value="props.treeData" :loading="formLoading"
          :expandedKeys="props.expandedKeys" dataKey="key" class="p-treetable-sm" tableStyle="min-width: 50rem">
          <slot name="TreeTableColumn" />

          <slot name="TreeTableColumnAction">
            <Column header="操作" :frozen="true" alignFrozen="right" style="min-width: 250px">
              <template #body="{ node }">
                <div class="flex gap-2">
                  <Button v-if="_crudController & 2" icon="pi pi-eye" severity="info" size="small" v-tooltip="'详情'"
                    @click="handleCrudDialog(node.data, 'READ')" />
                  <Button v-if="_crudController & 4" icon="pi pi-pencil" severity="warning" size="small"
                    v-tooltip="'编辑'" @click="handleCrudDialog(node.data, 'EDIT')" />
                  <Button v-if="_crudController & 8" icon="pi pi-trash" severity="danger" size="small" v-tooltip="'删除'"
                    @click="handleDeletes([node.data.id])" />
                </div>
              </template>
            </Column>
          </slot>
        </TreeTable>
      </slot>

      <!-- 分页器 (仅在非树形表格时显示) -->
      <Paginator v-if="tableData && tableData.meta.total > 0 && !props.useTreeTable" :first="paginationOptions.first"
        :rows="paginationOptions.rows" :totalRecords="paginationOptions.totalRecords"
        :rowsPerPageOptions="paginationOptions.rowsPerPageOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="显示 {first} 到 {last} 条，共 {totalRecords} 条记录" @page="onPageChange" class="mt-4" />
    </Panel>

    <!-- 侧边栏对话框 -->
    <Drawer v-model:visible="crudDialogOptionsRef.visible" position="right" class="w-full !md:w-30rem  h-screen"
      :modal="true">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-user"></i>
          <span class="font-bold">
            <span v-if="crudDialogOptionsRef.mode === 'NEW'">新建</span>
            <span v-else-if="crudDialogOptionsRef.mode === 'EDIT'">编辑</span>
            <span v-else-if="crudDialogOptionsRef.mode === 'READ'">查看</span>
            {{ name }}信息
          </span>
          <Tag v-if="crudDialogOptionsRef.data" :value="`#${(crudDialogOptionsRef.data as T).id}`" severity="secondary"
            class="ml-2" />
        </div>
      </template>

      <div class="flex justify-center">
        <Form v-slot="$form" unstyled v-if="crudDialogOptionsRef.data" ref="drawerFormRef"
          :initialValues="crudDialogOptionsRef.data" :resolver="props.resolver" @submit="onFormSubmit"
          class="w-full flex flex-col gap-4 ">
          <slot :data="(crudDialogOptionsRef.data as T)" :mode="crudDialogOptionsRef.mode"
            :disabled="crudDialogOptionsRef.loading || crudDialogOptionsRef.mode === 'READ'" name="CrudForm"
            :$form="$form" />
        </Form>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <div class="flex gap-2 justify-content-end">
            <slot name="CrudFormAction">
              <template v-if="crudDialogOptionsRef.mode === 'READ'">
                <Button label="关闭" icon="pi pi-times" severity="secondary"
                  @click="crudDialogOptionsRef.visible = false" />
              </template>
              <template v-else>
                <Button label="取消" icon="pi pi-times" severity="secondary"
                  @click="crudDialogOptionsRef.visible = false" />
                <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetForm(drawerFormRef)" />
                <Button type="submit" :label="crudDialogOptionsRef.mode !== 'NEW' ? '修改' : '新增'" icon="pi pi-check"
                  :loading="crudDialogOptionsRef.loading" @click="drawerFormRef?.submit?.()" />
              </template>
            </slot>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>

<style scoped></style>