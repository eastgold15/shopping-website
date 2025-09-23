<script lang="ts" setup>
import type {
  SelectSkuType,
  SkuListQueryDto,
} from "@backend/db/models/sku.model";
import BatchCreateSKUs from "@frontend/components/BatchCreateSKUs.vue";
import ImagePreview from "@frontend/components/ImagePreview.vue";
import ImageSelector from "@frontend/components/ImageSelector.vue";
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
import Textarea from "primevue/textarea";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().skus;

// 使用zod定义表单验证schema
const skuSchema = z.object({
  productId: z.number().min(1, "商品ID不能为空"),
  colorSpecId: z.number().min(1, "颜色规格ID不能为空"),
  name: z
    .string()
    .min(1, "SKU名称不能为空")
    .max(255, "SKU名称不能超过255个字符"),
  skuCode: z
    .string()
    .min(1, "SKU编码不能为空")
    .max(100, "SKU编码不能超过100个字符"),
  price: z.string().min(1, "价格不能为空"),
  comparePrice: z.string().optional(),
  cost: z.string().optional(),
  stock: z.number().min(0, "库存不能小于0"),
  minStock: z.number().min(0, "最低库存不能小于0").optional(),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  imageOverride: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z
    .number()
    .min(0, "排序权重不能小于0")
    .max(9999, "排序权重不能超过9999"),
  images: z.array(z.object({
    id: z.number(),
    imageUrl: z.string(),
    fileName: z.string().optional(),
    category: z.string().optional(),
    fileSize: z.number().optional(),
    createdAt: z.date().optional()
  })).optional(),
});

