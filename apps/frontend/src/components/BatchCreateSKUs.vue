<script setup lang="ts">
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

// 颜色规格接口类型
interface ColorSpec {
	id: number;
	name: string;
	colorValue?: string;
	imageUrl: string;
	description?: string;
	sortOrder?: number;
}

// SKU表单数据类型
interface SkuFormData {
	id: number; // 颜色规格ID
	name: string; // SKU名称（使用颜色名称）
	price: string;
	comparePrice: string;
	cost: string;
	stock: number;
	minStock: number;
	weight: string;
	skuCode: string;
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

// 可用的颜色规格列表
const availableColorSpecs = ref<ColorSpec[]>([]);

// SKU表单数据列表
const skuFormList = ref<SkuFormData[]>([]);

// 默认值设置
const defaultValues = ref({
	price: "",
	comparePrice: "",
	cost: "",
	stock: 100,
	minStock: 0,
	weight: "",
	skuCodePrefix: "",
});

// 表单验证schema
const formSchema = z.object({
	colorSpecs: z
		.array(
			z.object({
				id: z.number().min(1, "颜色规格ID不能为空"),
				name: z.string().min(1, "SKU名称不能为空"),
				price: z.string().min(1, "价格不能为空"),
				comparePrice: z.string().optional(),
				cost: z.string().optional(),
				stock: z.number().min(0, "库存不能小于0"),
				minStock: z.number().min(0, "最低库存不能小于0"),
				weight: z.string().optional(),
				skuCode: z.string().optional(),
			}),
		)
		.min(1, "至少需要一个颜色规格"),
});

const resolver = zodResolver(formSchema);

// 计算SKU数量
const totalSkuCount = computed(() => {
	return skuFormList.value.length;
});

// 加载颜色规格数据（重构后不再使用尺寸）
const loadColorSpecs = async () => {
	try {
		// 加载当前商品的颜色规格
		const colorSpecsResponse = await cmsApi.colorSpecs.getByProductId(props.productId);
		if (colorSpecsResponse.code === 200) {
			availableColorSpecs.value = colorSpecsResponse.data;
		}
	} catch (error) {
		console.error("加载颜色规格数据失败:", error);
		toast.add({
			severity: "error",
			summary: "加载失败",
			detail: "无法加载颜色规格数据",
			life: 3000,
		});
	}
};

// 初始化SKU表单数据根据颜色规格
const initializeSkuForms = () => {
	skuFormList.value = availableColorSpecs.value.map((colorSpec) => ({
		id: colorSpec.id,
		name: colorSpec.name,
		price: defaultValues.value.price,
		comparePrice: defaultValues.value.comparePrice,
		cost: defaultValues.value.cost,
		stock: defaultValues.value.stock,
		minStock: defaultValues.value.minStock,
		weight: defaultValues.value.weight,
		skuCode: `${defaultValues.value.skuCodePrefix}${props.productId}-${colorSpec.id}`,
	}));
};

// 应用默认值到所有SKU
const applyDefaultValues = () => {
	skuFormList.value.forEach((sku) => {
		sku.price = defaultValues.value.price;
		sku.comparePrice = defaultValues.value.comparePrice;
		sku.cost = defaultValues.value.cost;
		sku.stock = defaultValues.value.stock;
		sku.minStock = defaultValues.value.minStock;
		sku.weight = defaultValues.value.weight;
		sku.skuCode = `${defaultValues.value.skuCodePrefix}${props.productId}-${sku.id}`;
	});
};

// 确认创建
const confirmCreate = async () => {
	try {
		// 验证表单
		const validatedData = formSchema.parse({ colorSpecs: skuFormList.value });

		// 调用新的基于颜色规格的批量创建SKU接口
		const result = await cmsApi.skus.batchCreateByColorSpecs(
			props.productId,
			validatedData.colorSpecs
		);

		if (result.code === 200) {
			toast.add({
				severity: "success",
				summary: "创建成功",
				detail: `成功创建 ${result.data.createdCount} 个SKU`,
				life: 3000,
			});

			emit("success", result.data);
			visible.value = false;
			resetForm();
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


</script>

<template>
  <Dialog :visible="visible" :style="{ width: '90vw', maxWidth: '1200px' }" :maximizable="true" :modal="true" header="批量创建SKU">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：基本信息和默认值配置 -->
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
                  可创建SKU数量:
                  <Tag :value="totalSkuCount" severity="info" />
                </label>
                <Message v-if="availableColorSpecs.length === 0" severity="warn" :closable="false">
                  该商品暂无颜色规格，请先添加颜色规格
                </Message>
              </div>
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
                <InputText v-model="defaultValues.price" placeholder="请输入默认价格" class="w-full" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">默认原价</label>
                  <InputText v-model="defaultValues.comparePrice" placeholder="请输入默认原价" class="w-full" />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">默认成本</label>
                  <InputText v-model="defaultValues.cost" placeholder="请输入默认成本" class="w-full" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">默认库存 *</label>
                  <InputNumber v-model="defaultValues.stock" :min="0" class="w-full" />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-2 block">最低库存</label>
                  <InputNumber v-model="defaultValues.minStock" :min="0" class="w-full" />
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">默认重量(kg)</label>
                <InputText v-model="defaultValues.weight" placeholder="如：0.5" class="w-full" />
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">SKU编码前缀</label>
                <InputText v-model="defaultValues.skuCodePrefix" placeholder="如：PRD-" class="w-full" />
              </div>

              <Button 
                label="应用默认值到所有SKU" 
                icon="pi pi-refresh" 
                class="w-full" 
                @click="applyDefaultValues"
                :disabled="skuFormList.length === 0"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- 右侧：SKU列表编辑 -->
      <div class="space-y-6">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-list"></i>
                SKU列表配置
              </div>
              <Button 
                label="重新加载颜色规格" 
                icon="pi pi-refresh" 
                size="small" 
                severity="secondary"
                @click="loadColorSpecs"
              />
            </div>
          </template>
          <template #content>
            <div v-if="skuFormList.length === 0" class="text-center py-8">
              <i class="pi pi-box text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-500">暂无可用的颜色规格</p>
              <p class="text-gray-400 text-sm">请先为商品添加颜色规格</p>
            </div>

            <div v-else class="space-y-4 max-h-96 overflow-y-auto">
              <div v-for="(sku, index) in skuFormList" :key="sku.id" class="border rounded-lg p-4 bg-gray-50">
                <!-- SKU名称和颜色信息 -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <div 
                      v-if="availableColorSpecs.find(cs => cs.id === sku.id)?.colorValue" 
                      class="w-6 h-6 rounded-full border border-gray-300"
                      :style="{ backgroundColor: availableColorSpecs.find(cs => cs.id === sku.id)?.colorValue }"
                    ></div>
                    <span class="font-medium">{{ sku.name }}</span>
                  </div>
                  <Tag :value="sku.skuCode" severity="info" class="text-xs" />
                </div>

                <!-- 价格配置 -->
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">价格 *</label>
                    <InputText v-model="sku.price" placeholder="价格" size="small" class="w-full" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">原价</label>
                    <InputText v-model="sku.comparePrice" placeholder="原价" size="small" class="w-full" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">成本</label>
                    <InputText v-model="sku.cost" placeholder="成本" size="small" class="w-full" />
                  </div>
                </div>

                <!-- 库存和重量配置 -->
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">库存 *</label>
                    <InputNumber v-model="sku.stock" :min="0" size="small" class="w-full" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">最低库存</label>
                    <InputNumber v-model="sku.minStock" :min="0" size="small" class="w-full" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-600 mb-1 block">重量(kg)</label>
                    <InputText v-model="sku.weight" placeholder="重量" size="small" class="w-full" />
                  </div>
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
          将创建 {{ totalSkuCount }} 个SKU
        </div>
        <div class="flex items-center gap-2">
          <Button label="取消" icon="pi pi-times" @click="closeDialog" />
          <Button 
            label="确认创建" 
            icon="pi pi-check" 
            severity="success" 
            @click="confirmCreate"
            :disabled="skuFormList.length === 0 || !defaultValues.price"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>