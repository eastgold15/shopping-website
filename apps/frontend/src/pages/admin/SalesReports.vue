<template>
	<div class="p-6">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">销售统计</h1>
				<p class="text-gray-600 mt-1">查看销售数据和趋势分析</p>
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

					<!-- 自定义日期范围 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">自定义日期</label>
						<Calendar 
							v-model="filters.dateRange" 
							selectionMode="range" 
							:manualInput="false"
							dateFormat="yy-mm-dd"
							placeholder="选择日期范围"
							class="w-full"
							@date-select="loadReportData"
						/>
					</div>

					<!-- 商品分类 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">商品分类</label>
						<MultiSelect 
							v-model="filters.categories" 
							:options="categoryOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择分类"
							class="w-full"
							display="chip"
							:maxSelectedLabels="2"
							@change="loadReportData"
						/>
					</div>

					<!-- 销售渠道 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">销售渠道</label>
						<Dropdown 
							v-model="filters.channel" 
							:options="channelOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择渠道"
							class="w-full"
							@change="loadReportData"
						/>
					</div>
				</div>
			</template>
		</Card>

		<!-- 关键指标卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
			<!-- 总销售额 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">¥{{ formatNumber(kpiData.totalRevenue) }}</div>
							<div class="text-sm text-gray-500 mt-1">总销售额</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.revenueGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.revenueGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-dollar text-blue-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 订单数量 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ formatNumber(kpiData.totalOrders) }}</div>
							<div class="text-sm text-gray-500 mt-1">订单数量</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.ordersGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.ordersGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-shopping-cart text-green-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 平均订单价值 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">¥{{ formatNumber(kpiData.avgOrderValue) }}</div>
							<div class="text-sm text-gray-500 mt-1">平均订单价值</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.aovGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.aovGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.aovGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-chart-line text-orange-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>

			<!-- 转化率 -->
			<Card>
				<template #content>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-800">{{ kpiData.conversionRate }}%</div>
							<div class="text-sm text-gray-500 mt-1">转化率</div>
							<div class="flex items-center mt-2">
								<i :class="kpiData.conversionGrowth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="kpiData.conversionGrowth >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm ml-1">
									{{ Math.abs(kpiData.conversionGrowth) }}%
								</span>
								<span class="text-gray-500 text-sm ml-1">vs 上期</span>
							</div>
						</div>
						<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<i class="pi pi-percentage text-purple-600 text-xl"></i>
						</div>
					</div>
				</template>
			</Card>
		</div>

		<!-- 图表区域 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- 销售趋势图 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">销售趋势</h3>
						<p class="text-sm text-gray-500 mt-1">销售额和订单数量变化趋势</p>
					</div>
				</template>
				<template #content>
					<Chart type="line" :data="salesTrendData" :options="chartOptions" class="h-80" />
				</template>
			</Card>

			<!-- 分类销售占比 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">分类销售占比</h3>
						<p class="text-sm text-gray-500 mt-1">各商品分类的销售额占比</p>
					</div>
				</template>
				<template #content>
					<Chart type="doughnut" :data="categoryData" :options="doughnutOptions" class="h-80" />
				</template>
			</Card>
		</div>

		<!-- 热销商品排行 -->
		<Card class="mb-6">
			<template #header>
				<div class="flex items-center justify-between p-4 border-b">
					<div>
						<h3 class="text-lg font-semibold">热销商品排行</h3>
						<p class="text-sm text-gray-500 mt-1">销量最高的商品列表</p>
					</div>
					<Dropdown 
						v-model="topProductsType" 
						:options="topProductsOptions" 
						optionLabel="label" 
						optionValue="value"
						class="w-40"
						@change="loadTopProducts"
					/>
				</div>
			</template>
			<template #content>
				<DataTable 
					:value="topProducts" 
					stripedRows 
					responsiveLayout="scroll"
					class="p-datatable-sm"
				>
					<Column field="rank" header="排名" style="min-width: 80px">
						<template #body="{ data }">
							<div class="flex items-center justify-center">
								<Badge 
									:value="data.rank" 
									:severity="data.rank <= 3 ? 'success' : 'secondary'"
									size="large"
								/>
							</div>
						</template>
					</Column>
					<Column field="product" header="商品信息" style="min-width: 250px">
						<template #body="{ data }">
							<div class="flex items-center gap-3">
								<img 
									:src="data.image" 
									:alt="data.name"
									class="w-12 h-12 rounded-lg object-cover"
								/>
								<div>
									<div class="font-medium text-gray-800">{{ data.name }}</div>
									<div class="text-sm text-gray-500">{{ data.category }}</div>
								</div>
							</div>
						</template>
					</Column>
					<Column field="sales" header="销量" style="min-width: 100px">
						<template #body="{ data }">
							<span class="font-medium">{{ formatNumber(data.sales) }}</span>
						</template>
					</Column>
					<Column field="revenue" header="销售额" style="min-width: 120px">
						<template #body="{ data }">
							<span class="font-medium text-green-600">¥{{ formatNumber(data.revenue) }}</span>
						</template>
					</Column>
					<Column field="growth" header="增长率" style="min-width: 100px">
						<template #body="{ data }">
							<div class="flex items-center">
								<i :class="data.growth >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
								<span :class="data.growth >= 0 ? 'text-green-500' : 'text-red-500'" class="ml-1">
									{{ Math.abs(data.growth) }}%
								</span>
							</div>
						</template>
					</Column>
					<Column field="stock" header="库存" style="min-width: 100px">
						<template #body="{ data }">
							<Badge 
								:value="data.stock" 
								:severity="data.stock > 50 ? 'success' : data.stock > 10 ? 'warning' : 'danger'"
							/>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 销售渠道分析 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 渠道销售对比 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">渠道销售对比</h3>
						<p class="text-sm text-gray-500 mt-1">各销售渠道的表现对比</p>
					</div>
				</template>
				<template #content>
					<Chart type="bar" :data="channelData" :options="barOptions" class="h-80" />
				</template>
			</Card>

			<!-- 地区销售分布 -->
			<Card>
				<template #header>
					<div class="p-4 border-b">
						<h3 class="text-lg font-semibold">地区销售分布</h3>
						<p class="text-sm text-gray-500 mt-1">各地区的销售额分布情况</p>
					</div>
				</template>
				<template #content>
					<div class="space-y-4">
						<div v-for="region in regionData" :key="region.name" class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="w-3 h-3 rounded-full" :style="{ backgroundColor: region.color }"></div>
								<span class="font-medium">{{ region.name }}</span>
							</div>
							<div class="text-right">
								<div class="font-medium">¥{{ formatNumber(region.revenue) }}</div>
								<div class="text-sm text-gray-500">{{ region.percentage }}%</div>
							</div>
						</div>
					</div>
				</template>
			</Card>
		</div>
	</div>
