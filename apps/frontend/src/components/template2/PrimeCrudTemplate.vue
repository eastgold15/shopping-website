<script lang="ts" generic="T extends { id: string }, PageQuery, MetaData" setup>
// import type { FormInstance } from 'primevue/form'

import type { GenCmsTemplateData } from '@frontend/composables/cms/usePrimeTemplateGen'
import type { PageModel } from '@frontend/types/prime-cms'
import type { FormInstance } from '@primevue/forms'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import Panel from 'primevue/panel'
import Sidebar from 'primevue/sidebar'
import Tag from 'primevue/tag'

const props = defineProps<{
  name: string
  identifier?: string
  /**
   * 表单数据
   */
  queryForm: Partial<PageQuery>
  tableData: PageModel<T[]>
  templateData: GenCmsTemplateData<T, PageQuery, MetaData>
  rules?: Record<string, any> // PrimeVue 表单验证规则
  queryRules?: Record<string, any>
  crudController?: number
}>()

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
} = props.templateData

const _crudController = computed(() => props.crudController || 15)

// 表单引用
const queryFormRef = ref<FormInstance>()
const drawerFormRef = ref<FormInstance>()

// 分页配置
const paginationOptions = computed(() => ({
  first: (tableData.value.meta.currentPage - 1) * tableData.value.meta.itemsPerPage,
  rows: tableData.value.meta.itemsPerPage,
  totalRecords: tableData.value.meta.totalItems,
  rowsPerPageOptions: [20, 30, 50, 100]
}))

// 分页事件处理
const onPageChange = (event: any) => {
  tableData.value.meta.currentPage = Math.floor(event.first / event.rows) + 1
  tableData.value.meta.itemsPerPage = event.rows
  fetchList()
}
</script>

<template>
  <div class="prime-crud-template">
    <!-- 查询表单区域 -->
    <Panel header="查询条件" class="mb-4">
      <slot name="IHeader">
        <form ref="queryFormRef" @submit.prevent>
          <div class="grid">
            <slot name="QueryForm" />

            <slot name="QueryFormAction">
              <div class="col-12 md:col-auto">
                <div class="flex gap-2">
                  <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetForm(queryFormRef)" />
                  <Button label="查询" icon="pi pi-search" :loading="formLoading" @click="FormSearch(queryFormRef)" />
                  <Button :label="`新建${name}`" icon="pi pi-plus" severity="success"
                    @click="handleCrudDialog(null, 'NEW')" />
                </div>
              </div>
            </slot>
          </div>
        </form>
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
      <Paginator v-if="tableData && tableData.meta.totalItems > 0" :first="paginationOptions.first"
        :rows="paginationOptions.rows" :totalRecords="paginationOptions.totalRecords"
        :rowsPerPageOptions="paginationOptions.rowsPerPageOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="显示 {first} 到 {last} 条，共 {totalRecords} 条记录" @page="onPageChange" class="mt-4" />
    </Panel>

    <!-- 侧边栏对话框 -->
    <Sidebar v-model:visible="crudDialogOptions.visible" position="right" class="w-full md:w-20rem lg:w-30rem"
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

      <template #default>
        <form v-if="crudDialogOptions.data" ref="drawerFormRef" @submit.prevent class="flex flex-column gap-4">
          <slot :data="crudDialogOptions.data" :mode="crudDialogOptions.mode"
            :disabled="crudDialogOptions.loading || crudDialogOptions.mode === 'READ'" name="CrudForm" />
        </form>
      </template>

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
    </Sidebar>
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