<script setup lang="ts">
// PrimeVue 组件
import ImageSelector from '@/app/components/ImageSelector.vue'
import { client } from '@/share/useTreaty'
import { Form, FormField } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import TreeSelect from 'primevue/treeselect'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'

const router = useRouter()
const toast = useToast()

// 表单初始值
const initialValues = reactive({
	name: '',
	slug: '',
	sku: '',
	barcode: '',
	categoryId: null,
	description: '',
	shortDescription: '',
	images: [] as string[],
	videos: [] as string[],
	colors: [] as string[],
	sizes: [] as string[],
	materials: [] as string[],
	careInstructions: '',
	features: [] as string[],
	specifications: '',
	price: 0,
	comparePrice: 0,
	cost: 0,
	stock: 0,
	minStock: 0,
	weight: 0,
	dimensions: '',
	trackInventory: false,
	isActive: true,
	isFeatured: false,
	metaTitle: '',
	metaDescription: '',
	metaKeywords: ''
})

// 表单验证器
const formResolver = zodResolver(
	z.object({
		name: z.string().min(1, { message: '商品名称不能为空' }).max(100, { message: '商品名称不能超过100个字符' }),
		slug: z.string().min(1, { message: 'URL标识符不能为空' }).regex(/^[a-z0-9-]+$/, { message: 'URL标识符只能包含小写字母、数字和连字符' }),
		sku: z.string().optional(),
		barcode: z.string().optional(),
		categoryId: z.any(),
		description: z.string().optional(),
		shortDescription: z.string().max(200, { message: '简短描述不能超过200个字符' }).optional(),
		images: z.array(z.string()).min(1, { message: '至少需要上传一张商品图片' }),
		videos: z.array(z.string()).optional(),
		colors: z.array(z.string()).optional(),
		sizes: z.array(z.string()).optional(),
		materials: z.array(z.string()).optional(),
		careInstructions: z.string().optional(),
		features: z.array(z.string()).optional(),
		specifications: z.string().optional(),
		price: z.number().min(0.01, { message: '商品价格必须大于0' }),
		comparePrice: z.number().min(0, { message: '对比价格不能为负数' }).optional(),
		cost: z.number().min(0, { message: '成本价格不能为负数' }).optional(),
		stock: z.number().min(0, { message: '库存数量不能为负数' }),
		minStock: z.number().min(0, { message: '最低库存不能为负数' }).optional(),
		weight: z.number().min(0, { message: '重量不能为负数' }).optional(),
		dimensions: z.string().optional(),
		isActive: z.boolean(),
		isFeatured: z.boolean(),
		metaTitle: z.string().max(60, { message: 'SEO标题不能超过60个字符' }).optional(),
		metaDescription: z.string().max(160, { message: 'SEO描述不能超过160个字符' }).optional(),
		metaKeywords: z.string().optional()
	}).refine((data) => {
		// 对比价格应该大于等于销售价格
		if (data.comparePrice && data.comparePrice > 0 && data.comparePrice < data.price) {
			return false
		}
		return true
	}, {
		message: '对比价格应该大于等于销售价格',
		path: ['comparePrice']
	})
)

// 单独的字段验证器
const nameResolver = zodResolver(z.string().min(1, { message: '商品名称不能为空' }).max(100, { message: '商品名称不能超过100个字符' }))
const slugResolver = zodResolver(z.string().min(1, { message: 'URL标识符不能为空' }).regex(/^[a-z0-9-]+$/, { message: 'URL标识符只能包含小写字母、数字和连字符' }))

const priceResolver = zodResolver(z.number().min(0.01, { message: '商品价格必须大于0' }))

const stockResolver = zodResolver(z.number().min(0, { message: '库存数量不能为负数' }))


// 新增规格
const newColor = ref('')
const newSize = ref('')
const newMaterial = ref('')
const newFeature = ref('')

// 商品分类
const categories = ref<any[]>([])

// 计算属性 - 用于TreeSelect的数据源
const treeData = computed(() => {
	// TreeSelect使用标准的TreeNode格式，key作为选中值，label作为显示文本
	const convertToTreeSelectFormat = (nodes: any[]): any[] => {
		return nodes.map(node => ({
			key: node.id, // TreeSelect的key就是选中时返回的值
			label: node.name,
			data: node,
			children: node.children && node.children.length > 0 ? convertToTreeSelectFormat(node.children) : undefined
		}))
	}

	return convertToTreeSelectFormat(categories.value)
})

// 加载状态
const saving = ref(false)
const publishing = ref(false)

