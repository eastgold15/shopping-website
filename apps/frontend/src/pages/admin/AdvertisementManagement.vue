<script setup lang="ts">
import ImageSelector from "@/app/components/ImageSelector.vue";
import { handleApiRes } from '@/app/utils/handleApi';
import { client } from "@/share/useTreaty";
import { Form, FormField } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import Button from "primevue/button";
import Card from "primevue/card";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import ConfirmDialog from "primevue/confirmdialog";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from 'primevue/message';
import Select from "primevue/select";
import Tag from "primevue/tag";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { onMounted, reactive, ref } from "vue";
import { z } from 'zod';
import type {
	Advertisement,
	AdvertisementQuery
} from "../../types/advertisement";




// 组合式API
const toast = useToast();
const confirm = useConfirm();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const showCreateDialog = ref(false);
const showImageSelector = ref(false);
const editingAdvertisement = ref<Advertisement | null>(null);
const advertisements = ref<Advertisement[]>([]);
const formRef = ref<any>(null);

// 分页信息
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 筛选器
const filters = reactive<AdvertisementQuery>({
	type: undefined,
	position: undefined,
	isActive: undefined,
});

// 表单数据
const initialValues = reactive({
	title: "",
	type: "carousel",
	image: "",
	link: "",
	position: "",
	sortOrder: 0,
	isActive: true,
	startDate: null as Date | null,
	endDate: null as Date | null,
});

// 表单验证器
const formResolver = zodResolver(
	z.object({
		title: z.string().min(1, { message: '广告标题不能为空' }),
		type: z.string().min(1, { message: '请选择广告类型' }),
		image: z.string().min(1, { message: '请上传广告图片' }),
		link: z.string().optional(),
		position: z.string().optional(),
		sortOrder: z.number().min(0, { message: '排序值不能小于0' }),
		isActive: z.boolean(),
		startDate: z.date().nullable().optional(),
		endDate: z.date().nullable().optional(),
	})
)

// 单独的字段验证器
const titleResolver = zodResolver(z.string().min(1, { message: '广告标题不能为空' }))
const typeResolver = zodResolver(z.string().min(1, { message: '请选择广告类型' }))
const imageResolver = zodResolver(z.string().min(1, { message: '请上传广告图片' }))
const sortOrderResolver = zodResolver(z.number().min(0, { message: '排序值不能小于0' }))

// 选项数据
const typeOptions = ref([
	{ label: "轮播图", value: "carousel" },
]);
const positionOptions = ref([
	{ label: "首页轮播", value: "home-hero" },
	{ label: "分类页顶部", value: "category-top" }
])
	;
const statusOptions = [
	{ label: "启用", value: true },
	{ label: "禁用", value: false },
];

const removeImage = () => {
	initialValues.image = ''; // 直接清空
	formRef.value.setFieldValue('image', '');
}




// 方法
/**
 * 加载广告列表
 */
const loadAdvertisements = async () => {
	loading.value = true;
	try {
		const params = {
			page: page.value,
			pageSize: pageSize.value,
			type: filters.type || undefined,
			position: filters.position || undefined,
			isActive: filters.isActive !== undefined ? filters.isActive : undefined
		};

		console.log('Loading advertisements with params:', params);
		const res = await handleApiRes(client.api.advertisements.get({ query: params }))
		console.log('API response:', res);
		if (!res) {
			advertisements.value = [];
			total.value = 0;
			toast.add({ severity: 'error', summary: '错误', detail: '加载广告列表失败', life: 1000 });
			return
		};

		const resData: any = res.data;
		if (res.code === 200) {
			// 处理分页数据结构 {items: [], meta: {total: number}}
			if (Array.isArray(resData.items)) {
				advertisements.value = resData.items;
				total.value = resData.meta?.total || 0;
			}
			else {
				advertisements.value = [];
				total.value = 0;
				toast.add({ severity: 'error', summary: '错误', detail: '数据格式错误', life: 1000 });
			}
		}

	} catch (error) {
		console.error('加载广告列表失败:', error);
		advertisements.value = [];
		total.value = 0;
		toast.add({ severity: 'error', summary: '错误', detail: '加载广告列表失败', life: 1000 });
	} finally {
		loading.value = false;
	}
}


/**
 * 页面变化处理
 */
const onPageChange = (event: any) => {
	page.value = event.page + 1; // DataTable的page从0开始，API从1开始
	pageSize.value = event.rows;
	loadAdvertisements();
};

/**
 * 重置筛选器
 */
const resetFilters = () => {
	filters.type = undefined;
	filters.position = undefined;
	filters.isActive = undefined;
	page.value = 1;
	loadAdvertisements();
};

