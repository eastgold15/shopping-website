<script lang="ts" setup>
import { genPrimeCmsTemplateData } from '@frontend/composables/cms/usePrimeTemplateGen'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import TreeSelect from 'primevue/treeselect'




const $crud = {}

// 使用 PrimeVue 版本的模板数据生成器
const templateData = await genPrimeCmsTemplateData<IMenuModel, IMenuModelQuery, null>({
  // 1. 定义查询表单
  getList: $crud.list,
  create: $crud.create,
  update: $crud.update,
  delete: $crud.delete,

  // 2. 定义初始表格列
  getEmptyModel: () => ({
    id: '1',
    name: '',
    path: '',
    component: '',
    parentId: 0,
    sort: 0,
    icon: '',
    type: 0,
    status: 0,
    remark: '',
    activeMenu: '',
    isExt: false,
  }),

  // 3. 定义删除框标题
  getDeleteBoxTitle(id: string) {
    return `删除菜单${id}`
  },
  getDeleteBoxTitles(ids: Array<string>) {
    return ` 菜单#${ids.join(',')} `
  },

  // 4. 生命周期
  onFetchSuccess: async () => {
    // const permissionStore = useMyPermissionStore()
    // await permissionStore.fetchPermissions()
  },

  // 5. 数据转换
  transformSubmitData: (data, type) => {
    if (type === 'NEW') {
      if (data.parentId === -1) {
        data.parentId = undefined
      }
    }
  },
},
  // 6. 定义查询表单
  {
    name: '',
    page: 1,
    pageSize: 20,
  })

// 等待 templateData 初始化完成
const { tableData, queryForm, fetchList } = templateData

onMounted(async () => {
  await fetchList()
})

// 表单验证规则
const rules = {
  type: [
    { required: true, message: '请选择菜单类型' },
    { validator: (value: number) => [0, 1, 2].includes(value), message: '菜单类型必须是 0（目录）、1（菜单）或 2（权限）' }
  ],
  name: [
    { required: true, message: '请输入名称' },
    { minLength: 2, message: '名称至少2个字符' }
  ],
  path: [
    { required: true, message: '请输入路由地址' }
  ]
}

// 查询表单验证规则
const queryRules = {
  name: [
    { maxLength: 50, message: '名称不能超过50个字符' }
  ],
  path: [
    { maxLength: 100, message: '路径不能超过100个字符' }
  ]
}

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: 0 },
  { label: '菜单', value: 1 },
  { label: '权限', value: 2 }
]

// 状态选项
const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 }
]

// 是否选项
const booleanOptions = [
  { label: '否', value: false },
  { label: '是', value: true }
]

// 计算属性：包含根目录的菜单树
const menuWithRoot = computed(() => ([
  {
    id: -1,
    name: '根目录',
    children: [...tableData.value.items]
  }
]))
</script>

