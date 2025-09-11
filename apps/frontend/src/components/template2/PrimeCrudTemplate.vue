<script lang="ts" generic="T extends { id: number }, PageQuery, MetaData" setup>

import type { PageData } from '@backend/types'
import type { GenCmsTemplateData } from '@frontend/composables/cms/usePrimeTemplateGen'
import type { FormInstance, FormSubmitEvent } from '@primevue/forms'
import { Form } from '@primevue/forms'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import Panel from 'primevue/panel'

import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

import Drawer from 'primevue/drawer'

const props = defineProps<{
  name: string
  identifier?: string
  /**
   * 表单数据
   */
  queryForm: Partial<PageQuery>
  tableData: PageData<T[]>
  templateData: GenCmsTemplateData<T, PageQuery, MetaData>
  resolver?: any // PrimeVue 表单验证器（支持zodResolver、yupResolver、valibotResolver或自定义resolver）
  queryResolver?: any // 查询表单验证器
  crudController?: number
}>()

// // 定义插槽类型
// defineSlots<{
//   CrudForm: (props: { data: T; mode: string; disabled: boolean }) => any
//   CrudFormAction: () => any
//   QueryForm: () => any
//   QueryFormAction: () => any
//   TableColumn: () => any
//   IHeader: () => any
// }>()

// 添加空值检查，避免解构null值
const templateDataRef = computed(() => props.templateData)

const {
  FormSearch,
  formLoading,
  handleCrudDialog,
  tableData,
  fetchList,
  crudDialogOptions,
  resetForm,
  submitForm,
  handleDeletes,
} = templateDataRef.value || {
  FormSearch: null,
  formLoading: ref(false),
  handleCrudDialog: () => { },
  tableData: ref({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
  fetchList: () => { },
  crudDialogOptions: ref({ visible: false, mode: 'NEW', data: null, loading: false }),
  resetForm: () => { },
  submitForm: () => { },
  handleDeletes: () => { },
}

const _crudController = computed(() => props.crudController || 15)
const toast = useToast()

// 表单引用
const queryFormRef = ref<FormInstance>()
const drawerFormRef = ref<FormInstance>()

// 分页配置
const paginationOptions = computed(() => ({
  first: (tableData.value.meta.page - 1) * tableData.value.meta.pageSize,
  rows: tableData.value.meta.pageSize,
  totalRecords: tableData.value.meta.totalPages,
  rowsPerPageOptions: [20, 30, 50, 100]
}))

// 分页事件处理
const onPageChange = (event: any) => {
  tableData.value.meta.page = Math.floor(event.first / event.rows) + 1
  tableData.value.meta.pageSize = event.rows
  fetchList()
}

// 查询表单提交处理
const onQueryFormSubmit = async (event: FormSubmitEvent) => {
  if (event.valid) {
    await FormSearch(queryFormRef.value)
  } else {
    toast.add({
      severity: 'error',
      summary: '查询表单验证失败',
      detail: '请检查输入内容',
      life: 3000
    })
  }
}

// 表单提交处理
const onFormSubmit = async (event: FormSubmitEvent) => {
  if (event.valid) {
    await submitForm(drawerFormRef.value)
  } else {
    toast.add({
      severity: 'error',
      summary: '表单验证失败',
      detail: '请检查输入内容',
      life: 3000
    })
  }
}
</script>

<template>
  <div class="prime-crud-template">
    <!-- 查询表单区域 -->
    <Panel header="查询条件" class="mb-4">
      <slot name="IHeader">
        <Form ref="queryFormRef" :initialValues="queryForm" :resolver="props.queryResolver" @submit="onQueryFormSubmit">
          <div class="    md:flex md:justify-between md:items-center ">

            <div class="md:flex gap-4">
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
        <DataTable v-if="tableData" :value="tableData.items" :loading="formLoading" dataKey="id" stripedRows
          showGridlines responsiveLayout="scroll" class="p-datatable-sm">
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
      </slot>

      <!-- 分页器 -->
      <Paginator v-if="tableData && tableData.meta.total > 0" :first="paginationOptions.first"
        :rows="paginationOptions.rows" :totalRecords="paginationOptions.totalRecords"
        :rowsPerPageOptions="paginationOptions.rowsPerPageOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="显示 {first} 到 {last} 条，共 {totalRecords} 条记录" @page="onPageChange" class="mt-4" />
    </Panel>

    <!-- 侧边栏对话框 -->
    <Drawer v-model:visible="crudDialogOptions.visible" position="right" class="w-full md:w-40rem lg:w-30rem h-screen"
      :modal="true">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-user"></i>
          <span class="font-bold">
            <span v-if="crudDialogOptions.mode === 'NEW'">新建</span>
            <span v-else-if="crudDialogOptions.mode === 'EDIT'">编辑</span>
            <span v-else-if="crudDialogOptions.mode === 'READ'">查看</span>
            {{ name }}信息
          </span>
          <Tag v-if="crudDialogOptions.data" :value="`#${crudDialogOptions.data.id}`" severity="secondary"
            class="ml-2" />
        </div>
      </template>


      <div class="flex justify-center  ">

        <Form v-if="crudDialogOptions.data" ref="drawerFormRef" :initialValues="crudDialogOptions.data"
          :resolver="props.resolver" @submit="onFormSubmit" class="w-full flex flex-col gap-4 sm:w-56 ">
          <slot :data="(crudDialogOptions.data as T)" :mode="crudDialogOptions.mode"
            :disabled="crudDialogOptions.loading || crudDialogOptions.mode === 'READ'" name="CrudForm" />
        </Form>

      </div>


      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <slot name="CrudFormAction">
            <template v-if="crudDialogOptions.mode === 'READ'">
              <Button label="关闭" icon="pi pi-times" severity="secondary" @click="crudDialogOptions.visible = false" />
            </template>
            <template v-else>
              <Button label="取消" icon="pi pi-times" severity="secondary" @click="crudDialogOptions.visible = false" />
              <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetForm(drawerFormRef)" />
              <Button :label="crudDialogOptions.mode !== 'NEW' ? '修改' : '新增'" icon="pi pi-check"
                :loading="crudDialogOptions.loading" @click="submitForm(drawerFormRef)" />
            </template>
          </slot>
        </div>
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
.prime-crud-template {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: end;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>