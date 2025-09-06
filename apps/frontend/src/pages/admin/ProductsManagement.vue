<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Image from 'primevue/image'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Category } from '@/app/types/category'
import type { Product, ProductForm } from '@/app/types/product'
import { client } from '@/share/useTreaty'
import ImageSelector from '@/app/components/ImageSelector.vue'
import { handleApiRes } from '@/app/utils/handleApi'


// 响应式数据
const loading = ref(false)
const saving = ref(false)
const products = ref<Product[]>([])
const selectedProducts = ref<Product[]>([])
const categories = ref<Category[]>([])
// 初始化元数据 页码
const initMeta = ref({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
})
const sortField = ref('createdAt')
const sortOrder = ref(-1) // 1 for asc, -1 for desc
const searchKeyword = ref('')
const filterCategory = ref<number | null>(null)
const filterStatus = ref('all')
const showCreateDialog = ref(false)
const editingProduct = ref<Product | null>(null)
const showImageSelector = ref(false)

// 表单数据
const productForm = ref<ProductForm>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    cost: 0,
    sku: '',
    barcode: '',
    weight: 0,
    dimensions: null,
    images: [],
    videos: [],
    colors: [],
    sizes: [],
    materials: [],
    careInstructions: '',
    features: null,
    specifications: null,
    categoryId: null,
    stock: 0,
    minStock: 0,
    isActive: true,
    isFeatured: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
})

// 选项数据
const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '上架', value: true },
    { label: '下架', value: false }
]

const availableTags = ref([
    '热销', '新品', '推荐', '限时优惠', '包邮', '精选'
])

// 工具函数
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// 计算属性
const isFormValid = computed(() => {
    return productForm.value.name.trim() &&
        productForm.value.slug.trim() &&
        productForm.value.description.trim() &&
        productForm.value.shortDescription.trim() &&
        productForm.value.price > 0 &&
        productForm.value.stock >= 0 &&
        productForm.value.sku.trim() &&
        productForm.value.categoryId !== null
})

const categoryOptions = computed(() => {
    return categories.value.map(cat => ({
        label: cat.name,
        value: cat.id
    }))
})

const tagOptions = computed(() => {
    return availableTags.value.map(tag => ({
        label: tag,
        value: tag
    }))
})

// 方法
const loadProducts = async () => {
    try {
        loading.value = true
        const params = {
            page: initMeta.value.page,
            pageSize: initMeta.value.pageSize,
            sortBy: sortField.value,
            sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
            categoryId: filterCategory.value || undefined,
            isActive: filterStatus.value !== 'all' ? filterStatus.value : undefined
        }
        // 添加搜索参数
        if (searchKeyword.value) {
            params.search = searchKeyword.value
        }
        const { data: response } = await client.api.products.get({ query: params })
        if (response.code === 200) {
            const data = response.data
            // 根据新的API返回格式，直接从data中获取商品数据
            products.value = data.items || []
            initMeta.value = data.meta
            console.log("init", products.value, initMeta.value)
        } else {
            throw new Error(response.message || '获取商品列表失败')
        }

    } catch (error) {
        console.error('加载商品失败:', error)
        products.value = []
        initMeta.value.total = 0
        toast.add({ severity: 'error', summary: '错误', detail: '加载商品失败', life: 1000 })
    } finally {
        loading.value = false
    }
}

const loadCategories = async () => {
    try {
        const { data: response } = await client.api.categories.get()

        if (response.code === 200) {
            categories.value = response.data || []
        } else {
            throw new Error(response.message || '获取分类列表失败')
        }
    } catch (error) {
        console.error('加载分类失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '加载分类失败', life: 1000 })
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadCategories()
    loadProducts()
})

// 分页处理
const onPage = (event: any) => {
    initMeta.value.page = event.page + 1
    initMeta.value.pageSize = event.rows
    loadProducts()
}

// 排序处理
const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    loadProducts()
}

// 搜索处理
const handleSearch = (searchTerm?: string) => {
    if (searchTerm !== undefined) {
        searchKeyword.value = searchTerm
    }
    initMeta.value.page = 1
    loadProducts()
}