<template>
  <PrimeCrudTemplate name="菜单" identifier="menu" :rules="rules" :query-rules="queryRules" :table-data="tableData"
    :template-data="templateData" :crud-controller="15" :query-form="queryForm">
    <!-- 查询表单 -->
    <template #QueryForm>
      <div class="col-12 md:col-6 lg:col-4">
        <div class="flex flex-column gap-1">
          <label for="query-name" class="text-sm font-medium">菜单名称</label>
          <InputText id="query-name" v-model="queryForm.name" placeholder="搜索菜单名称" />
        </div>
      </div>

      <div class="col-12 md:col-6 lg:col-4">
        <div class="flex flex-column gap-1">
          <label for="query-path" class="text-sm font-medium">路径</label>
          <InputText id="query-path" v-model="queryForm.path" placeholder="搜索路径" />
        </div>
      </div>

      <div class="col-12 md:col-6 lg:col-4">
        <div class="flex flex-column gap-1">
          <label for="query-type" class="text-sm font-medium">类型</label>
          <Select id="query-type" v-model="queryForm.type" :options="menuTypeOptions" option-label="label"
            option-value="value" placeholder="选择菜单类型" clearable />
        </div>
      </div>
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
      <Column field="id" header="序号" style="width: 80px" />
      <Column field="name" header="名称" style="width: 150px" />

      <Column header="图标" style="width: 100px">
        <template #body="{ data }">
          <div class="flex justify-content-center">
            <i :class="data.icon" v-if="data.icon" />
            <span v-else class="text-color-secondary">-</span>
          </div>
        </template>
      </Column>

      <Column header="类型" style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.type === 0 ? '目录' : data.type === 1 ? '菜单' : '权限'"
            :severity="data.type === 0 ? 'warning' : data.type === 2 ? 'danger' : 'success'" />
        </template>
      </Column>

      <Column field="path" header="路由" style="width: 200px" />
      <Column field="component" header="文件路径" style="width: 200px" />

      <Column header="权限标识" style="width: 150px">
        <template #body="{ data }">
          <Tag v-if="data.permission" :value="data.permission" severity="info" />
          <span v-else class="text-color-secondary">-</span>
        </template>
      </Column>

      <Column field="orderNo" header="排序" style="width: 80px" />

      <Column header="路由缓存" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.keepAlive ? '是' : '否'" :severity="data.keepAlive ? 'success' : 'secondary'" />
        </template>
      </Column>

      <Column header="是否显示" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.show ? '显示' : '隐藏'" :severity="data.show ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column header="状态" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.status === 1 ? '启用' : '禁用'" :severity="data.status === 1 ? 'success' : 'danger'" />
        </template>
      </Column>

      <Column field="updatedAt" header="更新时间" style="width: 180px">
        <template #body="{ data }">
          {{ data.updatedAt }}
        </template>
      </Column>
    </template>

    <!-- 表单 -->
    <template #CrudForm="{ data, disabled }">
      <div class="flex flex-column gap-3">
        <!-- 菜单类型 -->
        <div class="flex flex-column gap-1">
          <label class="text-sm font-medium">菜单类型</label>
          <div class="flex gap-4">
            <div v-for="option in menuTypeOptions" :key="option.value" class="flex align-items-center gap-2">
              <RadioButton v-model="data.type" :value="option.value" :disabled="disabled"
                :input-id="`type-${option.value}`" />
              <label :for="`type-${option.value}`">{{ option.label }}</label>
            </div>
          </div>
        </div>

        <!-- 名称 -->
        <div class="flex flex-column gap-1">
          <label :for="`name-${data.id}`" class="text-sm font-medium">
            {{ data.type === 2 ? '权限名称' : '节点名称' }}
          </label>
          <InputText :id="`name-${data.id}`" v-model="data.name"
            :placeholder="data.type === 2 ? '请输入权限名称...' : '请输入节点名称...'" :disabled="disabled" required />
        </div>

        <!-- 上级节点 -->
        <div class="flex flex-column gap-1">
          <label :for="`parent-${data.id}`" class="text-sm font-medium">上级节点</label>
          <TreeSelect :id="`parent-${data.id}`" v-model="data.parentId" :options="menuWithRoot" :disabled="disabled"
            option-label="name" option-value="id" placeholder="请选择上级节点..." class="w-full" />
        </div>

        <!-- 路由地址 -->
        <div v-if="data.type !== 2" class="flex flex-column gap-1">
          <label :for="`path-${data.id}`" class="text-sm font-medium">路由地址</label>
          <InputText :id="`path-${data.id}`" v-model="data.path" placeholder="请输入路由地址..." :disabled="disabled" />
        </div>

        <!-- 权限 -->
        <div v-if="data.type !== 0" class="flex flex-column gap-1">
          <label :for="`permission-${data.id}`" class="text-sm font-medium">权限</label>
          <InputText :id="`permission-${data.id}`" v-model="data.permission" placeholder="请输入权限..."
            :disabled="disabled" />
        </div>

        <!-- 排序优先级 -->
        <div class="flex flex-column gap-1">
          <label :for="`order-${data.id}`" class="text-sm font-medium">排序优先级</label>
          <InputText :id="`order-${data.id}`" v-model="data.orderNo" placeholder="请输入排序优先级..." :disabled="disabled" />
        </div>

        <!-- 是否外链 -->
        <div v-if="data.type !== 2" class="flex flex-column gap-1">
          <label class="text-sm font-medium">是否外链</label>
          <div class="flex gap-4">
            <div v-for="option in booleanOptions" :key="String(option.value)" class="flex align-items-center gap-2">
              <RadioButton v-model="data.isExt" :value="option.value" :disabled="disabled"
                :input-id="`ext-${String(option.value)}-${data.id}`" />
              <label :for="`ext-${String(option.value)}-${data.id}`">{{ option.label }}</label>
            </div>
          </div>
        </div>

        <!-- 是否缓存 -->
        <div v-if="data.type === 1" class="flex flex-column gap-1">
          <label class="text-sm font-medium">是否缓存</label>
          <div class="flex gap-4">
            <div v-for="option in booleanOptions" :key="String(option.value)" class="flex align-items-center gap-2">
              <RadioButton v-model="data.keepAlive" :value="option.value" :disabled="disabled"
                :input-id="`cache-${String(option.value)}-${data.id}`" />
              <label :for="`cache-${String(option.value)}-${data.id}`">{{ option.label }}</label>
            </div>
          </div>
        </div>

        <!-- 是否显示 -->
        <div v-if="data.type !== 2" class="flex flex-column gap-1">
          <label class="text-sm font-medium">是否显示</label>
          <div class="flex gap-4">
            <div v-for="option in booleanOptions" :key="String(option.value)" class="flex align-items-center gap-2">
              <RadioButton v-model="data.show" :value="option.value" :disabled="disabled"
                :input-id="`show-${String(option.value)}-${data.id}`" />
              <label :for="`show-${String(option.value)}-${data.id}`">{{ option.label }}</label>
            </div>
          </div>
        </div>

        <!-- 状态 -->
        <div class="flex flex-column gap-1">
          <label class="text-sm font-medium">状态</label>
          <div class="flex gap-4">
            <div v-for="option in statusOptions" :key="String(option.value)" class="flex align-items-center gap-2">
              <RadioButton v-model="data.status" :value="option.value" :disabled="disabled"
                :input-id="`status-${String(option.value)}-${data.id}`" />
              <label :for="`status-${String(option.value)}-${data.id}`">{{ option.label }}</label>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PrimeCrudTemplate>
</template>

<style scoped>
/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>