// 当前操作类型
const currentAction = ref<'publish' | 'draft' | 'submit'>('submit')

// 表单引用
const formRef = ref<any>(null)

// 触发保存草稿
const triggerSaveDraft = () => {
	currentAction.value = 'draft'
	formRef.value?.submit()
}

// 触发发布商品
const triggerPublishProduct = () => {
	currentAction.value = 'publish'
	formRef.value?.submit()
}

// 表单提交处理
const onFormSubmit = async ({ valid, values }: { valid: boolean; values: any }) => {
	console.log('表单数据:', values)
	if (!valid) {
		toast.add({ severity: 'warn', summary: '警告', detail: '请检查表单输入', life: 1000 })
		return
	}

	// 根据当前操作类型调用相应的处理函数
	if (currentAction.value === 'draft') {
		await saveDraft({ valid, values })
	} else if (currentAction.value === 'publish') {
		await publishProduct({ valid, values })
	} else {
		// 默认提交行为
		try {
			saving.value = true

			// 调用API创建商品
			const { data, error } = await client.api.products.post(values)

			if (data) {
				toast.add({
					severity: 'success',
					summary: '成功',
					detail: '商品保存成功',
					life: 1000
				})

				// 跳转到商品列表页面
				// router.push('/admin/products')
			} else {
				throw new Error(error || '保存失败')
			}
		} catch (error) {
			console.error('保存商品失败:', error)
			toast.add({
				severity: 'error',
				summary: '错误',
				detail: '保存商品失败，请重试',
				life: 1000
			})
		} finally {
			saving.value = false
		}
	}

	// 重置操作类型
	currentAction.value = 'submit'
}

// 保存草稿
const saveDraft = async ({ valid, values }: { valid: boolean; values: any }) => {
	if (!valid) {
		toast.add({ severity: 'warn', summary: '警告', detail: '请检查表单输入', life: 1000 })
		return
	}

	try {
		saving.value = true

		// 准备商品数据
		const productData = {
			...values,
			isActive: false // 草稿状态设为不激活
		}

		// 调用API创建商品
		const { data, error } = await client.api.products.post(productData)

		if (data) {
			toast.add({
				severity: 'success',
				summary: '成功',
				detail: '草稿保存成功',
				life: 1000
			})

			// 跳转到商品列表页面
			router.push('/admin/products')
		} else {
			throw new Error(error || '保存失败')
		}
	} catch (error) {
		console.error('保存草稿失败:', error)
		toast.add({
			severity: 'error',
			summary: '错误',
			detail: '保存草稿失败，请重试',
			life: 1000
		})
	} finally {
		saving.value = false
	}
}

// 发布商品
const publishProduct = async ({ valid, values }: { valid: boolean; values: any }) => {
	if (!valid) {
		toast.add({ severity: 'warn', summary: '警告', detail: '请检查表单输入', life: 1000 })
		return
	}

	try {
		publishing.value = true

		// 准备商品数据
		const productData = {
			...values,
			isActive: true // 发布状态设为激活
		}

		// 调用API创建商品
		const { data, error } = await client.api.products.post(productData)

		if (data) {
			toast.add({
				severity: 'success',
				summary: '成功',
				detail: '商品发布成功',
				life: 1000
			})

			// 跳转到商品列表页面
			router.push('/admin/products')
		} else {
			throw new Error(error || '保存失败')
		}
	} catch (error) {
		console.error('发布商品失败:', error)
		toast.add({
			severity: 'error',
			summary: '错误',
			detail: '发布商品失败，请重试',
			life: 1000
		})
	} finally {
		publishing.value = false
	}
}



// 规格管理 - 已移除旧的函数，使用FormField版本

const addVideo = () => {
	initialValues.videos.push('')
}

const removeVideo = (index: number) => {
	initialValues.videos.splice(index, 1)
}



// 图片选择器相关
const showImageSelector = ref(false)



// 打开图片选择器
const openImageSelector = () => {
	showImageSelector.value = true
}

// 图片选择事件
const onImageSelected = (imageUrl: string) => {
	if (!initialValues.images.includes(imageUrl)) {
		initialValues.images.push(imageUrl)
		toast.add({
			severity: 'success',
			summary: '成功',
			detail: '图片添加成功',
			life: 1000
		})
	} else {
		toast.add({
			severity: 'warn',
			summary: '提示',
			detail: '图片已存在',
			life: 1000
		})
	}
	showImageSelector.value = false
}



