<template>
	<div class="p-6">
		<!-- 页面标题和操作栏 -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">退款管理</h1>
				<p class="text-gray-600 mt-1">管理订单退款申请和处理流程</p>
			</div>
			<div class="flex gap-3">
				<Button 
					label="导出数据" 
					icon="pi pi-download" 
					severity="secondary" 
					@click="exportData"
				/>
				<Button 
					label="刷新" 
					icon="pi pi-refresh" 
					@click="loadRefunds"
				/>
			</div>
		</div>

		<!-- 筛选工具栏 -->
		<Card class="mb-6">
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<!-- 搜索框 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">搜索</label>
						<InputText 
							v-model="searchKeyword" 
							placeholder="订单号、用户名、退款单号"
							class="w-full"
							@input="handleSearch"
						/>
					</div>

					<!-- 退款状态筛选 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">退款状态</label>
						<Select 
							v-model="filterStatus" 
							:options="statusOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="全部状态"
							class="w-full"
							@change="handleFilter"
							showClear
						/>
					</div>

					<!-- 退款类型筛选 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">退款类型</label>
						<Select 
							v-model="filterType" 
							:options="typeOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="全部类型"
							class="w-full"
							@change="handleFilter"
							showClear
						/>
					</div>

					<!-- 日期范围筛选 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">申请日期</label>
						<Calendar 
							v-model="dateRange" 
							selectionMode="range" 
							:manualInput="false"
							placeholder="选择日期范围"
							class="w-full"
							@date-select="handleFilter"
							showIcon
						/>
					</div>
				</div>
			</template>
		</Card>

		<!-- 退款数据表格 -->
		<Card>
			<template #content>
				<DataTable 
					:value="refunds" 
					:loading="loading"
					:paginator="true"
					:rows="pageSize"
					:totalRecords="total"
					:lazy="true"
					@page="onPage"
					@sort="onSort"
					:sortField="sortField"
					:sortOrder="sortOrder"
					class="p-datatable-sm"
					showGridlines
					responsiveLayout="scroll"
					v-model:selection="selectedRefunds"
					dataKey="id"
					selectionMode="multiple"
				>
					<!-- 表格头部 -->
					<template #header>
						<div class="flex justify-between items-center">
							<span class="text-lg font-semibold">退款列表</span>
							<div class="flex gap-2">
								<Button 
									label="批量处理" 
									icon="pi pi-check" 
									size="small" 
									:disabled="!selectedRefunds.length"
									@click="batchProcess"
								/>
							</div>
						</div>
					</template>

					<!-- 选择列 -->
					<Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

					<!-- 退款单号 -->
					<Column field="refundNo" header="退款单号" sortable>
						<template #body="{ data }">
							<span class="font-mono text-blue-600">{{ data.refundNo }}</span>
						</template>
					</Column>

					<!-- 订单信息 -->
					<Column field="orderNo" header="关联订单" sortable>
						<template #body="{ data }">
							<div>
								<div class="font-mono text-sm">{{ data.orderNo }}</div>
								<div class="text-xs text-gray-500">{{ data.customerName }}</div>
							</div>
						</template>
					</Column>

					<!-- 退款金额 -->
					<Column field="refundAmount" header="退款金额" sortable>
						<template #body="{ data }">
							<div class="text-right">
								<div class="font-semibold text-red-600">{{ formatCurrency(data.refundAmount) }}</div>
								<div class="text-xs text-gray-500">原价: {{ formatCurrency(data.originalAmount) }}</div>
							</div>
						</template>
					</Column>

					<!-- 退款类型 -->
					<Column field="refundType" header="退款类型">
						<template #body="{ data }">
							<Tag 
								:value="getRefundTypeLabel(data.refundType)" 
								:severity="getRefundTypeSeverity(data.refundType)"
							/>
						</template>
					</Column>

					<!-- 退款状态 -->
					<Column field="status" header="状态">
						<template #body="{ data }">
							<Tag 
								:value="getStatusLabel(data.status)" 
								:severity="getStatusSeverity(data.status)"
							/>
						</template>
					</Column>

					<!-- 申请时间 -->
					<Column field="createdAt" header="申请时间" sortable>
						<template #body="{ data }">
							<div class="text-sm">
								<div>{{ formatDate(data.createdAt) }}</div>
								<div class="text-xs text-gray-500" v-if="data.processedAt">
									处理: {{ formatDate(data.processedAt) }}
								</div>
							</div>
						</template>
					</Column>

					<!-- 操作列 -->
					<Column header="操作" :exportable="false">
						<template #body="{ data }">
							<div class="flex gap-2">
								<Button 
									icon="pi pi-eye" 
									size="small" 
									severity="info" 
									@click="viewRefund(data)"
									v-tooltip.top="'查看详情'"
								/>
								<Button 
									icon="pi pi-check" 
									size="small" 
									severity="success" 
									@click="approveRefund(data)"
									v-tooltip.top="'同意退款'"
									:disabled="data.status !== 'pending'"
								/>
								<Button 
									icon="pi pi-times" 
									size="small" 
									severity="danger" 
									@click="rejectRefund(data)"
									v-tooltip.top="'拒绝退款'"
									:disabled="data.status !== 'pending'"
								/>
							</div>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 退款详情对话框 -->
		<Dialog 
			v-model:visible="detailDialogVisible" 
			header="退款详情" 
			:style="{ width: '800px' }"
			:modal="true"
			class="p-fluid"
		>
			<div v-if="selectedRefund" class="space-y-6">
				<!-- 基本信息 -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">退款单号</label>
						<p class="font-mono text-blue-600">{{ selectedRefund.refundNo }}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">关联订单</label>
						<p class="font-mono">{{ selectedRefund.orderNo }}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
						<p>{{ selectedRefund.customerName }}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
						<p>{{ selectedRefund.customerPhone }}</p>
					</div>
				</div>

				<!-- 退款信息 -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">退款类型</label>
						<Tag 
							:value="getRefundTypeLabel(selectedRefund.refundType)" 
							:severity="getRefundTypeSeverity(selectedRefund.refundType)"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">退款状态</label>
						<Tag 
							:value="getStatusLabel(selectedRefund.status)" 
							:severity="getStatusSeverity(selectedRefund.status)"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">原订单金额</label>
						<p class="text-lg font-semibold">{{ formatCurrency(selectedRefund.originalAmount) }}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">退款金额</label>
						<p class="text-lg font-semibold text-red-600">{{ formatCurrency(selectedRefund.refundAmount) }}</p>
					</div>
				</div>

				<!-- 退款原因 -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">退款原因</label>
					<p class="bg-gray-50 p-3 rounded-lg">{{ selectedRefund.reason }}</p>
				</div>

				<!-- 处理备注 -->
				<div v-if="selectedRefund.adminNote">
					<label class="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
					<p class="bg-blue-50 p-3 rounded-lg">{{ selectedRefund.adminNote }}</p>
				</div>

				<!-- 时间信息 -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">申请时间</label>
						<p>{{ formatDate(selectedRefund.createdAt) }}</p>
					</div>
					<div v-if="selectedRefund.processedAt">
						<label class="block text-sm font-medium text-gray-700 mb-1">处理时间</label>
						<p>{{ formatDate(selectedRefund.processedAt) }}</p>
					</div>
				</div>
			</div>

			<template #footer>
				<div class="flex justify-end gap-3">
					<Button 
						label="关闭" 
						icon="pi pi-times" 
						severity="secondary" 
						@click="detailDialogVisible = false"
					/>
					<Button 
						v-if="selectedRefund?.status === 'pending'"
						label="同意退款" 
						icon="pi pi-check" 
						severity="success" 
						@click="approveRefund(selectedRefund)"
					/>
					<Button 
						v-if="selectedRefund?.status === 'pending'"
						label="拒绝退款" 
						icon="pi pi-times" 
						severity="danger" 
						@click="rejectRefund(selectedRefund)"
					/>
				</div>
			</template>
		</Dialog>

		<!-- 处理退款对话框 -->
		<Dialog 
			v-model:visible="processDialogVisible" 
			:header="processAction === 'approve' ? '同意退款' : '拒绝退款'" 
			:style="{ width: '500px' }"
			:modal="true"
			class="p-fluid"
		>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
					<Textarea 
						v-model="processNote" 
						placeholder="请输入处理备注..."
						rows="4"
						class="w-full"
					/>
				</div>
			</div>

			<template #footer>
				<div class="flex justify-end gap-3">
					<Button 
						label="取消" 
						icon="pi pi-times" 
						severity="secondary" 
						@click="processDialogVisible = false"
					/>
					<Button 
						:label="processAction === 'approve' ? '确认同意' : '确认拒绝'" 
						icon="pi pi-check" 
						:severity="processAction === 'approve' ? 'success' : 'danger'" 
						@click="confirmProcess"
						:loading="processing"
					/>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref } from 'vue'

