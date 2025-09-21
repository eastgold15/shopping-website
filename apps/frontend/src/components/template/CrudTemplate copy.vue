<script lang="ts" setup>
import type { PartnerlFormDto, PartnersListVo, SelectImagesVo } from "@backend/types";
import type { CrudMode } from "@frontend/types/prime-cms";
import { formatDate } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import type { FormInstance, FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import type { TForm } from "elysia/type-system/types";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, toRaw } from "vue";
import z from "zod/v4";
import { genPrimeCmsTemplateData } from "./usePrimeTemplateGen";


const $crud = useCmsApi().partner;
const toast = useToast();

// 定义组件名称和控制器权限
const name = "合作伙伴";
const crudController = 15;
const disabled = false;

// 使用zod定义表单验证schema
const partnerSchema = z.object({
  name: z.string().min(2, "名称至少2个字符").max(100, "名称不能超过100个字符"),
  description: z
    .string()
    .min(1, "请输入合作伙伴描述"),
  sortOrder: z
    .number()
    .min(0, "排序权重不能小于0")
    .max(9999, "排序权重不能超过9999"),
  url: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  isActive: z.boolean(),
  images: z.array(z.object({
    id: z.number(),
    imageUrl: z.string(),
    fileName: z.string(),
    category: z.string(),
    isMain: z.boolean().optional()
  })).optional(),
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
    // @ts-ignore
    delete: $crud.delete,

    // 2. 定义初始表格列 初始值
    getEmptyModel: () => ({
      "id": 0,
      "name": "string",
      "description": "string",
      "url": "string",
      "sortOrder": 0,
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string",
      "images": [
        {
          "isMain": true,
          "id": 0,
          "imageUrl": "string",
          "fileName": "string",
          "category": "string"
        }
      ]
    }),
    // 3. 定义删除框标题
    getDeleteBoxTitle(id: number) {
      return `删除合作伙伴${id}`;
    },
    getDeleteBoxTitles(ids: Array<number>) {
      return ` 合作伙伴#${ids.join(",")} `;
    },
    // 5. 数据转换
    transformSubmitData: (data: any, mode: CrudMode) => {
      // 确保数字类型正确
      if (typeof data.sortOrder === "string") {
        const parsed = parseInt(data.sortOrder, 10);
        data.sortOrder = isNaN(parsed) ? 0 : parsed;
      }

      // 从images数组中提取主图片ID
      if (data.images && data.images.length > 0) {
        const mainImage = data.images.find((img: any) => img.isMain) || data.images[0];
        data.image_id = mainImage.id;
      } else {
        data.image_id = -1;
      }

      // @ts-ignore
      delete data.createdAt
      // @ts-ignore
      delete data.updatedAt
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

const { tableData, queryForm, fetchList, FormSearch,
  formLoading,
  handleCrudDialog,
  crudDialogOptions,
  resetForm,
  handleDeletes
} = templateData;

// 状态选项
const statusOptions = [
  { label: "全部", value: undefined },
  { label: "启用", value: true },
  { label: "禁用", value: false },
];


// 图片选择器相关
const imageSelectorVisible = ref(false);

// 打开图片选择器
const openImageSelector = () => {
  imageSelectorVisible.value = true;
};

// 选择图片回调 - 直接绑定到表单的images字段
const handleImageSelect = (selectedImages: SelectImagesVo[]) => {
  console.log('选中的图片:', selectedImages);
  // 更新表单数据中的images字段
  if (crudDialogOptionsRef.value?.data) {
    // 为选中的图片添加isMain标记
    const imagesWithMain = selectedImages.map((img, index) => ({
      ...img,
      isMain: index === 0 // 第一张设为主图
    }));

    crudDialogOptionsRef.value.data.images = imagesWithMain;
  }
};

// 为 crudDialogOptions 添加类型注解
const crudDialogOptionsRef = crudDialogOptions;

// 计算当前表单中的图片数据
const currentFormImages = computed(() => {
  const formData = crudDialogOptionsRef.value?.data;
  return formData?.images || [];
});

// 计算主图片用于显示
const mainImageForDisplay = computed(() => {
  const images = currentFormImages.value;
  if (images.length === 0) return null;
  // 找到主图或第一张图
  // @ts-ignore
  return images.find(img => img.isMain) || images[0];
});

const _crudController = computed(() => crudController || 15);

// 表单引用
const queryFormRef = ref<FormInstance | null>(null);
const drawerFormRef = ref<FormInstance | null>(null);

// 分页配置
const paginationOptions = computed(() => ({
  first: (tableData.value.meta.page - 1) * tableData.value.meta.limit,
  rows: tableData.value.meta.limit,
  totalRecords: tableData.value.meta.total,
  rowsPerPageOptions: [20, 30, 50, 100],
}));

// 分页事件处理
const onPageChange = (event: { first: number; rows: number }) => {
  tableData.value.meta.page = Math.floor(event.first / event.rows) + 1;
  tableData.value.meta.limit = event.rows;
  fetchList()
};

// 查询表单提交处理
const onQueryFormSubmit = async (event: FormSubmitEvent) => {
  if (event.valid) {
    await FormSearch(queryFormRef.value);
  } else {
    toast.add({
      severity: "error",
      summary: "查询表单验证失败",
      detail: "请检查输入内容",
      life: 3000,
    });
  }
};

// 表单提交处理
const onFormSubmit = async (event: FormSubmitEvent) => {
  if (event.valid) {
    try {
      crudDialogOptionsRef.value.loading = true;

      const formData = event.values as TForm;

      // 获取当前表单数据
      const currentData = crudDialogOptionsRef.value.data || {};
      const submitData = { ...currentData, ...formData } as TForm;

      // 转换提交数据
      if (templateData.transformSubmitData) {
        templateData.transformSubmitData(
          submitData,
          crudDialogOptionsRef.value.mode,
        );
      }

      // 提交数据
      const rawSubmitData = toRaw(submitData) as TForm;
      let res;

      if (crudDialogOptionsRef.value.mode === "EDIT") {
        // 对于编辑操作，需要从表格数据中获取ID
        // @ts-ignore
        const tableItem = tableData.value.items.flat().find(item => item.id === (currentData as any).id);
        res = await templateData.update(
          (tableItem as unknown as any).id!,
          rawSubmitData,
        );
        console.log("res", res);
        if (res.code === 200) {
          toast.add({
            severity: "success",
            summary: "修改成功",
            detail: "数据已成功修改",
            life: 3000,
          });
        } else {
          toast.add({
            severity: "error",
            summary: "修改失败",
            detail: res.message ?? "修改失败！",
            life: 3000,
          });
        }
      } else {
        // 对于新建操作，需要移除id字段（如果存在）
        const { id, ...createData } = rawSubmitData;
        res = await templateData.create(createData as Omit<TForm, "id">);
        console.log("res", res);
        if (res.code === 201) {
          toast.add({
            severity: "success",
            summary: "添加成功",
            detail: "数据已成功添加",
            life: 3000,
          });
        } else {
          toast.add({
            severity: "error",
            summary: "添加失败",
            detail: res.message ?? "添加失败！",
            life: 3000,
          });
        }
      }

      // 统一处理成功后的逻辑
      if (res?.code === 200 || res?.code === 201) {
        crudDialogOptionsRef.value.visible = false;
        await fetchList();
      }
    } catch (error) {
      console.error("表单提交失败:", error);
      toast.add({
        severity: "error",
        summary: "提交失败",
        detail: "表单提交失败，请稍后重试",
        life: 3000,
      });
    } finally {
      crudDialogOptionsRef.value.loading = false;
    }
  } else {
    toast.add({
      severity: "error",
      summary: "表单验证失败",
      detail: "请检查输入内容",
      life: 3000,
    });
  }
};

// 组件挂载时自动加载数据
onMounted(async () => {
  await fetchList();
  // await loadImages();
});

</script>

<template>
  <div class="prime-crud-template">
    <!-- 查询表单区域 -->
    <Panel header="查询条件" class="mb-4">
      <Form ref="queryFormRef" :initialValues="queryForm" :resolver="queryResolver" @submit="onQueryFormSubmit">
        <div class="md:flex md:justify-between md:items-center ">
          <div class="md:flex md:items-center  gap-4">
            <div class="flex flex-column gap-2">
              <FormField v-slot="$field" name="name" class="flex flex-column gap-1">
                <div class="flex  items-center gap-2">
                  <label for="query-name" class="text-sm font-medium  ">合作伙伴名称</label>
                  <InputText id="query-name" placeholder="搜索合作伙伴名称" />
                </div>
                <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
                  $field.error?.message }}
                </Message>
              </FormField>

              <FormField v-slot="$field" name="isActive" class="flex flex-column gap-1">
                <div class="flex  items-center gap-2">
                  <label for="query-status" class="text-sm font-medium">状态</label>
                  <Select id="query-status" :options="statusOptions" option-label="label" option-value="value"
                    placeholder="选择状态" clearable />
                </div>
                <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
                  $field.error?.message }}
                </Message>
              </FormField>
            </div>
          </div>
          <div>
            <slot name="QueryFormAction">
              <div class=" md:col-auto">
                <div class="flex gap-2">
                  <Button class="md:w-22  " label="重置" icon="pi pi-refresh" severity="secondary"
                    @click="resetForm(queryFormRef)" />
                  <Button class="w-22" label="查询" icon="pi pi-search" :loading="formLoading"
                    @click="queryFormRef?.submit?.()" />
                  <Button class="w-42" :label="`新建${name}`" icon="pi pi-plus" severity="success"
                    @click="handleCrudDialog(null, 'NEW')" />
                </div>
              </div>
            </slot>
          </div>
        </div>
      </Form>
    </Panel>

    <!-- 表格区域 -->
    <Panel header="数据列表" class="mb-4">
      <DataTable :value="tableData.items" :loading="formLoading" dataKey="id" stripedRows showGridlines
        responsiveLayout="scroll" class="p-datatable-sm">
        <Column field="id" header="ID" style="width: 80px">
          <template #filterapply="slotProps"></template>
        </Column>

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

        <slot name="TableColumnAction">
          <Column header="操作" :frozen="true" alignFrozen="right" style="min-width: 250px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button v-if="_crudController & 2" icon="pi pi-eye" severity="info" size="small" v-tooltip="'详情'"
                  @click="handleCrudDialog(data, 'READ')" />
                <Button v-if="_crudController & 4" icon="pi pi-pencil" severity="warning" size="small" v-tooltip="'编辑'"
                  @click="handleCrudDialog(data, 'EDIT')" />
                <Button v-if="_crudController & 8" icon="pi pi-trash" severity="danger" size="small" v-tooltip="'删除'"
                  @click="handleDeletes([data.id])" />
              </div>
            </template>
          </Column>
        </slot>
      </DataTable>

      <!-- 分页器 (仅在非树形表格时显示) -->
      <Paginator v-if="tableData && tableData.meta.total > 0" :first="paginationOptions.first"
        :rows="paginationOptions.rows" :totalRecords="paginationOptions.totalRecords"
        :rowsPerPageOptions="paginationOptions.rowsPerPageOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="显示 {first} 到 {last} 条，共 {totalRecords} 条记录" @page="onPageChange" class="mt-4" />
    </Panel>

    <!-- 侧边栏对话框 -->
    <Drawer v-model:visible="crudDialogOptionsRef.visible" position="right" class="w-full !md:w-30rem  h-screen"
      :modal="true">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-user"></i>
          <span class="font-bold">
            <span v-if="crudDialogOptionsRef.mode === 'NEW'">新建</span>
            <span v-else-if="crudDialogOptionsRef.mode === 'EDIT'">编辑</span>
            <span v-else-if="crudDialogOptionsRef.mode === 'READ'">查看</span>
            {{ name }}信息
          </span>
          <Tag v-if="crudDialogOptionsRef.data" :value="`#${(crudDialogOptionsRef.data as PartnersListVo).id}`"
            severity="secondary" class="ml-2" />
        </div>
      </template>

      <div class="flex justify-center">
        <Form v-slot="$form" unstyled v-if="crudDialogOptionsRef.data" ref="drawerFormRef"
          :initialValues="crudDialogOptionsRef.data" :value="crudDialogOptionsRef.data" :resolver="resolver"
          @submit="onFormSubmit" class="w-full flex flex-col gap-4 ">
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
              <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined @click="openImageSelector" />

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

          <div class="flex gap-2 justify-content-end">
            <div class="flex gap-2 justify-content-end">
              <slot name="CrudFormAction">
                <template v-if="crudDialogOptionsRef.mode === 'READ'">
                  <Button label="关闭" icon="pi pi-times" severity="secondary"
                    @click="crudDialogOptionsRef.visible = false" />
                </template>
                <template v-else>
                  <Button label="取消" icon="pi pi-times" severity="secondary"
                    @click="crudDialogOptionsRef.visible = false" />
                  <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetForm(drawerFormRef)" />
                  <Button type="submit" :label="crudDialogOptionsRef.mode !== 'NEW' ? '修改' : '新增'" icon="pi pi-check"
                    :loading="crudDialogOptionsRef.loading" />
                </template>
              </slot>
            </div>
          </div>
        </Form>
      </div>


    </Drawer>

  </div>
</template>

<style scoped>
/* 表格行悬停效果 */
:deep(.p-datatable-row:hover .image-preview-container) {
  transform: scale(1.05);
}

/* 图片选择器按钮样式优化 */
.image-selector-button {
  transition: all 0.3s ease;
}

.image-selector-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 表单中图片预览优化 */
.form-image-preview {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-image-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>