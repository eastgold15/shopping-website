<script lang="ts" setup>
import type { PartnerModel, PartnerQueryDto } from "@backend/modules/partner";
import ImageSelector from "@frontend/components/ImageSelector.vue";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { formatDate, getImageUrl } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { status } from "elysia";
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

const $crud = useCmsApi().advertisements;

// // 使用zod定义表单验证schema
// const partnerSchema = z.object({
//   name: z.string().min(2, "名称至少2个字符").max(100, "名称不能超过100个字符"),
//   description: z
//     .string()
//     .min(1, "请输入合作伙伴描述")
//     .max(500, "描述不能超过500个字符"),
//   image_id: z.number().min(0, "请选择合作伙伴图片"),
//   sortOrder: z
//     .number()
//     .min(0, "排序权重不能小于0")
//     .max(9999, "排序权重不能超过9999"),
//   url: z.string().url("请输入有效的URL").optional().or(z.literal("")),
//   isActive: z.boolean(),
//   selectedImageUrl: z.string().optional(),
// });

// 表单验证器
const ADSchema = z.object({
  title: z.string().min(1, { message: "广告标题不能为空" }),
  type: z.string().min(1, { message: "请选择广告类型" }),
  image: z.string().min(1, { message: "请上传广告图片" }),
  link: z.string().optional(),
  position: z.string().optional(),
  sortOrder: z.number().min(0, { message: "排序值不能小于0" }),
  isActive: z.boolean(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
}),


// 查询表单验证schema
const querySchema = z.object({
  type: z.string().min(1, { message: "请选择广告类型" }),
  position: z.string().optional(),
  isActive: z.boolean(),
});

// 创建resolver
const resolver = zodResolver(ADSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
  PartnerModel,
  PartnerQueryDto
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
      name: "",
      description: "",
      image_id: 0,
      image: "",
      selectedImageUrl: "",
      url: "",
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),

    // 3. 定义删除框标题
    getDeleteBoxTitle(id: number) {
      return `删除合作伙伴${id}`;
    },
    getDeleteBoxTitles(ids: Array<number>) {
      return ` 合作伙伴#${ids.join(",")} `;
    },

    // 5. 数据转换
    transformSubmitData: (data, type) => {
      // 确保数字类型正确
      if (typeof data.sortOrder === "string") {
        data.sortOrder = parseInt(data.sortOrder) || 0;
      }
      // @ts-ignore
      delete data.image
      // @ts-ignore
      delete data.createdAt
      // @ts-ignore
      delete data.updatedAt

      data.image_id = currentFormData.value?.image_id || data.image_id;
      // 移除前端显示用的字段，不提交到后端
      // @ts-ignore
      delete data.selectedImageUrl;
    },
  },
  // 6. 定义查询表单
  {
    name: "",
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
const currentFormData = ref<PartnerModel>();

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
  <PrimeCrudTemplate name="合作伙伴" identifier="partner" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
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

      <Column field="image" header="图片" style="width: 120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <img v-if="data.image" :src="getImageUrl(data.image)" :alt="data.name"
              class="w-12 h-12 object-cover rounded-lg border border-gray-200" />
            <div v-else class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-image text-gray-400 text-sm"></i>
            </div>
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
    <template #CrudForm="{ data, disabled }: { data: PartnerModel, disabled: boolean }">
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
        <FormField v-slot="$field" name="image_id" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">合作伙伴图片 *</label>
          <div class="flex flex-col gap-1">
            <InputNumber v-model="data.image_id" fluid placeholder="请输入选择图片" :disabled="true" />
            <!-- 图片选择器 -->
            <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined :disabled="disabled"
              @click="() => { currentFormData = data; showImageSelector = true; }" v-tooltip="'从图片库选择'" />
          </div>
          <div v-if="data.image" class="flex flex-col gap-2 mb-4">
            <img :src="getImageUrl(data.image)" :alt="data.name"
              class="w-24 h-24 object-cover rounded-lg border border-gray-200" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
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

  <!-- 图片选择器 -->
  <ImageSelector v-model:visible="showImageSelector" category="partner" @select="onImageSelected" />
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