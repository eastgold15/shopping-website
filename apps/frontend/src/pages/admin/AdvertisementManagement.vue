<template>
	<div class="advertisement-management">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-2xl font-bold text-gray-800">广告管理</h1>
			<Button 
				@click="showCreateDialog = true" 
				icon="pi pi-plus" 
				label="新增广告"
				class="p-button-success"
			/>
		</div>

		<!-- 筛选器 -->
		<Card class="mb-6">
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2">广告类型</label>
						<Dropdown 
							v-model="filters.type" 
							:options="typeOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择类型"
							showClear
							@change="loadAdvertisements"
							class="w-full"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">广告位置</label>
						<Dropdown 
							v-model="filters.position" 
							:options="positionOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择位置"
							showClear
							@change="loadAdvertisements"
							class="w-full"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">状态</label>
						<Dropdown 
							v-model="filters.isActive" 
							:options="statusOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择状态"
							showClear
							@change="loadAdvertisements"
							class="w-full"
						/>
					</div>
					<div class="flex items-end">
						<Button 
							@click="resetFilters" 
							icon="pi pi-refresh" 
							label="重置"
							class="p-button-outlined"
						/>
					</div>
				</div>
			</template>
		</Card>

		<!-- 广告列表 -->
		<Card>
			<template #content>
				<DataTable 
					:value="advertisements" 
					:loading="loading"
					paginator 
					:rows="pagination.limit"
					:totalRecords="pagination.total"
					:lazy="true"
					@page="onPageChange"
					responsiveLayout="scroll"
					stripedRows
				>
					<Column field="id" header="ID" :sortable="true" style="width: 80px" />
					
					<Column header="预览图" style="width: 120px">
						<template #body="{ data }">
							<img 
								:src="data.image" 
								:alt="data.title"
								class="w-16 h-10 object-cover rounded border"
								@error="handleImageError"
							/>
						</template>
					</Column>
					
					<Column field="title" header="标题" :sortable="true" />
					
					<Column field="type" header="类型" style="width: 100px">
						<template #body="{ data }">
							<Tag 
								:value="getTypeLabel(data.type)" 
								:severity="data.type === 'carousel' ? 'info' : 'warning'"
							/>
						</template>
					</Column>
					
					<Column field="position" header="位置" style="width: 120px">
						<template #body="{ data }">
							{{ getPositionLabel(data.position) }}
						</template>
					</Column>
					
					<Column field="sortOrder" header="排序" :sortable="true" style="width: 80px" />
					
					<Column field="isActive" header="状态" style="width: 100px">
						<template #body="{ data }">
							<Tag 
								:value="data.isActive ? '启用' : '禁用'" 
								:severity="data.isActive ? 'success' : 'danger'"
							/>
						</template>
					</Column>
					
					<Column header="操作" style="width: 200px">
						<template #body="{ data }">
							<div class="flex gap-2">
								<Button 
									@click="editAdvertisement(data)" 
									icon="pi pi-pencil" 
									size="small"
									class="p-button-outlined p-button-info"
									v-tooltip="'编辑'"
								/>
								<Button 
									@click="toggleStatus(data)" 
									:icon="data.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" 
									size="small"
									:class="data.isActive ? 'p-button-outlined p-button-warning' : 'p-button-outlined p-button-success'"
									:v-tooltip="data.isActive ? '禁用' : '启用'"
								/>
								<Button 
									@click="deleteAdvertisement(data)" 
									icon="pi pi-trash" 
									size="small"
									class="p-button-outlined p-button-danger"
									v-tooltip="'删除'"
								/>
							</div>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 创建/编辑对话框 -->
		<Dialog 
			v-model:visible="showCreateDialog" 
			:header="editingAdvertisement ? '编辑广告' : '新增广告'"
			modal 
			class="w-full max-w-2xl"
			@hide="resetForm"
		>
			<div class="space-y-4">
				<!-- 基本信息 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2">广告标题 *</label>
						<InputText 
							v-model="form.title" 
							placeholder="请输入广告标题"
							class="w-full"
							:class="{ 'p-invalid': errors.title }"
						/>
						<small v-if="errors.title" class="p-error">{{ errors.title }}</small>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-2">广告类型 *</label>
						<Dropdown 
							v-model="form.type" 
							:options="typeOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择广告类型"
							class="w-full"
							:class="{ 'p-invalid': errors.type }"
						/>
						<small v-if="errors.type" class="p-error">{{ errors.type }}</small>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2">广告位置</label>
						<Dropdown 
							v-model="form.position" 
							:options="positionOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择广告位置"
							class="w-full"
							showClear
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-2">排序值</label>
						<InputNumber 
							v-model="form.sortOrder" 
							placeholder="排序值（数字越大越靠前）"
							class="w-full"
							:min="0"
						/>
					</div>
				</div>

				<!-- 图片上传 -->
				<div>
					<label class="block text-sm font-medium mb-2">广告图片 *</label>
					<div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
						<div v-if="form.image" class="text-center">
							<img 
								:src="form.image" 
								alt="预览图"
								class="max-w-full max-h-48 mx-auto mb-2 rounded"
							/>
							<Button 
								@click="form.image = ''" 
								icon="pi pi-times" 
								label="移除图片"
								class="p-button-outlined p-button-danger"
								size="small"
							/>
						</div>
						<div v-else class="text-center">
							<i class="pi pi-cloud-upload text-4xl text-gray-400 mb-2"></i>
							<p class="text-gray-500 mb-2">点击上传或拖拽图片到此处</p>
							<FileUpload 
								mode="basic" 
								accept="image/*" 
								:maxFileSize="5000000"
								@select="onFileSelect"
								chooseLabel="选择图片"
								class="p-button-outlined"
							/>
						</div>
					</div>
					<small v-if="errors.image" class="p-error">{{ errors.image }}</small>
				</div>

				<!-- 链接地址 -->
				<div>
					<label class="block text-sm font-medium mb-2">链接地址</label>
					<InputText 
						v-model="form.link" 
						placeholder="请输入点击跳转的链接地址"
						class="w-full"
					/>
					<small class="text-gray-500">可选，点击广告时跳转的链接</small>
				</div>

				<!-- 时间设置 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2">开始时间</label>
						<Calendar 
							v-model="form.startDate" 
							showTime 
							hourFormat="24"
							placeholder="选择开始时间"
							class="w-full"
							showButtonBar
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-2">结束时间</label>
						<Calendar 
							v-model="form.endDate" 
							showTime 
							hourFormat="24"
							placeholder="选择结束时间"
							class="w-full"
							showButtonBar
						/>
					</div>
				</div>

				<!-- 状态设置 -->
				<div class="flex items-center gap-2">
					<Checkbox v-model="form.isActive" inputId="isActive" binary />
					<label for="isActive" class="text-sm font-medium">启用广告</label>
				</div>
			</div>

			<template #footer>
				<div class="flex justify-end gap-2">
					<Button 
						@click="showCreateDialog = false" 
						label="取消" 
						class="p-button-outlined"
					/>
					<Button 
						@click="saveAdvertisement" 
						:label="editingAdvertisement ? '更新' : '创建'" 
						:loading="saving"
						class="p-button-success"
					/>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { client } from '@frontend/utils/useTreaty';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Paginator from 'primevue/paginator';
