<script setup lang="ts">
import Badge from 'primevue/badge'
// PrimeVue 组件
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { client } from '@/share/useTreaty'

// 类型定义
interface Order {
    id: number
    orderNumber: string
    userId: number
    userName: string
    userEmail: string
    userPhone: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    shippingStatus: ShippingStatus
    totalAmount: number
    discountAmount: number
    shippingFee: number
    finalAmount: number
    paymentMethod: string
    shippingAddress: ShippingAddress
    items: OrderItem[]
    remark: string
    createdAt: Date
    updatedAt: Date
    paidAt?: Date
    shippedAt?: Date
    deliveredAt?: Date
    cancelledAt?: Date
}

interface OrderItem {
    id: number
    productId: number
    productName: string
    productImage: string
    sku: string
    price: number
    quantity: number
    totalPrice: number
}

interface ShippingAddress {
    name: string
    phone: string
    province: string
    city: string
    district: string
    address: string
    zipCode: string
}

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial_refund'
type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned'

// 响应式数据
const loading = ref(false)
const orders = ref<Order[]>([])
const selectedOrders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('createdAt')
const sortOrder = ref(-1)
const searchKeyword = ref('')
const filterStatus = ref('all')
const filterPaymentStatus = ref('all')
const filterDateRange = ref<Date[]>([])
const showOrderDetail = ref(false)
const selectedOrder = ref<Order | null>(null)
const showStatusDialog = ref(false)
const newStatus = ref<OrderStatus>('pending')
const statusRemark = ref('')

// 选项数据
const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '待确认', value: 'pending' },
    { label: '已确认', value: 'confirmed' },
    { label: '已发货', value: 'shipped' },
    { label: '已送达', value: 'delivered' },
    { label: '已取消', value: 'cancelled' },
    { label: '已退款', value: 'refunded' }
]

const paymentStatusOptions = [
    { label: '全部支付状态', value: 'all' },
    { label: '未支付', value: 'unpaid' },
    { label: '已支付', value: 'paid' },
    { label: '已退款', value: 'refunded' },
    { label: '部分退款', value: 'partial_refund' }
]

const orderStatusOptions = [
    { label: '待确认', value: 'pending' },
    { label: '已确认', value: 'confirmed' },
    { label: '已发货', value: 'shipped' },
    { label: '已送达', value: 'delivered' },
    { label: '已取消', value: 'cancelled' },
    { label: '已退款', value: 'refunded' }
]

// 工具函数
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// 计算属性
const orderStatistics = computed(() => {
    const stats = {
        total: orders.value.length,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    }
    
    orders.value.forEach(order => {
        stats[order.status]++
    })
    
    return stats
})

