<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { client } from '@/share/useTreaty'
import ImageSelector from '@/app/components/ImageSelector.vue'

// 类型定义
interface Partner {
    id: number
    name: string
    description: string
    image: string
    url: string
    sortOrder: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

interface PartnerForm {
    name: string
    description: string
    image: string
    url: string
    sortOrder: number
    isActive: boolean
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const partners = ref<Partner[]>([])
const selectedPartners = ref<Partner[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('sortOrder')
const sortOrder = ref(1) // 1 for asc, -1 for desc
const searchKeyword = ref('')
const filterStatus = ref('all')
const showCreateDialog = ref(false)
const editingPartner = ref<Partner | null>(null)
const showImageSelector = ref(false)

// 表单数据
const partnerForm = ref<PartnerForm>({
    name: '',
    description: '',
    image: '',
    url: '',
    sortOrder: 0,
    isActive: true
})

// 状态选项
const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '启用', value: true },
    { label: '禁用', value: false }
]

// 工具函数
const confirm = useConfirm()
const toast = useToast()

// 计算属性
const isFormValid = computed(() => {
    return partnerForm.value.name.trim() &&
        partnerForm.value.description.trim() &&
        partnerForm.value.image.trim()
})

// 图片选择相关方法
const openImageSelector = () => {
    showImageSelector.value = true
}

const onImageSelected = (imageUrl: string, imageData: any) => {
    partnerForm.value.image = imageUrl
    showImageSelector.value = false
    toast.add({
        severity: 'success',
        summary: '图片选择成功',
        detail: `已选择图片: ${imageData.fileName}`,
        life: 2000
    })
}

// 方法
const loadPartners = async () => {
    try {
        loading.value = true
        const params = {
            page: page.value,
            pageSize: pageSize.value,
            sortBy: sortField.value,
            sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
            search: searchKeyword.value || undefined,
            isActive: filterStatus.value !== 'all' ? filterStatus.value : undefined
        }

        const response = await client.api.partners.get({ query: params })

        if (response.data && response.data.code === 200) {
            // 处理分页数据结构 {items: [], meta: {total: number}}
            const responseData = response.data.data
            if (responseData && typeof responseData === 'object') {
                if (Array.isArray(responseData.items)) {
                    partners.value = responseData.items
                    total.value = responseData.meta?.total || 0
                } else if (Array.isArray(responseData)) {
                    // 兼容直接返回数组的情况
                    partners.value = responseData
                    total.value = response.data.total || responseData.length
                } else {
                    console.error('API返回的数据格式不正确:', responseData)
                    partners.value = []
                    total.value = 0
                    toast.add({ severity: 'error', summary: '错误', detail: '数据格式错误', life: 1000 })
                }
            } else {
                partners.value = []
                total.value = 0
            }
        } else {
            console.error('API返回的数据格式错误:', response.data)
            partners.value = []
            total.value = 0
            toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '加载合作伙伴失败', life: 1000 })
        }
    } catch (error) {
        console.error('加载合作伙伴失败:', error)
        partners.value = []
        total.value = 0
        toast.add({ severity: 'error', summary: '错误', detail: '加载合作伙伴失败', life: 1000 })
    } finally {
        loading.value = false
    }
}

// 分页处理
const onPage = (event: any) => {
    page.value = event.page + 1 // DataTable的page从0开始，API从1开始
    pageSize.value = event.rows
    loadPartners()
}

// 排序处理
const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    loadPartners()
}

// 搜索处理
const handleSearch = () => {
    page.value = 1
    loadPartners()
}

// 筛选处理
const handleFilter = () => {
    page.value = 1
    loadPartners()
}

// 显示编辑对话框
const showEditDialog = (partner: Partner) => {
    editingPartner.value = partner
    partnerForm.value = {
        name: partner.name,
        description: partner.description,
        image: partner.image,
        url: partner.url,
        sortOrder: partner.sortOrder,
        isActive: partner.isActive
    }
    showCreateDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
    showCreateDialog.value = false
    editingPartner.value = null
    partnerForm.value = {
        name: '',
        description: '',
        image: '',
        url: '',
        sortOrder: 0,
        isActive: true
    }
}