// 新的字段处理函数
const addColor = () => {
	if (newColor.value.trim() && !initialValues.colors.includes(newColor.value.trim())) {
		initialValues.colors.push(newColor.value.trim())
		newColor.value = ''
	}
}

const addSize = () => {
	if (newSize.value.trim() && !initialValues.sizes.includes(newSize.value.trim())) {
		initialValues.sizes.push(newSize.value.trim())
		newSize.value = ''
	}
}

const addMaterial = () => {
	if (newMaterial.value.trim() && !initialValues.materials.includes(newMaterial.value.trim())) {
		initialValues.materials.push(newMaterial.value.trim())
		newMaterial.value = ''
	}
}

const addFeature = () => {
	if (newFeature.value.trim() && !initialValues.features.includes(newFeature.value.trim())) {
		initialValues.features.push(newFeature.value.trim())
		newFeature.value = ''
	}
}

const removeImage = (index: number) => {
	initialValues.images.splice(index, 1)
}

// 加载商品分类
const loadCategories = async () => {
	try {
		const { data, error } = await client.api.categories.tree.get()
		if (data && data.code === 200) {
			categories.value = data.data || []
		} else {
			console.error('获取分类失败:', error)
			categories.value = []
		}
	} catch (error) {
		console.error('加载分类失败:', error)
		categories.value = []
	}
}

// 组件挂载时加载数据
onMounted(() => {
	loadCategories()
})
</script>

