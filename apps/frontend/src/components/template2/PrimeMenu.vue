<template>
  <div class="prime-menu-container">
    <!-- 顶部操作栏 -->
    <div class="menu-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <Button v-if="showAdd" icon="pi pi-plus" :label="addText" @click="handleAdd" class="p-button-success"
          size="small" />
        <Button v-if="showBatchDelete && selectedItems.length > 0" icon="pi pi-trash"
          :label="`批量删除(${selectedItems.length})`" @click="handleBatchDelete" class="p-button-danger" size="small" />
        <Button v-if="showRefresh" icon="pi pi-refresh" label="刷新" @click="handleRefresh" class="p-button-secondary"
          size="small" />
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right"></slot>
      </div>
    </div>

    <!-- 搜索栏 -->
    <Card v-if="showSearch" class="search-card">
      <template #content>
        <form @submit.prevent="handleSearch">
          <div class="search-form">
            <slot name="search-form" :form="searchForm" :loading="loading">
              <div class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12 p-md-4">
                  <label for="keyword">关键词</label>
                  <InputText id="keyword" v-model="searchForm.keyword" placeholder="请输入关键词搜索" />
                </div>
              </div>
            </slot>
            <div class="search-actions">
              <Button type="submit" icon="pi pi-search" label="搜索" :loading="loading" size="small" />
              <Button type="button" icon="pi pi-refresh" label="重置" class="p-button-secondary" @click="handleReset"
                size="small" />
            </div>
          </div>
        </form>
      </template>
    </Card>

    <!-- 数据表格 -->
    <Card class="table-card">
      <template #content>
        <DataTable :value="tableData.items" :loading="loading" :paginator="showPagination" :rows="tableData.meta.page"
          :totalRecords="tableData.meta.total" :lazy="true" @page="onPageChange" @sort="onSort"
          :selection="selectedItems" @selection-change="onSelectionChange" :selectionMode="selectionMode"
          :metaKeySelection="false" dataKey="id" class="p-datatable-sm" :scrollable="scrollable"
          :scrollHeight="scrollHeight" :resizableColumns="resizable" columnResizeMode="expand">
          <!-- 选择列 -->
          <Column v-if="showSelection" selectionMode="multiple" headerStyle="width: 3rem"></Column>

          <!-- 序号列 -->
          <Column v-if="showIndex" header="序号" headerStyle="width: 4rem">
            <template #body="{ index }">
              {{ (tableData.meta.currentPage - 1) * tableData.meta.itemsPerPage + index + 1 }}
            </template>
          </Column>

          <!-- 动态列 -->
          <slot name="columns" :data="tableData.items" :loading="loading"></slot>

          <!-- 操作列 -->
          <Column v-if="showActions" header="操作" :frozen="actionsFrozen" alignFrozen="right"
            :style="{ width: actionsWidth }">
            <template #body="{ data, index }">
              <slot name="actions" :data="data" :index="index">
                <div class="action-buttons">
                  <Button v-if="showView" icon="pi pi-eye" class="p-button-info p-button-text p-button-sm"
                    @click="handleView(data)" v-tooltip.top="'查看'" />
                  <Button v-if="showEdit" icon="pi pi-pencil" class="p-button-success p-button-text p-button-sm"
                    @click="handleEdit(data)" v-tooltip.top="'编辑'" />
                  <Button v-if="showDelete" icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm"
                    @click="handleDelete(data)" v-tooltip.top="'删除'" />
                </div>
              </slot>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- 表单对话框 -->
    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" :modal="true" :closable="!dialogLoading"
      :closeOnEscape="!dialogLoading" :style="{ width: dialogWidth }" :maximizable="dialogMaximizable"
      class="prime-form-dialog">
      <template #default>
        <form @submit.prevent="handleSubmit" ref="formRef">
          <slot name="form" :data="formData" :mode="formMode" :loading="dialogLoading" :rules="formRules">
            <div class="p-fluid">
              <div class="p-field">
                <label>默认表单内容</label>
                <InputText v-model="formData.name" placeholder="请输入名称" />
              </div>
            </div>
          </slot>
        </form>
      </template>

      <template #footer>
        <div class="dialog-footer">
          <Button label="取消" icon="pi pi-times" class="p-button-text" @click="dialogVisible = false"
            :disabled="dialogLoading" />
          <Button v-if="formMode !== 'view'" :label="formMode === 'edit' ? '保存' : '创建'"
            :icon="formMode === 'edit' ? 'pi pi-check' : 'pi pi-plus'" @click="handleSubmit" :loading="dialogLoading" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { PageModel } from "@frontend/types/prime-cms";

