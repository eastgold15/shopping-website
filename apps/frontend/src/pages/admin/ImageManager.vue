<script setup lang="ts">
import type { ListImagesQueryDto, SelectImagesVo } from "@backend/types";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import {
	formatDate,
	formatSize,
	getImageUrl,
} from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().images;

// 使用zod定义表单验证schema
const imageSchema = z.object({
	fileName: z
		.string()
		.min(1, "文件名不能为空")
		.max(255, "文件名不能超过255个字符"),
	category: z.string().min(1, "请选择分类"),
	alt: z.string().max(500, "Alt文本不能超过500个字符").optional(),
});

// 查询表单验证schema
const querySchema = z.object({
	filename: z.string().max(255, "搜索文件名不能超过255个字符").optional(),
	category: z.string().optional(),
});

// 创建resolver
const resolver = zodResolver(imageSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
	SelectImagesVo,
	ListImagesQueryDto
>(
	{
		// 1. 定义查询表单
		getList: async (params) => {
			// 调用API获取图片列表
			const result = await $crud.list(params as ListImagesQueryDto);
			// 调试：打印分页数据
			console.log("ImageManager - API Response:", result);
			console.log("ImageManager - Meta data:", result?.data?.meta);
			// 确保返回正确的类型
			return result as any;
		},
		create: async (_data) => {
			// 图片创建通过上传实现，这里返回成功
			return { code: 200, message: "操作成功", data: null };
		},
		update: async (id, data) => {
			// 调用API更新图片信息
			const result = await $crud.update(id, data);
			// 确保返回正确的类型
			return result as any;
		},
		delete: async (id) => {
			// 调用API删除图片
			const result = await $crud.delete(id);
			// 确保返回正确的类型
			return result as any;
		},
		deletes: async (ids) => {
			// 调用API批量删除图片
			const result = await $crud.batchDelete({ ids });
			// 确保返回正确的类型
			return result as any;
		},

		// 2. 定义初始表格列 初始值
		getEmptyModel: () => ({
			id: 0,
			fileName: "",
			imageUrl: "",
			category: "general",
			fileSize: 0,
			mimeType: "",
			alt: "",
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

		// 3. 定义删除框标题
		getDeleteBoxTitle(id: number) {
			return `删除图片${id}`;
		},
		getDeleteBoxTitles(ids: Array<number>) {
			return ` 图片#${ids.join(",")} `;
		},

		// 5. 数据转换
		transformSubmitData: (data, _type) => {
			// 移除只读字段
			// @ts-ignore
			delete data.imageUrl;
			// @ts-ignore
			delete data.fileSize;
			// @ts-ignore
			delete data.mimeType;
			// @ts-ignore
			delete data.createdAt;
			// @ts-ignore
			delete data.updatedAt;
		},
	},
	// 6. 定义查询表单
	{
		filename: "",
		category: undefined,
		page: 1,
		limit: 10,
	},
);

const { tableData, queryForm, fetchList } = templateData;

onMounted(async () => {
	await fetchList();
});

// 分类选项
const categoryOptions = [
	{ label: "全部", value: "all" },
	{ label: "常规图", value: "general" },
	{ label: "轮播图", value: "banner" },
	{ label: "商品图片", value: "product" },
	{ label: "logo图片", value: "logo" },
	{ label: "头像图片", value: "avatar" },
	{ label: "其他图片", value: "other" },
];

// 上传相关
const showUploadDialog = ref(false);

// 上传成功回调
const onUploadSuccess = async () => {
	showUploadDialog.value = false;
	await fetchList();
};
</script>

<template>
  <PrimeCrudTemplate name="图片" identifier="image" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="filename" class="flex flex-column gap-1">
          <div class="flex items-center gap-2">
            <label for="query-filename" class="text-sm font-medium">文件名</label>
            <InputText id="query-filename" placeholder="搜索文件名" />
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
      </div>
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <Column field="image" header="图片" style="width: 120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <img v-if="data.imageUrl" :src="getImageUrl(data.imageUrl)" :alt="data.fileName"
              class="w-12 h-12 object-cover rounded-lg border border-gray-200" />
            <div v-else class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-image text-gray-400 text-sm"></i>
            </div>
          </div>
        </template>
      </Column>

      <Column field="fileName" header="文件名" style="width: 200px">
        <template #body="{ data }">
          <span class="font-medium">{{ data.fileName }}</span>
        </template>
      </Column>

      <Column field="category" header="分类" style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.category" severity="info" />
        </template>
      </Column>

      <Column field="fileSize" header="大小" style="width: 100px">
        <template #body="{ data }">
          <span class="text-gray-600 text-sm">
            {{ formatSize(data.fileSize) }}
          </span>
        </template>
      </Column>

      <Column field="mimeType" header="类型" style="width: 120px">
        <template #body="{ data }">
          <span class="text-gray-600 text-sm">
            {{ data.mimeType }}
          </span>
        </template>
      </Column>

      <Column field="alt" header="Alt文本" style="width: 200px">
        <template #body="{ data }">
          <span class="text-gray-600 text-sm line-clamp-2">
            {{ data.alt || '-' }}
          </span>
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
    <template #CrudForm="{ data, disabled }: { data: SelectImagesVo, disabled: boolean }">
      <div class="h-full">
        <!-- 文件名 -->
        <FormField v-slot="$field" name="fileName" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">文件名 *</label>
          <InputText fluid size="small" placeholder="请输入文件名" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 分类 -->
        <FormField v-slot="$field" name="category" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">分类 *</label>
          <Select fluid :options="categoryOptions.filter(c => c.value !== undefined)" option-label="label"
            option-value="value" placeholder="请选择分类" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- Alt文本 -->
        <FormField v-slot="$field" name="alt" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">Alt文本</label>
          <Textarea fluid placeholder="请输入图片描述" :disabled="disabled" rows="2" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 图片预览 -->
        <div class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">图片预览</label>
          <div class="flex justify-center">
            <img v-if="data.imageUrl" :src="getImageUrl(data.imageUrl)" :alt="data.fileName"
              class="w-32 h-32 object-cover rounded-lg border border-gray-200" />
            <div v-else class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-image text-gray-400 text-2xl"></i>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 查询表单操作 -->
    <template #QueryFormAction>
      <div class="md:col-auto">
        <div class="flex gap-2">
          <Button class="md:w-22" label="重置" icon="pi pi-refresh" severity="secondary"
            @click="templateData.resetForm(null)" />
          <Button class="w-22" label="查询" icon="pi pi-search" :loading="templateData.formLoading.value"
            @click="templateData.FormSearch(null)" />
          <Button class="w-42" label="上传图片" icon="pi pi-upload" severity="success" @click="showUploadDialog = true" />
        </div>
      </div>
    </template>
  </PrimeCrudTemplate>

  <!-- 上传组件 -->
  <ImageUpload v-model:visible="showUploadDialog" @upload-success="onUploadSuccess" />
</template>

<style scoped>
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>