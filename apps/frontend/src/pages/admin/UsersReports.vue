<template>
	<div class="p-6">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">用户统计</h1>
				<p class="text-gray-600 mt-1">查看用户数据和行为分析</p>
			</div>
			<div class="flex gap-3">
				<Button 
					label="导出报表" 
					icon="pi pi-download" 
					severity="secondary" 
					@click="exportReport"
				/>
				<Button 
					label="刷新数据" 
					icon="pi pi-refresh" 
					@click="refreshData"
					:loading="loading"
				/>
			</div>
		</div>

		<!-- 筛选工具栏 -->
		<Card class="mb-6">
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<!-- 时间范围 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
						<Dropdown 
							v-model="filters.timeRange" 
							:options="timeRangeOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择时间范围"
							class="w-full"
							@change="loadReportData"
						/>
					</div>

					<!-- 用户类型 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">用户类型</label>
						<Dropdown 
							v-model="filters.userType" 
							:options="userTypeOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择用户类型"
							class="w-full"
							@change="loadReportData"
						/>
					</div>

					<!-- 地区 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">地区</label>
						<MultiSelect 
							v-model="filters.regions" 
							:options="regionOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择地区"
							class="w-full"
							display="chip"
							:maxSelectedLabels="2"
							@change="loadReportData"
						/>
					</div>

					<!-- 注册来源 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">注册来源</label>
						<Dropdown 
							v-model="filters.source" 
							:options="sourceOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择来源"
							class="w-full"
							@change="loadReportData"
						/>
					</div>
				</div>
			</template>
		</Card>

		<!-- 关键指标卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
			<!-- 总用户数 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ formatNumber(kpiData.totalUsers) }}</div>
							<div class="text-sm text-gray-500 mt-1">总用户数</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.usersGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.usersGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.usersGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-users text-blue-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 新增用户 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ formatNumber(kpiData.newUsers) }}</div>
							<div class="text-sm text-gray-500 mt-1">新增用户</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.newUsersGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.newUsersGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.newUsersGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-user-plus text-green-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 活跃用户 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ formatNumber(kpiData.activeUsers) }}</div>
							<div class="text-sm text-gray-500 mt-1">活跃用户</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.activeGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.activeGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.activeGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-eye text-orange-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 用户留存率 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ kpiData.retentionRate }}%</div>
							<div class="text-sm text-gray-500 mt-1">用户留存率</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.retentionGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.retentionGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.retentionGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-heart text-purple-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>
		</div>

		<!-- 图表区域 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- 用户增长趋势 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">用户增长趋势</h3>
						<p class="text-sm text-gray-500 mt-1">新增用户和总用户数变化趋势</p>
					</div>
				</template>
				<template #content>
					<Chart type="line" :data="userGrowthData" :options="chartOptions" class="h-80" />
				</template>
			</Card>

			<!-- 用户来源分布 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">用户来源分布</h3>
						<p class="text-sm text-gray-500 mt-1">各渠道用户注册来源占比</p>
					</div>
				</template>
				<template #content>
					<Chart type="doughnut" :data="sourceData" :options="doughnutOptions" class="h-80" />
				</template>
			</Card>
		</div>

		<!-- 用户行为分析 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- 用户活跃度 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">用户活跃度分析</h3>
						<p class="text-sm text-gray-500 mt-1">日活、周活、月活用户统计</p>
					</div>
				</template>
				<template #content>
					<Chart type="bar" :data="activityData" :options="barOptions" class="h-80" />
				</template>
			</Card>

			<!-- 地区分布 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">地区分布</h3>
						<p class="text-sm text-gray-500 mt-1">用户地理位置分布情况</p>
					</div>
				</template>
				<template #content>
					<div class="space-y-4">
						<div v-for="region in regionDistribution" :key="region.name" class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="w-3 h-3 rounded-full" :style="{ backgroundColor: region.color }"></div>
								<span class="font-medium">{{ region.name }}</span>
							</div>
							<div class="text-right">
								<div class="font-medium">{{ formatNumber(region.users) }}</div>
								<div class="text-sm text-gray-500">{{ region.percentage }}%</div>
							</div>
						</div>
					</div>
				</template>
			</Card>
		</div>

		<!-- 用户行为表格 -->
		<Card class="mb-6">
			<template #header>
				<div class="flex items-center justify-between p-4 border-b">
					<div>
						<h3 class="text-lg font-semibold">用户行为分析</h3>
						<p class="text-sm text-gray-500 mt-1">用户购买行为和偏好统计</p>
					</div>
					<Dropdown 
						v-model="behaviorType" 
						:options="behaviorOptions" 
						optionLabel="label" 
						optionValue="value"
						class="w-40"
						@change="loadBehaviorData"
					/>
				</div>
			</template>
			<template #content>
				<DataTable 
					:value="behaviorData" 
					stripedRows 
					responsiveLayout="scroll"
					class="p-datatable-sm"
					paginator
					:rows="10"
				>
					<Column field="user" header="用户信息" style="min-width: 200px">
						<template #body="{ data }">
							<div class="flex items-center gap-3">
								<Avatar 
									:image="data.avatar" 
									:label="data.name.charAt(0)"
									shape="circle"
									size="normal"
								/>
								<div>
									<div class="font-medium text-gray-800">{{ data.name }}</div>
									<div class="text-sm text-gray-500">{{ data.email }}</div>
								</div>
							</div>
						</template>
					</Column>
					<Column field="registerDate" header="注册时间" style="min-width: 120px">
						<template #body="{ data }">
							<span class="text-sm">{{ formatDate(data.registerDate) }}</span>
						</template>
					</Column>
					<Column field="lastLogin" header="最后登录" style="min-width: 120px">
						<template #body="{ data }">
							<span class="text-sm">{{ formatDate(data.lastLogin) }}</span>
						</template>
					</Column>
					<Column field="orders" header="订单数" style="min-width: 100px">
						<template #body="{ data }">
							<span class="font-medium">{{ data.orders }}</span>
						</template>
					</Column>
					<Column field="totalSpent" header="消费金额" style="min-width: 120px">
						<template #body="{ data }">
							<span class="font-medium text-green-600">¥{{ formatNumber(data.totalSpent) }}</span>
						</template>
					</Column>
					<Column field="avgOrderValue" header="平均订单" style="min-width: 120px">
						<template #body="{ data }">
							<span class="text-sm">¥{{ formatNumber(data.avgOrderValue) }}</span>
						</template>
					</Column>
					<Column field="status" header="状态" style="min-width: 100px">
						<template #body="{ data }">
							<Badge 
								:value="data.status" 
								:severity="data.status === '活跃' ? 'success' : data.status === '沉睡' ? 'warning' : 'danger'"
							/>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 用户留存分析 -->
		<Card>
			<template #header>
				<div class="p-4 border-b">
					<h3 class="text-lg font-semibold">用户留存分析</h3>
					<p class="text-sm text-gray-500 mt-1">用户在不同时间段的留存情况</p>
				</div>
			</template>
			<template #content>
				<Chart type="line" :data="retentionData" :options="retentionOptions" class="h-80" />
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

