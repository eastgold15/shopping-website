<script lang="ts" setup>
import type { CategoriesModel, CategoriesQueryDTO } from "@backend/types";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { formatDate } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import TreeSelect from "primevue/treeselect";

import { z } from "zod";

const $crud = useCmsApi().categories;

// 使用zod定义表单验证schema
const categoriesSchema = z.object({
  name: z.string().min(1, { message: "分类名称不能为空" }),
  description: z.string().optional(),
  parentId: z.any().optional(),
  sortOrder: z.number().min(0, { message: "排序必须大于等于0" }),
  icon: z.string().optional(),
  isVisible: z.boolean(),
  slug: z.string().min(1, { message: "URL标识符不能为空" }),
})


// 状态选项
const statusOptions = [
  { label: "全部", value: "all" },
  { label: "显示", value: "visible" },
  { label: "隐藏", value: "hidden" },
];

// 查询表单验证schema
const querySchema = z.object({
  name: z.string().max(100, "搜索名称不能超过100个字符").optional(),
  isActive: z.boolean().optional(),
});

// 创建resolver
const resolver = zodResolver(categoriesSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
  CategoriesModel,
  CategoriesQueryDTO
>(
  {
    // 1. 定义查询表单 (二选一：普通列表或树形数据)
    getTree: $crud.tree,  // 树形表格模式
    create: $crud.create,
    update: $crud.update,
    delete: $crud.delete,

    // 2. 定义初始表格列 初始值
    getEmptyModel: () => ({
      id: 2,
      name: "手机",
      slug: "phones",
      description: "智能手机分类",
      parentId: 1,
      sortOrder: 0,
      isVisible: true,
      icon: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),

    // 3. 定义删除框标题
    getDeleteBoxTitle(id: number) {
      return `删除分类${id}`;
    },
    getDeleteBoxTitles(ids: Array<number>) {
      return ` 分类#${ids.join(",")} `;
    },

    // 5. 数据转换
    transformSubmitData: (data, type) => {
      // 转换TreeSelect的parentId格式
      if (data.parentId && typeof data.parentId === 'object' && 'key' in data.parentId) {
        data.parentId = Number(data.parentId.key);
      } else if (data.parentId === null || data.parentId === undefined || data.parentId === '') {
        data.parentId = null;
      }
    },
  },
  // 6. 定义查询表单
  {
    name: "",
    isVisible: undefined,
    page: 1,
    pageSize: 20,
  },
);

const { tableData, queryForm, treeData } = templateData;

// 注意：数据加载现在由PrimeCrudTemplate组件自动处理
// 根据useTreeTable属性自动选择getList或getTree方法

// 状态选项
const VisibleOptions = [
  { label: "全部", value: undefined },
  { label: "启用", value: true },
  { label: "禁用", value: false },
];





// 将已经是树形结构的数据转换为TreeTable所需的TreeNode格式
const convertTreeToTreeNodes = (treeData: Category[]): any[] => {
  return treeData.map((node) => ({
    key: node.id.toString(),
    data: node,
    children: node.children ? convertTreeToTreeNodes(node.children) : undefined,
  }));
};

// 树形选择器数据转换（适用于已经是树形结构的数据）
const convertToTreeSelectFormat = (treeData: Category[]): any[] => {
  return treeData.map((category) => ({
    key: category.id,
    label: category.name,
    data: category,
    children: category.children ? convertToTreeSelectFormat(category.children) : undefined,
  }));
};

// TreeSelect数据计算属性
const treeSelectData = computed(() => {
  if (!treeData.value || treeData.value.length === 0) return [];
  // treeData.value 已经是树形结构，直接转换为 TreeSelect 格式
  return convertToTreeSelectFormat(treeData.value as Category[]);
});

// TreeTable数据计算属性
const treeTableData = computed(() => {
  if (!treeData.value || treeData.value.length === 0) return [];
  // treeData.value 已经是树形结构，直接转换为 TreeTable 格式
  return convertTreeToTreeNodes(treeData.value as Category[]);
});

// 展开状态管理
const expandedKeys = ref<Record<string, boolean>>({});



</script>

<template>
  <PrimeCrudTemplate name="分类" identifier="partner" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver"
    :useTreeTable="true" :expandedKeys="expandedKeys" :tree-data="treeTableData">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="name" class="flex flex-column gap-1">
          <div class="flex  items-center gap-2">
            <label for="query-name" class="text-sm font-medium  ">分类名称</label>
            <InputText id="query-name" placeholder="搜索分类名称" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <FormField v-slot="$field" name="isActive" class="flex flex-column gap-1">
          <div class="flex  items-center gap-2">
            <label for="query-status" class="text-sm font-medium">状态</label>
            <Select id="query-status" :options="statusOptions" option-label="label" option-value="value"
              placeholder="选择状态" clearable />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>
      </div>
    </template>

    <!-- 树形表格列定义 -->
    <template #TreeTableColumn>
      <Column field="name" header="分类名称" expander style="min-width: 300px">
        <template #body="{ node }">
          <div class="flex items-center gap-2">
            <i v-if="node.data.icon" :class="node.data.icon" class="text-lg" />
            <span class="font-medium">{{ node.data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="description" header="描述" style="min-width: 250px">
        <template #body="{ node }">
          <span class="text-sm text-gray-600 line-clamp-2">{{ node.data.description || '-' }}</span>
        </template>
      </Column>

      <Column field="sortOrder" header="排序" style="min-width: 80px">
        <template #body="{ node }">
          <span class="font-mono text-sm">{{ node.data.sortOrder }}</span>
        </template>
      </Column>

      <Column field="isVisible" header="状态" style="min-width: 100px">
        <template #body="{ node }">
          <Tag :value="node.data.isVisible ? '启用' : '禁用'" :severity="node.data.isVisible ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column field="createdAt" header="创建时间" style="min-width: 180px">
        <template #body="{ node }">
          <span class="text-sm text-gray-500">{{ formatDate(node.data.createdAt) }}</span>
        </template>
      </Column>

      <Column field="updatedAt" header="更新时间" style="min-width: 180px">
        <template #body="{ node }">
          <span class="text-sm text-gray-500">{{ formatDate(node.data.updatedAt) }}</span>
        </template>
      </Column>
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }: { data: CategoriesModel, disabled: boolean }">
      <div class="h-full">
        <!-- 分类名称 -->
        <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">分类名称 *</label>
          <InputText fluid size="small" placeholder="请输入分类名称" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 父分类 -->
        <FormField v-slot="$field" name="parentId" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">父分类</label>
          <TreeSelect :options="treeSelectData" placeholder="请选择父分类（可选）" selectionMode="single"
            :metaKeySelection="false" class="w-full" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 分类描述 -->
        <FormField v-slot="$field" name="description" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">分类描述 *</label>
          <Textarea fluid placeholder="请输入分类描述" :disabled="disabled" rows="2" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>



        <!-- 链接 -->
        <FormField v-slot="$field" name="slug" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">网站链接</label>
          <InputText fluid placeholder="请输入网站链接（可选）" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 排序权重 -->
        <FormField v-slot="$field" name="sortOrder" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">排序权重 *</label>
          <InputNumber placeholder="请输入排序权重" :disabled="disabled" :min="0" :max="9999" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 图标 -->
        <FormField v-slot="$field" name="sortOrder" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">图标 *</label>
          <InputNumber placeholder="请输入图标类名" :disabled="disabled" :min="0" :max="9999" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>


        <!-- 启用状态 -->
        <FormField v-slot="$field" name="isVisible" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">启用状态</label>
          <div class="flex gap-4">
            <div class="flex align-items-center gap-2">
              <RadioButton :value="true" :disabled="disabled" input-id="active-true" />
              <label for="active-true">启用</label>
            </div>
            <div class="flex align-items-center gap-2">
              <RadioButton :value="false" :disabled="disabled" input-id="active-false" />
              <label for="active-false">禁用</label>
            </div>
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>
      </div>
    </template>
  </PrimeCrudTemplate>


</template>

<style scoped>
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>