import type { 
	Advertisement, 
	AdvertisementForm, 
	AdvertisementQuery,
	AdvertisementListResponse,
	AdvertisementResponse
} from '../../types/advertisement';
import { ADVERTISEMENT_TYPES, ADVERTISEMENT_POSITIONS } from '../../types/advertisement';

// 组合式API
const toast = useToast();
const confirm = useConfirm();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const showCreateDialog = ref(false);
const editingAdvertisement = ref<Advertisement | null>(null);
const advertisements = ref<Advertisement[]>([]);

// 分页信息
const pagination = reactive({
	page: 1,
	limit: 10,
	total: 0
});

// 筛选器
const filters = reactive<AdvertisementQuery>({
	type: undefined,
	position: undefined,
	isActive: undefined
});

// 表单数据
const form = reactive<AdvertisementForm>({
	title: '',
	type: 'banner',
	image: '',
	link: '',
	position: '',
	sortOrder: 0,
	isActive: true,
	startDate: '',
	endDate: ''
});

// 表单验证错误
const errors = reactive<Record<string, string>>({
	title: '',
	type: '',
	image: ''
});

// 选项数据
const typeOptions = ADVERTISEMENT_TYPES;
const positionOptions = ADVERTISEMENT_POSITIONS;
const statusOptions = [
	{ label: '启用', value: true },
	{ label: '禁用', value: false }
];