// 方法
const loadOrders = async () => {
    try {
        loading.value = true
        const params = {
            page: page.value,
            pageSize: pageSize.value,
            sortBy: sortField.value,
            sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
            search: searchKeyword.value || undefined,
            status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
            paymentStatus: filterPaymentStatus.value !== 'all' ? filterPaymentStatus.value : undefined,
            startDate: filterDateRange.value?.[0],
            endDate: filterDateRange.value?.[1]
        }

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 模拟数据
        const mockOrders: Order[] = [
            {
                id: 1,
                orderNumber: 'ORD202401001',
                userId: 1,
                userName: '张三',
                userEmail: 'zhangsan@example.com',
                userPhone: '13800138000',
                status: 'confirmed',
                paymentStatus: 'paid',
                shippingStatus: 'preparing',
                totalAmount: 1299,
                discountAmount: 100,
                shippingFee: 15,
                finalAmount: 1214,
                paymentMethod: '微信支付',
                shippingAddress: {
                    name: '张三',
                    phone: '13800138000',
                    province: '广东省',
                    city: '深圳市',
                    district: '南山区',
                    address: '科技园南区深南大道10000号',
                    zipCode: '518000'
                },
                items: [
                    {
                        id: 1,
                        productId: 1,
                        productName: 'iPhone 15 Pro',
                        productImage: '/uploads/iphone15pro.jpg',
                        sku: 'IP15P-001',
                        price: 7999,
                        quantity: 1,
                        totalPrice: 7999
                    }
                ],
                remark: '请尽快发货',
                createdAt: new Date(),
                updatedAt: new Date(),
                paidAt: new Date(Date.now() - 3600000)
            },
            {
                id: 2,
                orderNumber: 'ORD202401002',
                userId: 2,
                userName: '李四',
                userEmail: 'lisi@example.com',
                userPhone: '13900139000',
                status: 'shipped',
                paymentStatus: 'paid',
                shippingStatus: 'shipped',
                totalAmount: 2999,
                discountAmount: 0,
                shippingFee: 0,
                finalAmount: 2999,
                paymentMethod: '支付宝',
                shippingAddress: {
                    name: '李四',
                    phone: '13900139000',
                    province: '北京市',
                    city: '北京市',
                    district: '朝阳区',
                    address: '建国门外大街1号',
                    zipCode: '100000'
                },
                items: [
                    {
                        id: 2,
                        productId: 2,
                        productName: 'MacBook Pro 14"',
                        productImage: '/uploads/macbookpro14.jpg',
                        sku: 'MBP14-001',
                        price: 14999,
                        quantity: 1,
                        totalPrice: 14999
                    }
                ],
                remark: '',
                createdAt: new Date(Date.now() - 86400000),
                updatedAt: new Date(Date.now() - 3600000),
                paidAt: new Date(Date.now() - 82800000),
                shippedAt: new Date(Date.now() - 3600000)
            }
        ]
        
        orders.value = mockOrders
        total.value = mockOrders.length
        
    } catch (error) {
        console.error('加载订单失败:', error)
        orders.value = []
        total.value = 0
        toast.add({ severity: 'error', summary: '错误', detail: '加载订单失败', life: 1000 })
    } finally {
        loading.value = false
    }
}

// 分页处理
const onPage = (event: any) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    loadOrders()
}

// 排序处理
const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    loadOrders()
}

// 搜索处理
const handleSearch = () => {
    page.value = 1
    loadOrders()
}

// 筛选处理
const handleFilter = () => {
    page.value = 1
    loadOrders()
}

// 显示订单详情
const showOrderDetails = (order: Order) => {
    selectedOrder.value = order
    showOrderDetail.value = true
}

// 显示状态修改对话框
const showChangeStatus = (order: Order) => {
    selectedOrder.value = order
    newStatus.value = order.status
    statusRemark.value = ''
    showStatusDialog.value = true
}

// 更新订单状态
const updateOrderStatus = async () => {
    if (!selectedOrder.value) return
    
    try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        selectedOrder.value.status = newStatus.value
        selectedOrder.value.updatedAt = new Date()
        
        toast.add({ severity: 'success', summary: '成功', detail: '订单状态更新成功', life: 1000 })
        showStatusDialog.value = false
        loadOrders()
    } catch (error) {
        console.error('更新订单状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '更新订单状态失败', life: 1000 })
    }
}

// 确认删除订单
const confirmDeleteOrder = (order: Order) => {
    confirm.require({
        message: `确定要删除订单 "${order.orderNumber}" 吗？`,
        header: '删除确认',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteOrder(order.id)
    })
}