</template>

<script setup lang="ts">
import Badge from 'primevue/badge'
// PrimeVue 组件
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref } from 'vue'

// 类型定义
interface KPIData {
	totalRevenue: number
	totalOrders: number
	avgOrderValue: number
	conversionRate: number
	revenueGrowth: number
	ordersGrowth: number
	aovGrowth: number
	conversionGrowth: number
}

interface TopProduct {
	rank: number
	name: string
	category: string
	image: string
	sales: number
	revenue: number
	growth: number
	stock: number
}

interface RegionData {
	name: string
	revenue: number
	percentage: number
	color: string
}

const toast = useToast()

// 响应式数据
const loading = ref(false)
const topProductsType = ref('sales')

// 筛选条件
const filters = reactive({
	timeRange: 'last30days',
	dateRange: null as Date[] | null,
	categories: [] as string[],
	channel: 'all'
})

// KPI数据
const kpiData = reactive<KPIData>({
	totalRevenue: 1250000,
	totalOrders: 3420,
	avgOrderValue: 365.5,
	conversionRate: 3.2,
	revenueGrowth: 12.5,
	ordersGrowth: 8.3,
	aovGrowth: 4.2,
	conversionGrowth: -1.5
})

// 热销商品数据
const topProducts = ref<TopProduct[]>([
	{
		rank: 1,
		name: '时尚休闲T恤',
		category: '服装',
		image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
		sales: 1250,
		revenue: 125000,
		growth: 15.2,
		stock: 85
	},
	{
		rank: 2,
		name: '运动鞋',
		category: '鞋类',
		image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
		sales: 980,
		revenue: 98000,
		growth: 8.7,
		stock: 42
	},
	{
		rank: 3,
		name: '牛仔裤',
		category: '服装',
		image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&h=100&fit=crop',
		sales: 756,
		revenue: 75600,
		growth: -2.1,
		stock: 23
	},
	{
		rank: 4,
		name: '手提包',
		category: '配饰',
		image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop',
		sales: 642,
		revenue: 64200,
		growth: 22.3,
		stock: 67
	},
	{
		rank: 5,
		name: '连衣裙',
		category: '服装',
		image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop',
		sales: 534,
		revenue: 53400,
		growth: 5.8,
		stock: 156
	}
])