// 定义组件属性
interface Props {
	// 数据相关
	data?: PageModel<any>;
	loading?: boolean;

	// 工具栏配置
	showToolbar?: boolean;
	showAdd?: boolean;
	showBatchDelete?: boolean;
	showRefresh?: boolean;
	addText?: string;

	// 搜索配置
	showSearch?: boolean;
	searchForm?: Record<string, any>;

	// 表格配置
	showPagination?: boolean;
	showSelection?: boolean;
	showIndex?: boolean;
	showActions?: boolean;
	selectionMode?: "single" | "multiple";
	scrollable?: boolean;
	scrollHeight?: string;
	resizable?: boolean;

	// 操作按钮配置
	showView?: boolean;
	showEdit?: boolean;
	showDelete?: boolean;
	actionsFrozen?: boolean;
	actionsWidth?: string;

	// 对话框配置
	dialogWidth?: string;
	dialogMaximizable?: boolean;

	// 表单配置
	formRules?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	showToolbar: true,
	showAdd: true,
	showBatchDelete: true,
	showRefresh: true,
	addText: "新增",
	showSearch: true,
	showPagination: true,
	showSelection: true,
	showIndex: true,
	showActions: true,
	selectionMode: "multiple",
	scrollable: false,
	scrollHeight: "400px",
	resizable: true,
	showView: true,
	showEdit: true,
	showDelete: true,
	actionsFrozen: true,
	actionsWidth: "150px",
	dialogWidth: "600px",
	dialogMaximizable: true,
	searchForm: () => ({ keyword: "" }),
});

// 定义事件
interface Emits {
	add: [];
	edit: [data: any];
	view: [data: any];
	delete: [data: any];
	"batch-delete": [items: any[]];
	refresh: [];
	search: [form: any];
	reset: [];
	"page-change": [event: any];
	sort: [event: any];
	"selection-change": [items: any[]];
	submit: [data: any, mode: string];
}

const emit = defineEmits<Emits>();

// 响应式数据
const selectedItems = ref<any[]>([]);
const searchForm = reactive({ ...props.searchForm });
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const formMode = ref<"add" | "edit" | "view">("add");
const formData = ref<any>({});
const formRef = ref();

// 计算属性
const tableData = computed(
	() =>
		props.data || {
			items: [],
			meta: {
				page: 1,
				pageSize: 0,
				total: 0,
				totalPages: 0,
			},
		},
);

const dialogTitle = computed(() => {
	const titles = {
		add: "新增",
		edit: "编辑",
		view: "查看",
	};
	return titles[formMode.value];
});

// 事件处理方法
function handleAdd() {
	formMode.value = "add";
	formData.value = {};
	dialogVisible.value = true;
	emit("add");
}

function handleEdit(data: any) {
	formMode.value = "edit";
	formData.value = { ...data };
	dialogVisible.value = true;
	emit("edit", data);
}

function handleView(data: any) {
	formMode.value = "view";
	formData.value = { ...data };
	dialogVisible.value = true;
	emit("view", data);
}

function handleDelete(data: any) {
	emit("delete", data);
}

function handleBatchDelete() {
	emit("batch-delete", selectedItems.value);
}

function handleRefresh() {
	emit("refresh");
}

function handleSearch() {
	emit("search", searchForm);
}

function handleReset() {
	Object.keys(searchForm).forEach((key) => {
		if (props.searchForm && props.searchForm[key] !== undefined) {
			searchForm[key] = props.searchForm[key];
		} else {
			searchForm[key] = "";
		}
	});
	emit("reset");
}

function handleSubmit() {
	emit("submit", formData.value, formMode.value);
}

function onPageChange(event: any) {
	emit("page-change", event);
}

function onSort(event: any) {
	emit("sort", event);
}

function onSelectionChange(event: any) {
	selectedItems.value = event.value;
	emit("selection-change", event.value);
}

// 暴露方法给父组件
defineExpose({
	selectedItems,
	searchForm,
	dialogVisible,
	dialogLoading,
	formMode,
	formData,
	handleAdd,
	handleEdit,
	handleView,
	handleDelete,
	handleBatchDelete,
	handleRefresh,
	handleSearch,
	handleReset,
	handleSubmit,
});
</script>

<style scoped>
.prime-menu-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.toolbar-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-card {
  margin-bottom: 0;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.table-card {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.prime-form-dialog .p-dialog-content {
  padding: 1.5rem;
}

.dialog-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-toolbar {
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .search-actions {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>