// PrimeVue 组件
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'
import Chart from 'primevue/chart'

// 类型定义
interface KPIData {
	totalUsers: number
	newUsers: number
	activeUsers: number
	retentionRate: number
	usersGrowth: number
	newUsersGrowth: number
	activeGrowth: number
	retentionGrowth: number
}

interface UserBehavior {
	name: string
	email: string
	avatar?: string
	registerDate: string
	lastLogin: string
	orders: number
	totalSpent: number
	avgOrderValue: number
	status: string
}

interface RegionData {
	name: string
	users: number
	percentage: number
	color: string
}

const toast = useToast()

// 响应式数据
const loading = ref(false)
const behaviorType = ref('all')

// 筛选条件
const filters = reactive({
	timeRange: 'last30days',
	userType: 'all',
	regions: [] as string[],
	source: 'all'
})

// KPI数据
const kpiData = reactive<KPIData>({
	totalUsers: 15420,
	newUsers: 1250,
	activeUsers: 8960,
	retentionRate: 68.5,
	usersGrowth: 15.2,
	newUsersGrowth: 22.8,
	activeGrowth: 8.7,
	retentionGrowth: 3.2
})

// 用户行为数据
const behaviorData = ref<UserBehavior[]>([
	{
		name: '张三',
		email: 'zhangsan@example.com',
		avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
		registerDate: '2024-01-15',
		lastLogin: '2024-01-20',
		orders: 12,
		totalSpent: 3580,
		avgOrderValue: 298,
		status: '活跃'
	},
	{
		name: '李四',
		email: 'lisi@example.com',
		registerDate: '2024-01-10',
		lastLogin: '2024-01-18',
		orders: 8,
		totalSpent: 2150,
		avgOrderValue: 269,
		status: '活跃'
	},
	{
		name: '王五',
		email: 'wangwu@example.com',
		registerDate: '2023-12-20',
		lastLogin: '2024-01-05',
		orders: 3,
		totalSpent: 890,
		avgOrderValue: 297,
		status: '沉睡'
	},
	{
		name: '赵六',
		email: 'zhaoliu@example.com',
		registerDate: '2023-11-15',
		lastLogin: '2023-12-01',
		orders: 1,
		totalSpent: 156,
		avgOrderValue: 156,
		status: '流失'
	},
	{
		name: '孙七',
		email: 'sunqi@example.com',
		registerDate: '2024-01-12',
		lastLogin: '2024-01-19',
		orders: 15,
		totalSpent: 4250,
		avgOrderValue: 283,
		status: '活跃'
	}
])

