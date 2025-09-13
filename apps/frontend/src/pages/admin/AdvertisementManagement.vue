<script lang="ts" setup>
import type { ADModel, ADQueryDto } from "@backend/modules/advertisements";
import ImageSelector from "@frontend/components/ImageSelector.vue";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import { formatDate, getImageUrl } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import DatePicker from "primevue/datepicker";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import { onMounted, ref } from "vue";
import { z } from "zod";

const $crud = useCmsApi().advertisements;

// 表单验证器
const ADSchema = z.object({
  title: z.string().min(1, { message: "广告标题不能为空" }),
  type: z.string().min(1, { message: "请选择广告类型" }),
  link: z.string().optional(),
  position: z.string().optional(),
  sortOrder: z.number().min(0, { message: "排序值不能小于0" }),
  isActive: z.boolean(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
});

// 查询表单验证schema
const querySchema = z.object({
  type: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
});

// 创建resolver
const resolver = zodResolver(ADSchema);
const queryResolver = zodResolver(querySchema);

// 响应式数据
const templateData = await genPrimeCmsTemplateData<
  ADModel,
  ADQueryDto
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
      title: "",
      type: "carousel",
      image_id: -1,
      link: "",
      position: "",
      sortOrder: 0,
      isActive: true,
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }),

    // 3. 定义删除框标题
    getDeleteBoxTitle(id: number) {
      return `删除广告${id}`;
    },
    getDeleteBoxTitles(ids: Array<number>) {
      return ` 广告#${ids.join(",")} `;
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

    },
  },
  // 6. 定义查询表单
  {
    type: undefined,
    position: undefined,
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
const currentFormData = ref<ADModel>();

const onImageSelected = (imageUrl: string, imageData: any) => {
  console.log("imageData:", imageData);
  console.log("imageUrl:", imageUrl);

  if (currentFormData.value) {
    // 设置图片ID（数字类型）
    currentFormData.value.image_id = imageData.id;
    // 设置显示用的图片URL
    // @ts-ignore
    currentFormData.value.image = imageUrl;
  }
  showImageSelector.value = false;
};
</script>

<template>
  <PrimeCrudTemplate name="广告管理" identifier="advertisement" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm" :resolver="resolver" :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex flex-column gap-2">
        <FormField v-slot="$field" name="type" class="flex flex-column gap-1">
          <div class="flex  items-center gap-2">
            <label for="query-type" class="text-sm font-medium  ">广告类型</label>
            <Select id="query-type" :options="[
              { label: '全部', value: undefined },
              { label: '轮播图', value: 'carousel' },
              { label: '横幅', value: 'banner' },
              { label: '弹窗', value: 'popup' },
            ]" option-label="label" option-value="value" placeholder="选择广告类型" clearable />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <FormField v-slot="$field" name="position" class="flex flex-column gap-1">
          <div class="flex  items-center gap-2">
            <label for="query-position" class="text-sm font-medium">广告位置</label>
            <Select id="query-position" :options="[
              { label: '全部', value: undefined },
              { label: '首页顶部', value: 'home-top' },
              { label: '首页中部', value: 'home-middle' },
              { label: '侧边栏', value: 'sidebar' },
            ]" option-label="label" option-value="value" placeholder="选择广告位置" clearable />
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

      <Column field="image" header="广告图片" style="width: 120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <img v-if="data.image" :src="getImageUrl(data.image)" :alt="data.title"
              class="w-12 h-12 object-cover rounded-lg border border-gray-200" />
            <div v-else class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-image text-gray-400 text-sm"></i>
            </div>
          </div>
        </template>
      </Column>

      <Column field="title" header="广告标题" style="width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ data.title }}</span>
            <Tag v-if="data.link" value="有链接" severity="info" class="text-xs" />
          </div>
        </template>
      </Column>

      <Column field="type" header="广告类型" style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.type === 'carousel' ? '轮播图' : data.type === 'banner' ? '横幅' : '弹窗'"
            :severity="data.type === 'carousel' ? 'info' : data.type === 'banner' ? 'warning' : 'secondary'" />
        </template>
      </Column>

      <Column field="position" header="广告位置" style="width: 120px">
        <template #body="{ data }">
          <span v-if="data.position" class="text-sm">
            {{ data.position === 'home-top' ? '首页顶部' : data.position === 'home-middle' ? '首页中部' : '侧边栏' }}
          </span>
          <span v-else class="text-gray-400 text-sm">未设置</span>
        </template>
      </Column>

      <Column field="link" header="链接地址" style="width: 200px">
        <template #body="{ data }">
          <div v-if="data.link" class="flex items-center gap-2">
            <a :href="data.link" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm truncate max-w-32"
              v-tooltip.top="data.link">
              {{ data.link }}
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
    <template #CrudForm="{ data, disabled }: { data: ADModel, disabled: boolean }">
      <div class="h-full">
        <!-- 广告标题 -->
        <FormField v-slot="$field" name="title" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">广告标题 *</label>
          <InputText fluid size="small" placeholder="请输入广告标题" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 广告类型 -->
        <FormField v-slot="$field" name="type" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">广告类型 *</label>
          <Select fluid :options="[
            { label: '轮播图', value: 'carousel' },
            { label: '横幅', value: 'banner' },
            { label: '弹窗', value: 'popup' },
          ]" option-label="label" option-value="value" placeholder="请选择广告类型" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 广告位置 -->
        <FormField v-slot="$field" name="position" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">广告位置</label>
          <Select fluid :options="[
            { label: '首页顶部', value: 'home-top' },
            { label: '首页中部', value: 'home-middle' },
            { label: '侧边栏', value: 'sidebar' },
          ]" option-label="label" option-value="value" placeholder="请选择广告位置" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 广告图片 -->
        <FormField v-slot="$field" name="image_id" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">广告图片 *</label>
          <div class="flex flex-col gap-1">
            <InputNumber v-model="data.image_id" fluid placeholder="请输入选择图片" :disabled="true" />
            <!-- 图片选择器 -->
            <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined :disabled="disabled"
              @click="() => { currentFormData = data; showImageSelector = true; }" v-tooltip="'从图片库选择'" />
          </div>
          <!--  @ts-ignore -->
          <div v-if="data.image" class="flex flex-col gap-2 mb-4">
            <img :src="getImageUrl(data.image)" :alt="data.title"
              class="w-24 h-24 object-cover rounded-lg border border-gray-200" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 链接地址 -->
        <FormField v-slot="$field" name="link" class="flex flex-col gap-2 mb-4">
          <label class="text-sm font-medium">链接地址</label>
          <InputText fluid placeholder="请输入链接地址（可选）" :disabled="disabled" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>

        <!-- 时间设置 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormField v-slot="$field" name="startDate" class="flex flex-col gap-2">
            <label class="text-sm font-medium">开始时间</label>
            <DatePicker fluid placeholder="请选择开始时间" :disabled="disabled" showTime hourFormat="24" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>

          <FormField v-slot="$field" name="endDate" class="flex flex-col gap-2">
            <label class="text-sm font-medium">结束时间</label>
            <DatePicker fluid placeholder="请选择结束时间" :disabled="disabled" showTime hourFormat="24" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

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
          <div class="flex align-items-center gap-2">
            <Checkbox :disabled="disabled" inputId="isActive" :binary="true" />
            <label for="isActive">启用广告</label>
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}
          </Message>
        </FormField>
      </div>
    </template>
  </PrimeCrudTemplate>

  <!-- 图片选择器 -->
  <ImageSelector v-model:visible="showImageSelector" category="advertisement" @select="onImageSelected" />
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