// 筛选处理
const handleFilter = (filters?: any) => {
    if (filters) {
        if (filters.category !== undefined) {
            filterCategory.value = filters.category
        }
        if (filters.status !== undefined) {
            filterStatus.value = filters.status
        }
    }
    initMeta.value.page = 1
    loadProducts()
}

// 显示编辑对话框
const showEditDialog = (product: Product) => {
    editingProduct.value = product
    productForm.value = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        comparePrice: product.comparePrice,
        cost: product.cost,
        sku: product.sku,
        barcode: product.barcode,
        weight: product.weight,
        dimensions: product.dimensions,
        images: [...(product.images || [])],
        videos: [...(product.videos || [])],
        colors: [...(product.colors || [])],
        sizes: [...(product.sizes || [])],
        materials: [...(product.materials || [])],
        careInstructions: product.careInstructions || '',
        features: product.features,
        specifications: product.specifications,
        categoryId: product.categoryId,
        stock: product.stock,
        minStock: product.minStock,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        metaKeywords: product.metaKeywords || ''
    }
    showCreateDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
    showCreateDialog.value = false
    editingProduct.value = null
    productForm.value = {
        name: '',
        slug: '',
        description: '',
        shortDescription: '',
        price: 0,
        comparePrice: 0,
        cost: 0,
        sku: '',
        barcode: '',
        weight: 0,
        dimensions: null,
        images: [],
        videos: [],
        colors: [],
        sizes: [],
        materials: [],
        careInstructions: '',
        features: null,
        specifications: null,
        categoryId: null,
        stock: 0,
        minStock: 0,
        isActive: true,
        isFeatured: false,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: ''
    }
}

// 保存商品
const saveProduct = async () => {
    if (!isFormValid.value) {
        toast.add({ severity: 'warn', summary: '警告', detail: '请填写必填字段', life: 1000 })
        return
    }

    try {
        saving.value = true

        // 准备提交数据
        const submitData = {
            ...productForm.value,
            // 确保数组字段不为null
            images: productForm.value.images || [],
            videos: productForm.value.videos || [],
            colors: productForm.value.colors || [],
            sizes: productForm.value.sizes || [],
            materials: productForm.value.materials || []
        }

        if (editingProduct.value) {
            // 更新商品
            const { data: response } = await client.api.products({ id: editingProduct.value.id }).put(submitData)

            if (response.code === 200) {
                toast.add({ severity: 'success', summary: '成功', detail: '更新商品成功', life: 1000 })
            } else {
                throw new Error(response.message || '更新商品失败')
            }
        } else {
            // 创建商品
            const { data: response } = await client.api.products.post(submitData)

            if (response.code === 200) {
                toast.add({ severity: 'success', summary: '成功', detail: '创建商品成功', life: 1000 })
            } else {
                throw new Error(response.message || '创建商品失败')
            }
        }

        closeDialog()
        loadProducts()
    } catch (error) {
        console.error('保存商品失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: error.message || '保存商品失败', life: 1000 })
    } finally {
        saving.value = false
    }
}

// 确认删除
const confirmDelete = (product: Product) => {
    confirm.require({
        message: `确定要删除商品 "${product.name}" 吗？`,
        header: '删除确认',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteProduct(product.id)
    })
}

// 删除商品
const deleteProduct = async (id: number) => {
    try {
        const response = await handleApiRes(client.api.products({ id }).delete())

        if (response.code === 200) {
            toast.add({ severity: 'success', summary: '成功', detail: response.message, life: 1000 })
            loadProducts()
        } else {
            throw new Error(response.message || '删除商品失败')
        }
    } catch (error) {
        console.error('删除商品失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: error.message || '删除商品失败', life: 1000 })
    }
}

// 切换上架状态
const toggleActive = async (product: Product) => {
    const originalStatus = product.isActive
    try {
        product.isActive = !product.isActive

        const { data: response } = await client.api.products({ id: product.id }).put({
            isActive: product.isActive
        })

        if (response.code === 200) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `${product.isActive ? '上架' : '下架'}商品成功`
            })
        } else {
            throw new Error(response.message || '切换状态失败')
        }
    } catch (error) {
        product.isActive = originalStatus
        console.error('切换状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: error.message || '切换状态失败', life: 1000 })
    }
}