// 地区分布数据
const regionDistribution = ref<RegionData[]>([
	{ name: '华东地区', users: 5420, percentage: 35, color: '#3B82F6' },
	{ name: '华南地区', users: 3850, percentage: 25, color: '#10B981' },
	{ name: '华北地区', users: 3080, percentage: 20, color: '#F59E0B' },
	{ name: '西南地区', users: 1850, percentage: 12, color: '#EF4444' },
	{ name: '其他地区', users: 1220, percentage: 8, color: '#8B5CF6' }
])

// 选项数据
const timeRangeOptions = [
	{ label: '今天', value: 'today' },
	{ label: '昨天', value: 'yesterday' },
	{ label: '最近7天', value: 'last7days' },
	{ label: '最近30天', value: 'last30days' },
	{ label: '最近90天', value: 'last90days' },
	{ label: '本月', value: 'thisMonth' },
	{ label: '上月', value: 'lastMonth' },
	{ label: '本年', value: 'thisYear' }
]

const userTypeOptions = [
	{ label: '全部用户', value: 'all' },
	{ label: '新用户', value: 'new' },
	{ label: '活跃用户', value: 'active' },
	{ label: '沉睡用户', value: 'inactive' },
	{ label: '流失用户', value: 'churned' }
]

const regionOptions = [
	{ label: '华东地区', value: 'east' },
	{ label: '华南地区', value: 'south' },
	{ label: '华北地区', value: 'north' },
	{ label: '西南地区', value: 'southwest' },
	{ label: '其他地区', value: 'others' }
]

const sourceOptions = [
	{ label: '全部来源', value: 'all' },
	{ label: '搜索引擎', value: 'search' },
	{ label: '社交媒体', value: 'social' },
	{ label: '直接访问', value: 'direct' },
	{ label: '推荐链接', value: 'referral' },
	{ label: '广告投放', value: 'ads' }
]

const behaviorOptions = [
	{ label: '全部用户', value: 'all' },
	{ label: '高价值用户', value: 'high_value' },
	{ label: '活跃用户', value: 'active' },
	{ label: '新用户', value: 'new' }
]

