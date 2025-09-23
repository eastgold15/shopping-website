<script setup lang="ts">
import type { SelectColorType, SelectSizeType } from "@backend/db/models/attribute.model";
import type { SelectImagesVo } from "@backend/types";
import ImageSelector from "@frontend/components/ImageSelector.vue";
import { useCmsApi } from "@frontend/utils/handleApi";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import Button from "primevue/button";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { z } from "zod";

interface Color {
	id: number;
	name: string;
	value?: string;
	imageUrl?: string; // 添加颜色对应的图片URL
	imageId?: number;  // 添加颜色对应的图片ID
}

interface Size {
	id: number;
	name: string;
	value?: string;
}

const props = defineProps<{
	productId: number;
	productName: string;
}>();

const emit = defineEmits<{
	success: [result: any];
}>();

const toast = useToast();
const cmsApi = useCmsApi();

const visible = defineModel<boolean>("visible", { default: false });

// 可选的颜色和尺寸列表
const availableColors = ref<SelectColorType[]>([]);
const availableSizes = ref<SelectSizeType[]>([]);

// 表单数据
const form = ref({
	colors: [] as Color[],
	sizes: [] as Size[],
	defaultPrice: "",
	defaultComparePrice: "",
	defaultCost: "",
	defaultStock: 100,
	defaultWeight: "",
	skuCodePattern: "{productId}-{colorValue}-{sizeValue}",
});

// 选择的颜色和尺寸
const selectedColor = ref<SelectColorType | null>(null);
const selectedSize = ref<SelectSizeType | null>(null);

// 预览生成的SKU
const previewSkus = ref<any[]>([]);

// 图片选择相关
const showImageSelector = ref(false);
const selectedImages = ref<SelectImagesVo[]>([]);
const currentColorIndex = ref<number>(-1); // 当前正在选择图片的颜色索引

// 表单验证schema
const formSchema = z.object({
	colors: z
		.array(
			z.object({
				id: z.number(),
				name: z.string().min(1, "颜色名称不能为空"),
				value: z.string().optional(),
				imageUrl: z.string().optional(),
				imageId: z.number().optional(),
			}),
		)
		.min(1, "至少需要一个颜色"),
	sizes: z
		.array(
			z.object({
				id: z.number(),
				name: z.string().min(1, "尺寸名称不能为空"),
				value: z.string().optional(),
			}),
		)
		.min(1, "至少需要一个尺寸"),
	defaultPrice: z.string().min(1, "价格不能为空"),
	defaultComparePrice: z.string().optional(),
	defaultCost: z.string().optional(),
	defaultStock: z.number().min(0, "库存不能小于0"),
	defaultWeight: z.string().optional(),
	skuCodePattern: z.string().min(1, "SKU编码模式不能为空"),
});

const resolver = zodResolver(formSchema);

// 计算总组合数
const totalCombinations = computed(() => {
	return form.value.colors.length * form.value.sizes.length;
});

// 加载颜色和尺寸数据
const loadColorsAndSizes = async () => {
	try {
		// 加载颜色
		const colorsResponse = await cmsApi.colors.all({ isActive: "true" });
		if (colorsResponse.code === 200) {
			availableColors.value = colorsResponse.data.items;
		}

		// 加载尺寸
		const sizesResponse = await cmsApi.sizes.all({ isActive: "true" });
		if (sizesResponse.code === 200) {
			availableSizes.value = sizesResponse.data;
		}
	} catch (error) {
		console.error("加载颜色和尺寸数据失败:", error);
		toast.add({
			severity: "error",
			summary: "加载失败",
			detail: "无法加载颜色和尺寸数据",
			life: 3000,
		});
	}
};

// 添加颜色
const addColor = () => {
	if (selectedColor.value && !form.value.colors.find(c => c.id === selectedColor.value!.id)) {
		form.value.colors.push({
			id: selectedColor.value.id,
			name: selectedColor.value.name,
			value: selectedColor.value.value || selectedColor.value.name,
			imageUrl: undefined,
			imageId: undefined,
		});
		selectedColor.value = null;
	}
};

// 删除颜色
const removeColor = (index: number) => {
	form.value.colors.splice(index, 1);
};

// 为颜色选择图片
const selectColorImage = (colorIndex: number) => {
	currentColorIndex.value = colorIndex;
	// 如果已有图片，预设选中状态
	const currentColor = form.value.colors[colorIndex];
	if (currentColor && currentColor.imageId) {
		// 查找对应的图片对象（这里需要从图片列表中查找）
		// 暂时置空，后续可以优化
		selectedImages.value = [];
	} else {
		selectedImages.value = [];
	}
	showImageSelector.value = true;
};