// 保存合作伙伴
const savePartner = async () => {
    if (!isFormValid.value) {
        toast.add({ severity: 'warn', summary: '警告', detail: '请填写必填字段', life: 1000 })
        return
    }

    try {
        saving.value = true

        if (editingPartner.value) {
            // 更新
            const response = await client.api.partners[editingPartner.value.id.toString()].put(partnerForm.value)
            if (response.data && response.data.code === 200) {
                toast.add({ severity: 'success', summary: '成功', detail: '更新合作伙伴成功', life: 1000 })
                closeDialog()
                loadPartners()
            } else {
                toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '更新合作伙伴失败', life: 1000 })
            }
        } else {
            // 创建
            const response = await client.api.partners.post(partnerForm.value)
            if (response.data && response.data.code === 200) {
                toast.add({ severity: 'success', summary: '成功', detail: '创建合作伙伴成功', life: 1000 })
                closeDialog()
                loadPartners()
            } else {
                toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '创建合作伙伴失败', life: 1000 })
            }
        }
    } catch (error) {
        console.error('保存合作伙伴失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '保存合作伙伴失败', life: 1000 })
    } finally {
        saving.value = false
    }
}

// 确认删除
const confirmDelete = (partner: Partner) => {
    confirm.require({
        message: `确定要删除合作伙伴 "${partner.name}" 吗？`,
        header: '删除确认',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deletePartner(partner.id)
    })
}

// 删除合作伙伴
const deletePartner = async (id: number) => {
    try {
        const response = await client.api.partners[id.toString()].delete()
        if (response.data && response.data.code === 200) {
            toast.add({ severity: 'success', summary: '成功', detail: '删除合作伙伴成功', life: 1000 })
            loadPartners()
        } else {
            toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '删除合作伙伴失败', life: 1000 })
        }
    } catch (error) {
        console.error('删除合作伙伴失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '删除合作伙伴失败', life: 1000 })
    }
}

// 切换启用状态
const toggleActive = async (partner: Partner) => {
    try {
        const response = await client.api.partners[partner.id.toString()]['toggle-active'].patch()
        if (response.data && response.data.code === 200) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `${partner.isActive ? '启用' : '禁用'}合作伙伴成功`
            })
            loadPartners()
        } else {
            // 回滚状态
            partner.isActive = !partner.isActive
            toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '切换状态失败', life: 1000 })
        }
    } catch (error) {
        // 回滚状态
        partner.isActive = !partner.isActive
        console.error('切换状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '切换状态失败', life: 1000 })
    }
}

// 更新排序
const updateSort = async (partner: Partner) => {
    try {
        const response = await client.api.partners[partner.id.toString()].sort.patch({
            sortOrder: partner.sortOrder
        })
        if (response.data && response.data.code === 200) {
            toast.add({ severity: 'success', summary: '成功', detail: '更新排序成功', life: 1000 })
            loadPartners()
        } else {
            toast.add({ severity: 'error', summary: '错误', detail: response.data?.message || '更新排序失败', life: 1000 })
            loadPartners() // 重新加载以恢复原始值
        }
    } catch (error) {
        console.error('更新排序失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '更新排序失败', life: 1000 })
        loadPartners() // 重新加载以恢复原始值
    }
}

// 批量切换状态
const batchToggleActive = async (isActive: boolean) => {
    if (!selectedPartners.value.length) {
        toast.add({ severity: 'warn', summary: '警告', detail: '请先选择要操作的合作伙伴', life: 1000 })
        return
    }

    confirm.require({
        message: `确定要${isActive ? '启用' : '禁用'}选中的 ${selectedPartners.value.length} 个合作伙伴吗？`,
        header: '批量操作确认',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const promises = selectedPartners.value.map(partner =>
                    client.api.partners[partner.id.toString()]['toggle-active'].patch()
                )

                await Promise.all(promises)
                toast.add({
                    severity: 'success',
                    summary: '成功',
                    detail: `批量${isActive ? '启用' : '禁用'}合作伙伴成功`
                })
                selectedPartners.value = []
                loadPartners()
            } catch (error) {
                console.error('批量操作失败:', error)
                toast.add({ severity: 'error', summary: '错误', detail: '批量操作失败', life: 1000 })
            }
        }
    })
}

