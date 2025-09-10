<script setup lang="ts">
import type { CategoryDisplay } from "@backend/types";
import { api } from "@frontend/utils/handleApi";
import { Form, FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { z } from "zod";

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const categories = ref<CategoryTree[]>([]);
const expandedKeys = ref<Record<string, boolean>>({});
const searchKeyword = ref("");
const filterStatus = ref("all");
const showDialog = ref(false);
const editingCategory = ref(null);

// 表单初始值
const initialValues = reactive({
	name: "",
	slug: "",
	parentId: undefined,
	description: "",
	sortOrder: 0,
	isVisible: true,
	icon: "pi-clock",
	image: "",
});

// 表单验证器
const formResolver = zodResolver(
	z.object({
		name: z.string().min(1, { message: "分类名称不能为空" }),
		description: z.string().optional(),
		parentId: z.any().optional(),
		sortOrder: z.number().min(0, { message: "排序必须大于等于0" }),
		icon: z.string().optional(),
		image: z.string().optional(),
		isVisible: z.boolean(),
		slug: z.string().min(1, { message: "URL标识符不能为空" }),
	}),
);

// 单独的字段验证器
const nameResolver = zodResolver(
	z.string().min(1, { message: "分类名称不能为空" }),
);
const sortOrderResolver = zodResolver(
	z.number().min(0, { message: "排序值不能小于0" }),
);

// 状态选项
const statusOptions = [
	{ label: "全部", value: "all" },
	{ label: "显示", value: "visible" },
	{ label: "隐藏", value: "hidden" },
];

// 工具函数
const confirm = useConfirm();
const toast = !import.meta.env.SSR ? useToast() : null;
// 计算属性
const filteredCategories = computed(() => {
	let result = categories.value;

	// 搜索过滤
	if (searchKeyword.value) {
		result = filterByKeyword(result, searchKeyword.value);
	}

	// 状态过滤
	if (filterStatus.value !== "all") {
		const isVisible = filterStatus.value === "visible";
		result = filterByStatus(result, isVisible);
	}

	return result;
});

// 计算属性 - 用于TreeSelect的数据源
const treeData = computed(() => {
	// TreeSelect使用标准的TreeNode格式，key作为选中值，label作为显示文本
	const convertToTreeSelectFormat = (nodes: CategoryTree[]): any[] => {
		return nodes.map((node) => ({
			key: node.key, // TreeSelect的key就是选中时返回的值
			label: node.data.name,
			data: node.data,
			children:
				node.children && node.children.length > 0
					? convertToTreeSelectFormat(node.children)
					: undefined,
		}));
	};

	return convertToTreeSelectFormat(categories.value);
});

// 生命周期
onMounted(() => {
	loadCategories();
});

// 方法
const loadCategories = async () => {
	try {
		loading.value = true;
		const response = await api.categories.list();

		// 修复API响应处理逻辑
		if (response?.code === 200 && Array.isArray(response.data)) {
			categories.value = buildCategoryTree(response.data);
			console.log("加载分类成功:", categories.value);
		} else {
			console.error("API返回的数据格式错误:", response);
			categories.value = [];
			toast.add({
				severity: "error",
				summary: "错误",
				detail: response?.message || "加载分类失败",
			});
		}
	} catch (error) {
		console.error("加载分类失败:", error);
		categories.value = [];
		toast.add({
			severity: "error",
			summary: "错误",
			detail: error instanceof Error ? error.message : "加载分类失败",
		});
	} finally {
		loading.value = false;
	}
};

const buildCategoryTree = (categoryList: Category[]): CategoryTree[] => {
	// 使用共享库的buildTree方法构建基础树形结构
	const treeNodes = buildTree(categoryList, "id", "parentId", "children");

	// 转换为CategoryTree格式并计算level、排序
	const convertToTreeFormat = (
		nodes: any[],
		level: number = 0,
	): CategoryTree[] => {
		return nodes
			.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
			.map((node) => ({
				key: node.id,
				data: {
					...node,
					// 保持数据类型一致
					id: node.id,
					parentId: node.parentId,
					sortOrder: Number(node.sortOrder) || 0,
					isVisible: Boolean(node.isVisible),
					level: level,
				},
				children: node.children
					? convertToTreeFormat(node.children, level + 1)
					: [],
			}));
	};

	return convertToTreeFormat(treeNodes);
};

// 移除不需要的转换函数，直接使用 categories 数据结构

const filterByKeyword = (
	treeData: CategoryTree[],
	keyword: string,
): CategoryTree[] => {
	const filtered: CategoryTree[] = [];

	treeData.forEach((node) => {
		const matchesKeyword = node.data.name
			.toLowerCase()
			.includes(keyword.toLowerCase());
		const filteredChildren = node.children
			? filterByKeyword(node.children, keyword)
			: [];

		if (matchesKeyword || filteredChildren.length > 0) {
			filtered.push({
				...node,
				children: filteredChildren,
			});
		}
	});

	return filtered;
};

const filterByStatus = (
	treeData: CategoryTree[],
	isVisible: boolean,
): CategoryTree[] => {
	const filtered: CategoryTree[] = [];

	treeData.forEach((node) => {
		const matchesStatus = node.data.isVisible === isVisible;
		const filteredChildren = node.children
			? filterByStatus(node.children, isVisible)
			: [];

		if (matchesStatus || filteredChildren.length > 0) {
			filtered.push({
				...node,
				children: filteredChildren,
			});
		}
	});

	return filtered;
};

const expandAll = () => {
	const keys: Record<string, boolean> = {};
	const addKeys = (nodes: CategoryTree[]) => {
		nodes.forEach((node) => {
			keys[node.key] = true;
			if (node.children) {
				addKeys(node.children);
			}
		});
	};
	addKeys(categories.value);
	expandedKeys.value = keys;
};

const collapseAll = () => {
	expandedKeys.value = {};
};

const onNodeExpand = (node: any) => {
	expandedKeys.value[node.key] = true;
};

const onNodeCollapse = (node: any) => {
	delete expandedKeys.value[node.key];
};

const showCreateDialog = () => {
	editingCategory.value = null;
	// 重置表单初始值
	Object.assign(initialValues, {
		name: "",
		slug: "",
		parentId: undefined,
		description: "",
		sortOrder: 0,
		isVisible: true,
		icon: "",
		image: "",
	});

	showDialog.value = true;
};

const showCreateChildDialog = (parentCategory: Category) => {
	editingCategory.value = null;
	// 更新表单初始值 - TreeSelect需要对象格式
	Object.assign(initialValues, {
		name: "",
		slug: "",
		parentId: { [parentCategory.id]: true }, // TreeSelect的选中格式
		description: "",
		sortOrder: 0,
		isVisible: true,
		icon: "",
		image: "",
	});

	showDialog.value = true;
};

const showEditDialog = (category: Category) => {
	editingCategory.value = category;
	// 更新表单初始值，确保数据类型正确
	Object.assign(initialValues, {
		name: category.name || "",
		slug: category.slug || "",
		parentId: category.parentId ? { [category.parentId]: true } : undefined, // TreeSelect的选中格式
		description: category.description || "",
		sortOrder: Number(category.sortOrder) || 0,
		isVisible: Boolean(category.isVisible),
		icon: category.icon || "",
		image: category.image || "",
	});

	showDialog.value = true;
};

const closeDialog = () => {
	showDialog.value = false;
	editingCategory.value = null;
	// 重置表单初始值
	Object.assign(initialValues, {
		name: "",
		slug: "",
		parentId: undefined,
		description: "",
		sortOrder: 0,
		isVisible: true,
		icon: "",
		image: "",
	});
};

const onFormSubmit = async ({
	valid,
	values,
}: {
	valid: boolean;
	values: any;
}) => {
	console.log("value", values);
	if (!valid) {
		toast?.add({ severity: "warn", summary: "警告", detail: "请检查表单输入" });
		return;
	}

	try {
		saving.value = true;
		loading.value = true; // 添加加载状态

		// 处理TreeSelect的parentId格式 - 从对象{key: true}转换为字符串key
		let parentId;
		if (values.parentId && typeof values.parentId === "object") {
			const keys = Object.keys(values.parentId);
			parentId = keys.length > 0 ? keys[0] : undefined;
		} else if (typeof values.parentId === "string") {
			parentId = values.parentId;
		}

		const requestData = {
			name: values.name?.trim() || "",
			slug: values.slug?.trim() || undefined,
			parentId: Number(parentId) || undefined,
			description: values.description?.trim() || undefined,
			sortOrder: Number(values.sortOrder) || 0,
			isVisible: Boolean(values.isVisible),
			icon: values.icon?.trim() || undefined,
			image: values.image?.trim() || undefined,
		};

		let result;
		if (editingCategory.value) {
			// 更新分类
			result = await api.categories.update(
				editingCategory.value.id.toString(),
				requestData,
			);
		} else {
			// 创建分类
			result = await api.categories.create(requestData);
		}
		console.log("xxx", result);
		if (result.status == 200 && result.data.code === 200) {
			toast?.add({
				severity: "success",
				summary: "成功",
				detail: editingCategory.value ? "分类更新成功" : "分类创建成功",
			});
			closeDialog();
			await loadCategories();
		} else {
			console.log(111);
			toast?.add({
				severity: "error",
				summary: "错误",
				detail: result.data.data || "操作失败",
			});
		}
	} catch (error) {
		console.error("保存分类失败:", error);
		toast?.add({ severity: "error", summary: "错误", detail: "保存分类失败" });
	} finally {
		saving.value = false;
		loading.value = false; // 确保加载状态重置
	}
};

const toggleVisibility = async (categoryId: string) => {
	try {
		loading.value = true; // 添加加载状态
		const response = await handleApiRes(
			client.api.categories({ id: categoryId })["toggle"].patch(),
			false,
		);

		if (response.status === 200 && response.data.code == 200) {
			toast?.add({
				severity: "success",
				summary: "成功",
				detail: "显示状态更新成功",
			});
			await loadCategories(); // 重新加载数据
		} else {
			toast?.add({
				severity: "error",
				summary: "错误",
				detail: response.message || "更新显示状态失败",
			});
			await loadCategories(); // 重新加载数据
		}
	} catch (error) {
		toast?.add({
			severity: "error",
			summary: "错误",
			detail: error instanceof Error ? error.message : "更新显示状态失败",
		});
		await loadCategories();
	} finally {
		loading.value = false; // 确保加载状态重置
	}
};

const confirmDelete = (category: Category) => {
	confirm.require({
		message: `确定要删除分类 "${category.name}" 吗？此操作不可撤销。`,
		header: "删除确认",
		icon: "pi pi-exclamation-triangle",
		acceptClass: "p-button-danger",
		accept: () => deleteCategory(category.id),
	});
};

const deleteCategory = async (categoryId: string) => {
	try {
		loading.value = true; // 添加加载状态
		const response = await api.categories.delete(categoryId);

		if (response.code == 200) {
			toast?.add({
				severity: "success",
				summary: "成功",
				detail: "分类删除成功",
			});
			await loadCategories();
		} else {
			throw new Error(response.data.data || "删除分类失败");
		}
	} catch (error) {
		toast?.add({
			severity: "error",
			summary: "http错误",
			detail: error.message,
			life: 1000,
		});
	} finally {
		loading.value = false; // 确保加载状态重置
	}
};

const hasChildren = (node: CategoryTree): boolean => {
	return node.children ? node.children.length > 0 : false;
};

const formatDate = (date: Date | string): string => {
	return new Date(date).toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};
</script>
<template>
  <div class="category-management">
    <!-- 页面标题和操作栏 -->
    <div class="header-section">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">分类管理</h1>
          <p class="text-gray-600 mt-1">管理商品分类，支持树形结构、排序和显示控制</p>
        </div>
        <Button label="新增分类" icon="pi pi-plus" @click="showCreateDialog" class="p-button-success" :disabled="loading" />
      </div>

      <!-- 工具栏 -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-3">
          <Button label="展开全部" icon="pi pi-angle-down" @click="expandAll" class="p-button-outlined" size="small"
            :disabled="loading" />
          <Button label="收起全部" icon="pi pi-angle-up" @click="collapseAll" class="p-button-outlined" size="small"
            :disabled="loading" />
          <Button label="刷新" icon="pi pi-refresh" @click="loadCategories" class="p-button-outlined" size="small"
            :loading="loading" :disabled="loading" />
        </div>
        <div class="flex gap-3">
          <InputText v-model="searchKeyword" placeholder="搜索分类名称..." class="w-64" :disabled="loading" />
          <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
            placeholder="筛选状态" class="w-32" :disabled="loading" />
        </div>
      </div>
    </div>

    <!-- 分类树表格 -->
    <div class="table-section">
      <TreeTable :value="filteredCategories" :loading="loading" :expandedKeys="expandedKeys" @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse" class="p-treetable-sm" showGridlines responsiveLayout="scroll">
        <!-- 分类名称列 -->
        <Column field="name" header="分类名称" :expander="true" style="width: 300px">
          <template #body="{ node }">
            <div class="flex items-center gap-2">
              <i v-if="node.data.icon" :class="node.data.icon" class="text-lg"></i>
              <span class="font-medium">{{ node.data.name }}</span>
              <Tag v-if="node.data.level === 0" value="顶级" severity="info" class="text-xs" />
            </div>
          </template>
        </Column>

        <!-- 描述列 -->
        <Column field="description" header="描述" style="width: 200px">
          <template #body="{ node }">
            <span class="text-gray-600 text-sm">{{ node.data.description || '-' }}</span>
          </template>
        </Column>

        <!-- 排序列 -->
        <Column field="sortOrder" header="排序" style="width: 120px">
          <template #body="{ node }">
            <div class="flex items-center gap-2">
              <Button :label="node.data.sortOrder.toString()" size="small" severity="secondary" outlined />
            </div>
          </template>
        </Column>

        <!-- 显示状态列 -->
        <Column field="isVisible" header="显示状态" style="width: 140px">
          <template #body="{ node }">
            <div class="flex items-center gap-3">
              <ToggleSwitch v-model="node.data.isVisible" @change="toggleVisibility(node.data.id)" class="scale-90"
                :disabled="loading" />
              <div class="flex items-center gap-1">
                <i :class="node.data.isVisible ? 'pi pi-eye text-green-600' : 'pi pi-eye-slash text-gray-400'"
                  class="text-sm"></i>
                <Tag :value="node.data.isVisible ? '显示' : '隐藏'"
                  :severity="node.data.isVisible ? 'success' : 'secondary'" class="text-xs px-2 py-1" />
              </div>
            </div>
          </template>
        </Column>

        <!-- 创建时间列 -->
        <Column field="createdAt" header="创建时间" style="width: 150px">
          <template #body="{ node }">
            <span class="text-gray-500 text-sm">{{ formatDate(node.data.createdAt) }}</span>
          </template>
        </Column>

        <!-- 操作列 -->
        <Column header="操作" style="width: 200px">
          <template #body="{ node }">
            <div class="flex gap-2">
              <Button icon="pi pi-plus" @click="showCreateChildDialog(node.data)" class="p-button-success p-button-sm"
                v-tooltip.top="'添加子分类'" :disabled="loading" />
              <Button icon="pi pi-pencil" @click="showEditDialog(node.data)" class="p-button-warning p-button-sm"
                v-tooltip.top="'编辑'" :disabled="loading" />
              <Button icon="pi pi-trash" @click="confirmDelete(node.data)" class="p-button-danger p-button-sm"
                v-tooltip.top="'删除'" :disabled="hasChildren(node) || loading" />
            </div>
          </template>
        </Column>
      </TreeTable>
    </div>

    <!-- 创建/编辑分类对话框 -->
    <Dialog v-model:visible="showDialog" :header="editingCategory ? '编辑分类' : '新增分类'" :modal="true" :closable="true"
      class="w-96">
      <Form v-slot="$form" :initialValues :resolver="formResolver" @submit="onFormSubmit" class="space-y-4">
        <!-- 分类名称 -->
        <FormField v-slot="$field" name="name" :resolver="nameResolver" class="flex flex-col gap-1">
          <label class="block text-sm font-medium mb-2">分类名称 *</label>
          <InputText v-model="$field.value" type="text" placeholder="请输入分类名称" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- URL标识符 -->
        <FormField v-slot="$field" name="slug" class="flex flex-col gap-1">
          <label class="block text-sm font-medium mb-2">URL标识符 *</label>
          <InputText v-model="$field.value" type="text" placeholder="URL友好的标识符" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 父分类 -->
        <FormField v-slot="$field" name="parentId" class="flex flex-col gap-1">
          <label class="block text-sm font-medium mb-2">父分类 </label>
          <TreeSelect v-model="$field.value" :options="treeData" placeholder="选择父分类（留空为顶级分类）" class="w-full"
            selectionMode="single" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 描述 -->
        <FormField v-slot="$field" name="description" class="flex flex-col gap-1">
          <label class="block text-sm font-medium mb-2">描述</label>
          <Textarea v-model="$field.value" placeholder="请输入分类描述" rows="3" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 排序和图标 -->
        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="$field" name="sortOrder" :resolver="sortOrderResolver" class="flex flex-col gap-1">
            <label class="block text-sm font-medium mb-2">排序</label>
            <InputNumber v-model="$field.value" :min="0" :max="9999" fluid placeholder="排序值" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
          <FormField v-slot="$field" name="icon" class="flex flex-col gap-1">
            <label class="block text-sm font-medium mb-2">图标</label>
            <InputText v-model="$field.value" type="text" fluid placeholder="图标类名" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 分类图片 -->
        <FormField v-slot="$field" name="image" class="flex flex-col gap-1">
          <label class="block text-sm font-medium mb-2">分类图片</label>
          <InputText v-model="$field.value" type="text" placeholder="分类图片URL（不用填）" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 显示分类 -->
        <FormField v-slot="$field" name="isVisible" class="flex flex-col gap-1">
          <label class="flex items-center gap-2">
            <Checkbox v-model="$field.value" :binary="true" />
            <span class="text-sm font-medium">显示分类</span>
          </label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 表单按钮 -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" label="取消" @click="closeDialog" class="p-button-text" :disabled="loading || saving" />
          <Button type="submit" :label="editingCategory ? '更新' : '创建'" class="p-button-success"
            :loading="loading || saving" :disabled="loading || saving" />
        </div>
      </Form>
    </Dialog>

    <!-- 删除确认对话框 -->
    <ConfirmDialog :loading="loading" />

  </div>
</template>

<style scoped>
/* 自定义样式优化 */
.category-management {
  @apply bg-white rounded-lg shadow-sm;
}

.header-section {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b border-gray-200;
}

.table-section {
  @apply p-6;
}

/* TreeTable 样式优化 */
:deep(.p-treetable) {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

:deep(.p-treetable .p-treetable-thead > tr > th) {
  @apply bg-gray-50 text-gray-700 font-semibold border-b border-gray-200;
}

:deep(.p-treetable .p-treetable-tbody > tr) {
  @apply hover:bg-blue-50 transition-colors duration-200;
}

:deep(.p-treetable .p-treetable-tbody > tr > td) {
  @apply border-b border-gray-100 py-3;
}

/* InputNumber 样式优化 */
:deep(.p-inputnumber) {
  @apply rounded-md;
}

:deep(.p-inputnumber .p-inputnumber-input) {
  @apply text-center;
}

/* InputSwitch 样式优化 */
:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  @apply bg-green-500;
}

/* Tag 样式优化 */
:deep(.p-tag) {
  @apply font-medium;
}

/* Button 样式优化 */
:deep(.p-button-sm) {
  @apply shadow-sm;
}

/* Dialog 样式优化 */
:deep(.p-dialog .p-dialog-header) {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200;
}

:deep(.p-dialog .p-dialog-content) {
  @apply bg-white;
}

.category-management {
  @apply p-6 bg-gray-50 min-h-screen;
}

.header-section {
  @apply bg-white rounded-lg shadow-sm p-6 mb-6;
}

.table-section {
  @apply bg-white rounded-lg shadow-sm p-6;
}

:deep(.p-treetable) {
  @apply border-0;
}

:deep(.p-treetable .p-treetable-thead > tr > th) {
  @apply bg-gray-50 border-gray-200 text-gray-700 font-semibold;
}

:deep(.p-treetable .p-treetable-tbody > tr > td) {
  @apply border-gray-200;
}

:deep(.p-treetable .p-treetable-tbody > tr:hover) {
  @apply bg-gray-50;
}

:deep(.p-inputnumber-input) {
  @apply text-center;
}

:deep(.p-togglebutton) {
  @apply text-xs;
}

:deep(.p-dialog .p-dialog-content) {
  @apply p-6;
}

:deep(.p-dialog .p-dialog-footer) {
  @apply p-6 pt-0;
}
</style>