// 查询表单验证schema
const querySchema = z.object({
  productId: z.string().optional(),
  colorSpecId: z.string().optional(),
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
    // @ts-expect-error
    getList: $crud.list,
    create: $crud.create,
    update: $crud.update,
    delete: $crud.delete,

    // 2. 定义初始表格列 初始值
    getEmptyModel: () => ({
      id: 0,
      productId: 0,
      colorSpecId: 0,
      name: "",
      skuCode: "",
      price: "0.00",
      comparePrice: "0.00",
      cost: "0.00",
      stock: 0,
      minStock: 0,
      weight: "0.00",
      dimensions: { length: 0, width: 0, height: 0 },
      imageOverride: "",
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
      if (typeof data.colorSpecId === "string") {
        data.colorSpecId = parseInt(data.colorSpecId) || 0;
      }
      if (typeof data.stock === "string") {
        data.stock = parseInt(data.stock) || 0;
      }
      if (typeof data.minStock === "string") {
        data.minStock = parseInt(data.minStock) || 0;
      }
      
      // 处理图片关联
      if (data.images && data.images.length > 0) {
        data.images = data.images.map((img: any) => img.id);
      } else {
        data.images = [];
      }
      
      // @ts-expect-error
      delete data.createdAt;
      // @ts-expect-error
      delete data.updatedAt;
    },
  },
  // 6. 定义查询表单
  {
    productId: "",
    colorSpecId: "",
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

// 图片选择相关
const imageSelectorVisible = ref(false);
const currentFormData = ref<SelectSkuType>();

// 批量创建SKU相关
const showBatchCreateDialog = ref(false);
const selectedProductId = ref<number>(1);
const selectedProductName = ref<string>("示例商品");

// 打开图片选择器
const openImageSelector = () => {
  imageSelectorVisible.value = true;
};

// 打开批量创建对话框
const openBatchCreateDialog = () => {
  showBatchCreateDialog.value = true;
};

// 批量创建成功回调
const onBatchCreateSuccess = (result: any) => {
  console.log("批量创建SKU成功:", result);
  // 刷新列表
  fetchList();
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

        <FormField v-slot="$field" name="colorSpecId" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-colorSpecId" class="text-sm font-medium">颜色规格ID</label>
            <InputText id="query-colorSpecId" placeholder="搜索颜色规格ID" />
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

    <template #QueryFormActionChild>
      <Button class="w-42" :label="`批量新建SKU`" icon="pi pi-plus" severity="success" @click="openBatchCreateDialog" />
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <!-- 图片预览列 -->
      <Column field="images" header="图片" style="width: 100px">
        <template #body="{ data }">
          <ImagePreview 
            v-if="data.images && data.images.length > 0" 
            :images="data.images" 
            :size="'small'"
            :show-indicator="true"
          />
          <div v-else class="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
            <i class="pi pi-image text-lg"></i>
          </div>
        </template>
      </Column>

      <Column field="name" header="SKU名称" style="width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ data.name }}</span>
            <Tag v-if="data.skuCode" :value="data.skuCode" severity="info" class="text-xs" />
          </div>
        </template>
      </Column>

      <Column field="colorSpecId" header="颜色规格" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm">规格{{ data.colorSpecId || '-' }}</span>
        </template>
      </Column>

      <Column field="price" header="价格" style="width: 100px">
        <template #body="{ data }">
          <span class="font-medium">¥{{ parseFloat(data.price).toFixed(2) }}</span>
        </template>
      </Column>

      <Column field="cost" header="成本价" style="width: 100px">
        <template #body="{ data }">
          <span v-if="data.cost" class="text-gray-600">¥{{ parseFloat(data.cost).toFixed(2) }}</span>
          <span v-else>-</span>
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
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }: { data: SelectSkuType, disabled: boolean }">
      <div class="h-full overflow-y-auto">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-500"></i>
            基本信息
          </h3>

          <!-- 商品ID -->
          <FormField v-slot="$field" name="productId" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">商品ID *</label>
            <InputNumber fluid placeholder="请输入商品ID" :disabled="disabled" :min="1" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <!-- 颜色规格ID -->
          <FormField v-slot="$field" name="colorSpecId" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">颜色规格ID *</label>
            <InputNumber fluid placeholder="请输入颜色规格ID" :disabled="disabled" :min="1" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">关联的颜色规格ID，用于关联颜色和图片</small>
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
        </div>

        <!-- 价格信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-dollar text-green-500"></i>
            价格信息
          </h3>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <FormField v-slot="$field" name="price" class="flex flex-col gap-2">
              <label class="text-sm font-medium">价格 *</label>
              <InputText fluid placeholder="请输入价格" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="comparePrice" class="flex flex-col gap-2">
              <label class="text-sm font-medium">原价</label>
              <InputText fluid placeholder="请输入原价" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="cost" class="flex flex-col gap-2">
              <label class="text-sm font-medium">成本价</label>
              <InputText fluid placeholder="请输入成本价" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>
        </div>

        <!-- 库存信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-box text-orange-500"></i>
            库存信息
          </h3>

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
        </div>

        <!-- 物理属性 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-cog text-purple-500"></i>
            物理属性
          </h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <FormField v-slot="$field" name="weight" class="flex flex-col gap-2">
              <label class="text-sm font-medium">重量(kg)</label>
              <InputText fluid placeholder="请输入重量" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="imageOverride" class="flex flex-col gap-2">
              <label class="text-sm font-medium">SKU专属图片</label>
              <InputText fluid placeholder="SKU专属图片URL（可选）" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
              <small class="text-gray-500">可选，覆盖颜色规格的默认图片</small>
            </FormField>
          </div>

          <!-- 尺寸 -->
          <FormField v-slot="$field" name="dimensions" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">尺寸 (长×宽×高 cm)</label>
            <div class="grid grid-cols-3 gap-2">
              <InputNumber 
                v-model="data.dimensions.length" 
                placeholder="长" 
                :disabled="disabled" 
                mode="decimal" 
                :maxFractionDigits="2" 
              />
              <InputNumber 
                v-model="data.dimensions.width" 
                placeholder="宽" 
                :disabled="disabled" 
                mode="decimal" 
                :maxFractionDigits="2" 
              />
              <InputNumber 
                v-model="data.dimensions.height" 
                placeholder="高" 
                :disabled="disabled" 
                mode="decimal" 
                :maxFractionDigits="2" 
              />
            </div>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 状态设置 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-check-circle text-indigo-500"></i>
            状态设置
          </h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- 排序权重 -->
            <FormField v-slot="$field" name="sortOrder" class="flex flex-col gap-2">
              <label class="text-sm font-medium">排序权重 *</label>
              <InputNumber placeholder="请输入排序权重" :disabled="disabled" :min="0" :max="9999" class="w-full" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <!-- 启用状态 -->
            <FormField v-slot="$field" name="isActive" class="flex flex-col gap-2">
              <label class="text-sm font-medium">启用状态</label>
              <div class="flex gap-4">
                <div class="flex align-items-center gap-2">
                  <RadioButton v-model="data.isActive" :value="true" :disabled="disabled" input-id="active-true" />
                  <label for="active-true">启用</label>
                </div>
                <div class="flex align-items-center gap-2">
                  <RadioButton v-model="data.isActive" :value="false" :disabled="disabled" input-id="active-false" />
                  <label for="active-false">禁用</label>
                </div>
              </div>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>
        </div>

        <!-- 图片管理 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-image text-pink-500"></i>
            图片管理
          </h3>

          <FormField v-slot="$field" name="images" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">SKU图片</label>
            
            <!-- 已选择的图片预览 -->
            <div v-if="$field.value && $field.value.length > 0" class="mb-2">
              <ImagePreview 
                :images="$field.value" 
                :size="'medium'"
                :show-indicator="true"
              />
              <small class="text-gray-600 mt-1 block">
                已选择 {{ $field.value.length }} 张图片
              </small>
            </div>
            
            <!-- 选择图片按钮 -->
            <Button 
              :label="$field.value && $field.value.length > 0 ? '更换图片' : '选择图片'" 
              icon="pi pi-images" 
              severity="secondary" 
              outlined
              :disabled="disabled"
              @click="openImageSelector"
            />
            
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">支持选择多张图片，用于SKU的展示</small>
          </FormField>
        </div>
      </div>
    </template>
  </PrimeCrudTemplate>

  <!-- 批量创建SKU对话框 -->
  <BatchCreateSKUs 
    v-model:visible="showBatchCreateDialog"
    :product-id="selectedProductId"
    :product-name="selectedProductName"
    @success="onBatchCreateSuccess"
  />

  <!-- 图片选择器 -->
  <ImageSelector 
    v-model:visible="imageSelectorVisible" 
    category="product"
    :multiple="true" 
    :max-select="10" 
  />
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