<template>
	<div class="p-6">
		<Toast />
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-2xl font-bold text-gray-800">添加商品</h1>
			<div class="flex gap-3">
				<Button label="保存草稿" icon="pi pi-save" severity="secondary" @click="triggerSaveDraft"
					:loading="saving" />
				<Button label="发布商品" icon="pi pi-check" @click="triggerPublishProduct" :loading="publishing" />
			</div>
		</div>

		<!-- 商品表单 -->
		<Form ref="formRef" v-slot="$form" :initialValues :resolver="formResolver" @submit="onFormSubmit">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- 左侧主要信息 -->
				<div class="lg:col-span-2 space-y-6">
					<!-- 基本信息 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-info-circle text-blue-500"></i>
								基本信息
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 商品名称 -->
								<FormField v-slot="$field" name="name" :resolver="nameResolver"
									class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品名称 *</label>
									<InputText v-model="$field.value" placeholder="请输入商品名称" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- URL标识符 -->
								<FormField v-slot="$field" name="slug" :resolver="slugResolver"
									class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">URL标识符 *</label>
									<InputText v-model="$field.value" placeholder="请输入URL标识符" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
									<small class="text-gray-500">用于生成商品页面URL，只能包含字母、数字和连字符</small>
								</FormField>

								<!-- 商品编码 -->
								<FormField v-slot="$field" name="sku" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品编码</label>
									<InputText v-model="$field.value" placeholder="请输入商品编码" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 条形码 -->
								<FormField v-slot="$field" name="barcode" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">条形码</label>
									<InputText v-model="$field.value" placeholder="请输入条形码" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 商品分类 -->
								<FormField v-slot="$field" name="categoryId" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品分类 *</label>
									<TreeSelect v-model="$field.value" :options="treeData" placeholder="请选择商品分类"
										class="w-full" selectionMode="single" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 简短描述 -->
								<FormField v-slot="$field" name="shortDescription" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">简短描述</label>
									<Textarea v-model="$field.value" placeholder="请输入简短描述" class="w-full" rows="2" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
									<small class="text-gray-500">用于商品列表页面显示</small>
								</FormField>

								<!-- 详细描述 -->
								<FormField v-slot="$field" name="description" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
									<Textarea v-model="$field.value" placeholder="请输入详细描述" class="w-full" rows="4" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>

					<!-- 商品图片 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-image text-green-500"></i>
								商品图片
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 商品图片 -->
								<FormField v-slot="$field" name="images" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品图片 *</label>

									<!-- 图片选择器 -->
									<div class="space-y-4">
										<!-- 选择图片按钮 -->
										<Button @click="openImageSelector" icon="pi pi-images" label="选择图片" outlined />

										<!-- 已选择的图片展示 -->
										<div v-if="$field.value.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div v-for="(image, index) in $field.value" :key="index" class="relative group">
												<img :src="image" :alt="`商品图片 ${index + 1}`" class="w-full h-32 object-cover rounded-lg border" />
												<Button @click="removeImage(index)" icon="pi pi-times" size="small" severity="danger" rounded class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
										</div>

										<!-- 无图片时的提示 -->
										<div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
											<i class="pi pi-image text-4xl text-gray-400 mb-4"></i>
											<p class="text-gray-500">暂无图片，点击上方按钮选择图片</p>
										</div>
									</div>

									<small class="text-gray-500">支持 JPG、PNG 格式，建议尺寸 800x800px，最大5MB，最多10张</small>
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>

					<!-- 商品规格 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-cog text-purple-500"></i>
								商品规格
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 颜色规格 -->
								<div class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">颜色</label>
									<input type="hidden" name="colors" :value="JSON.stringify(initialValues.colors)" />
									<div class="flex flex-wrap gap-2">
										<div v-for="(color, index) in initialValues.colors" :key="index"
											class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
											<span>{{ color }}</span>
											<Button icon="pi pi-times" size="small" text
												@click="initialValues.colors.splice(index, 1)" />
										</div>
										<div class="flex items-center gap-2">
											<InputText v-model="newColor" placeholder="添加颜色" class="w-32"
												@keyup.enter="addColor" @keydown.stop @keypress.stop />
											<Button icon="pi pi-plus" size="small" @click="addColor" />
										</div>
									</div>
								</div>

								<!-- 尺寸规格 -->
								<div class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">尺寸</label>
									<input type="hidden" name="sizes" :value="JSON.stringify(initialValues.sizes)" />
									<div class="flex flex-wrap gap-2">
										<div v-for="(size, index) in initialValues.sizes" :key="index"
											class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
											<span>{{ size }}</span>
											<Button icon="pi pi-times" size="small" text
												@click="initialValues.sizes.splice(index, 1)" />
										</div>
										<div class="flex items-center gap-2">
											<InputText v-model="newSize" placeholder="添加尺寸" class="w-32"
												@keyup.enter="addSize" @keydown.stop @keypress.stop />
											<Button icon="pi pi-plus" size="small" @click="addSize" />
										</div>
									</div>
								</div>

								<!-- 材质 -->
								<div class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">材质</label>
									<input type="hidden" name="materials"
										:value="JSON.stringify(initialValues.materials)" />
									<div class="flex flex-wrap gap-2">
										<div v-for="(material, index) in initialValues.materials" :key="index"
											class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
											<span>{{ material }}</span>
											<Button icon="pi pi-times" size="small" text
												@click="initialValues.materials.splice(index, 1)" />
										</div>
										<div class="flex items-center gap-2">
											<InputText v-model="newMaterial" placeholder="添加材质" class="w-32"
												@keyup.enter="addMaterial" @keydown.stop @keypress.stop />
											<Button icon="pi pi-plus" size="small" @click="addMaterial" />
										</div>
									</div>
								</div>

								<!-- 特性 -->
								<div class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">特性</label>
									<input type="hidden" name="features"
										:value="JSON.stringify(initialValues.features)" />
									<div class="flex flex-wrap gap-2">
										<div v-for="(feature, index) in initialValues.features" :key="index"
											class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
											<span>{{ feature }}</span>
											<Button icon="pi pi-times" size="small" text
												@click="initialValues.features.splice(index, 1)" />
										</div>
										<div class="flex items-center gap-2">
											<InputText v-model="newFeature" placeholder="添加特性" class="w-32"
												@keyup.enter="addFeature" @keydown.stop @keypress.stop />
											<Button icon="pi pi-plus" size="small" @click="addFeature" />
										</div>
									</div>
								</div>

								<!-- 护理说明 -->
								<FormField v-slot="$field" name="careInstructions" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">护理说明</label>
									<Textarea v-model="$field.value" placeholder="请输入护理说明" class="w-full" rows="3" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 商品规格 -->
								<FormField v-slot="$field" name="specifications" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品规格</label>
									<Textarea v-model="$field.value" placeholder="请输入商品规格信息" class="w-full" rows="3" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 重量和尺寸 -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField v-slot="$field" name="weight" class="flex flex-col gap-1">
										<label class="block text-sm font-medium text-gray-700 mb-2">重量 (kg)</label>
										<InputNumber v-model="$field.value" placeholder="请输入重量" class="w-full" :min="0"
											:maxFractionDigits="2" />
										<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
											{{ $field.error?.message }}</Message>
									</FormField>
									<FormField v-slot="$field" name="dimensions" class="flex flex-col gap-1">
										<label class="block text-sm font-medium text-gray-700 mb-2">尺寸 (长x宽x高)</label>
										<InputText v-model="$field.value" placeholder="例如: 30x20x10 cm"
											class="w-full" />
										<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
											{{ $field.error?.message }}</Message>
									</FormField>
								</div>

								<!-- 商品视频 -->
								<FormField v-slot="$field" name="videos" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">商品视频</label>
									<div class="space-y-2">
										<div v-for="(video, index) in $field.value" :key="index"
											class="flex items-center gap-2">
											<InputText v-model="$field.value[index]" placeholder="请输入视频URL"
												class="flex-1" />
											<Button icon="pi pi-times" size="small" severity="danger"
												@click="$field.value.splice(index, 1)" />
										</div>
										<Button icon="pi pi-plus" label="添加视频" size="small" outlined
											@click="$field.value.push('')" />
									</div>
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>
				</div>

				<!-- 右侧信息 -->
				<div class="space-y-6">
					<!-- 价格设置 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-dollar text-green-500"></i>
								价格设置
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 销售价格 -->
								<FormField v-slot="$field" name="price" :resolver="priceResolver"
									class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">销售价格 *</label>
									<InputNumber v-model="$field.value" mode="currency" currency="USD" locale="en-US"
										class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 对比价格 -->
								<FormField v-slot="$field" name="comparePrice" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">对比价格</label>
									<InputNumber v-model="$field.value" mode="currency" currency="USD" locale="en-US"
										class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 成本价 -->
								<FormField v-slot="$field" name="cost" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">成本价</label>
									<InputNumber v-model="$field.value" mode="currency" currency="USD" locale="en-US"
										class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>

					<!-- 库存管理 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-box text-orange-500"></i>
								库存管理
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 库存数量 -->
								<FormField v-slot="$field" name="stock" :resolver="stockResolver"
									class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">库存数量 *</label>
									<InputNumber v-model="$field.value" :min="0" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 库存预警 -->
								<FormField v-slot="$field" name="minStock" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">最低库存预警</label>
									<InputNumber v-model="$field.value" :min="0" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
									<small class="text-gray-500">库存低于此数量时会收到提醒</small>
								</FormField>

								<!-- 库存跟踪 -->
								<FormField v-slot="$field" name="trackInventory" class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<Checkbox v-model="$field.value" binary />
										<label class="text-sm font-medium text-gray-700">跟踪库存</label>
									</div>
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>

					<!-- 商品状态 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-flag text-red-500"></i>
								商品状态
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- 商品启用 -->
								<FormField v-slot="$field" name="isActive" class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<Checkbox v-model="$field.value" binary />
										<label class="text-sm font-medium text-gray-700">商品启用</label>
									</div>
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- 推荐商品 -->
								<FormField v-slot="$field" name="isFeatured" class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<Checkbox v-model="$field.value" binary />
										<label class="text-sm font-medium text-gray-700">推荐商品</label>
									</div>
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>

					<!-- SEO设置 -->
					<Card>
						<template #title>
							<div class="flex items-center gap-2">
								<i class="pi pi-search text-blue-500"></i>
								SEO设置
							</div>
						</template>
						<template #content>
							<div class="space-y-4">
								<!-- SEO标题 -->
								<FormField v-slot="$field" name="metaTitle" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">SEO标题</label>
									<InputText v-model="$field.value" placeholder="请输入SEO标题" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- SEO描述 -->
								<FormField v-slot="$field" name="metaDescription" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">SEO描述</label>
									<Textarea v-model="$field.value" placeholder="请输入SEO描述" class="w-full" rows="3" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>

								<!-- SEO关键词 -->
								<FormField v-slot="$field" name="metaKeywords" class="flex flex-col gap-1">
									<label class="block text-sm font-medium text-gray-700 mb-2">SEO关键词</label>
									<InputText v-model="$field.value" placeholder="请输入SEO关键词，用逗号分隔" class="w-full" />
									<Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
										$field.error?.message }}</Message>
								</FormField>
							</div>
						</template>
					</Card>
				</div>
			</div>
		</Form>
	</div>

	<!-- 图片选择器组件 -->
	<ImageSelector v-model:visible="showImageSelector" category="products" @select="onImageSelected" />
</template>



<style scoped>
/* 自定义样式 */
.p-card {
	@apply shadow-sm border border-gray-200;
}

.p-card .p-card-title {
	@apply text-lg font-semibold text-gray-800 mb-4;
}

.p-inputtext,
.p-dropdown,
.p-inputnumber {
	@apply border-gray-300 focus:border-blue-500;
}

.p-button {
	@apply transition-all duration-200;
}

.p-error {
	@apply text-red-500 text-sm mt-1;
}

.p-invalid {
	@apply border-red-500;
}
</style>