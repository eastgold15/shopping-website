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
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0, "价格不能小于0"),
  comparePrice: z.number().min(0, "对比价格不能小于0").optional(),
  cost: z.number().min(0, "成本价不能小于0").optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0, "重量不能小于0").optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  careInstructions: z.string().optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
  categoryId: z.number().optional(),
  stock: z.number().min(0, "库存不能小于0"),
  minStock: z.number().min(0, "最低库存不能小于0").optional(),
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
      dimensions: { length: 0, width: 0, height: 0 },
      images: [],
      videos: [],
      colors: [],
      sizes: [],
      materials: [],
      careInstructions: "",
      features: [],
      specifications: {},
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
    // 确保images数组存在
    if (!currentFormData.value.images) {
      currentFormData.value.images = [];
    }
    // 添加图片URL到数组中
    if (!currentFormData.value.images.includes(imageUrl)) {
      currentFormData.value.images.push(imageUrl);
    }
  }
  showImageSelector.value = false;
};

// 规格管理相关
const newColor = ref('');
const newSize = ref('');
const newMaterial = ref('');
const newFeature = ref('');

// 添加颜色
const addColor = () => {
  if (newColor.value.trim()) {
    const data = templateData.crudFormData.value;
    if (!data.colors) {
      data.colors = [];
    }
    if (!data.colors.includes(newColor.value.trim())) {
      data.colors.push(newColor.value.trim());
    }
    newColor.value = '';
  }
};

// 添加尺寸
const addSize = () => {
  if (newSize.value.trim()) {
    const data = templateData.crudFormData.value;
    if (!data.sizes) {
      data.sizes = [];
    }
    if (!data.sizes.includes(newSize.value.trim())) {
      data.sizes.push(newSize.value.trim());
    }
    newSize.value = '';
  }
};

// 添加材质
const addMaterial = () => {
  if (newMaterial.value.trim()) {
    const data = templateData.crudFormData.value;
    if (!data.materials) {
      data.materials = [];
    }
    if (!data.materials.includes(newMaterial.value.trim())) {
      data.materials.push(newMaterial.value.trim());
    }
    newMaterial.value = '';
  }
};

