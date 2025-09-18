<script lang="ts" setup>
import type {
	SelectSkuType,
	SkuListQueryDto,
} from "@backend/db/models/sku.model";
import ImageSelector from "@frontend/components/ImageSelector.vue";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { formatDate, getImageUrl } from "@frontend/utils/formatUtils";
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
import Textarea from "primevue/textarea";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().skus;

// 使用zod定义表单验证schema
const skuSchema = z.object({
	productId: z.number().min(1, "商品ID不能为空"),
	name: z
		.string()
		.min(1, "SKU名称不能为空")
		.max(255, "SKU名称不能超过255个字符"),
	skuCode: z
		.string()
		.min(1, "SKU编码不能为空")
		.max(100, "SKU编码不能超过100个字符"),
	colorId: z.number().optional(),
	sizeId: z.number().optional(),
	colorValue: z.string().max(50, "颜色值不能超过50个字符").optional(),
	colorName: z.string().max(50, "颜色名称不能超过50个字符").optional(),
	sizeValue: z.string().max(50, "尺寸值不能超过50个字符").optional(),
	sizeName: z.string().max(50, "尺寸名称不能超过50个字符").optional(),
	price: z.string().min(1, "价格不能为空"),
	comparePrice: z.string().optional(),
	stock: z.number().min(0, "库存不能小于0"),
	minStock: z.number().min(0, "最低库存不能小于0").optional(),
	weight: z.string().optional(),
	isActive: z.boolean(),
	sortOrder: z
		.number()
		.min(0, "排序权重不能小于0")
		.max(9999, "排序权重不能超过9999"),
});

// 查询表单验证schema
const querySchema = z.object({
	productId: z.string().optional(),
	colorId: z.string().optional(),
	sizeId: z.string().optional(),
	isActive: z.boolean().optional(),
});

