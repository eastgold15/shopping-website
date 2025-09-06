<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chart from 'primevue/chart'

import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'


// 类型定义
interface DashboardStats {
    totalProducts: number
    totalOrders: number
    totalUsers: number
    totalRevenue: number
    todayOrders: number
    pendingOrders: number
    completedOrders: number
    cancelledOrders: number
}

interface RecentOrder {
    id: number
    orderNumber: string
    customerName: string
    amount: number
    status: string
    createdAt: Date
}

interface SalesData {
    labels: string[]
    datasets: any[]
}

// 响应式数据
const loading = ref(false)
const stats = ref<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
})
const recentOrders = ref<RecentOrder[]>([])
const salesData = ref<SalesData>({
    labels: [],
    datasets: []
})
const chartOptions = ref({})

// 工具函数
const router = useRouter()
const toast = useToast()

// 计算属性
const orderCompletionRate = computed(() => {
    const total = stats.value.totalOrders
    if (total === 0) return 0
    return Math.round((stats.value.completedOrders / total) * 100)
})

const todayGrowthRate = computed(() => {
    // 模拟增长率计算
    return 12.5
})

// 方法
const loadDashboardData = async () => {
    try {
        loading.value = true

        // 模拟API调用 - 实际项目中应该调用真实API
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟统计数据
        stats.value = {
            totalProducts: 156,
            totalOrders: 1234,
            totalUsers: 567,
            totalRevenue: 89456.78,
            todayOrders: 23,
            pendingOrders: 45,
            completedOrders: 1089,
            cancelledOrders: 100
        }

        // 模拟最近订单
        recentOrders.value = [
            {
                id: 1,
                orderNumber: 'ORD-2024-001',
                customerName: '张三',
                amount: 299.99,
                status: 'pending',
                createdAt: new Date()
            },
            {
                id: 2,
                orderNumber: 'ORD-2024-002',
                customerName: '李四',
                amount: 599.99,
                status: 'completed',
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                id: 3,
                orderNumber: 'ORD-2024-003',
                customerName: '王五',
                amount: 199.99,
                status: 'shipped',
                createdAt: new Date(Date.now() - 7200000)
            }
        ]

        // 模拟销售图表数据
        salesData.value = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [
                {
                    label: '销售额',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: true
                }
            ]
        }

        chartOptions.value = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: any) => '¥' + value.toLocaleString()
                    }
                }
            }
        }

    } catch (error) {
        console.error('加载仪表盘数据失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '加载仪表盘数据失败', life: 1000 })
    } finally {
        loading.value = false
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
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 获取订单状态标签
const getOrderStatusTag = (status: string) => {
    const statusMap: Record<string, { label: string; severity: string }> = {
        pending: { label: '待处理', severity: 'warning' },
        confirmed: { label: '已确认', severity: 'info' },
        shipped: { label: '已发货', severity: 'success' },
        completed: { label: '已完成', severity: 'success' },
        cancelled: { label: '已取消', severity: 'danger' }
    }
    return statusMap[status] || { label: status, severity: 'secondary' }
}

// 快捷操作
const quickActions = [
    {
        label: '添加商品',
        icon: 'pi pi-plus',
        action: () => router.push('/admin/products/add'),
        color: 'success'
    },
    {
        label: '查看订单',
        icon: 'pi pi-shopping-cart',
        action: () => router.push('/admin/orders'),
        color: 'info'
    },
    {
        label: '用户管理',
        icon: 'pi pi-users',
        action: () => router.push('/admin/users'),
        color: 'warning'
    },
    {
        label: '网站设置',
        icon: 'pi pi-cog',
        action: () => router.push('/admin/settings'),
        color: 'secondary'
    }
]

// 组件挂载时加载数据
onMounted(() => {
    loadDashboardData()
})
</script>

<template>
    <div class="dashboard">
        <!-- 页面标题 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">仪表盘</h1>
                    <p class="text-gray-600 mt-1">欢迎回来，这里是您的业务概览</p>
                </div>
                <Button label="刷新数据" icon="pi pi-refresh" @click="loadDashboardData" class="p-button-outlined"
                    :loading="loading" />
            </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-section mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- 总商品数 -->
                <Card class="stats-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm mb-1">总商品数</p>
                                <p class="text-2xl font-bold text-blue-600">
                                    <Skeleton v-if="loading" width="4rem" height="2rem" />
                                    <span v-else>{{ stats.totalProducts }}</span>
                                </p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="pi pi-box text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 总订单数 -->
                <Card class="stats-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm mb-1">总订单数</p>
                                <p class="text-2xl font-bold text-green-600">
                                    <Skeleton v-if="loading" width="4rem" height="2rem" />
                                    <span v-else>{{ stats.totalOrders }}</span>
                                </p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="pi pi-shopping-cart text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 总用户数 -->
                <Card class="stats-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm mb-1">总用户数</p>
                                <p class="text-2xl font-bold text-purple-600">
                                    <Skeleton v-if="loading" width="4rem" height="2rem" />
                                    <span v-else>{{ stats.totalUsers }}</span>
                                </p>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="pi pi-users text-purple-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 总收入 -->
                <Card class="stats-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm mb-1">总收入</p>
                                <p class="text-2xl font-bold text-orange-600">
                                    <Skeleton v-if="loading" width="6rem" height="2rem" />
                                    <span v-else>{{ formatCurrency(stats.totalRevenue) }}</span>
                                </p>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i class="pi pi-dollar text-orange-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 左侧：销售图表和订单状态 -->
            <div class="lg:col-span-2 space-y-6">
                <!-- 销售趋势图表 -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold">销售趋势</h3>
                            <Tag :value="`+${todayGrowthRate}%`" severity="success" class="text-xs" />
                        </div>
                    </template>
                    <template #content>
                        <div class="h-64">
                            <Skeleton v-if="loading" width="100%" height="16rem" />
                            <Chart v-else type="line" :data="salesData" :options="chartOptions" class="h-full" />
                        </div>
                    </template>
                </Card>

                <!-- 订单状态概览 -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">订单状态概览</h3>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center p-4 bg-yellow-50 rounded-lg">
                                <p class="text-2xl font-bold text-yellow-600">{{ stats.pendingOrders }}</p>
                                <p class="text-sm text-gray-600 mt-1">待处理</p>
                            </div>
                            <div class="text-center p-4 bg-green-50 rounded-lg">
                                <p class="text-2xl font-bold text-green-600">{{ stats.completedOrders }}</p>
                                <p class="text-sm text-gray-600 mt-1">已完成</p>
                            </div>
                            <div class="text-center p-4 bg-blue-50 rounded-lg">
                                <p class="text-2xl font-bold text-blue-600">{{ stats.todayOrders }}</p>
                                <p class="text-sm text-gray-600 mt-1">今日订单</p>
                            </div>
                            <div class="text-center p-4 bg-red-50 rounded-lg">
                                <p class="text-2xl font-bold text-red-600">{{ stats.cancelledOrders }}</p>
                                <p class="text-sm text-gray-600 mt-1">已取消</p>
                            </div>
                        </div>

                        <!-- 完成率进度条 -->
                        <div class="mt-6">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-600">订单完成率</span>
                                <span class="text-sm font-medium">{{ orderCompletionRate }}%</span>
                            </div>
                            <ProgressBar :value="orderCompletionRate" class="h-2" />
                        </div>
                    </template>
                </Card>
            </div>

            <!-- 右侧：快捷操作和最近订单 -->
            <div class="space-y-6">
                <!-- 快捷操作 -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">快捷操作</h3>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <Button v-for="action in quickActions" :key="action.label" :label="action.label"
                                :icon="action.icon" @click="action.action" :class="`p-button-${action.color} w-full`"
                                class="justify-start" />
                        </div>
                    </template>
                </Card>

                <!-- 最近订单 -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold">最近订单</h3>
                            <Button label="查看全部" @click="router.push('/admin/orders')"
                                class="p-button-text p-button-sm" />
                        </div>
                    </template>
                    <template #content>
                        <div v-if="loading" class="space-y-3">
                            <Skeleton v-for="i in 3" :key="i" width="100%" height="3rem" />
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="order in recentOrders" :key="order.id"
                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                @click="router.push(`/admin/orders/${order.id}`)">
                                <div class="flex-1">
                                    <p class="font-medium text-sm">{{ order.orderNumber }}</p>
                                    <p class="text-xs text-gray-600">{{ order.customerName }}</p>
                                    <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-medium text-sm">{{ formatCurrency(order.amount) }}</p>
                                    <Tag :value="getOrderStatusTag(order.status).label"
                                        :severity="getOrderStatusTag(order.status).severity" class="text-xs mt-1" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    @apply p-0;
}

.stats-card {
    @apply transition-all duration-200 hover:shadow-md;
}

.stats-card :deep(.p-card-body) {
    @apply p-4;
}

.stats-card :deep(.p-card-content) {
    @apply p-0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-section {
        @apply mb-4;
    }

    .stats-section {
        @apply mb-4;
    }
}
</style>