// 格式化日期
const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 获取合作伙伴详情
const getPartner = async (id: number) => {
    try {
        const response = await client.api.partners[id.toString()].get()
        if (response.data && response.data.code === 200) {
            return response.data.data
        }
        return null
    } catch (error) {
        console.error('获取合作伙伴详情失败:', error)
        return null
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadPartners()
})
</script>
<template>
    <div class="partners-management">
        <!-- 页面标题和操作栏 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">合作伙伴管理</h1>
                    <p class="text-gray-600 mt-1">管理网站合作伙伴信息，支持排序和显示控制</p>
                </div>
                <Button label="新增合作伙伴" icon="pi pi-plus" @click="showCreateDialog = true" class="p-button-success" />
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-3">
                    <Button label="刷新" icon="pi pi-refresh" @click="loadPartners" class="p-button-outlined"
                        size="small" />
                    <Button label="批量启用" icon="pi pi-check" @click="batchToggleActive(true)" class="p-button-outlined"
                        size="small" :disabled="!selectedPartners.length" />
                    <Button label="批量禁用" icon="pi pi-times" @click="batchToggleActive(false)" class="p-button-outlined"
                        size="small" :disabled="!selectedPartners.length" />
                </div>
                <div class="flex gap-3">
                    <InputText v-model="searchKeyword" placeholder="搜索合作伙伴名称..." class="w-64" @input="handleSearch" />
                    <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选状态" class="w-32" @change="handleFilter" />
                </div>
            </div>
        </div>

        <!-- 合作伙伴数据表格 -->
        <div class="table-section">
            <DataTable :value="partners" tableStyle="min-width: 50rem" :loading="loading"
                v-model:selection="selectedPartners" dataKey="id" paginator :rows="pageSize"
                :rowsPerPageOptions="[5, 10, 20, 50]" :totalRecords="total" :lazy="true" @page="onPage" @sort="onSort"
                :sortField="sortField" :sortOrder="sortOrder" :first="(page - 1) * pageSize" class="p-datatable-sm"
                showGridlines responsiveLayout="scroll" selectionMode="multiple" :metaKeySelection="false">

                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">合作伙伴管理</span>
                        <Button icon="pi pi-refresh" rounded raised />
                    </div>
                </template>
                <!-- 选择列 -->
                <Column selectionMode="multiple" style="width: 2%"></Column>

                <!-- 合作伙伴图片列 -->
                <Column field="image" header="图片" style="width: 10%">
                    <template #body="{ data }">
                        <div class="flex justify-center">
                            <img v-if="data.image" :src="data.image" :alt="data.name"
                                class="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                            <div v-else class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <i class="pi pi-image text-gray-400 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- 合作伙伴名称列 -->
                <Column field="name" header="合作伙伴名称" sortable style="width: 10%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <span class="font-medium">{{ data.name }}</span>
                            <Tag v-if="data.url" value="有链接" severity="info" class="text-xs" />
                        </div>
                    </template>
                </Column>

                <!-- 描述列 -->
                <Column field="description" header="描述" style="width: 10%">
                    <template #body="{ data }">
                        <span class="text-gray-600 text-sm line-clamp-2">{{ data.description || '-' }}</span>
                    </template>
                </Column>

                <!-- 网站链接列 -->
                <Column field="url" header="网站链接" style="width: 10%">
                    <template #body="{ data }">
                        <div v-if="data.url" class="flex items-center gap-2">
                            <a :href="data.url" target="_blank"
                                class="text-blue-600 hover:text-blue-800 text-sm truncate max-w-32"
                                v-tooltip.top="data.url">
                                {{ data.url }}
                            </a>
                            <i class="pi pi-external-link text-gray-400 text-xs"></i>
                        </div>
                        <span v-else class="text-gray-400 text-sm">-</span>
                    </template>
                </Column>

                <!-- 排序列 -->
                <Column field="sortOrder" header="排序" sortable style="width: 10%">
                    <template #body="{ data }">
                        <InputNumber v-model="data.sortOrder" :min="0" :max="999" size="small"
                            @blur="updateSort(data)" />
                    </template>
                </Column>

                <!-- 状态列 -->
                <Column field="isActive" header="状态" style="width: 10%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <ToggleSwitch v-model="data.isActive" @change="toggleActive(data)" class="scale-90" />
                            <Tag :value="data.isActive ? '启用' : '禁用'"
                                :severity="data.isActive ? 'success' : 'secondary'" class="text-xs px-2 py-1" />
                        </div>
                    </template>
                </Column>

                <!-- 创建时间列 -->
                <Column field="createdAt" header="创建时间" sortable  style="width: 10%">
                    <template #body="{ data }">
                        <span class="text-gray-500 text-sm">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <!-- 操作列 -->
                <Column header="操作" style="width: 10%">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" @click="showEditDialog(data)"
                                class="p-button-warning p-button-sm" v-tooltip.top="'编辑'" />
                            <Button icon="pi pi-trash" @click="confirmDelete(data)" class="p-button-danger p-button-sm"
                                v-tooltip.top="'删除'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 创建/编辑合作伙伴对话框 -->
        <Dialog v-model:visible="showCreateDialog" :header="editingPartner ? '编辑合作伙伴' : '新增合作伙伴'" :modal="true"
            :closable="true" class="w-[500px]">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">合作伙伴名称 *</label>
                    <InputText v-model="partnerForm.name" placeholder="请输入合作伙伴名称" class="w-full"
                        :class="{ 'p-invalid': !partnerForm.name }" />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">合作伙伴描述 *</label>
                    <Textarea v-model="partnerForm.description" placeholder="请输入合作伙伴描述" rows="3" class="w-full"
                        :class="{ 'p-invalid': !partnerForm.description }" />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">合作伙伴图片 *</label>
                    <div class="flex gap-2">
                        <InputText v-model="partnerForm.image" placeholder="请输入图片URL" class="flex-1"
                            :class="{ 'p-invalid': !partnerForm.image }" />
                        <Button 
                            icon="pi pi-images" 
                            label="选择图片" 
                            @click="openImageSelector" 
                            class="p-button-outlined"
                            v-tooltip="'从图片库选择'"
                        />
                    </div>
                    <div v-if="partnerForm.image" class="mt-2">
                        <img :src="partnerForm.image" :alt="partnerForm.name"
                            class="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">网站链接</label>
                    <InputText v-model="partnerForm.url" placeholder="请输入网站链接（可选）" class="w-full" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">排序权重</label>
                        <InputNumber v-model="partnerForm.sortOrder" :min="0" :max="9999" placeholder="排序值"
                            class="w-full" />
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center gap-2">
                            <Checkbox v-model="partnerForm.isActive" :binary="true" />
                            <span class="text-sm font-medium">启用状态</span>
                        </label>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="取消" @click="closeDialog" class="p-button-text" />
                    <Button :label="editingPartner ? '更新' : '创建'" @click="savePartner" class="p-button-success"
                        :loading="saving" :disabled="!isFormValid" />
                </div>
            </template>
        </Dialog>

        <!-- 删除确认对话框 -->
        <ConfirmDialog />

        <!-- 图片选择器 -->
        <ImageSelector 
            v-model:visible="showImageSelector"
            category="category"
            @select="onImageSelected"
        />
    </div>
</template>

<style scoped>
/* 自定义样式优化 */
.partners-management {
    @apply bg-white rounded-lg shadow-sm;
}

.header-section {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b border-gray-200;
}

.table-section {
    @apply p-6;
}

/* DataTable 样式优化 */
:deep(.p-datatable) {
    @apply border border-gray-200 rounded-lg overflow-hidden;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-50 text-gray-700 font-semibold border-b border-gray-200;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    @apply hover:bg-blue-50 transition-colors duration-200;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    @apply border-b border-gray-100 py-3;
}

/* InputNumber 样式优化 */
:deep(.p-inputnumber) {
    @apply rounded-md;
}

:deep(.p-inputnumber .p-inputnumber-input) {
    @apply text-center;
}

/* InputSwitch 样式优化 */
:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
    @apply bg-green-500;
}

/* Tag 样式优化 */
:deep(.p-tag) {
    @apply font-medium;
}

/* Button 样式优化 */
:deep(.p-button-sm) {
    @apply shadow-sm;
}

/* Dialog 样式优化 */
:deep(.p-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200;
}

:deep(.p-dialog .p-dialog-content) {
    @apply bg-white;
}

/* 文本截断样式 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
