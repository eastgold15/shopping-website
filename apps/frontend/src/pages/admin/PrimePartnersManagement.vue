<script lang="ts" setup>
import type {
	ListImagesQueryDto,
	PartnerlFormDto,
	PartnersListVo,
	SelectImagesVo,
} from "@backend/types";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import type { CrudMode } from "@frontend/types/prime-cms";
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
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().partner;
// 使用zod定义表单验证schema
const partnerSchema = z.object({
	name: z.string().min(2, "名称至少2个字符").max(100, "名称不能超过100个字符"),
	description: z.string().min(1, "请输入合作伙伴描述"),
	sortOrder: z
		.number()
		.min(0, "排序权重不能小于0")
		.max(9999, "排序权重不能超过9999"),
	url: z.string().url("请输入有效的URL").optional().or(z.literal("")),
	isActive: z.boolean(),
	selectedImageUrl: z.string().optional(),
});

// 查询表单验证schema
const querySchema = z.object({
	name: z.string().max(100, "搜索名称不能超过100个字符").optional(),
	isActive: z.boolean().optional(),
});

// 创建resolver
const resolver = zodResolver(partnerSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
	PartnersListVo,
	any,
	PartnerlFormDto
>(
	{
		// 1. 定义查询表单
		// @ts-ignore
		getList: $crud.list,
		// @ts-ignore
		create: $crud.create,
		// @ts-ignore
		update: $crud.update,
		delete: $crud.delete,
		// 2. 定义初始表格列 初始值
		getEmptyModel: () => ({
			id: 0,
			name: "",
			description: "",
			url: "",
			sortOrder: 0,
			isActive: true,
			createdAt: "",
			updatedAt: "",
			images: [
				{
					id: 1,
					fileName: "dongqi.jpeg",
					imageUrl: "http://img.cykycyky.top/logo/dongqi_2v1uxb.jpeg",
					category: "logo",
					isMain: false,
				},
			],
		}),

		// 3. 定义删除框标题
		getDeleteBoxTitle(id: number) {
			return `删除合作伙伴${id}`;
		},
		getDeleteBoxTitles(ids: Array<number>) {
			return ` 合作伙伴#${ids.join(",")} `;
		},

		// 5. 数据转换
		transformSubmitData: (data: any, _mode: CrudMode) => {
			// @ts-ignore
			data.images = data.images.map((img) => img.id);
			console.log("data11122", data);
		},
	},
	// 6. 定义查询表单
	{
		name: "",
		isActive: undefined,
		page: 1,
		limit: 20,
	},
);

const { tableData, queryForm, fetchList } = templateData;

onMounted(async () => {
	await fetchList();
	await loadImages();
});

// 状态选项
const statusOptions = [
	{ label: "全部", value: undefined },
	{ label: "启用", value: true },
	{ label: "禁用", value: false },
];

// 获取PrimeCrudTemplate组件的引用
const crudTemplateRef = ref();

// 图片选择相关
const toast = useToast();
const images = ref<SelectImagesVo[]>([]);
const loadingImages = ref(false);
const imageSelectorVisible = ref(false);

// 加载图片列表
const loadImages = async () => {
	loadingImages.value = true;
	try {
		const params: ListImagesQueryDto = {
			page: 1,
			limit: 100, // 加载更多图片供选择
		};

		const { code, data, message } = await useCmsApi().images.list(params);
		if (code !== 200) {
			toast.add({
				severity: "error",
				summary: "加载失败",
				detail: message,
				life: 3000,
			});
			return;
		}

		images.value = data.items;
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "加载失败",
			detail: (error as Error).message,
			life: 3000,
		});
	} finally {
		loadingImages.value = false;
	}
};
</script>

<template>
  <PrimeCrudTemplate ref="crudTemplateRef" name="合作伙伴" identifier="partner" :table-data="tableData"
    :template-data="templateData" :crud-controller="15" :query-form="queryForm" :resolver="resolver"
    :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="name" class="flex flex-column gap-1">
          <div class="flex  items-center gap-2">
            <label for="query-name" class="text-sm font-medium  ">合作伙伴名称</label>
            <InputText id="query-name" placeholder="搜索合作伙伴名称" />
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

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <Column field="images" header="图片" style="width:120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <ImagePreview :images="data.images" size="small" :show-indicator="true" />
          </div>
        </template>
      </Column>

      <Column field="name" header="合作伙伴名称" style="width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ data.name }}</span>
            <Tag v-if="data.url" value="有链接" severity="info" class="text-xs" />
          </div>
        </template>
      </Column>

      <Column field="description" header="描述" style="width: 300px">
        <template #body="{ data }">
          <span class="text-gray-600 text-sm line-clamp-2">
            {{ data.description || '-' }}
          </span>
        </template>
      </Column>

      <Column field="url" header="网站链接" style="width: 200px">
        <template #body="{ data }">
          <div v-if="data.url" class="flex items-center gap-2">
            <a :href="data.url" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm truncate max-w-32"
              v-tooltip.top="data.url">
              {{ data.url }}
            </a>
            <i class="pi pi-external-link text-gray-400 text-xs"></i>
          </div>
          <span v-else class="text-gray-400 text-sm">-</span>
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
    <template
      #CrudForm="{ data, mode, disabled, $form }: { data: PartnersListVo, mode: CrudMode, disabled: boolean, $form: any }">
      <div class="h-full">
        <!-- 合作伙伴名称 -->
        <FormField v-slot="$field" name="name" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">合作伙伴名称 *</label>
          <InputText fluid size="small" placeholder="请输入合作伙伴名称" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 合作伙伴描述 -->
        <FormField v-slot="$field" name="description" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">合作伙伴描述 *</label>

          <Textarea fluid placeholder="请输入合作伙伴描述" :disabled="disabled" rows="2" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 合作伙伴图片 -->
        <FormField v-slot="$field" name="images" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">合作伙伴图片 *</label>

          <!-- ✅ 预览当前选中的图片 -->
          <div v-if="$field.value && $field.value.length > 0" class="flex flex-col gap-2 mb-4">
            <ImagePreview :images="$field.value" size="small" :show-indicator="true" />
            <small class="text-gray-600" v-for="(img, index) in $field.value" :key="img.id || index">
              {{ img.fileName }} ({{ img.category || 'general' }})
            </small>
          </div>
          <!-- ✅ 图片选择器组件 -->
          <ImageSelector v-model="$field.value" v-model:visible="imageSelectorVisible" :multiple="true"
            :max-select="2" />
          <!-- 图片选择按钮 -->
          <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined @click="imageSelectorVisible = true" />

          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 网站链接 -->
        <FormField v-slot="$field" name="url" class="flex flex-col gap-2 mb-4">
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

/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>