// 添加特性
const addFeature = () => {
  if (newFeature.value.trim()) {
    const data = templateData.crudFormData.value;
    if (!data.features) {
      data.features = [];
    }
    if (!data.features.includes(newFeature.value.trim())) {
      data.features.push(newFeature.value.trim());
    }
    newFeature.value = '';
  }
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
      <div class="h-full overflow-y-auto">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-500"></i>
            基本信息
          </h3>

          <!-- 商品名称 -->
          <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">商品名称 *</label>
            <InputText fluid size="small" placeholder="请输入商品名称" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <!-- URL标识符 -->
          <FormField v-slot="$field" name="slug" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">URL标识符 *</label>
            <InputText fluid placeholder="请输入URL标识符" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">用于生成商品页面URL，只能包含字母、数字和连字符</small>
          </FormField>

          <!-- SKU和条形码 -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <FormField v-slot="$field" name="sku" class="flex flex-col gap-2">
              <label class="text-sm font-medium">商品编码</label>
              <InputText fluid placeholder="请输入商品SKU" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="barcode" class="flex flex-col gap-2">
              <label class="text-sm font-medium">条形码</label>
              <InputText fluid placeholder="请输入条形码" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>

          <!-- 商品分类 -->
          <FormField v-slot="$field" name="categoryId" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">商品分类 *</label>
            <InputNumber v-model="data.categoryId" placeholder="请输入分类ID" :disabled="disabled" :min="1" class="w-full" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <!-- 简短描述 -->
          <FormField v-slot="$field" name="shortDescription" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">简短描述</label>
            <Textarea fluid placeholder="请输入简短描述" :disabled="disabled" rows="2" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">用于商品列表页面显示</small>
          </FormField>

          <!-- 详细描述 -->
          <FormField v-slot="$field" name="description" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">详细描述</label>
            <Textarea fluid placeholder="请输入详细描述" :disabled="disabled" rows="4" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 商品图片 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-image text-green-500"></i>
            商品图片
          </h3>

          <FormField v-slot="$field" name="images" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">商品图片 *</label>
            <div class="flex flex-col gap-2">
              <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined :disabled="disabled"
                @click="() => { currentFormData = templateData.crudFormData.value; showImageSelector = true; }"
                v-tooltip="'从图片库选择'" />

              <!-- 已选择的图片展示 -->
              <div v-if="data.images && data.images.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="(image, index) in data.images" :key="index" class="relative group">
                  <img :src="image" :alt="`商品图片 ${index + 1}`" class="w-full h-32 object-cover rounded-lg border" />
                  <Button @click="data.images.splice(index, 1)" icon="pi pi-times" size="small" severity="danger"
                    rounded class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    :disabled="disabled" />
                </div>
              </div>

              <!-- 无图片时的提示 -->
              <div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <i class="pi pi-image text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">暂无图片，点击上方按钮选择图片</p>
              </div>
            </div>
            <small class="text-gray-500">支持 JPG、PNG 格式，建议尺寸 800x800px，最大5MB，最多10张</small>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 商品规格 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-cog text-purple-500"></i>
            商品规格
          </h3>

          <!-- 颜色规格 -->
          <div class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">颜色</label>
            <div class="flex flex-wrap gap-2">
              <div v-for="(color, index) in data.colors" :key="index"
                class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{{ color }}</span>
                <Button icon="pi pi-times" size="small" text @click="data.colors.splice(index, 1)"
                  :disabled="disabled" />
              </div>
              <div class="flex items-center gap-2" v-if="!disabled">
                <InputText v-model="newColor" placeholder="添加颜色" class="w-32" @keyup.enter="addColor" />
                <Button icon="pi pi-plus" size="small" @click="addColor" />
              </div>
            </div>
          </div>

          <!-- 尺寸规格 -->
          <div class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">尺寸</label>
            <div class="flex flex-wrap gap-2">
              <div v-for="(size, index) in data.sizes" :key="index"
                class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{{ size }}</span>
                <Button icon="pi pi-times" size="small" text @click="data.sizes.splice(index, 1)"
                  :disabled="disabled" />
              </div>
              <div class="flex items-center gap-2" v-if="!disabled">
                <InputText v-model="newSize" placeholder="添加尺寸" class="w-32" @keyup.enter="addSize" />
                <Button icon="pi pi-plus" size="small" @click="addSize" />
              </div>
            </div>
          </div>

          <!-- 材质规格 -->
          <div class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">材质</label>
            <div class="flex flex-wrap gap-2">
              <div v-for="(material, index) in data.materials" :key="index"
                class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{{ material }}</span>
                <Button icon="pi pi-times" size="small" text @click="data.materials.splice(index, 1)"
                  :disabled="disabled" />
              </div>
              <div class="flex items-center gap-2" v-if="!disabled">
                <InputText v-model="newMaterial" placeholder="添加材质" class="w-32" @keyup.enter="addMaterial" />
                <Button icon="pi pi-plus" size="small" @click="addMaterial" />
              </div>
            </div>
          </div>

          <!-- 护理说明 -->
          <FormField v-slot="$field" name="careInstructions" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">护理说明</label>
            <Textarea fluid placeholder="请输入护理说明" :disabled="disabled" rows="2" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <!-- 商品特性 -->
          <div class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">商品特性</label>
            <div class="flex flex-wrap gap-2">
              <div v-for="(feature, index) in data.features" :key="index"
                class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{{ feature }}</span>
                <Button icon="pi pi-times" size="small" text @click="data.features.splice(index, 1)"
                  :disabled="disabled" />
              </div>
              <div class="flex items-center gap-2" v-if="!disabled">
                <InputText v-model="newFeature" placeholder="添加特性" class="w-32" @keyup.enter="addFeature" />
                <Button icon="pi pi-plus" size="small" @click="addFeature" />
              </div>
            </div>
          </div>

          <!-- 规格参数 -->
          <FormField v-slot="$field" name="specifications" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">规格参数</label>
            <Textarea fluid placeholder="请输入规格参数" :disabled="disabled" rows="3" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <!-- 价格和库存 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-dollar text-orange-500"></i>
            价格和库存
          </h3>

          <!-- 价格信息 -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <FormField v-slot="$field" name="price" class="flex flex-col gap-2">
              <label class="text-sm font-medium">售价 *</label>
              <InputNumber v-model="data.price" placeholder="请输入售价" :disabled="disabled" :min="0"
                :max-fraction-digits="2" class="w-full" />
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

            <FormField v-slot="$field" name="cost" class="flex flex-col gap-2">
              <label class="text-sm font-medium">成本价</label>
              <InputNumber v-model="data.cost" placeholder="请输入成本价" :disabled="disabled" :min="0"
                :max-fraction-digits="2" class="w-full" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>

          <!-- 库存信息 -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <FormField v-slot="$field" name="stock" class="flex flex-col gap-2">
              <label class="text-sm font-medium">库存数量 *</label>
              <InputNumber v-model="data.stock" placeholder="请输入库存数量" :disabled="disabled" :min="0" class="w-full" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="minStock" class="flex flex-col gap-2">
              <label class="text-sm font-medium">最低库存</label>
              <InputNumber v-model="data.minStock" placeholder="请输入最低库存" :disabled="disabled" :min="0" class="w-full" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>

          <!-- 物理属性 -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <FormField v-slot="$field" name="weight" class="flex flex-col gap-2">
              <label class="text-sm font-medium">重量(kg)</label>
              <InputNumber v-model="data.weight" placeholder="请输入重量" :disabled="disabled" :min="0"
                :max-fraction-digits="3" class="w-full" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>

            <FormField v-slot="$field" name="dimensions" class="flex flex-col gap-2">
              <label class="text-sm font-medium">尺寸</label>
              <InputText fluid placeholder="长x宽x高(cm)" :disabled="disabled" />
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>
        </div>

        <!-- 商品状态 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-check-circle text-indigo-500"></i>
            商品状态
          </h3>

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
                  <RadioButton v-model="data.isFeatured" :value="false" :disabled="disabled"
                    input-id="featured-false" />
                  <label for="featured-false">不推荐</label>
                </div>
              </div>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
              </Message>
            </FormField>
          </div>
        </div>

        <!-- SEO信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-search text-teal-500"></i>
            SEO信息
          </h3>

          <FormField v-slot="$field" name="metaTitle" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">SEO标题</label>
            <InputText fluid placeholder="请输入SEO标题" :disabled="disabled" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">建议不超过60个字符</small>
          </FormField>

          <FormField v-slot="$field" name="metaDescription" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">SEO描述</label>
            <Textarea fluid placeholder="请输入SEO描述" :disabled="disabled" rows="2" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
            <small class="text-gray-500">建议不超过160个字符</small>
          </FormField>

          <FormField v-slot="$field" name="metaKeywords" class="flex flex-col gap-2 mb-4">
            <label class="text-sm font-medium">SEO关键词</label>
            <InputText fluid placeholder="请输入SEO关键词，用逗号分隔" :disabled="disabled" />
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