// 图片选择完成
const onImageSelectionComplete = () => {
	if (currentColorIndex.value >= 0 && selectedImages.value.length > 0) {
		const selectedImage = selectedImages.value[0]; // 只取第一张图片
		form.value.colors[currentColorIndex.value].imageUrl = selectedImage.imageUrl;
		form.value.colors[currentColorIndex.value].imageId = selectedImage.id;
	}
	showImageSelector.value = false;
	currentColorIndex.value = -1;
};

// 添加尺寸
const addSize = () => {
	if (selectedSize.value && !form.value.sizes.find(s => s.id === selectedSize.value!.id)) {
		form.value.sizes.push({
			id: selectedSize.value.id,
			name: selectedSize.value.name,
			value: selectedSize.value.value || selectedSize.value.name,
		});
		selectedSize.value = null;
	}
};

// 删除尺寸
const removeSize = (index: number) => {
	form.value.sizes.splice(index, 1);
};

// 生成预览
const generatePreview = () => {
	previewSkus.value = [];

	form.value.colors.forEach((color) => {
		form.value.sizes.forEach((size) => {
			const skuCode = form.value.skuCodePattern
				.replace("{productId}", props.productId.toString())
				.replace("{colorName}", color.name)
				.replace("{colorValue}", color.value || color.name)
				.replace("{sizeName}", size.name)
				.replace("{sizeValue}", size.value || size.name);

			previewSkus.value.push({
				skuCode,
				name: `${props.productName} ${color.name} ${size.name}`,
				colorName: color.name,
				colorValue: color.value,
				colorImageUrl: color.imageUrl, // 添加颜色图片
				sizeName: size.name,
				price: form.value.defaultPrice,
				stock: form.value.defaultStock,
			});
		});
	});
};

// 确认创建
const confirmCreate = async () => {
	try {
		// 验证表单
		const validatedData = formSchema.parse(form.value);

		// 调用API创建SKU
		const response = await fetch(
			`/api/products/${props.productId}/batch-skus`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(validatedData),
			},
		);

		const result = await response.json();

		if (result.code === 200) {
			toast.add({
				severity: "success",
				summary: "创建成功",
				detail: `成功创建 ${result.data.createdCount} 个SKU`,
				life: 3000,
			});

			emit("success", result.data);

			visible.value = false;

			// 重置表单
			form.value = {
				colors: [],
				sizes: [],
				defaultPrice: "",
				defaultComparePrice: "",
				defaultCost: "",
				defaultStock: 100,
				defaultWeight: "",
				skuCodePattern: "{productId}-{colorValue}-{sizeValue}",
			};
			previewSkus.value = [];
		} else {
			throw new Error(result.message || "创建失败");
		}
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "创建失败",
			detail: error instanceof Error ? error.message : "创建SKU失败",
			life: 3000,
		});
	}
};

// 关闭对话框
const closeDialog = () => {
	visible.value = false;
	previewSkus.value = [];
};

// 监听可见性变化，重置表单
watch(visible, (newval) => {
	if (!newval) {
		form.value = {
			colors: [],
			sizes: [],
			defaultPrice: "",
			defaultComparePrice: "",
			defaultCost: "",
			defaultStock: 100,
			defaultWeight: "",
			skuCodePattern: "{productId}-{colorValue}-{sizeValue}",
		};
		previewSkus.value = [];
		selectedColor.value = null;
		selectedSize.value = null;
	}
});

// 组件挂载时加载数据
onMounted(() => {
	loadColorsAndSizes();
});
</script>

