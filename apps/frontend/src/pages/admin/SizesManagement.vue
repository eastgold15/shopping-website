<script lang="ts" setup>
import type {
	SelectSizeType,
	SizeListQueryDto,
} from "@backend/db/models/attribute.model";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { formatDate } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import RadioButton from "primevue/radiobutton";
import Select from "primevue/select";
import Tag from "primevue/tag";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().sizes;

// 使用zod定义表单验证schema
const sizeSchema = z.object({
	name: z
		.string()
		.min(1, "尺寸名称不能为空")
		.max(50, "尺寸名称不能超过50个字符"),
	value: z.string().min(1, "尺寸值不能为空").max(50, "尺寸值不能超过50个字符"),
	displayName: z.string().max(100, "显示名称不能超过100个字符").optional(),
	category: z.string().max(50, "分类不能超过50个字符").optional(),
	ukSize: z.string().max(20, "UK码不能超过20个字符").optional(),
	usSize: z.string().max(20, "US码不能超过20个字符").optional(),
	euSize: z.string().max(20, "EU码不能超过20个字符").optional(),
	sortOrder: z
		.number()
		.min(0, "排序权重不能小于0")
		.max(9999, "排序权重不能超过9999"),
	isActive: z.boolean(),
});

// 查询表单验证schema
const querySchema = z.object({
	name: z.string().max(50, "搜索名称不能超过50个字符").optional(),
	category: z.string().max(50, "搜索分类不能超过50个字符").optional(),
	isActive: z.boolean().optional(),
});

// 创建resolver
const resolver = zodResolver(sizeSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
	SelectSizeType,
	SizeListQueryDto
>(
	{
		// 1. 定义查询表单
		// @ts-expect-error
		getList: $crud.list,
		create: $crud.create,
		update: $crud.update,
		delete: $crud.delete,

		// 2. 定义初始表格列 初始值
		getEmptyModel: () => ({
			id: 0,
			name: "",
			value: "",
			displayName: "",
			category: "",
			ukSize: "",
			usSize: "",
			euSize: "",
			sortOrder: 0,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

		// 3. 定义删除框标题
		getDeleteBoxTitle(id: number) {
			return `删除尺寸${id}`;
		},
		getDeleteBoxTitles(ids: Array<number>) {
			return ` 尺寸#${ids.join(",")} `;
		},

		// 5. 数据转换
		transformSubmitData: (data, type) => {
			// 确保数字类型正确
			if (typeof data.sortOrder === "string") {
				data.sortOrder = parseInt(data.sortOrder) || 0;
			}
			// @ts-expect-error
			delete data.createdAt;
			// @ts-expect-error
			delete data.updatedAt;
		},
	},
	// 6. 定义查询表单
	{
		name: "",
		category: "",
		isActive: undefined,
		page: 1,
		limit: 20,
	},
);

const { tableData, queryForm, fetchList } = templateData;

onMounted(async () => {
	await fetchList();
});

// 状态选项
const statusOptions = [
	{ label: "全部", value: undefined },
	{ label: "启用", value: true },
	{ label: "禁用", value: false },
];

// 分类选项
const categoryOptions = [
	{ label: "全部", value: "" },
	{ label: "服装", value: "clothing" },
	{ label: "鞋子", value: "shoes" },
	{ label: "配件", value: "accessories" },
];
</script>

<template>
  <PrimeCrudTemplate name="尺寸" identifier="size" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="name" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-name" class="text-sm font-medium">尺寸名称</label>
            <InputText id="query-name" placeholder="搜索尺寸名称" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <FormField v-slot="$field" name="category" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-category" class="text-sm font-medium">分类</label>
            <Select id="query-category" :options="categoryOptions" option-label="label" option-value="value"
              placeholder="选择分类" clearable />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <FormField v-slot="$field" name="isActive" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-status" class="text-sm font-medium">状态</label>
            <Select id="query-status" :options="statusOptions" option-label="label" option-value="value"
              placeholder="选择状态" clearable />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>
      </div>
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <Column field="name" header="尺寸名称" style="width: 120px">
        <template #body="{ data }">
          <span class="font-medium">{{ data.name }}</span>
        </template>
      </Column>

      <Column field="value" header="尺寸值" style="width: 100px">
        <template #body="{ data }">
          <span class="font-medium">{{ data.value }}</span>
        </template>
      </Column>

      <Column field="displayName" header="显示名称" style="width: 120px">
        <template #body="{ data }">
          <span>{{ data.displayName || '-' }}</span>
        </template>
      </Column>

      <Column field="category" header="分类" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.category || '未分类'" severity="info" />
        </template>
      </Column>

      <Column field="ukSize" header="UK码" style="width: 80px">
        <template #body="{ data }">
          <span>{{ data.ukSize || '-' }}</span>
        </template>
      </Column>

      <Column field="usSize" header="US码" style="width: 80px">
        <template #body="{ data }">
          <span>{{ data.usSize || '-' }}</span>
        </template>
      </Column>

      <Column field="euSize" header="EU码" style="width: 80px">
        <template #body="{ data }">
          <span>{{ data.euSize || '-' }}</span>
        </template>
      </Column>

      <Column field="sortOrder" header="排序" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.sortOrder }}</span>
        </template>
      </Column>

      <Column field="isActive" header="状态" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.isActive ? '启用' : '禁用'" :severity="data.isActive ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column field="createdAt" header="创建时间" style="width: 150px">
        <template #body="{ data }">
          <span class="text-gray-500 text-sm">
            {{ formatDate(data.createdAt) }}
          </span>
        </template>
      </Column>

      <Column field="updatedAt" header="更新时间" style="width: 150px">
        <template #body="{ data }">
          <span class="text-gray-500 text-sm">
            {{ formatDate(data.updatedAt) }}
          </span>
        </template>
      </Column>
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }: { data: SelectSizeType, disabled: boolean }">
      <div class="h-full">
        <!-- 尺寸名称 -->
        <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">尺寸名称 *</label>
          <InputText fluid placeholder="请输入尺寸名称" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 尺寸值 -->
        <FormField v-slot="$field" name="value" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">尺寸值 *</label>
          <InputText fluid placeholder="请输入尺寸值（如：L、42等）" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 显示名称 -->
        <FormField v-slot="$field" name="displayName" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">显示名称</label>
          <InputText fluid placeholder="请输入显示名称（可选）" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 分类 -->
        <FormField v-slot="$field" name="category" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">分类</label>
          <Select :options="categoryOptions" option-label="label" option-value="value" placeholder="选择分类" 
            :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- UK码 -->
        <FormField v-slot="$field" name="ukSize" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">UK码</label>
          <InputText fluid placeholder="请输入UK码" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- US码 -->
        <FormField v-slot="$field" name="usSize" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">US码</label>
          <InputText fluid placeholder="请输入US码" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- EU码 -->
        <FormField v-slot="$field" name="euSize" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">EU码</label>
          <InputText fluid placeholder="请输入EU码" :disabled="disabled" />
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

        <!-- 启用状态 -->
        <FormField v-slot="$field" name="isActive" class="flex flex-col gap-2 mb-4">
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
</style>