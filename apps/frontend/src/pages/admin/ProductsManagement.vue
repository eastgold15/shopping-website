<script setup lang="ts">
import { zodResolver } from "@primevue/forms/resolvers/zod";

import ImageSelector from "@frontend/components/ImageSelector.vue";

import type { ProductModel } from "@backend/types";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { useCmsApi } from "@frontend/utils/handleApi";
import z from "zod";


// 表单验证schema
const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "商品名称不能为空"),
  slug: z.string().min(1, "URL别名不能为空"),
  description: z.string().min(1, "商品描述不能为空"),
  shortDescription: z.string().min(1, "简短描述不能为空"),
  price: z.number().min(0.01, "价格必须大于0"),
  comparePrice: z.number().optional(),
  cost: z.number().optional(),
  sku: z.string().min(1, "SKU不能为空"),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.any().optional(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  careInstructions: z.string().optional(),
  features: z.any().optional(),
  specifications: z.any().optional(),
  categoryId: z.number().nullable(),
  stock: z.number().min(0, "库存不能为负数"),
  minStock: z.number().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

const querySchema = z.object({
  name: z.string().optional(),
  categoryId: z.number().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});
const $crud = useCmsApi().products;
const resolver = zodResolver(productSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
  ProductModel,
  any
>(
  {
    // 1. 定义查询表单
    getList: $crud.list,
    create: $crud.create,
    update: $crud.update,
    delete: $crud.delete,
    // 2. 定义初始表格列 初始值
    getEmptyModel: () => ({
      id: 0,
      name: "",
      slug: "",
      description: "",
      shortDescription: "",
      price: 0,
      comparePrice: 0,
      cost: 0,
      sku: "",
      barcode: "",
      weight: 0,
      dimensions: null,
      images: [],
      videos: [],
      colors: [],
      sizes: [],
      materials: [],
      careInstructions: "",
      features: null,
      specifications: null,
      categoryId: null,
      stock: 0,
      minStock: 0,
      isActive: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      createdAt: "",
      updatedAt: "",
    }),

    // 3. 定义删除框标题
    getDeleteBoxTitle(id: number) {
      return `删除商品${id}`;
    },
    getDeleteBoxTitles(ids: Array<number>) {
      return ` 商品#${ids.join(",")} `;
    },

    // 5. 数据转换
    transformSubmitData: (data, type) => {
      // 确保数组字段不为null
      return {
        ...data,
        images: data.images || [],
        videos: data.videos || [],
        colors: data.colors || [],
        sizes: data.sizes || [],
        materials: data.materials || [],
      };
    },
  },
  // 6. 定义查询表单
  {
    name: "",
    categoryId: undefined,
    isActive: undefined,
    isFeatured: undefined,
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
const currentFormData = ref<ProductModel>();

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
  <PrimeCrudTemplate name="商品管理" identifier="product" :table-data="templateData.tableData" :template-data="templateData"
    :crud-controller="15" :resolver="resolver" :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="name" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-name" class="text-sm font-medium">商品名称</label>
            <InputText id="query-name" placeholder="搜索商品名称" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <FormField v-slot="$field" name="categoryId" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-category" class="text-sm font-medium">商品分类</label>
            <InputNumber id="query-category" placeholder="分类ID" />
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

        <FormField v-slot="$field" name="isFeatured" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-featured" class="text-sm font-medium">是否推荐</label>
            <Select id="query-featured"
              :options="[{ label: '全部', value: undefined }, { label: '推荐', value: true }, { label: '普通', value: false }]"
              option-label="label" option-value="value" placeholder="选择推荐状态" clearable />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>
      </div>
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <Column field="images" header="商品图片" style="width: 120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <img v-if="data.images && data.images.length > 0" :src="data.images[0]" :alt="data.name"
              class="w-12 h-12 object-cover rounded-lg border border-gray-200" />
            <div v-else class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-image text-gray-400 text-sm"></i>
            </div>
          </div>
        </template>
      </Column>

      <Column field="name" header="商品名称" style="width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ data.name }}</span>
            <Tag v-if="data.isFeatured" value="推荐" severity="success" class="text-xs" />
          </div>
        </template>
      </Column>

      <Column field="sku" header="SKU" style="width: 120px">
        <template #body="{ data }">
          <span class="text-gray-600 text-sm font-mono">
            {{ data.sku || '-' }}
          </span>
        </template>
      </Column>

      <Column field="price" header="价格" style="width: 100px">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-medium text-green-600">¥{{ data.price }}</span>
            <span v-if="data.comparePrice && data.comparePrice > data.price" class="text-xs text-gray-400 line-through">
              ¥{{ data.comparePrice }}
            </span>
          </div>
        </template>
      </Column>

      <Column field="stock" header="库存" style="width: 80px">
        <template #body="{ data }">
          <Tag :value="data.stock" :severity="data.stock > 10 ? 'success' : data.stock > 0 ? 'warn' : 'danger'" />
        </template>
      </Column>

      <Column field="categoryId" header="分类ID" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.categoryId || '-' }}</span>
        </template>
      </Column>

      <Column field="isActive" header="状态" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.isActive ? '上架' : '下架'" :severity="data.isActive ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column field="createdAt" header="创建时间" style="width: 150px">
        <template #body="{ data }">
          <span class="text-gray-500 text-sm">
            {{ data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '-' }}
          </span>
        </template>
      </Column>
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }: { data: ProductModel, disabled: boolean }">
      <div class="h-full">
        <!-- 商品名称 -->
        <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">商品名称 *</label>
          <InputText fluid size="small" placeholder="请输入商品名称" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- SKU -->
        <FormField v-slot="$field" name="sku" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">SKU</label>
          <InputText fluid placeholder="请输入商品SKU" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 商品描述 -->
        <FormField v-slot="$field" name="description" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">商品描述</label>
          <Textarea fluid placeholder="请输入商品描述" :disabled="disabled" rows="3" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 价格信息 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="price" class="flex flex-col gap-2">
            <label class="text-sm font-medium">售价 *</label>
            <InputNumber v-model="data.price" placeholder="请输入售价" :disabled="disabled" :min="0" :max-fraction-digits="2"
              class="w-full" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="comparePrice" class="flex flex-col gap-2">
            <label class="text-sm font-medium">对比价</label>
            <InputNumber v-model="data.comparePrice" placeholder="请输入对比价" :disabled="disabled" :min="0"
              :max-fraction-digits="2" class="w-full" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 库存和分类 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="stock" class="flex flex-col gap-2">
            <label class="text-sm font-medium">库存数量 *</label>
            <InputNumber v-model="data.stock" placeholder="请输入库存数量" :disabled="disabled" :min="0" class="w-full" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="categoryId" class="flex flex-col gap-2">
            <label class="text-sm font-medium">分类ID</label>
            <InputNumber v-model="data.categoryId" placeholder="请输入分类ID" :disabled="disabled" :min="1" class="w-full" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 商品图片 -->
        <FormField v-slot="$field" name="images" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">商品图片</label>
          <div class="flex flex-col gap-2">
            <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined :disabled="disabled"
              @click="() => { currentFormData = data; showImageSelector = true; }" v-tooltip="'从图片库选择'" />
            <div v-if="data.images && data.images.length > 0" class="flex flex-wrap gap-2">
              <img v-for="(image, index) in data.images" :key="index" :src="image" :alt="`商品图片${index + 1}`"
                class="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            </div>
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 商品状态 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="isActive" class="flex flex-col gap-2">
            <label class="text-sm font-medium">上架状态</label>
            <div class="flex gap-4">
              <div class="flex align-items-center gap-2">
                <RadioButton v-model="data.isActive" :value="true" :disabled="disabled" input-id="active-true" />
                <label for="active-true">上架</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton v-model="data.isActive" :value="false" :disabled="disabled" input-id="active-false" />
                <label for="active-false">下架</label>
              </div>
            </div>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="isFeatured" class="flex flex-col gap-2">
            <label class="text-sm font-medium">是否推荐</label>
            <div class="flex gap-4">
              <div class="flex align-items-center gap-2">
                <RadioButton v-model="data.isFeatured" :value="true" :disabled="disabled" input-id="featured-true" />
                <label for="featured-true">推荐</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton v-model="data.isFeatured" :value="false" :disabled="disabled" input-id="featured-false" />
                <label for="featured-false">不推荐</label>
              </div>
            </div>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>
      </div>
    </template>
  </PrimeCrudTemplate>

  <!-- 图片选择器 -->
  <ImageSelector v-model:visible="showImageSelector" category="product" @select="onImageSelected" />
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