// 图表数据
const userGrowthData = computed(() => ({
	labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	datasets: [
		{
			label: '新增用户',
			data: [850, 920, 780, 1050, 980, 1120, 1250, 1180, 1350, 1420, 1580, 1650],
			borderColor: '#3B82F6',
			backgroundColor: 'rgba(59, 130, 246, 0.1)',
			fill: true,
			tension: 0.4
		},
		{
			label: '总用户数',
			data: [8500, 9420, 10200, 11250, 12230, 13350, 14600, 15780, 17130, 18550, 20130, 21780],
			borderColor: '#10B981',
			backgroundColor: 'rgba(16, 185, 129, 0.1)',
			fill: true,
			tension: 0.4,
			yAxisID: 'y1'
		}
	]
}))

const sourceData = computed(() => ({
	labels: ['搜索引擎', '社交媒体', '直接访问', '推荐链接', '广告投放'],
	datasets: [{
		data: [35, 25, 20, 12, 8],
		backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
		hoverBackgroundColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED']
	}]
}))

const activityData = computed(() => ({
	labels: ['日活用户', '周活用户', '月活用户'],
	datasets: [{
		label: '用户数量',
		data: [3200, 8960, 12500],
		backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
	}]
}))

const retentionData = computed(() => ({
	labels: ['第1天', '第3天', '第7天', '第14天', '第30天', '第60天', '第90天'],
	datasets: [{
		label: '留存率 (%)',
		data: [100, 85, 72, 65, 58, 52, 48],
		borderColor: '#8B5CF6',
		backgroundColor: 'rgba(139, 92, 246, 0.1)',
		fill: true,
		tension: 0.4
	}]
}))

// 图表配置
const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		y: {
			beginAtZero: true,
			position: 'left'
		},
		y1: {
			type: 'linear',
			display: true,
			position: 'right',
			grid: {
				drawOnChartArea: false
			}
		}
	},
	plugins: {
		legend: {
			position: 'top'
		}
	}
}

const doughnutOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom'
		}
	}
}

const barOptions = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		y: {
			beginAtZero: true
		}
	},
	plugins: {
		legend: {
			display: false
		}
	}
}

const retentionOptions = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		y: {
			beginAtZero: true,
			max: 100
		}
	},
	plugins: {
		legend: {
			position: 'top'
		}
	}
}

// 工具函数
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('zh-CN').format(num)
}

const formatDate = (dateStr: string): string => {
	return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 加载报表数据
const loadReportData = async () => {
	loading.value = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// 这里应该根据筛选条件调用后端API加载数据
		console.log('加载用户报表数据:', filters)
		
	} catch (error) {
		console.error('加载用户报表数据失败:', error)
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: '加载用户报表数据时发生错误',
			life: 3000
		})
	} finally {
		loading.value = false
	}
}

// 加载用户行为数据
const loadBehaviorData = async () => {
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 500))
		
		// 这里应该根据行为类型调用后端API
		console.log('加载用户行为数据:', behaviorType.value)
		
	} catch (error) {
		console.error('加载用户行为数据失败:', error)
	}
}

// 刷新数据
const refreshData = async () => {
	await loadReportData()
	toast.add({
		severity: 'success',
		summary: '刷新成功',
		detail: '数据已更新',
		life: 3000
	})
}

// 导出报表
const exportReport = () => {
	// 模拟导出功能
	toast.add({
		severity: 'info',
		summary: '导出中',
		detail: '正在生成报表文件...',
		life: 3000
	})
	
	// 这里应该调用后端API生成并下载报表文件
	console.log('导出用户报表')
}

// 组件挂载时加载数据
onMounted(() => {
	loadReportData()
})
</script>

<style scoped>
/* 自定义样式 */
.p-chart {
	position: relative;
}

.p-datatable .p-datatable-tbody > tr > td {
	padding: 0.75rem 0.5rem;
}

.p-card .p-card-content {
	padding: 1.5rem;
}

.p-badge {
	font-weight: 600;
}
</style>