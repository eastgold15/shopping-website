<script lang="ts" setup>
import type {
  CategoryListQueryDto,
  PartnersListQueryDto,
  SelectCategoryVo,
} from "@backend/types";
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
  slug: z.string().min(1, { message: "URL标识符不能为空，不可重复" }),
});

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
  SelectCategoryVo,
  PartnersListQueryDto,
  CategoryListQueryDto
>(
  {
    // 1. 定义查询表单 (二选一：普通列表或树形数据)
    // @ts-ignore
    getTree: $crud.tree, // 树形表格模式
    // @ts-ignore
    create: $crud.create,
    // @ts-ignore
    update: $crud.update,
    // @ts-ignore
    delete: $crud.delete,

    // 2. 定义初始表格列 初始值
    getEmptyModel: () => ({
      id: 0,
      name: "分类名字",
      slug: "网站链接",
      description: "描述",
      parentId: null,
      sortOrder: 1,
      isVisible: true,
      icon: "图标",
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
    transformSubmitData: (data: any, type) => {

      if (type == "NEW") {
        delete data.createdAt
      }

      // 转换TreeSelect的parentId格式
      if (data.parentId && typeof data.parentId === "object") {
        Object.keys(data.parentId).forEach((key) => {
          data.parentId = Number(key);
        });
      }

      delete data.updatedAt;
    },
  },
  // 6. 定义查询表单
  {
    name: "",
    isVisible: undefined,
    page: 1,
    limit: 20,
  },
  true
);

const { queryForm, treeData } = templateData;

interface TreeCategoryNode extends SelectCategoryVo {
  key: string;
  children?: TreeCategoryNode[];
}

interface TreeSelectNode {
  key: string | '__NULL__';
  label: string;
  data: TreeCategoryNode | null;
  children?: TreeSelectNode[];
}

const convertToTreeSelectFormat = (treeData: TreeCategoryNode[]): TreeSelectNode[] => {
  console.log('treeData:1111', treeData);

  const converted = treeData.map((category) => ({
    ...category,
    label: category.name,
    data: category,
    children: category.children
      ? convertToTreeSelectFormat(category.children)
      : undefined,
  }));

  console.log('converted:', converted);
  return [
    {
      key: '__NULL__',
      label: "无父级分类",
      data: null,
      children: undefined,

    },
    ...converted,
  ];
};

// TreeSelect数据计算属性
const treeSelectData = computed(() => {
  if (!treeData.value || treeData.value.length === 0) return [];
  // treeData.value 已经是树形结构，直接转换为 TreeSelect 格式
  return convertToTreeSelectFormat(treeData.value as unknown as TreeCategoryNode[]);
});

</script>

<template>
  <!-- @ts-ignore -->
  <PrimeCrudTemplate name="分类" identifier="partner" :template-data="templateData" :crud-controller="15"
    :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
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
            <i v-if="node.data && node.data.icon" :class="node.data.icon" class="text-lg" />
            <span class="font-medium">{{ node.data && node.data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="description" header="描述" style="min-width: 250px">
        <template #body="{ node }">
          <span class="text-sm text-gray-600 line-clamp-2">{{ node.data && node.data.description || '-' }}</span>
        </template>
      </Column>

      <Column field="sortOrder" header="排序" style="min-width: 80px">
        <template #body="{ node }">
          <span class="font-mono text-sm">{{ node.data && node.data.sortOrder || '-' }}</span>
        </template>
      </Column>

      <Column field="isVisible" header="状态" style="min-width: 100px">
        <template #body="{ node }">
          <Tag v-if="node.data" :value="node.data.isVisible ? '启用' : '禁用'"
            :severity="node.data.isVisible ? 'success' : 'danger'" />
          <span v-else>-</span>
        </template>
      </Column>

      <Column field="createdAt" header="创建时间" style="min-width: 180px">
        <template #body="{ node }">
          <span class="text-sm text-gray-500">{{ node.data && node.data.createdAt ? formatDate(node.data.createdAt) :
            '-' }}</span>
        </template>
      </Column>

      <Column field="updatedAt" header="更新时间" style="min-width: 180px">
        <template #body="{ node }">
          <span class="text-sm text-gray-500">{{ node.data && node.data.updatedAt ? formatDate(node.data.updatedAt) :
            '-' }}</span>
        </template>
      </Column>
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }: { data: Partial<SelectCategoryVo>, disabled: boolean }">
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
        <FormField v-slot="$field" name="icon" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">图标 *</label>
          <InputText placeholder="请输入图标类名" :disabled="disabled" class="w-full" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            <template #container="slotProps"></template>
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
  line-clamp: 2;
  overflow: hidden;
}

/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>