// 方法
/**
 * 加载广告列表
 */
const loadAdvertisements = async () => {
	loading.value = true;
	try {
		const params = new URLSearchParams();
		params.append('page', pagination.page.toString());
		params.append('limit', pagination.limit.toString());
		
		if (filters.type) params.append('type', filters.type);
		if (filters.position) params.append('position', filters.position);
		if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

		const { data, error } = await client.api.advertisements.get({ query: Object.fromEntries(params) });
		
		if (data) {
			advertisements.value = data.advertisements;
			pagination.total = data.total;
			pagination.page = data.page;
			pagination.limit = data.limit;
		} else {
			throw new Error(error || '获取广告列表失败');
		}
	} catch (error) {
		console.error('加载广告列表失败:', error);
		toast.add({
			severity: 'error',
			summary: '错误',
			detail: '加载广告列表失败',
			life: 3000
		});
	} finally {
		loading.value = false;
	}
};

/**
 * 页面变化处理
 */
const onPageChange = (event: any) => {
	pagination.page = event.page + 1;
	loadAdvertisements();
};

/**
 * 重置筛选器
 */
const resetFilters = () => {
	filters.type = undefined;
	filters.position = undefined;
	filters.isActive = undefined;
	pagination.page = 1;
	loadAdvertisements();
};

/**
 * 获取类型标签
 */
const getTypeLabel = (type: string) => {
	return typeOptions.find(option => option.value === type)?.label || type;
};

/**
 * 获取位置标签
 */
const getPositionLabel = (position?: string) => {
	if (!position) return '-';
	return positionOptions.find(option => option.value === position)?.label || position;
};

/**
 * 编辑广告
 */
const editAdvertisement = (advertisement: Advertisement) => {
	editingAdvertisement.value = advertisement;
	form.title = advertisement.title;
	form.type = advertisement.type;
	form.image = advertisement.image;
	form.link = advertisement.link || '';
	form.position = advertisement.position || '';
	form.sortOrder = advertisement.sortOrder;
	form.isActive = advertisement.isActive;
	form.startDate = advertisement.startDate || '';
	form.endDate = advertisement.endDate || '';
	showCreateDialog.value = true;
};

/**
 * 切换广告状态
 */
const toggleStatus = async (advertisement: Advertisement) => {
	try {
		const { data, error } = await client.api.advertisements({ id: advertisement.id }).toggle.patch({ isActive: !advertisement.isActive });
		const response = { success: !!data, data, error, message: data?.message };
		
		if (response.success) {
			toast.add({
				severity: 'success',
				summary: '成功',
				detail: response.message,
				life: 3000
			});
			loadAdvertisements();
		} else {
			throw new Error(response.error || '操作失败');
		}
	} catch (error) {
		console.error('切换广告状态失败:', error);
		toast.add({
			severity: 'error',
			summary: '错误',
			detail: '切换广告状态失败',
			life: 3000
		});
	}
};

/**
 * 删除广告
 */