// 删除订单
const deleteOrder = async (id: number) => {
    try {
        toast.add({ severity: 'success', summary: '成功', detail: '删除订单成功', life: 1000 })
        loadOrders()
    } catch (error) {
        console.error('删除订单失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '删除订单失败', life: 1000 })
    }
}

// 获取状态标签样式
const getStatusSeverity = (status: OrderStatus) => {
    const severityMap = {
        pending: 'warning',
        confirmed: 'info',
        shipped: 'primary',
        delivered: 'success',
        cancelled: 'danger',
        refunded: 'secondary'
    }
    return severityMap[status] || 'secondary'
}

const getPaymentStatusSeverity = (status: PaymentStatus) => {
    const severityMap = {
        unpaid: 'danger',
        paid: 'success',
        refunded: 'warning',
        partial_refund: 'info'
    }
    return severityMap[status] || 'secondary'
}

// 获取状态文本
const getStatusText = (status: OrderStatus) => {
    const textMap = {
        pending: '待确认',
        confirmed: '已确认',
        shipped: '已发货',
        delivered: '已送达',
        cancelled: '已取消',
        refunded: '已退款'
    }
    return textMap[status] || status
}

const getPaymentStatusText = (status: PaymentStatus) => {
    const textMap = {
        unpaid: '未支付',
        paid: '已支付',
        refunded: '已退款',
        partial_refund: '部分退款'
    }
    return textMap[status] || status
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

// 导出订单
const exportOrders = () => {
    toast.add({ severity: 'info', summary: '提示', detail: '导出功能开发中...', life: 1000 })
}

// 组件挂载时加载数据
onMounted(() => {
    loadOrders()
})
</script>

<template>
    <div class="orders-management">
        <!-- 页面标题和统计 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">订单管理</h1>
                    <p class="text-gray-600 mt-1">管理所有订单信息，包括订单状态、支付状态等</p>
                </div>
                <div class="flex gap-3">
                    <Button label="导出订单" icon="pi pi-download" @click="exportOrders" class="p-button-outlined" />
                    <Button label="批量处理" icon="pi pi-cog" class="p-button-outlined" :disabled="!selectedOrders.length" />
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-blue-600">{{ orderStatistics.total }}</div>
                        <div class="text-sm text-gray-600">总订单</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-orange-600">{{ orderStatistics.pending }}</div>
                        <div class="text-sm text-gray-600">待确认</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-blue-600">{{ orderStatistics.confirmed }}</div>
                        <div class="text-sm text-gray-600">已确认</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-purple-600">{{ orderStatistics.shipped }}</div>
                        <div class="text-sm text-gray-600">已发货</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-green-600">{{ orderStatistics.delivered }}</div>
                        <div class="text-sm text-gray-600">已送达</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-red-600">{{ orderStatistics.cancelled }}</div>
                        <div class="text-sm text-gray-600">已取消</div>
                    </template>
                </Card>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-3">
                    <Button label="刷新" icon="pi pi-refresh" @click="loadOrders" class="p-button-outlined" size="small" />
                    <Button label="批量确认" icon="pi pi-check" class="p-button-outlined" size="small" :disabled="!selectedOrders.length" />
                    <Button label="批量发货" icon="pi pi-send" class="p-button-outlined" size="small" :disabled="!selectedOrders.length" />
                </div>
                <div class="flex gap-3">
                    <InputText v-model="searchKeyword" placeholder="搜索订单号或用户..." class="w-64" @input="handleSearch" />
                    <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选状态" class="w-32" @change="handleFilter" />
                    <Select v-model="filterPaymentStatus" :options="paymentStatusOptions" optionLabel="label" optionValue="value"
                        placeholder="支付状态" class="w-32" @change="handleFilter" />
                    <Calendar v-model="filterDateRange" selectionMode="range" placeholder="选择日期范围" 
                        class="w-48" @date-select="handleFilter" showIcon />
                </div>
            </div>
        </div>

        <!-- 订单数据表格 -->
        <div class="table-section">
            <DataTable :value="orders" tableStyle="min-width: 50rem" :loading="loading"
                v-model:selection="selectedOrders" dataKey="id" paginator :rows="pageSize"
                :rowsPerPageOptions="[5, 10, 20, 50]" :totalRecords="total" :lazy="true" @page="onPage" @sort="onSort"
                :sortField="sortField" :sortOrder="sortOrder" :first="(page - 1) * pageSize" class="p-datatable-sm"
                showGridlines responsiveLayout="scroll" selectionMode="multiple" :metaKeySelection="false">

                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">订单列表</span>
                        <Button icon="pi pi-refresh" rounded raised />
                    </div>
                </template>

                <!-- 选择列 -->
                <Column selectionMode="multiple" class="w-[3%]"></Column>

                <!-- 订单号列 -->
                <Column field="orderNumber" header="订单号" sortable class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="font-medium text-sm">{{ data.orderNumber }}</p>
                            <p class="text-xs text-gray-600">{{ formatDate(data.createdAt) }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 用户信息列 -->
                <Column field="userName" header="用户信息" class="w-[15%]">
                    <template #body="{ data }">
                        <div>
                            <p class="font-medium text-sm">{{ data.userName }}</p>
                            <p class="text-xs text-gray-600">{{ data.userPhone }}</p>
                            <p class="text-xs text-gray-600">{{ data.userEmail }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 商品信息列 -->
                <Column field="items" header="商品信息" class="w-[20%]">
                    <template #body="{ data }">
                        <div class="space-y-1">
                            <div v-for="item in data.items.slice(0, 2)" :key="item.id" class="flex items-center gap-2">
                                <img :src="item.productImage" :alt="item.productName" class="w-8 h-8 rounded object-cover" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs font-medium truncate">{{ item.productName }}</p>
                                    <p class="text-xs text-gray-600">{{ formatCurrency(item.price) }} × {{ item.quantity }}</p>
                                </div>
                            </div>
                            <p v-if="data.items.length > 2" class="text-xs text-gray-500">等{{ data.items.length }}件商品</p>
                        </div>
                    </template>
                </Column>

                <!-- 金额列 -->
                <Column field="finalAmount" header="订单金额" sortable class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="font-medium text-sm text-red-600">{{ formatCurrency(data.finalAmount) }}</p>
                            <p v-if="data.discountAmount > 0" class="text-xs text-gray-600">
                                优惠: {{ formatCurrency(data.discountAmount) }}
                            </p>
                            <p v-if="data.shippingFee > 0" class="text-xs text-gray-600">
                                运费: {{ formatCurrency(data.shippingFee) }}
                            </p>
                        </div>
                    </template>
                </Column>

                <!-- 支付方式列 -->
                <Column field="paymentMethod" header="支付方式" class="w-[10%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-sm">{{ data.paymentMethod }}</p>
                            <Tag :value="getPaymentStatusText(data.paymentStatus)" 
                                :severity="getPaymentStatusSeverity(data.paymentStatus)" class="text-xs" />
                        </div>
                    </template>
                </Column>

                <!-- 订单状态列 -->
                <Column field="status" header="订单状态" class="w-[10%]">
                    <template #body="{ data }">
                        <Tag :value="getStatusText(data.status)" :severity="getStatusSeverity(data.status)" class="text-xs" />
                    </template>
                </Column>

                <!-- 操作列 -->
                <Column header="操作" class="w-[18%]">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" @click="showOrderDetails(data)"
                                class="p-button-info p-button-sm" v-tooltip.top="'查看详情'" />
                            <Button icon="pi pi-pencil" @click="showChangeStatus(data)"
                                class="p-button-warning p-button-sm" v-tooltip.top="'修改状态'" />
                            <Button icon="pi pi-print" @click="router.push(`/admin/orders/${data.id}/print`)"
                                class="p-button-secondary p-button-sm" v-tooltip.top="'打印'" />
                            <Button icon="pi pi-trash" @click="confirmDeleteOrder(data)" 
                                class="p-button-danger p-button-sm" v-tooltip.top="'删除'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 订单详情对话框 -->
        <Dialog v-model:visible="showOrderDetail" header="订单详情" :modal="true" :closable="true" class="w-[900px]">
            <div v-if="selectedOrder" class="space-y-6">
                <!-- 基本信息 -->
                <div class="grid grid-cols-2 gap-6">
                    <Card>
                        <template #title>订单信息</template>
                        <template #content>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">订单号:</span>
                                    <span class="font-medium">{{ selectedOrder.orderNumber }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">创建时间:</span>
                                    <span>{{ formatDate(selectedOrder.createdAt) }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">订单状态:</span>
                                    <Tag :value="getStatusText(selectedOrder.status)" 
                                        :severity="getStatusSeverity(selectedOrder.status)" />
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">支付状态:</span>
                                    <Tag :value="getPaymentStatusText(selectedOrder.paymentStatus)" 
                                        :severity="getPaymentStatusSeverity(selectedOrder.paymentStatus)" />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>用户信息</template>
                        <template #content>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">用户姓名:</span>
                                    <span class="font-medium">{{ selectedOrder.userName }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">联系电话:</span>
                                    <span>{{ selectedOrder.userPhone }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">邮箱地址:</span>
                                    <span>{{ selectedOrder.userEmail }}</span>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 收货地址 -->
                <Card>
                    <template #title>收货地址</template>
                    <template #content>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">收货人:</span>
                                <span class="font-medium">{{ selectedOrder.shippingAddress.name }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">联系电话:</span>
                                <span>{{ selectedOrder.shippingAddress.phone }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">详细地址:</span>
                                <span>{{ selectedOrder.shippingAddress.province }}{{ selectedOrder.shippingAddress.city }}{{ selectedOrder.shippingAddress.district }}{{ selectedOrder.shippingAddress.address }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 商品列表 -->
                <Card>
                    <template #title>商品列表</template>
                    <template #content>
                        <DataTable :value="selectedOrder.items" class="p-datatable-sm">
                            <Column field="productImage" header="图片" class="w-[15%]">
                                <template #body="{ data }">
                                    <img :src="data.productImage" :alt="data.productName" class="w-12 h-12 rounded object-cover" />
                                </template>
                            </Column>
                            <Column field="productName" header="商品名称" class="w-[35%]">
                                <template #body="{ data }">
                                    <div>
                                        <p class="font-medium">{{ data.productName }}</p>
                                        <p class="text-sm text-gray-600">SKU: {{ data.sku }}</p>
                                    </div>
                                </template>
                            </Column>
                            <Column field="price" header="单价" class="w-[20%]">
                                <template #body="{ data }">
                                    <span class="text-red-600">{{ formatCurrency(data.price) }}</span>
                                </template>
                            </Column>
                            <Column field="quantity" header="数量" class="w-[15%]">
                                <template #body="{ data }">
                                    <Badge :value="data.quantity" severity="info" />
                                </template>
                            </Column>
                            <Column field="totalPrice" header="小计" class="w-[15%]">
                                <template #body="{ data }">
                                    <span class="font-medium text-red-600">{{ formatCurrency(data.totalPrice) }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>

                <!-- 费用明细 -->
                <Card>
                    <template #title>费用明细</template>
                    <template #content>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">商品总额:</span>
                                <span>{{ formatCurrency(selectedOrder.totalAmount) }}</span>
                            </div>
                            <div v-if="selectedOrder.discountAmount > 0" class="flex justify-between">
                                <span class="text-gray-600">优惠金额:</span>
                                <span class="text-green-600">-{{ formatCurrency(selectedOrder.discountAmount) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">运费:</span>
                                <span>{{ formatCurrency(selectedOrder.shippingFee) }}</span>
                            </div>
                            <div class="flex justify-between border-t pt-2">
                                <span class="font-medium">实付金额:</span>
                                <span class="font-bold text-red-600 text-lg">{{ formatCurrency(selectedOrder.finalAmount) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </Dialog>

        <!-- 修改状态对话框 -->
        <Dialog v-model:visible="showStatusDialog" header="修改订单状态" :modal="true" :closable="true" class="w-[400px]">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">订单状态</label>
                    <Select v-model="newStatus" :options="orderStatusOptions" optionLabel="label" 
                        optionValue="value" placeholder="选择状态" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">备注说明</label>
                    <Textarea v-model="statusRemark" placeholder="请输入状态变更说明..." rows="3" class="w-full" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button label="取消" @click="showStatusDialog = false" class="p-button-text" />
                    <Button label="确认" @click="updateOrderStatus" :disabled="!newStatus" />
                </div>
            </template>
        </Dialog>

        <!-- 确认对话框 -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.orders-management {
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