<template>
  <Dialog :visible="visible" :style="{ width: '80vw' }" :maximizable="true" :modal="true" header="批量创建SKU">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle"></i>
              基本信息
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">商品名称</label>
                <InputText :model-value="productName" disabled class="w-full" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">商品ID</label>
                <InputText :model-value="productId.toString()" disabled class="w-full" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">
                  预计生成SKU数量:
                  <Tag :value="totalCombinations" severity="info" />
                </label>
              </div>
            </div>
          </template>
        </Card>

        <!-- 颜色配置 -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-palette"></i>
              颜色配置
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="flex gap-2">
                <Select 
                  v-model="selectedColor" 
                  :options="availableColors" 
                  option-label="name" 
                  placeholder="选择颜色" 
                  class="flex-1"
                  :filter="true"
                  filter-placeholder="搜索颜色"
                />
                <Button icon="pi pi-plus" @click="addColor" :disabled="!selectedColor" />
              </div>

              <div class="flex flex-wrap gap-2">
                <div v-for="(color, index) in form.colors" :key="index" 
                     class="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                  <!-- 颜色显示 -->
                  <div class="flex items-center gap-2">
                    <div v-if="color.value?.startsWith('#')" 
                         class="w-6 h-6 rounded-full border border-gray-300"
                         :style="{ backgroundColor: color.value }"></div>
                    <span class="font-medium">{{ color.name }}</span>
                  </div>
                  
                  <!-- 图片预览 -->
                  <div v-if="color.imageUrl" class="flex items-center gap-1">
                    <img :src="color.imageUrl" 
                         :alt="color.name" 
                         class="w-8 h-8 object-cover rounded border" />
                    <i class="pi pi-check text-green-600 text-sm"></i>
                  </div>
                  
                  <!-- 图片操作按钮 -->
                  <div class="flex items-center gap-1">
                    <Button 
                      icon="pi pi-image" 
                      size="small" 
                      severity="secondary" 
                      outlined 
                      :title="color.imageUrl ? '更换图片' : '选择图片'"
                      @click="selectColorImage(index)" 
                    />
                    <Button 
                      icon="pi pi-times" 
                      size="small" 
                      severity="danger" 
                      outlined 
                      title="删除颜色"
                      @click="removeColor(index)" 
                    />
                  </div>
                </div>
              </div>

              <Message v-if="form.colors.length === 0" severity="warn" :closable="false">
                至少需要添加一个颜色
              </Message>
            </div>
          </template>
        </Card>

        <!-- 尺寸配置 -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-ruler"></i>
              尺寸配置
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="flex gap-2">
                <Select 
                  v-model="selectedSize" 
                  :options="availableSizes" 
                  option-label="name" 
                  placeholder="选择尺寸" 
                  class="flex-1"
                  :filter="true"
                  filter-placeholder="搜索尺寸"
                />
                <Button icon="pi pi-plus" @click="addSize" :disabled="!selectedSize" />
              </div>

              <div class="flex flex-wrap gap-2">
                <Tag v-for="(size, index) in form.sizes" :key="index" :value="size.name" severity="secondary"
                  class="cursor-pointer" @click="removeSize(index)">
                  <span class="ml-2">×</span>
                </Tag>
              </div>

              <Message v-if="form.sizes.length === 0" severity="warn" :closable="false">
                至少需要添加一个尺寸
              </Message>
            </div>
          </template>
        </Card>

        <!-- 默认值配置 -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog"></i>
              默认值配置
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">默认价格 *</label>
                <InputNumber v-model="form.defaultPrice" mode="currency" currency="CNY" locale="zh-CN" class="w-full" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">默认原价</label>
                  <InputNumber v-model="form.defaultComparePrice" mode="currency" currency="CNY" locale="zh-CN"
                    class="w-full" />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">默认成本</label>
                  <InputNumber v-model="form.defaultCost" mode="currency" currency="CNY" locale="zh-CN"
                    class="w-full" />
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">默认库存 *</label>
                <InputNumber v-model="form.defaultStock" :min="0" class="w-full" />
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">默认重量(kg)</label>
                <InputNumber v-model="form.defaultWeight" mode="decimal" :min-fraction-digits="2"
                  :max-fraction-digits="3" class="w-full" />
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">SKU编码模式</label>
                <Textarea v-model="form.skuCodePattern" rows="2" class="w-full"
                  placeholder="{productId}-{colorValue}-{sizeValue}" />
                <small class="text-gray-500">
                  可用变量: {productId}, {colorName}, {colorValue}, {sizeName}, {sizeValue}
                </small>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- 右侧：预览区域 -->
      <div class="space-y-6">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-eye"></i>
                SKU预览
              </div>
              <Button label="生成预览" icon="pi pi-refresh" size="small" @click="generatePreview"
                :disabled="form.colors.length === 0 || form.sizes.length === 0" />
            </div>
          </template>
          <template #content>
            <div v-if="previewSkus.length === 0" class="text-center py-8">
              <i class="pi pi-box text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-500">请先配置颜色和尺寸，然后点击"生成预览"</p>
            </div>

            <div v-else class="space-y-3 max-h-96 overflow-y-auto">
              <div v-for="sku in previewSkus" :key="sku.skuCode" class="border rounded-lg p-3 bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium">{{ sku.name }}</span>
                  <Tag :value="sku.skuCode" severity="info" class="text-xs" />
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span>颜色: {{ sku.colorName }}</span>
                  <span>尺寸: {{ sku.sizeName }}</span>
                  <span>价格: ¥{{ sku.price }}</span>
                  <span>库存: {{ sku.stock }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          将创建 {{ totalCombinations }} 个SKU组合
        </div>
        <div class="flex items-center gap-2">
          <Button label="取消" icon="pi pi-times" @click="closeDialog" />
          <Button label="确认创建" icon="pi pi-check" severity="success" @click="confirmCreate"
            :disabled="form.colors.length === 0 || form.sizes.length === 0" />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- 图片选择器 -->
  <ImageSelector
    v-model:visible="showImageSelector"
    v-model="selectedImages"
    category="product"
    :multiple="false"
    :max-select="1"
    @select="onImageSelectionComplete"
  />
</template>