// 创建resolver
const resolver = zodResolver(skuSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
	SelectSkuType,
	SkuListQueryDto
>(
	{
		// 1. 定义查询表单
		// @ts-ignore
		getList: $crud.list,
		create: $crud.create,
		update: $crud.update,
		delete: $crud.delete,

		// 2. 定义初始表格列 初始值
		getEmptyModel: () => ({
			id: 0,
			productId: 0,
			name: "",
			skuCode: "",
			colorId: undefined,
			sizeId: undefined,
			colorValue: "",
			colorName: "",
			sizeValue: "",
			sizeName: "",
			price: "0.00",
			comparePrice: "0.00",
			stock: 0,
			minStock: 0,
			weight: "0.00",
			dimensions: {},
			isActive: true,
			sortOrder: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			images: [],
		}),

		// 3. 定义删除框标题
		getDeleteBoxTitle(id: number) {
			return `删除SKU${id}`;
		},
		getDeleteBoxTitles(ids: Array<number>) {
			return ` SKU#${ids.join(",")} `;
		},

		// 5. 数据转换
		transformSubmitData: (data, type) => {
			// 确保数字类型正确
			if (typeof data.sortOrder === "string") {
				data.sortOrder = parseInt(data.sortOrder) || 0;
			}
			if (typeof data.productId === "string") {
				data.productId = parseInt(data.productId) || 0;
			}
			if (typeof data.colorId === "string") {
				data.colorId = parseInt(data.colorId) || undefined;
			}
			if (typeof data.sizeId === "string") {
				data.sizeId = parseInt(data.sizeId) || undefined;
			}
			if (typeof data.stock === "string") {
				data.stock = parseInt(data.stock) || 0;
			}
			if (typeof data.minStock === "string") {
				data.minStock = parseInt(data.minStock) || 0;
			}
			// @ts-ignore
			delete data.createdAt;
			// @ts-ignore
			delete data.updatedAt;
			// @ts-ignore
			delete data.images;
		},
	},
	// 6. 定义查询表单
	{
		productId: "",
		colorId: "",
		sizeId: "",
		isActive: undefined,
		page: 1,
		pageSize: 20,
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

// 图片选择相关
const showImageSelector = ref(false);
const currentFormData = ref<SelectSkuType>();

const onImageSelected = (imageUrl: string, imageData: any) => {
	console.log("imageData:", imageData);
	console.log("imageUrl:", imageUrl);

	if (currentFormData.value) {
		// 设置图片ID（数字类型）
		currentFormData.value.image_id = imageData.id;
		// 设置显示用的图片URL
		currentFormData.value.image = imageUrl;
	}
	showImageSelector.value = false;
};
</script>

<template>
  <PrimeCrudTemplate name="SKU" identifier="sku" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="productId" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-productId" class="text-sm font-medium">商品ID</label>
            <InputText id="query-productId" placeholder="搜索商品ID" />
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

      <Column field="name" header="SKU名称" style="width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ data.name }}</span>
            <Tag v-if="data.skuCode" :value="data.skuCode" severity="info" class="text-xs" />
          </div>
        </template>
      </Column>

      <Column field="colorName" header="颜色" style="width: 100px">
        <template #body="{ data }">
          <div class="flex items-center gap-2" v-if="data.colorName">
            <div v-if="data.colorValue" class="w-4 h-4 rounded-full border border-gray-300" 
              :style="{ backgroundColor: data.colorValue }"></div>
            <span>{{ data.colorName }}</span>
          </div>
          <span v-else>-</span>
        </template>
      </Column>

      <Column field="sizeName" header="尺寸" style="width: 100px">
        <template #body="{ data }">
          <span>{{ data.sizeName || '-' }}</span>
        </template>
      </Column>

      <Column field="price" header="价格" style="width: 100px">
        <template #body="{ data }">
          <span class="font-medium">¥{{ parseFloat(data.price).toFixed(2) }}</span>
        </template>
      </Column>

      <Column field="stock" header="库存" style="width: 100px">
        <template #body="{ data }">
          <span :class="data.stock <= data.minStock ? 'text-red-600 font-medium' : ''">{{ data.stock }}</span>
        </template>
      </Column>

      <Column field="isActive" header="状态" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.isActive ? '启用' : '禁用'" :severity="data.isActive ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column field="sortOrder" header="排序" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.sortOrder }}</span>
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
    <template #CrudForm="{ data, disabled }: { data: SelectSkuType, disabled: boolean }">
      <div class="h-full">
        <!-- 商品ID -->
        <FormField v-slot="$field" name="productId" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">商品ID *</label>
          <InputNumber fluid placeholder="请输入商品ID" :disabled="disabled" :min="1" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- SKU名称 -->
        <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">SKU名称 *</label>
          <InputText fluid placeholder="请输入SKU名称" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- SKU编码 -->
        <FormField v-slot="$field" name="skuCode" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">SKU编码 *</label>
          <InputText fluid placeholder="请输入SKU编码" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 颜色信息 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="colorName" class="flex flex-col gap-2">
            <label class="text-sm font-medium">颜色名称</label>
            <InputText fluid placeholder="请输入颜色名称" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="colorValue" class="flex flex-col gap-2">
            <label class="text-sm font-medium">颜色值</label>
            <InputText fluid placeholder="请输入颜色值（如：#FF0000）" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 尺寸信息 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="sizeName" class="flex flex-col gap-2">
            <label class="text-sm font-medium">尺寸名称</label>
            <InputText fluid placeholder="请输入尺寸名称" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="sizeValue" class="flex flex-col gap-2">
            <label class="text-sm font-medium">尺寸值</label>
            <InputText fluid placeholder="请输入尺寸值" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 价格信息 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="price" class="flex flex-col gap-2">
            <label class="text-sm font-medium">价格 *</label>
            <InputNumber fluid placeholder="请输入价格" :disabled="disabled" mode="currency" currency="CNY" 
              locale="zh-CN" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="comparePrice" class="flex flex-col gap-2">
            <label class="text-sm font-medium">原价</label>
            <InputNumber fluid placeholder="请输入原价" :disabled="disabled" mode="currency" currency="CNY" 
              locale="zh-CN" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 库存信息 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="stock" class="flex flex-col gap-2">
            <label class="text-sm font-medium">库存 *</label>
            <InputNumber fluid placeholder="请输入库存数量" :disabled="disabled" :min="0" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="minStock" class="flex flex-col gap-2">
            <label class="text-sm font-medium">最低库存</label>
            <InputNumber fluid placeholder="请输入最低库存预警值" :disabled="disabled" :min="0" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 重量 -->
        <FormField v-slot="$field" name="weight" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">重量(kg)</label>
          <InputNumber fluid placeholder="请输入重量" :disabled="disabled" mode="decimal" :minFractionDigits="2" 
            :maxFractionDigits="2" />
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