// 类型定义
interface Refund {
	id: number
	refundNo: string
	orderNo: string
	customerName: string
	customerPhone: string
	originalAmount: number
	refundAmount: number
	refundType: 'full' | 'partial' | 'return'
	status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
	reason: string
	adminNote?: string
	createdAt: Date
	processedAt?: Date
	processedBy?: string
}

const confirm = useConfirm()
const toast = useToast()

// 响应式数据
const refunds = ref<Refund[]>([])
const selectedRefunds = ref<Refund[]>([])
const selectedRefund = ref<Refund | null>(null)
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('createdAt')
const sortOrder = ref(-1)

// 筛选条件
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const dateRange = ref<Date[]>([])

// 对话框状态
const detailDialogVisible = ref(false)
const processDialogVisible = ref(false)
const processAction = ref<'approve' | 'reject'>('approve')
const processNote = ref('')
const processing = ref(false)

// 选项数据
const statusOptions = [
	{ label: '待处理', value: 'pending' },
	{ label: '已同意', value: 'approved' },
	{ label: '已拒绝', value: 'rejected' },
	{ label: '处理中', value: 'processing' },
	{ label: '已完成', value: 'completed' }
]

const typeOptions = [
	{ label: '全额退款', value: 'full' },
	{ label: '部分退款', value: 'partial' },
	{ label: '退货退款', value: 'return' }
]