/**
 * 获取类型标签
 */
const getTypeLabel = (type: string) => {
	return typeOptions.value.find((option) => option.value === type)?.label || type;
};

/**
 * 获取位置标签
 */
const getPositionLabel = (position?: string) => {
	if (!position) return "-";
	return (
		positionOptions.value.find((option) => option.value === position)?.label ||
		position
	);
};



/**
 * 关闭对话框
 */
const closeDialog = () => {
	showCreateDialog.value = false;
	editingAdvertisement.value = null;
	// 重置表单初始值
	Object.assign(initialValues, {
		title: "",
		type: "carousel",
		image: "",
		link: "",
		position: "",
		sortOrder: 0,
		isActive: true,
		startDate: null,
		endDate: null,
	});
};

/**
 * 编辑广告
 */
const editAdvertisement = (advertisement: Advertisement) => {
	editingAdvertisement.value = advertisement;
	// 更新表单初始值
	Object.assign(initialValues, {
		title: advertisement.title || "",
		type: advertisement.type || "carousel",
		image: advertisement.image || "",
		link: advertisement.link || "",
		position: advertisement.position || "",
		sortOrder: Number(advertisement.sortOrder) || 0,
		isActive: Boolean(advertisement.isActive),
		startDate: advertisement.startDate ? new Date(advertisement.startDate) : null,
		endDate: advertisement.endDate ? new Date(advertisement.endDate) : null,
	});
	console.log("aaaa", initialValues)
	showCreateDialog.value = true;
};

/**
 * 切换广告状态
 */
const toggleStatus = async (advertisement: Advertisement) => {
	try {
		const res = await handleApiRes(client.api
			.advertisements({ id: advertisement.id })
			.toggle.patch({ isActive: !advertisement.isActive }))

		if (res && res.code === 200) {
			toast.add({
				severity: "success",
				summary: "成功",
				detail: res.message,
				life: 3000,
			});
			loadAdvertisements();
		}
		else {
			throw new Error(res?.message || "操作失败");
		}
	} catch (error) {
		console.error("切换广告状态失败:", error);
		toast.add({
			severity: "error",
			summary: "错误",
			detail: "切换广告状态失败",
			life: 3000,
		});
	}
};

/**
 * 删除广告
 */
const deleteAdvertisement = (advertisement: Advertisement) => {
	confirm.require({
		message: `确定要删除广告 "${advertisement.title}" 吗？`,
		header: "确认删除",
		icon: "pi pi-exclamation-triangle",
		rejectClass: "p-button-secondary p-button-outlined",
		rejectLabel: "取消",
		acceptLabel: "删除",
		accept: async () => {
			try {
				const res = await handleApiRes(client.api
					.advertisements({ id: advertisement.id })
					.delete())


				if (res && res.code === 200) {
					toast.add({
						severity: "success",
						summary: "成功",
						detail: "广告删除成功",
						life: 3000,
					});
					loadAdvertisements();
				} else {
					throw new Error(res?.message || "删除失败");
				}
			} catch (error) {
				console.error("删除广告失败:", error);
				toast.add({
					severity: "error",
					summary: "错误",
					detail: "删除广告失败",
					life: 3000,
				});
			}
		},
	});
};

/**
 * 打开图片选择器
 */
const openImageSelector = () => {
	showImageSelector.value = true;
};

/**
 * 图片选择处理
 */
const onImageSelected = (imageUrl: string) => {
	initialValues.image = imageUrl;
	// 如果表单已经初始化，也更新表单字段值
	if (formRef.value) {
		formRef.value.setFieldValue('image', imageUrl);
	}
	showImageSelector.value = false;
};

/**
 * 图片加载错误处理
 */
// const handleImageError = (event: Event) => {
// 	const img = event.target as HTMLImageElement;
// 	img.src = "/placeholder-image.png"; // 设置默认图片
// };

/**
 * 表单提交处理
 */