// 切换推荐状态
const toggleFeatured = async (product: Product) => {
    const originalStatus = product.isFeatured
    try {
        product.isFeatured = !product.isFeatured

        const { data: response } = await client.api.products({ id: product.id }).put({
            isFeatured: product.isFeatured
        })

        if (response.code === 200) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `${product.isFeatured ? '设为推荐' : '取消推荐'}成功`
            })
        } else {
            throw new Error(response.message || '切换推荐状态失败')
        }
    } catch (error) {
        product.isFeatured = originalStatus
        console.error('切换推荐状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: error.message || '切换推荐状态失败', life: 1000 })
    }
}

// 格式化金额
const formatCurrency = (amount: number) => {
    return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
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

// 打开图片选择器
const openImageSelector = () => {
    showImageSelector.value = true
}

// 处理图片选择
const onImageSelected = (imageUrl: string) => {
    if (!productForm.value.images.includes(imageUrl)) {
        productForm.value.images.push(imageUrl)
        toast.add({ severity: 'success', summary: '成功', detail: '图片添加成功', life: 1000 })
    } else {
        toast.add({ severity: 'warn', summary: '提示', detail: '图片已存在', life: 1000 })
    }
    showImageSelector.value = false
}

// 移除图片
const removeImage = (index: number) => {
    productForm.value.images.splice(index, 1)
    toast.add({ severity: 'info', summary: '提示', detail: '图片已移除', life: 1000 })
}

// 跳转到添加商品页面
const goToAddProduct = () => {
    router.push('/admin/products/add')
}


</script>

<template>
    <div class="products-management">
        <!-- 页面标题和操作栏 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">商品管理</h1>
                    <p class="text-gray-600 mt-1">管理商品信息，包括价格、库存、分类等</p>
                </div>
                <div class="flex gap-3">
                    <Button label="添加商品" icon="pi pi-plus" @click="goToAddProduct" class="p-button-success" />
                    <Button label="批量导入" icon="pi pi-upload" class="p-button-outlined" />
                </div>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-3">
                    <Button label="刷新" icon="pi pi-refresh" @click="loadProducts" class="p-button-outlined"
                        size="small" />
                    <Button label="批量上架" icon="pi pi-check" class="p-button-outlined" size="small"
                        :disabled="!selectedProducts.length" />
                    <Button label="批量下架" icon="pi pi-times" class="p-button-outlined" size="small"
                        :disabled="!selectedProducts.length" />
                </div>
                <div class="flex gap-3">
                    <InputText v-model="searchKeyword" placeholder="搜索商品名称或SKU..." class="w-64"
                        @update:modelValue="handleSearch" />
                    <Select v-model="filterCategory" :options="categoryOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选分类" class="w-32" @change="handleFilter" showClear />
                    <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选状态" class="w-32" @change="handleFilter" />
                </div>
            </div>
        </div>

        <!-- 商品数据表格 -->
        <div class="table-section">
            <DataTable :value="products" :loading="loading" :paginator="true" :rows="initMeta.pageSize"
                :totalRecords="initMeta.total" :lazy="true" @page="onPage" @sort="onSort" :sortField="sortField"
                :sortOrder="sortOrder" v-model:selection="selectedProducts" selectionMode="multiple" dataKey="id"
                tableStyle="min-width: 50rem" class="p-datatable-sm">
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column field="id" header="ID" :sortable="true" style="width: 80px">
                    <template #body="{ data }">
                        <span class="font-mono text-sm">#{{ data.id }}</span>
                    </template>
                </Column>

                <Column field="name" header="商品名称" :sortable="true" style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <Image v-if="data.images && data.images[0]" :src="data.images[0]" alt="商品图片" width="40"
                                height="40" class="rounded border" />
                            <div v-else class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <i class="pi pi-image text-gray-400"></i>
                            </div>
                            <div>
                                <div class="font-medium">{{ data.name }}</div>
                                <div class="text-sm text-gray-500">{{ data.slug }}</div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="sku" header="SKU" :sortable="true" style="width: 120px">
                    <template #body="{ data }">
                        <span class="font-mono text-sm">{{ data.sku }}</span>
                    </template>
                </Column>

                <Column field="price" header="价格" :sortable="true" style="width: 100px">
                    <template #body="{ data }">
                        <div class="text-right">
                            <div class="font-medium">{{ formatCurrency(data.price) }}</div>
                            <div v-if="data.comparePrice && data.comparePrice > data.price"
                                class="text-sm text-gray-400 line-through">
                                {{ formatCurrency(data.comparePrice) }}
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="stock" header="库存" :sortable="true" style="width: 80px">
                    <template #body="{ data }">
                        <div class="text-center">
                            <span :class="{
                                'text-red-600': data.stock <= data.minStock,
                                'text-orange-600': data.stock <= data.minStock * 2,
                                'text-green-600': data.stock > data.minStock * 2
                            }">{{ data.stock }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="categoryName" header="分类" style="width: 120px">
                    <template #body="{ data }">
                        <Tag v-if="data.categoryName" :value="data.categoryName" class="p-tag-secondary" />
                        <span v-else class="text-gray-400">未分类</span>
                    </template>
                </Column>

                <Column field="isActive" header="状态" style="width: 100px">
                    <template #body="{ data }">
                        <div class="flex flex-col gap-1">
                            <Tag :value="data.isActive ? '上架' : '下架'"
                                :severity="data.isActive ? 'success' : 'danger'" />
                            <Tag v-if="data.isFeatured" value="推荐" severity="info" />
                        </div>
                    </template>
                </Column>

                <Column field="createdAt" header="创建时间" :sortable="true" style="width: 150px">
                    <template #body="{ data }">
                        <span class="text-sm">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <Column header="操作" style="width: 150px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" size="small" class="p-button-outlined p-button-primary"
                                @click="showEditDialog(data)" v-tooltip.top="'编辑'" />
                            <Button :icon="data.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" size="small"
                                :class="data.isActive ? 'p-button-outlined p-button-warning' : 'p-button-outlined p-button-success'"
                                @click="toggleActive(data)" :v-tooltip.top="data.isActive ? '下架' : '上架'" />
                            <Button :icon="data.isFeatured ? 'pi pi-star-fill' : 'pi pi-star'" size="small"
                                :class="data.isFeatured ? 'p-button-outlined p-button-info' : 'p-button-outlined'"
                                @click="toggleFeatured(data)" :v-tooltip.top="data.isFeatured ? '取消推荐' : '设为推荐'" />
                            <Button icon="pi pi-trash" size="small" class="p-button-outlined p-button-danger"
                                @click="confirmDelete(data)" v-tooltip.top="'删除'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 创建/编辑商品对话框 -->
        <Dialog v-model:visible="showCreateDialog" :header="editingProduct ? '编辑商品' : '新增商品'" :modal="true"
            :closable="true" class="w-[1000px] max-h-[90vh]">
            <div class="space-y-6">
                <!-- 必填信息区域 -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-red-800 mb-4 flex items-center">
                        <i class="pi pi-exclamation-circle mr-2"></i>
                        必填信息
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- 左列 -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">商品名称 *</label>
                                <InputText v-model="productForm.name" placeholder="请输入商品名称" class="w-full"
                                    :class="{ 'p-invalid': !productForm.name }" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">URL别名 *</label>
                                <InputText v-model="productForm.slug" placeholder="请输入URL别名" class="w-full"
                                    :class="{ 'p-invalid': !productForm.slug }" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">商品SKU *</label>
                                <InputText v-model="productForm.sku" placeholder="请输入商品SKU" class="w-full"
                                    :class="{ 'p-invalid': !productForm.sku }" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">商品分类 *</label>
                                <Select v-model="productForm.categoryId" :options="categoryOptions" optionLabel="label"
                                    optionValue="value" placeholder="请选择分类" class="w-full"
                                    :class="{ 'p-invalid': !productForm.categoryId }" />
                            </div>
                        </div>

                        <!-- 右列 -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">商品描述 *</label>
                                <Textarea v-model="productForm.description" placeholder="请输入商品描述" rows="3"
                                    class="w-full" :class="{ 'p-invalid': !productForm.description }" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-red-700">简短描述 *</label>
                                <Textarea v-model="productForm.shortDescription" placeholder="请输入简短描述" rows="2"
                                    class="w-full" :class="{ 'p-invalid': !productForm.shortDescription }" />
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium mb-2 text-red-700">销售价格 *</label>
                                    <InputNumber v-model="productForm.price" :min="0" :maxFractionDigits="2"
                                        placeholder="0.00" class="w-full"
                                        :class="{ 'p-invalid': productForm.price <= 0 }" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2 text-red-700">库存数量 *</label>
                                    <InputNumber v-model="productForm.stock" :min="0" placeholder="0" class="w-full"
                                        :class="{ 'p-invalid': productForm.stock < 0 }" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 选填信息区域 -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <i class="pi pi-info-circle mr-2"></i>
                        选填信息
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- 左列 -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">对比价格</label>
                                <InputNumber v-model="productForm.comparePrice" :min="0" :maxFractionDigits="2"
                                    placeholder="0.00" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">成本价</label>
                                <InputNumber v-model="productForm.cost" :min="0" :maxFractionDigits="2"
                                    placeholder="0.00" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">最低库存</label>
                                <InputNumber v-model="productForm.minStock" :min="0" placeholder="0" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">重量(kg)</label>
                                <InputNumber v-model="productForm.weight" :min="0" :maxFractionDigits="3"
                                    placeholder="0.000" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">尺寸</label>
                                <InputText v-model="productForm.dimensions" placeholder="长x宽x高(cm)" class="w-full" />
                            </div>
                        </div>

                        <!-- 右列 -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">条形码</label>
                                <InputText v-model="productForm.barcode" placeholder="请输入条形码" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">材质</label>
                                <MultiSelect v-model="productForm.materials" :options="tagOptions" optionLabel="label"
                                    optionValue="value" placeholder="选择材质" class="w-full" display="chip" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 text-blue-700">护理说明</label>
                                <Textarea v-model="productForm.careInstructions" placeholder="请输入护理说明" rows="3"
                                    class="w-full" />
                            </div>

                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <ToggleSwitch v-model="productForm.isActive" />
                                    <label class="text-sm text-blue-700">立即上架</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Checkbox v-model="productForm.isFeatured" binary />
                                    <label class="text-sm text-blue-700">设为推荐</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 商品图片区域 -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-green-800 mb-4 flex items-center">
                        <i class="pi pi-image mr-2"></i>
                        商品图片
                    </h3>
                    <div class="space-y-4">
                        <!-- 添加图片按钮 -->
                        <Button label="选择图片" icon="pi pi-plus" @click="openImageSelector"
                            class="p-button-outlined w-full" v-tooltip="'从图片库中选择图片'" />

                        <!-- 已选择的图片展示 -->
                        <div v-if="productForm.images.length > 0" class="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div v-for="(imageUrl, index) in productForm.images" :key="index" class="relative">
                                <img :src="imageUrl" :alt="`商品图片 ${index + 1}`"
                                    class="w-full h-24 object-cover rounded border" />
                                <Button icon="pi pi-times"
                                    class="p-button-rounded p-button-danger p-button-text absolute -top-2 -right-2"
                                    @click="removeImage(index)" v-tooltip="'移除图片'" />
                            </div>
                        </div>

                        <!-- 空状态提示 -->
                        <div v-else class="text-center py-8 text-gray-500">
                            <i class="pi pi-image text-4xl mb-2"></i>
                            <p>暂无图片，点击上方按钮选择图片</p>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button label="取消" @click="closeDialog" class="p-button-text" />
                    <Button :label="editingProduct ? '更新' : '创建'" @click="saveProduct" :loading="saving"
                        :disabled="!isFormValid" />
                </div>
            </template>
        </Dialog>

        <!-- 确认对话框 -->
        <ConfirmDialog />

        <!-- 图片选择器 -->
        <ImageSelector v-model:visible="showImageSelector" category="products" @select="onImageSelected" />
    </div>
</template>

<style scoped>
.products-management {
    @apply p-0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-section {
        @apply mb-4;
    }

    .table-section {
        @apply overflow-x-auto;
    }
}
</style>