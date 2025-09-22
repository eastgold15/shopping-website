<script setup lang="ts">
import type { ProductModel } from "@backend/types";
import BatchCreateSKUs from "@frontend/components/BatchCreateSKUs.vue";
import ImageSelector from "@frontend/components/ImageSelector.vue";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { useCmsApi } from "@frontend/utils/handleApi";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import TreeSelect from "primevue/treeselect";
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
	dimensions: z
		.object({
			length: z.number().optional(),
			width: z.number().optional(),
			height: z.number().optional(),
		})
		.optional(),
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
const templateData = await genPrimeCmsTemplateData<ProductModel, any>(
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
		limit: 20,
	},
);

const { tableData, queryForm, fetchList } = templateData;

onMounted(async () => {
	await fetchList();
	await loadImages();
	await loadCategories();
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

// 可用图片列表
const images = ref([]);
const loadingImages = ref(false);

// 分类树相关
const categoryTree = ref([]);
const selectedCategory = ref(null);
const loadingCategories = ref(false);

// 加载图片列表
const loadImages = async () => {
	try {
		loadingImages.value = true;
		const response = await fetch("/api/images");
		const result = await response.json();
		if (result.code === 200) {
			images.value = result.data.items || [];
		}
	} catch (error) {
		console.error("加载图片失败:", error);
	} finally {
		loadingImages.value = false;
	}
};

// 获取图片URL
const getImageUrl = (imageUrl: string) => {
	if (!imageUrl) return "";
	if (imageUrl.startsWith("http")) return imageUrl;
	return `/api/uploads/${imageUrl}`;
};

// 获取图片显示名称
const getImageDisplayName = (image: any) => {
	return image.alt || image.fileName || image.id?.toString() || "未命名图片";
};

// 加载分类树
const loadCategories = async () => {
	try {
		loadingCategories.value = true;
		const response = await fetch("/api/categories");
		const result = await response.json();
		if (result.code === 200) {
			// 将扁平的分类列表转换为树形结构
			categoryTree.value = buildCategoryTree(result.data.items || []);
		}
	} catch (error) {
		console.error("加载分类失败:", error);
		// 使用模拟数据作为备选
		categoryTree.value = getMockCategoryTree();
	} finally {
		loadingCategories.value = false;
	}
};

// 构建分类树结构
const buildCategoryTree = (categories: any[]) => {
	const categoryMap = new Map();
	const rootCategories = [];

	// 第一遍：创建所有节点的映射
	categories.forEach((category) => {
		categoryMap.set(category.id, {
			key: category.id,
			label: category.name,
			data: category,
			icon: "pi pi-folder",
			children: [],
		});
	});

	// 第二遍：建立父子关系
	categories.forEach((category) => {
		const node = categoryMap.get(category.id);
		if (category.parentId && categoryMap.has(category.parentId)) {
			const parentNode = categoryMap.get(category.parentId);
			parentNode.children.push(node);
		} else {
			rootCategories.push(node);
		}
	});

	return rootCategories;
};

// 模拟分类数据（当API不可用时使用）
const getMockCategoryTree = () => {
	return [
		{
			key: 1,
			label: "服装鞋帽",
			icon: "pi pi-tag",
			children: [
				{
					key: 11,
					label: "男鞋",
					icon: "pi pi-male",
					children: [
						{ key: 111, label: "运动鞋", icon: "pi pi-running" },
						{ key: 112, label: "休闲鞋", icon: "pi pi-walking" },
						{ key: 113, label: "正装鞋", icon: "pi pi-briefcase" },
					],
				},
				{
					key: 12,
					label: "女鞋",
					icon: "pi pi-female",
					children: [
						{ key: 121, label: "高跟鞋", icon: "pi pi-heel" },
						{ key: 122, label: "平底鞋", icon: "pi pi-shoe" },
						{ key: 123, label: "运动鞋", icon: "pi pi-running" },
					],
				},
			],
		},
		{
			key: 2,
			label: "运动户外",
			icon: "pi pi-mountain",
			children: [
				{ key: 21, label: "跑步鞋", icon: "pi pi-running" },
				{ key: 22, label: "篮球鞋", icon: "pi pi-basketball" },
				{ key: 23, label: "足球鞋", icon: "pi pi-soccer-ball" },
			],
		},
	];
};

// 分类选择变化处理
const onCategoryChange = (event: any) => {
	const data = templateData.crudFormData.value;
	if (data && event.value) {
		// TreeSelect可能返回的是节点对象，我们需要提取key
		if (typeof event.value === "object") {
			data.categoryId = event.value.key || event.value;
		} else {
			data.categoryId = event.value;
		}
	}
};

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

// SKU批量创建相关
const showBatchCreateSKUs = ref(false);
const selectedProductId = ref(0);
const selectedProductName = ref("");

const openBatchCreateSKUs = (product: ProductModel) => {
	selectedProductId.value = product.id;
	selectedProductName.value = product.name;
	showBatchCreateSKUs.value = true;
};

const onBatchCreateSuccess = (result: any) => {
	console.log("批量创建SKU成功:", result);
	// 可以在这里刷新SKU列表或执行其他操作
};

// 图片操作方法
const removeImage = (index: number) => {
	const data = templateData.crudFormData.value;
	if (data && data.images) {
		data.images.splice(index, 1);
	}
};

const moveImage = (index: number, direction: number) => {
	const data = templateData.crudFormData.value;
	if (!data || !data.images) return;

	const newIndex = index + direction;
	if (newIndex >= 0 && newIndex < data.images.length) {
		const temp = data.images[index];
		data.images[index] = data.images[newIndex];
		data.images[newIndex] = temp;
	}
};

// 规格管理相关
const newColor = ref("");
const newSize = ref("");
const newMaterial = ref("");
const newFeature = ref("");

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
		newColor.value = "";
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
		newSize.value = "";
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
		newMaterial.value = "";
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
		newFeature.value = "";
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

      <Column field="actions" header="操作" style="width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Button icon="pi pi-plus" size="small" severity="success" @click="openBatchCreateSKUs(data)"
              v-tooltip="'批量创建SKU'" />
          </div>
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
            <div class="card flex justify-center">
              <TreeSelect v-model="selectedCategory" :options="categoryTree" selectionMode="single" 
                placeholder="选择商品分类" class="w-full" :disabled="disabled"
                @change="onCategoryChange">
                <template #dropdownicon>
                  <i class="pi pi-sitemap" />
                </template>
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i :class="slotProps.option.icon || 'pi pi-folder'" />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </TreeSelect>
            </div>
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
            
            <!-- 图片多选下拉框 -->
            <div class="card flex justify-center mb-4">
              <Select v-model="data.images" :options="images" optionLabel="fileName" placeholder="选择商品图片" 
                class="w-full" :loading="loadingImages" multiple :maxSelectionLimit="10" filter>
                <template #value="slotProps">
                  <div v-if="slotProps.value && slotProps.value.length > 0" class="flex flex-wrap gap-1">
                    <div v-for="(image, index) in slotProps.value" :key="index" 
                      class="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <img :alt="getImageDisplayName(image)" :src="getImageUrl(image.imageUrl || image)" 
                        style="width: 20px; height: 20px; object-fit: cover; border-radius: 2px" />
                      <span class="text-sm">{{ getImageDisplayName(image) }}</span>
                      <Button icon="pi pi-times" text rounded size="small" @click.stop="removeImage(index)" 
                        :disabled="disabled" class="ml-1" />
                    </div>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center">
                    <img :alt="slotProps.option.fileName" :src="getImageUrl(slotProps.option.imageUrl)" 
                      style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px" />
                    <div class="flex flex-col ml-2">
                      <span>{{ getImageDisplayName(slotProps.option) }}</span>
                      <small class="text-gray-500">{{ slotProps.option.category || 'general' }}</small>
                    </div>
                  </div>
                </template>
                <template #dropdownicon>
                  <i class="pi pi-images" />
                </template>
                <template #header>
                  <div class="font-medium p-3">可用图片 (最多选择10张)</div>
                </template>
                <template #footer>
                  <div class="p-3">
                    <Button label="刷新图片" fluid severity="secondary" variant="text" size="small" 
                      icon="pi pi-refresh" @click="loadImages" :loading="loadingImages" />
                  </div>
                </template>
              </Select>
            </div>

            <!-- 已选择的图片网格展示 -->
            <div v-if="data.images && data.images.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div v-for="(image, index) in data.images" :key="index" class="relative group">
                <img :src="getImageUrl(image.imageUrl || image)" :alt="`商品图片 ${index + 1}`" 
                  class="w-full h-32 object-cover rounded-lg border border-gray-200" />
                <div class="absolute top-1 right-1 flex gap-1">
                  <Button @click="moveImage(index, -1)" icon="pi pi-arrow-up" size="small" 
                    severity="secondary" rounded :disabled="index === 0 || disabled"
                    class="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button @click="moveImage(index, 1)" icon="pi pi-arrow-down" size="small" 
                    severity="secondary" rounded :disabled="index === data.images.length - 1 || disabled"
                    class="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button @click="removeImage(index)" icon="pi pi-times" size="small" severity="danger"
                    rounded class="opacity-0 group-hover:opacity-100 transition-opacity" :disabled="disabled" />
                </div>
                <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {{ index + 1 }}
                </div>
              </div>
            </div>

            <!-- 无图片时的提示 -->
            <div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <i class="pi pi-image text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-500">暂未选择图片，请从上方下拉框中选择商品图片</p>
            </div>

            <small class="text-gray-500">支持 JPG、PNG 格式，建议尺寸 800x800px，最多10张图片，第一张将作为主图</small>
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

  <!-- SKU批量创建对话框 -->
  <BatchCreateSKUs
    v-model:visible="showBatchCreateSKUs"
    :product-id="selectedProductId"
    :product-name="selectedProductName"
    @success="onBatchCreateSuccess"
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

/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>