const onFormSubmit = async ({ valid, values }: { valid: boolean; values: any }) => {
	if (!valid) {
		toast.add({ severity: 'warn', summary: '警告', detail: '请检查表单输入' })
		return
	}

	try {
		saving.value = true

		const requestData = {
			title: values.title?.trim() || '',
			type: values.type || 'carousel',
			image: values.image?.trim() || '',
			link: values.link?.trim() || undefined,
			position: values.position?.trim() || undefined,
			sortOrder: Number(values.sortOrder) || 0,
			isActive: Boolean(values.isActive),
			startDate: values.startDate || undefined,
			endDate: values.endDate || undefined,
		}

		let result
		if (editingAdvertisement.value) {
			// 更新广告
			result = await handleApiRes(client.api.advertisements({ id: editingAdvertisement.value.id }).put(requestData))
		} else {
			// 创建广告
			result = await handleApiRes(client.api.advertisements.post(requestData))
		}

		if (result && result.code === 200) {
			toast.add({
				severity: 'success',
				summary: '成功',
				detail: editingAdvertisement.value ? '广告更新成功' : '广告创建成功'
			})
			closeDialog()
			await loadAdvertisements()
		} else {
			toast.add({
				severity: 'error',
				summary: '错误',
				detail: result?.message || '操作失败'
			})
		}
	} catch (error) {
		console.error('保存广告失败:', error)
		toast.add({ severity: 'error', summary: '错误', detail: '保存广告失败' })
	} finally {
		saving.value = false
	}
};

/**
 * 显示创建对话框
 */
const showCreateDialogHandler = () => {
	editingAdvertisement.value = null;
	// 重置表单初始值
	Object.assign(initialValues, {
		title: "",
		type: "carousel",
		image: "",
		link: "",
		position: "",
		sortOrder: 0,
		isActive: true,
		startDate: null,
		endDate: null,
	});
	showCreateDialog.value = true;
};




// 生命周期
onMounted(() => {
	loadAdvertisements();
});
</script>

