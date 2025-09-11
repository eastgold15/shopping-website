<script lang="ts" setup>
import type { PartnerModel, PartnerQuery } from "@backend/modules/partner"
import ImageSelector from "@frontend/components/ImageSelector.vue"
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen"
import { formatDate } from '@frontend/utils/formatUtils'
import { useCmsApi } from "@frontend/utils/handleApi"
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

const $crud = useCmsApi.partner



// 响应式数据
const templateData = await genPrimeCmsTemplateData<PartnerModel, PartnerQuery, null>({
  // 1. 定义查询表单
  getList: $crud.list,
  create: $crud.create,
  update: $crud.update,
  delete: $crud.delete,

  // 2. 定义初始表格列
  getEmptyModel: () => ({
    id: 0,
    name: '',
    description: '',
    image_id: 0,
    selectedImageUrl: '',
    url: '',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  // 3. 定义删除框标题
  getDeleteBoxTitle(id: number) {
    return `删除合作伙伴${id}`
  },
  getDeleteBoxTitles(ids: Array<number>) {
    return ` 合作伙伴#${ids.join(',')} `
  },



  // 5. 数据转换
  transformSubmitData: (data, type) => {
    // 确保数字类型正确
    if (typeof data.sortOrder === 'string') {
      data.sortOrder = parseInt(data.sortOrder) || 0
    }
    if (typeof data.image_id === 'string') {
      data.image_id = parseInt(data.image_id) || 0
    }
    // 移除前端显示用的字段，不提交到后端
    delete data.selectedImageUrl
  },
},
  // 6. 定义查询表单
  {
    name: '',
    isActive: undefined,
    page: 1,
    pageSize: 20,
  })


const { tableData, queryForm, fetchList } = templateData

onMounted(async () => {
  await fetchList()
})
// // 将生成的数据赋值给响应式引用
// templateData.value = generatedData
// tableData.value = generatedData.tableData.value
// queryForm.value = generatedData.queryForm.value

// // 初始化数据
// await generatedData.fetchList()
// const tableData = ref()
// const queryForm = ref<Partial<PartnerQuery>>({
//   page: 1,
//   pageSize: 20



// // 表单验证规则
// const rules = {
//   name: [
//     { required: true, message: '请输入合作伙伴名称' },
//     { minLength: 2, message: '名称至少2个字符' },
//     { maxLength: 100, message: '名称不能超过100个字符' }
//   ],
//   description: [
//     { required: true, message: '请输入合作伙伴描述' },
//     { maxLength: 500, message: '描述不能超过500个字符' }
//   ],
//   image_id: [
//     { required: true, message: '请选择合作伙伴图片' },
//     { type: 'number', message: '图片ID必须为数字' }
//   ],
//   sortOrder: [
//     { required: true, message: '请输入排序权重' },
//     { min: 0, message: '排序权重不能小于0' },
//     { max: 9999, message: '排序权重不能超过9999' }
//   ]
// }

// // 查询表单验证规则
// const queryRules = {
//   name: [
//     { maxLength: 100, message: '搜索名称不能超过100个字符' }
//   ]
// }

// 状态选项
const statusOptions = [
  { label: '全部', value: undefined },
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

// 图片选择相关
const showImageSelector = ref(false)
const currentFormData = ref<any>(null)

const onImageSelected = (imageUrl: string, imageData: any) => {
  if (currentFormData.value) {
    // 设置图片ID（数字类型）
    currentFormData.value.image_id = imageData.id
    // 设置显示用的图片URL
    currentFormData.value.selectedImageUrl = imageUrl
  }
  showImageSelector.value = false
}

// 自定义图片选择组件
const PartnerImageField = defineComponent({
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localImage = ref(props.modelValue)
    const showSelector = ref(false)

    const onImageSelect = (imageUrl: string, imageData: any) => {
      localImage.value = imageUrl
      emit('update:modelValue', imageUrl)
      showSelector.value = false
    }

    return () => h('div', { class: 'flex flex-column gap-2' }, [
      h('label', { class: 'text-sm font-medium' }, '合作伙伴图片 *'),
      h('div', { class: 'flex gap-2' }, [
        h(InputText, {
          modelValue: localImage.value,
          'onUpdate:modelValue': (value: string) => {
            localImage.value = value
            emit('update:modelValue', value)
          },
          placeholder: '请输入图片URL',
          disabled: props.disabled,
          class: 'flex-1'
        }),
        h(Button, {
          label: '选择图片',
          icon: 'pi pi-images',
          severity: 'secondary',
          outlined: true,
          disabled: props.disabled,
          onClick: () => showSelector.value = true
        })
      ]),
      localImage.value && h('div', { class: 'mt-2' }, [
        h('img', {
          src: localImage.value,
          alt: '合作伙伴图片',
          class: 'w-24 h-24 object-cover rounded-lg border border-gray-200'
        })
      ]),
      h(ImageSelector, {
        visible: showSelector.value,
        'onUpdate:visible': (value: boolean) => showSelector.value = value,
        category: 'partner',
        onSelect: onImageSelect
      })
    ])
  }
})
</script>

<template>

  <PrimeCrudTemplate name="合作伙伴" identifier="partner" :table-data="tableData" :template-data="templateData"
    :crud-controller="15" :query-form="queryForm">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="flex gap-2 items-center">
        <label for="query-name" class="text-sm font-medium">合作伙伴名称</label>
        <InputText id="query-name" v-model="queryForm.name" placeholder="搜索合作伙伴名称" />
      </div>
      <div class="flex gap-2 items-center">
        <label for="query-status" class="text-sm font-medium">状态</label>
        <Select id="query-status" v-model="queryForm.isActive" :options="statusOptions" option-label="label"
          option-value="value" placeholder="选择状态" clearable />
      </div>

    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="ID" style="width: 80px" />

      <Column field="image" header="图片" style="width: 120px">
        <template #body="{ data }">
          <div class="flex justify-center">
            <img v-if="data.image" :src="data.image" :alt="data.name"
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
      <div class="flex flex-column gap-3">
        <!-- 合作伙伴名称 -->
        <div class="flex flex-column gap-1">
          <label :for="`name-${data.id}`" class="text-sm font-medium">
            合作伙伴名称 *
          </label>
          <InputText :id="`name-${data.id}`" v-model="data.name" placeholder="请输入合作伙伴名称" :disabled="disabled"
            required />
        </div>

        <!-- 合作伙伴描述 -->
        <div class="flex flex-column gap-1">
          <label :for="`description-${data.id}`" class="text-sm font-medium">
            合作伙伴描述 *
          </label>
          <Textarea :id="`description-${data.id}`" v-model="data.description" placeholder="请输入合作伙伴描述"
            :disabled="disabled" rows="3" required />
        </div>

        <!-- 合作伙伴图片 -->
        <div class="flex flex-column gap-1">
          <label class="text-sm font-medium">合作伙伴图片 *</label>
          <div class="flex gap-2">
            <InputText :value="data.url || ''" placeholder="请选择图片" :disabled="true" class="flex-1" readonly />
            <!-- 图片选择器 -->
            <Button label="选择图片" icon="pi pi-images" severity="secondary" outlined :disabled="disabled"
              @click="() => { currentFormData = data; showImageSelector = true; }" v-tooltip="'从图片库选择'" />
          </div>
          <div v-if="data.url" class="mt-2">
            <img :src="data.url" :alt="data.name" class="w-24 h-24 object-cover rounded-lg border border-gray-200" />
          </div>
        </div>

        <!-- 网站链接 -->
        <div class="flex flex-column gap-1">
          <label :for="`url-${data.id}`" class="text-sm font-medium">
            网站链接
          </label>
          <InputText :id="`url-${data.id}`" v-model="data.url" placeholder="请输入网站链接（可选）" :disabled="disabled" />
        </div>

        <!-- 排序权重 -->
        <div class="flex flex-column gap-1">
          <label :for="`sortOrder-${data.id}`" class="text-sm font-medium">
            排序权重 *
          </label>
          <InputNumber :id="`sortOrder-${data.id}`" v-model="data.sortOrder" placeholder="请输入排序权重" :disabled="disabled"
            :min="0" :max="9999" class="w-full" required />
        </div>

        <!-- 启用状态 -->
        <div class="flex flex-column gap-1">
          <label class="text-sm font-medium">启用状态</label>
          <div class="flex gap-4">
            <div class="flex align-items-center gap-2">
              <RadioButton v-model="data.isActive" :value="true" :disabled="disabled" input-id="active-true" />
              <label for="active-true">启用</label>
            </div>
            <div class="flex align-items-center gap-2">
              <RadioButton v-model="data.isActive" :value="false" :disabled="disabled" input-id="active-false" />
              <label for="active-false">禁用</label>
            </div>
          </div>
        </div>
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