// 模拟数据
const mockRefunds: Refund[] = [
	{
		id: 1,
		refundNo: 'RF202401001',
		orderNo: 'ORD202401001',
		customerName: '张三',
		customerPhone: '13800138001',
		originalAmount: 299.00,
		refundAmount: 299.00,
		refundType: 'full',
		status: 'pending',
		reason: '商品质量问题，要求全额退款',
		createdAt: new Date('2024-01-15 10:30:00')
	},
	{
		id: 2,
		refundNo: 'RF202401002',
		orderNo: 'ORD202401002',
		customerName: '李四',
		customerPhone: '13800138002',
		originalAmount: 599.00,
		refundAmount: 200.00,
		refundType: 'partial',
		status: 'approved',
		reason: '尺寸不合适，部分退款',
		adminNote: '同意部分退款，已处理',
		createdAt: new Date('2024-01-14 14:20:00'),
		processedAt: new Date('2024-01-14 16:45:00'),
		processedBy: 'admin'
	},
	{
		id: 3,
		refundNo: 'RF202401003',
		orderNo: 'ORD202401003',
		customerName: '王五',
		customerPhone: '13800138003',
		originalAmount: 399.00,
		refundAmount: 399.00,
		refundType: 'return',
		status: 'rejected',
		reason: '不喜欢颜色，要求退货',
		adminNote: '个人喜好原因，不符合退货政策',
		createdAt: new Date('2024-01-13 09:15:00'),
		processedAt: new Date('2024-01-13 11:30:00'),
		processedBy: 'admin'
	},
	{
		id: 4,
		refundNo: 'RF202401004',
		orderNo: 'ORD202401004',
		customerName: '赵六',
		customerPhone: '13800138004',
		originalAmount: 799.00,
		refundAmount: 799.00,
		refundType: 'full',
		status: 'completed',
		reason: '商品损坏，要求全额退款',
		adminNote: '商品确实有质量问题，已全额退款',
		createdAt: new Date('2024-01-12 16:45:00'),
		processedAt: new Date('2024-01-12 18:20:00'),
		processedBy: 'admin'
	},
	{
		id: 5,
		refundNo: 'RF202401005',
		orderNo: 'ORD202401005',
		customerName: '孙七',
		customerPhone: '13800138005',
		originalAmount: 199.00,
		refundAmount: 199.00,
		refundType: 'full',
		status: 'processing',
		reason: '收到商品与描述不符',
		adminNote: '正在核实商品信息',
		createdAt: new Date('2024-01-11 11:20:00'),
		processedAt: new Date('2024-01-11 13:45:00'),
		processedBy: 'admin'
	}
]