<template>
	<div class="advertisement-management">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-2xl font-bold text-gray-800">广告管理</h1>
			<Button @click="showCreateDialogHandler" icon="pi pi-plus" label="新增广告" class="p-button-success" />
		</div>

		<!-- 筛选器 -->
		<Card class="mb-6">
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2">广告类型</label>
						<Select v-model="filters.type" :options="typeOptions" optionLabel="label" optionValue="value"
							placeholder="选择类型" showClear @change="loadAdvertisements" class="w-full" />
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">广告位置</label>
						<Select v-model="filters.position" :options="positionOptions" optionLabel="label" optionValue="value"
							placeholder="选择位置" showClear @change="loadAdvertisements" class="w-full" />
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">状态</label>
						<Select v-model="filters.isActive" :options="statusOptions" optionLabel="label" optionValue="value"
							placeholder="选择状态" showClear @change="loadAdvertisements" class="w-full" />
					</div>
					<div class="flex items-end">
						<Button @click="resetFilters" icon="pi pi-refresh" label="重置" class="p-button-outlined" />
					</div>
				</div>
			</template>
		</Card>

		<!-- 广告列表 -->
		<Card>
			<template #content>
				<DataTable :value="advertisements" :loading="loading" paginator :rows="pageSize" :totalRecords="total"
					:lazy="true" @page="onPageChange" responsiveLayout="scroll" stripedRows :rowsPerPageOptions="[5, 10, 20, 50]"
					:first="(page - 1) * pageSize">
					<Column field="id" header="ID" :sortable="true" style="width: 80px" />

					<Column header="预览图" style="width: 120px">
						<template #body="{ data }">
							<img :src="data.image" :alt="data.title" class="w-16 h-10 object-cover rounded border" />
						</template>
					</Column>

					<Column field="title" header="标题" :sortable="true" />

					<Column field="type" header="类型" style="width: 100px">
						<template #body="{ data }">
							<Tag :value="getTypeLabel(data.type)" :severity="data.type === 'carousel' ? 'info' : 'warning'" />
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
							<Tag :value="data.isActive ? '启用' : '禁用'" :severity="data.isActive ? 'success' : 'danger'" />
						</template>
					</Column>

					<Column header="操作" style="width: 200px">
						<template #body="{ data }">
							<div class="flex gap-2">
								<Button @click="editAdvertisement(data)" icon="pi pi-pencil" size="small"
									class="p-button-outlined p-button-info" v-tooltip="'编辑'" />
								<Button @click="toggleStatus(data)" :icon="data.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" size="small"
									:class="data.isActive ? 'p-button-outlined p-button-warning' : 'p-button-outlined p-button-success'"
									v-tooltip="data.isActive ? '禁用' : '启用'" />
								<Button @click="deleteAdvertisement(data)" icon="pi pi-trash" size="small"
									class="p-button-outlined p-button-danger" v-tooltip="'删除'" />
							</div>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 创建/编辑对话框 -->
		<Dialog v-model:visible="showCreateDialog" :header="editingAdvertisement ? '编辑广告' : '新增广告'" modal
			class="w-full max-w-2xl" @hide="closeDialog">
			<Form ref="formRef" :resolver="formResolver" :initialValues @submit="onFormSubmit" class="space-y-4">
				<!-- 基本信息 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField v-slot="$field" name="title" :resolver="titleResolver" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">广告标题 *</label>
						<InputText v-model="$field.value" placeholder="请输入广告标题" class="w-full"
							:class="{ 'p-invalid': $field.invalid }" />
						<Message v-if="$field.invalid" severity="error" size="small" variant="simple">
							{{ $field.error?.message }}
						</Message>
					</FormField>

					<FormField v-slot="$field" name="type" :resolver="typeResolver" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">广告类型 *</label>
						<Select v-model="$field.value" :options="typeOptions" optionLabel="label" optionValue="value"
							placeholder="请选择广告类型" class="w-full" :class="{ 'p-invalid': $field.invalid }" />
						<Message v-if="$field.invalid" severity="error" size="small" variant="simple">
							{{ $field.error?.message }}
						</Message>
					</FormField>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField v-slot="$field" name="position" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">显示位置</label>
						<Select v-model="$field.value" :options="positionOptions" optionLabel="label" optionValue="value"
							placeholder="请选择显示位置" class="w-full" />
					</FormField>

					<FormField v-slot="$field" name="sortOrder" :resolver="sortOrderResolver" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">排序 *</label>
						<InputNumber v-model="$field.value" placeholder="请输入排序" class="w-full"
							:class="{ 'p-invalid': $field.invalid }" />
						<Message v-if="$field.invalid" severity="error" size="small" variant="simple">
							{{ $field.error?.message }}
						</Message>
					</FormField>
				</div>

				<!-- 图片选择 -->
				<FormField v-slot="$field" name="image" :resolver="imageResolver" class="flex flex-col gap-1">
					<label class="block text-sm font-medium mb-2">广告图片 *</label>
					<div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
						<div v-if="$field.value" class="text-center">
							<img :src="$field.value" alt="预览图" class="max-w-full max-h-48 mx-auto mb-2 rounded" />
							<div class="flex gap-2 justify-center">
								<Button @click="openImageSelector" icon="pi pi-pencil" label="更换图片"
									class="p-button-outlined p-button-info" size="small" />
								<Button @click="removeImage" icon="pi pi-times" label="移除图片" class="p-button-outlined p-button-danger"
									size="small" />
							</div>
						</div>
						<div v-else class="text-center">
							<i class="pi pi-images text-4xl text-gray-400 mb-2"></i>
							<p class="text-gray-500 mb-2">点击选择轮播图片</p>
							<Button @click="openImageSelector" icon="pi pi-plus" label="选择图片" class="p-button-outlined" />
						</div>
					</div>
					<Message v-if="$field.invalid" severity="error" size="small" variant="simple">
						{{ $field.error?.message }}
					</Message>
				</FormField>

				<!-- 链接地址 -->
				<FormField v-slot="$field" name="link" class="flex flex-col gap-1">
					<label class="block text-sm font-medium mb-2">链接地址</label>
					<InputText v-model="$field.value" placeholder="请输入点击跳转的链接地址" class="w-full" />
					<small class="text-gray-500">可选，点击广告时跳转的链接</small>
				</FormField>

				<!-- 时间设置 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField v-slot="$field" name="startDate" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">开始时间</label>
						<DatePicker v-model="$field.value" showTime hourFormat="24" placeholder="选择开始时间" class="w-full"
							showButtonBar />
					</FormField>

					<FormField v-slot="$field" name="endDate" class="flex flex-col gap-1">
						<label class="block text-sm font-medium mb-2">结束时间</label>
						<DatePicker v-model="$field.value" showTime hourFormat="24" placeholder="选择结束时间" class="w-full"
							showButtonBar />
					</FormField>
				</div>

				<!-- 状态设置 -->
				<FormField v-slot="$field" name="isActive" class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Checkbox v-model="$field.value" inputId="isActive" binary />
						<label for="isActive" class="text-sm font-medium">启用广告</label>
					</div>
				</FormField>
			</Form>

			<template #footer>
				<div class="flex justify-end gap-2">
					<Button @click="closeDialog" label="取消" class="p-button-outlined" />
					<Button @click="formRef?.submit()" :label="editingAdvertisement ? '更新' : '创建'" :loading="saving"
						class="p-button-success" />
				</div>
			</template>
		</Dialog>

		<!-- 图片选择器 -->
		<ImageSelector v-model:visible="showImageSelector" category="carousel" @select="onImageSelected" />

		<!-- 确认对话框 -->
		<ConfirmDialog />
	</div>
</template>



<style scoped>
.advertisement-management {
	@apply p-6;
}

.p-datatable .p-datatable-tbody>tr>td {
	@apply py-3;
}

.p-dialog .p-dialog-content {
	@apply p-6;
}
</style>