<!--哲学： 做什么 -->
<script lang="ts"
  generic="T extends { id: number }, PageQuery extends BaseQueryParams, TForm extends Record<string, any> = T" setup>
  import type { GenCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
  import type {
    BaseQueryParams,
    FormResolver,
  } from "@frontend/types/prime-cms";
  import type { FormInstance } from "@primevue/forms";
  import { computed, onMounted, ref } from "vue";

  const props = defineProps<{
    name: string;
    identifier?: string;
    /**
     * 查询表单初始/绑定数据 (通常由父组件的 templateData.queryForm 提供)
     */
    queryForm: Partial<PageQuery>;
    /**
     * 核心的模板数据对象，包含所有方法和状态
     */
    templateData: GenCmsTemplateData<T, PageQuery, TForm>;
    resolver: FormResolver | any;
    queryResolver: FormResolver | any;
    crudController?: number;
  }>();

  // 解构 templateData，这是所有逻辑和状态的来源
  const {
    formLoading,
    handleCrudDialog,
    tableData: reactiveTableData, // 重命名以避免与 props.tableData 冲突
    treeData,
    isPage,
    expandedKeys,
    useTreeTable,
    fetchData, // 统一数据获取方法
    crudDialogOptions,
    resetForm,
    handleDeletes,
    onFormSubmit,
    onQueryFormSubmit,
    onPageChange,
  } = props.templateData;

  // 为 crudDialogOptions 添加类型注解
  const crudDialogOptionsRef = crudDialogOptions;

  const _crudController = computed(() => props.crudController || 15);
  // 表单引用
  const queryFormRef = ref<FormInstance | null>(null);
  const drawerFormRef = ref<FormInstance | null>(null);
  // 组件挂载时自动加载数据
  onMounted(async () => {
    // 根据 useTreeTable 属性自动选择数据获取方式
    await fetchData(useTreeTable || false);

    console.log("111",treeData)
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
        <DataTable v-if="reactiveTableData && !useTreeTable" :value="reactiveTableData.items" :loading="formLoading"
          dataKey="id" stripedRows showGridlines responsiveLayout="scroll" class="p-datatable-sm">
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
        <TreeTable v-else-if="useTreeTable && treeData" :value="treeData" :loading="formLoading"
          :expandedKeys="expandedKeys" dataKey="key" class="p-treetable-sm" tableStyle="min-width: 50rem">
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


      <!-- 分页器 (仅在非树形表格且数据总量大于0时显示) -->
      <Paginator v-if="!useTreeTable && reactiveTableData.meta.total > 0 || isPage" :first="reactiveTableData.meta.page"
        :rows="reactiveTableData.meta.limit" :totalRecords="reactiveTableData.meta.total"
        :rowsPerPageOptions="[20, 30, 50, 100]"
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