// 地区销售数据
const regionData = ref<RegionData[]>([
	{ name: '华东地区', revenue: 450000, percentage: 36, color: '#3B82F6' },
	{ name: '华南地区', revenue: 325000, percentage: 26, color: '#10B981' },
	{ name: '华北地区', revenue: 275000, percentage: 22, color: '#F59E0B' },
	{ name: '西南地区', revenue: 125000, percentage: 10, color: '#EF4444' },
	{ name: '其他地区', revenue: 75000, percentage: 6, color: '#8B5CF6' }
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
	{ label: '本年', value: 'thisYear' },
	{ label: '自定义', value: 'custom' }
]

const categoryOptions = [
	{ label: '服装', value: 'clothing' },
	{ label: '鞋类', value: 'shoes' },
	{ label: '配饰', value: 'accessories' },
	{ label: '包包', value: 'bags' },
	{ label: '运动装', value: 'sportswear' }
]

const channelOptions = [
	{ label: '全部渠道', value: 'all' },
	{ label: '官网', value: 'website' },
	{ label: '移动端', value: 'mobile' },
	{ label: '微信小程序', value: 'wechat' },
	{ label: '第三方平台', value: 'thirdparty' }
]

const topProductsOptions = [
	{ label: '按销量排序', value: 'sales' },
	{ label: '按销售额排序', value: 'revenue' },
	{ label: '按增长率排序', value: 'growth' }
]

// 图表数据
const salesTrendData = computed(() => ({
	labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	datasets: [
		{
			label: '销售额 (万元)',
			data: [85, 92, 78, 105, 98, 112, 125, 118, 135, 142, 158, 165],
			borderColor: '#3B82F6',
			backgroundColor: 'rgba(59, 130, 246, 0.1)',
			fill: true,
			tension: 0.4
		},
		{
			label: '订单数量',
			data: [320, 350, 280, 420, 380, 450, 480, 460, 520, 550, 580, 620],
			borderColor: '#10B981',
			backgroundColor: 'rgba(16, 185, 129, 0.1)',
			fill: true,
			tension: 0.4,
			yAxisID: 'y1'
		}
	]
}))

const categoryData = computed(() => ({
	labels: ['服装', '鞋类', '配饰', '包包', '运动装'],
	datasets: [{
		data: [35, 25, 20, 12, 8],
		backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
		hoverBackgroundColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED']
	}]
}))

const channelData = computed(() => ({
	labels: ['官网', '移动端', '微信小程序', '第三方平台'],
	datasets: [{
		label: '销售额 (万元)',
		data: [450, 320, 180, 125],
		backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
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

// 工具函数
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('zh-CN').format(num)
}

// 加载报表数据
const loadReportData = async () => {
	loading.value = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// 这里应该根据筛选条件调用后端API加载数据
		console.log('加载报表数据:', filters)
		
	} catch (error) {
		console.error('加载报表数据失败:', error)
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: '加载报表数据时发生错误',
			life: 3000
		})
	} finally {
		loading.value = false
	}
}

// 加载热销商品
const loadTopProducts = async () => {
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 500))
		
		// 这里应该根据排序类型调用后端API
		console.log('加载热销商品:', topProductsType.value)
		
	} catch (error) {
		console.error('加载热销商品失败:', error)
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
	console.log('导出销售报表')
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