const deleteAdvertisement = (advertisement: Advertisement) => {
	confirm.require({
		message: `确定要删除广告 "${advertisement.title}" 吗？`,
		header: '确认删除',
		icon: 'pi pi-exclamation-triangle',
		rejectClass: 'p-button-secondary p-button-outlined',
		rejectLabel: '取消',
		acceptLabel: '删除',
		accept: async () => {
			try {
				const { data, error } = await client.api.advertisements({ id: advertisement.id }).delete();
			const response = { success: !!data, data, error };
				
				if (response.success) {
					toast.add({
						severity: 'success',
						summary: '成功',
						detail: '广告删除成功',
						life: 3000
					});
					loadAdvertisements();
				} else {
					throw new Error(response.error || '删除失败');
				}
			} catch (error) {
				console.error('删除广告失败:', error);
				toast.add({
					severity: 'error',
					summary: '错误',
					detail: '删除广告失败',
					life: 3000
				});
			}
		}
	});
};

/**
 * 文件选择处理
 */
const onFileSelect = (event: any) => {
	const file = event.files[0];
	if (file) {
		// 这里应该实现文件上传逻辑
		// 暂时使用 FileReader 预览
		const reader = new FileReader();
		reader.onload = (e) => {
			form.image = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}
};

/**
 * 图片加载错误处理
 */
const handleImageError = (event: Event) => {
	const img = event.target as HTMLImageElement;
	img.src = '/placeholder-image.png'; // 设置默认图片
};

/**
 * 表单验证
 */
const validateForm = (): boolean => {
	// 清空之前的错误
	Object.keys(errors).forEach(key => {
		errors[key] = '';
	});

	let isValid = true;

	if (!form.title.trim()) {
		errors.title = '请输入广告标题';
		isValid = false;
	}

	if (!form.type) {
		errors.type = '请选择广告类型';
		isValid = false;
	}

	if (!form.image.trim()) {
		errors.image = '请上传广告图片';
		isValid = false;
	}

	return isValid;
};

/**
 * 保存广告
 */
const saveAdvertisement = async () => {
	if (!validateForm()) {
		return;
	}

	saving.value = true;
	try {
		const url = editingAdvertisement.value 
			? `/api/advertisements/${editingAdvertisement.value.id}`
			: '/api/advertisements';
		
		const method = editingAdvertisement.value ? 'PUT' : 'POST';
		
		const requestData = {
			title: form.title,
			type: form.type,
			image: form.image,
			link: form.link || undefined,
			position: form.position || undefined,
			sortOrder: form.sortOrder,
			isActive: form.isActive,
			startDate: form.startDate || undefined,
			endDate: form.endDate || undefined
		};
		
		let result;
		if (editingAdvertisement.value) {
			result = await client.api.advertisements({ id: editingAdvertisement.value.id }).put(requestData);
		} else {
			result = await client.api.advertisements.post(requestData);
		}
		
		const response = { success: !!result.data, data: result.data, error: result.error, message: result.data?.message };
		
		if (response.success) {
			toast.add({
				severity: 'success',
				summary: '成功',
				detail: response.message,
				life: 3000
			});
			showCreateDialog.value = false;
			resetForm();
			loadAdvertisements();
		} else {
			throw new Error(response.error || '保存失败');
		}
	} catch (error) {
		console.error('保存广告失败:', error);
		toast.add({
			severity: 'error',
			summary: '错误',
			detail: '保存广告失败',
			life: 3000
		});
	} finally {
		saving.value = false;
	}
};

/**
 * 重置表单
 */
const resetForm = () => {
	editingAdvertisement.value = null;
	form.title = '';
	form.type = 'banner';
	form.image = '';
	form.link = '';
	form.position = '';
	form.sortOrder = 0;
	form.isActive = true;
	form.startDate = '';
	form.endDate = '';
	
	// 清空错误
	Object.keys(errors).forEach(key => {
		errors[key] = '';
	});
};

// 生命周期
onMounted(() => {
	loadAdvertisements();
});
</script>

<style scoped>
.advertisement-management {
	@apply p-6;
}

.p-datatable .p-datatable-tbody > tr > td {
	@apply py-3;
}

.p-dialog .p-dialog-content {
	@apply p-6;
}
</style>