// 加载退款数据
const loadRefunds = async () => {
	loading.value = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// 应用筛选条件
		let filteredRefunds = [...mockRefunds]
		
		// 搜索筛选
		if (searchKeyword.value) {
			const keyword = searchKeyword.value.toLowerCase()
			filteredRefunds = filteredRefunds.filter(refund => 
				refund.refundNo.toLowerCase().includes(keyword) ||
				refund.orderNo.toLowerCase().includes(keyword) ||
				refund.customerName.toLowerCase().includes(keyword)
			)
		}
		
		// 状态筛选
		if (filterStatus.value) {
			filteredRefunds = filteredRefunds.filter(refund => refund.status === filterStatus.value)
		}
		
		// 类型筛选
		if (filterType.value) {
			filteredRefunds = filteredRefunds.filter(refund => refund.refundType === filterType.value)
		}
		
		// 日期筛选
		if (dateRange.value && dateRange.value.length === 2) {
			const [startDate, endDate] = dateRange.value
			filteredRefunds = filteredRefunds.filter(refund => {
				const refundDate = new Date(refund.createdAt)
				return refundDate >= startDate && refundDate <= endDate
			})
		}
		
		// 排序
		if (sortField.value) {
			filteredRefunds.sort((a, b) => {
				const aValue = a[sortField.value as keyof Refund]
				const bValue = b[sortField.value as keyof Refund]
				if (aValue < bValue) return sortOrder.value === 1 ? -1 : 1
				if (aValue > bValue) return sortOrder.value === 1 ? 1 : -1
				return 0
			})
		}
		
		total.value = filteredRefunds.length
		
		// 分页
		const start = (page.value - 1) * pageSize.value
		const end = start + pageSize.value
		refunds.value = filteredRefunds.slice(start, end)
		
	} catch (error) {
		console.error('加载退款数据失败:', error)
		refunds.value = []
		total.value = 0
		toast.add({ severity: 'error', summary: '错误', detail: '加载退款数据失败', life: 1000 })
	} finally {
		loading.value = false
	}
}

// 分页处理
const onPage = (event: any) => {
	page.value = event.page + 1
	pageSize.value = event.rows
	loadRefunds()
}

// 排序处理
const onSort = (event: any) => {
	sortField.value = event.sortField
	sortOrder.value = event.sortOrder
	loadRefunds()
}

// 搜索处理
const handleSearch = () => {
	page.value = 1
	loadRefunds()
}

// 筛选处理
const handleFilter = () => {
	page.value = 1
	loadRefunds()
}

// 查看退款详情
const viewRefund = (refund: Refund) => {
	selectedRefund.value = refund
	detailDialogVisible.value = true
}

// 同意退款
const approveRefund = (refund: Refund) => {
	selectedRefund.value = refund
	processAction.value = 'approve'
	processNote.value = ''
	processDialogVisible.value = true
}

// 拒绝退款
const rejectRefund = (refund: Refund) => {
	selectedRefund.value = refund
	processAction.value = 'reject'
	processNote.value = ''
	processDialogVisible.value = true
}

// 确认处理
const confirmProcess = async () => {
	if (!selectedRefund.value) return
	
	processing.value = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		const action = processAction.value === 'approve' ? '同意' : '拒绝'
		const newStatus = processAction.value === 'approve' ? 'approved' : 'rejected'
		
		// 更新退款状态
		selectedRefund.value.status = newStatus
		selectedRefund.value.adminNote = processNote.value
		selectedRefund.value.processedAt = new Date()
		selectedRefund.value.processedBy = 'admin'
		
		toast.add({
			severity: 'success',
			summary: '处理成功',
			detail: `已${action}退款申请`,
			life: 3000
		})
		
		processDialogVisible.value = false
		detailDialogVisible.value = false
		loadRefunds()
		
	} catch (error) {
		console.error('处理退款失败:', error)
		toast.add({
			severity: 'error',
			summary: '处理失败',
			detail: '处理退款时发生错误',
			life: 3000
		})
	} finally {
		processing.value = false
	}
}

// 批量处理
const batchProcess = () => {
	confirm.require({
		message: `确定要批量处理选中的 ${selectedRefunds.value.length} 个退款申请吗？`,
		header: '批量处理确认',
		icon: 'pi pi-exclamation-triangle',
		accept: async () => {
			try {
				// 模拟批量处理API调用
				await new Promise(resolve => setTimeout(resolve, 1500))
				
				toast.add({
					severity: 'success',
					summary: '批量处理成功',
					detail: `已处理 ${selectedRefunds.value.length} 个退款申请`,
					life: 3000
				})
				
				selectedRefunds.value = []
				loadRefunds()
			} catch (error) {
				toast.add({
					severity: 'error',
					summary: '批量处理失败',
					detail: '批量处理时发生错误',
					life: 3000
				})
			}
		}
	})
}

// 导出数据
const exportData = () => {
	toast.add({
		severity: 'info',
		summary: '导出功能',
		detail: '导出功能开发中...',
		life: 3000
	})
}

// 获取退款类型标签
const getRefundTypeLabel = (type: string) => {
	const typeMap: Record<string, string> = {
		full: '全额退款',
		partial: '部分退款',
		return: '退货退款'
	}
	return typeMap[type] || type
}

// 获取退款类型严重程度
const getRefundTypeSeverity = (type: string) => {
	const severityMap: Record<string, string> = {
		full: 'danger',
		partial: 'warning',
		return: 'info'
	}
	return severityMap[type] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
	const statusMap: Record<string, string> = {
		pending: '待处理',
		approved: '已同意',
		rejected: '已拒绝',
		processing: '处理中',
		completed: '已完成'
	}
	return statusMap[status] || status
}

// 获取状态严重程度
const getStatusSeverity = (status: string) => {
	const severityMap: Record<string, string> = {
		pending: 'warning',
		approved: 'success',
		rejected: 'danger',
		processing: 'info',
		completed: 'success'
	}
	return severityMap[status] || 'info'
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

// 组件挂载时加载数据
onMounted(() => {
	loadRefunds()
})
</script>

<style scoped>
/* 自定义样式 */
.p-card {
	@apply shadow-sm border border-gray-200;
}

.p-datatable {
	@apply border border-gray-200 rounded-lg;
}

.p-datatable .p-datatable-header {
	@apply bg-gray-50 border-b border-gray-200;
}

.p-datatable .p-datatable-tbody > tr:hover {
	@apply bg-gray-50;
}

.p-button {
	@apply transition-all duration-200;
}

.p-tag {
	@apply font-medium;
}
</style>