<template>
	<div class="p-6">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">物流设置</h1>
				<p class="text-gray-600 mt-1">配置物流方式、运费计算和配送区域</p>
			</div>
			<div class="flex gap-3">
				<Button 
					label="重置配置" 
					icon="pi pi-refresh" 
					severity="secondary" 
					@click="resetSettings"
				/>
				<Button 
					label="保存设置" 
					icon="pi pi-save" 
					@click="saveSettings"
					:loading="saving"
				/>
			</div>
		</div>

		<!-- 物流方式配置 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- 快递配送 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-truck text-blue-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">快递配送</h3>
								<p class="text-sm text-gray-500">标准快递配送服务</p>
							</div>
						</div>
						<ToggleSwitch v-model="shippingSettings.express.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !shippingSettings.express.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">基础运费</label>
							<InputNumber 
								v-model="shippingSettings.express.baseFee" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="输入基础运费"
								class="w-full"
								mode="currency"
								currency="CNY"
								:disabled="!shippingSettings.express.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">免邮门槛</label>
							<InputNumber 
								v-model="shippingSettings.express.freeThreshold" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="输入免邮门槛"
								class="w-full"
								mode="currency"
								currency="CNY"
								:disabled="!shippingSettings.express.enabled"
							/>
							<small class="text-gray-500">订单金额达到此数值时免运费</small>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">配送时间</label>
							<InputText 
								v-model="shippingSettings.express.deliveryTime" 
								placeholder="例如：1-3个工作日"
								class="w-full"
								:disabled="!shippingSettings.express.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">重量计费</label>
							<div class="grid grid-cols-2 gap-2">
								<InputNumber 
									v-model="shippingSettings.express.weightUnit" 
									:min="0.1" 
									:maxFractionDigits="1"
									placeholder="重量单位"
									class="w-full"
									suffix=" kg"
									:disabled="!shippingSettings.express.enabled"
								/>
								<InputNumber 
									v-model="shippingSettings.express.weightFee" 
									:min="0" 
									:maxFractionDigits="2"
									placeholder="每单位费用"
									class="w-full"
									mode="currency"
									currency="CNY"
									:disabled="!shippingSettings.express.enabled"
								/>
							</div>
							<small class="text-gray-500">超出基础重量后的计费标准</small>
						</div>
					</div>
				</template>
			</Card>

			<!-- 同城配送 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-map-marker text-green-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">同城配送</h3>
								<p class="text-sm text-gray-500">本地快速配送服务</p>
							</div>
						</div>
						<ToggleSwitch v-model="shippingSettings.local.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !shippingSettings.local.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">配送费用</label>
							<InputNumber 
								v-model="shippingSettings.local.fee" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="输入配送费用"
								class="w-full"
								mode="currency"
								currency="CNY"
								:disabled="!shippingSettings.local.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">配送范围（公里）</label>
							<InputNumber 
								v-model="shippingSettings.local.range" 
								:min="1" 
								:max="100"
								placeholder="输入配送范围"
								class="w-full"
								suffix=" km"
								:disabled="!shippingSettings.local.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">配送时间</label>
							<InputText 
								v-model="shippingSettings.local.deliveryTime" 
								placeholder="例如：2-4小时"
								class="w-full"
								:disabled="!shippingSettings.local.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">服务时间</label>
							<div class="grid grid-cols-2 gap-2">
								<Calendar 
									v-model="shippingSettings.local.serviceStart" 
									timeOnly 
									hourFormat="24"
									placeholder="开始时间"
									class="w-full"
									:disabled="!shippingSettings.local.enabled"
								/>
								<Calendar 
									v-model="shippingSettings.local.serviceEnd" 
									timeOnly 
									hourFormat="24"
									placeholder="结束时间"
									class="w-full"
									:disabled="!shippingSettings.local.enabled"
								/>
							</div>
						</div>
					</div>
				</template>
			</Card>

			<!-- 自提服务 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-home text-orange-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">自提服务</h3>
								<p class="text-sm text-gray-500">到店自提服务</p>
							</div>
						</div>
						<ToggleSwitch v-model="shippingSettings.pickup.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !shippingSettings.pickup.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">自提地址</label>
							<Textarea 
								v-model="shippingSettings.pickup.address" 
								placeholder="请输入自提地址"
								rows="2"
								class="w-full"
								:disabled="!shippingSettings.pickup.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
							<InputText 
								v-model="shippingSettings.pickup.phone" 
								placeholder="请输入联系电话"
								class="w-full"
								:disabled="!shippingSettings.pickup.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">营业时间</label>
							<InputText 
								v-model="shippingSettings.pickup.businessHours" 
								placeholder="例如：周一至周日 9:00-18:00"
								class="w-full"
								:disabled="!shippingSettings.pickup.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">准备时间</label>
							<InputText 
								v-model="shippingSettings.pickup.prepareTime" 
								placeholder="例如：下单后2小时可取"
								class="w-full"
								:disabled="!shippingSettings.pickup.enabled"
							/>
						</div>
					</div>
				</template>
			</Card>

			<!-- 国际配送 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-globe text-purple-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">国际配送</h3>
								<p class="text-sm text-gray-500">跨境物流服务</p>
							</div>
						</div>
						<ToggleSwitch v-model="shippingSettings.international.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !shippingSettings.international.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">基础运费</label>
							<InputNumber 
								v-model="shippingSettings.international.baseFee" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="输入基础运费"
								class="w-full"
								mode="currency"
								currency="USD"
								:disabled="!shippingSettings.international.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">配送时间</label>
							<InputText 
								v-model="shippingSettings.international.deliveryTime" 
								placeholder="例如：7-15个工作日"
								class="w-full"
								:disabled="!shippingSettings.international.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支持的国家/地区</label>
							<MultiSelect 
								v-model="shippingSettings.international.supportedCountries" 
								:options="countryOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择支持的国家/地区"
								class="w-full"
								:disabled="!shippingSettings.international.enabled"
								display="chip"
								:maxSelectedLabels="3"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">关税说明</label>
							<Textarea 
								v-model="shippingSettings.international.customsNote" 
								placeholder="请输入关税相关说明"
								rows="2"
								class="w-full"
								:disabled="!shippingSettings.international.enabled"
							/>
						</div>
					</div>
				</template>
			</Card>
		</div>

		<!-- 配送区域设置 -->
		<Card class="mb-6">
			<template #header>
				<div class="flex items-center justify-between p-4 border-b">
					<div>
						<h3 class="text-lg font-semibold">配送区域设置</h3>
						<p class="text-sm text-gray-500 mt-1">配置不同区域的运费标准</p>
					</div>
					<Button 
						label="添加区域" 
						icon="pi pi-plus" 
						size="small" 
						@click="addShippingZone"
					/>
				</div>
			</template>
			<template #content>
				<DataTable 
					:value="shippingSettings.zones" 
					stripedRows 
					responsiveLayout="scroll"
					class="p-datatable-sm"
				>
					<Column field="name" header="区域名称" style="min-width: 150px">
						<template #body="{ data, index }">
							<InputText 
								v-model="data.name" 
								placeholder="输入区域名称"
								class="w-full"
								size="small"
							/>
						</template>
					</Column>
					<Column field="areas" header="包含地区" style="min-width: 200px">
						<template #body="{ data }">
							<MultiSelect 
								v-model="data.areas" 
								:options="areaOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择地区"
								class="w-full"
								display="chip"
								:maxSelectedLabels="2"
							/>
						</template>
					</Column>
					<Column field="baseFee" header="基础运费" style="min-width: 120px">
						<template #body="{ data }">
							<InputNumber 
								v-model="data.baseFee" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="运费"
								class="w-full"
								mode="currency"
								currency="CNY"
								size="small"
							/>
						</template>
					</Column>
					<Column field="freeThreshold" header="免邮门槛" style="min-width: 120px">
						<template #body="{ data }">
							<InputNumber 
								v-model="data.freeThreshold" 
								:min="0" 
								:maxFractionDigits="2"
								placeholder="免邮门槛"
								class="w-full"
								mode="currency"
								currency="CNY"
								size="small"
							/>
						</template>
					</Column>
					<Column field="enabled" header="启用" style="min-width: 80px">
						<template #body="{ data }">
							<ToggleSwitch v-model="data.enabled" size="small" />
						</template>
					</Column>
					<Column header="操作" style="min-width: 100px">
						<template #body="{ index }">
							<Button 
								icon="pi pi-trash" 
								severity="danger" 
								size="small" 
								text 
								@click="removeShippingZone(index)"
							/>
						</template>
					</Column>
				</DataTable>
			</template>
		</Card>

		<!-- 通用设置 -->
		<Card>
			<template #header>
				<div class="p-4 border-b">
					<h3 class="text-lg font-semibold">通用设置</h3>
					<p class="text-sm text-gray-500 mt-1">物流相关的通用配置</p>
				</div>
			</template>
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<!-- 默认重量单位 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">默认重量单位</label>
						<Select 
							v-model="shippingSettings.general.weightUnit" 
							:options="weightUnitOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择重量单位"
							class="w-full"
						/>
					</div>

					<!-- 默认尺寸单位 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">默认尺寸单位</label>
						<Select 
							v-model="shippingSettings.general.dimensionUnit" 
							:options="dimensionUnitOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择尺寸单位"
							class="w-full"
						/>
					</div>

					<!-- 包装费用 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">包装费用</label>
						<InputNumber 
							v-model="shippingSettings.general.packagingFee" 
							:min="0" 
							:maxFractionDigits="2"
							placeholder="输入包装费用"
							class="w-full"
							mode="currency"
							currency="CNY"
						/>
					</div>

					<!-- 处理时间 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">订单处理时间（小时）</label>
						<InputNumber 
							v-model="shippingSettings.general.processingTime" 
							:min="1" 
							:max="168"
							placeholder="输入处理时间"
							class="w-full"
							suffix=" 小时"
						/>
					</div>

					<!-- 最大重量限制 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">最大重量限制（kg）</label>
						<InputNumber 
							v-model="shippingSettings.general.maxWeight" 
							:min="1" 
							:maxFractionDigits="1"
							placeholder="输入最大重量"
							class="w-full"
							suffix=" kg"
						/>
					</div>

					<!-- 自动计算运费 -->
					<div class="flex items-center gap-3">
						<ToggleSwitch v-model="shippingSettings.general.autoCalculate" />
						<div>
							<label class="block text-sm font-medium text-gray-700">自动计算运费</label>
							<p class="text-xs text-gray-500">根据重量和距离自动计算</p>
						</div>
					</div>
				</div>

				<!-- 物流跟踪设置 -->
				<div class="mt-6 pt-6 border-t border-gray-200">
					<h4 class="text-md font-semibold mb-4">物流跟踪设置</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">跟踪API接口</label>
							<InputText 
								v-model="shippingSettings.general.trackingApiUrl" 
								placeholder="https://api.tracking.com/v1/track"
								class="w-full"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
							<Password 
								v-model="shippingSettings.general.trackingApiKey" 
								placeholder="请输入API密钥"
								class="w-full"
								:feedback="false"
								toggleMask
							/>
						</div>
					</div>
					<div class="flex items-center gap-3 mt-4">
						<ToggleSwitch v-model="shippingSettings.general.enableTracking" />
						<div>
							<label class="block text-sm font-medium text-gray-700">启用物流跟踪</label>
							<p class="text-xs text-gray-500">为客户提供实时物流跟踪服务</p>
						</div>
					</div>
				</div>
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'

// 类型定义
interface ShippingZone {
	id: string
	name: string
	areas: string[]
	baseFee: number
	freeThreshold: number
	enabled: boolean
}

interface ShippingSettings {
	express: {
		enabled: boolean
		baseFee: number
		freeThreshold: number
		deliveryTime: string
		weightUnit: number
		weightFee: number
	}
	local: {
		enabled: boolean
		fee: number
		range: number
		deliveryTime: string
		serviceStart: Date | null
		serviceEnd: Date | null
	}
	pickup: {
		enabled: boolean
		address: string
		phone: string
		businessHours: string
		prepareTime: string
	}
	international: {
		enabled: boolean
		baseFee: number
		deliveryTime: string
		supportedCountries: string[]
		customsNote: string
	}
	zones: ShippingZone[]
	general: {
		weightUnit: string
		dimensionUnit: string
		packagingFee: number
		processingTime: number
		maxWeight: number
		autoCalculate: boolean
		trackingApiUrl: string
		trackingApiKey: string
		enableTracking: boolean
	}
}

const confirm = useConfirm()
const toast = useToast()

// 响应式数据
const saving = ref(false)

// 物流设置数据
const shippingSettings = reactive<ShippingSettings>({
	express: {
		enabled: true,
		baseFee: 10,
		freeThreshold: 99,
		deliveryTime: '1-3个工作日',
		weightUnit: 1,
		weightFee: 5
	},
	local: {
		enabled: false,
		fee: 8,
		range: 20,
		deliveryTime: '2-4小时',
		serviceStart: null,
		serviceEnd: null
	},
	pickup: {
		enabled: true,
		address: '',
		phone: '',
		businessHours: '周一至周日 9:00-18:00',
		prepareTime: '下单后2小时可取'
	},
	international: {
		enabled: false,
		baseFee: 25,
		deliveryTime: '7-15个工作日',
		supportedCountries: [],
		customsNote: ''
	},
	zones: [
		{
			id: '1',
			name: '江浙沪地区',
			areas: ['shanghai', 'jiangsu', 'zhejiang'],
			baseFee: 8,
			freeThreshold: 88,
			enabled: true
		},
		{
			id: '2',
			name: '偏远地区',
			areas: ['xinjiang', 'tibet', 'qinghai'],
			baseFee: 20,
			freeThreshold: 200,
			enabled: true
		}
	],
	general: {
		weightUnit: 'kg',
		dimensionUnit: 'cm',
		packagingFee: 2,
		processingTime: 24,
		maxWeight: 30,
		autoCalculate: true,
		trackingApiUrl: '',
		trackingApiKey: '',
		enableTracking: false
	}
})

// 选项数据
const countryOptions = [
	{ label: '美国', value: 'US' },
	{ label: '加拿大', value: 'CA' },
	{ label: '英国', value: 'GB' },
	{ label: '德国', value: 'DE' },
	{ label: '法国', value: 'FR' },
	{ label: '日本', value: 'JP' },
	{ label: '韩国', value: 'KR' },
	{ label: '澳大利亚', value: 'AU' },
	{ label: '新西兰', value: 'NZ' },
	{ label: '新加坡', value: 'SG' }
]

const areaOptions = [
	{ label: '北京', value: 'beijing' },
	{ label: '上海', value: 'shanghai' },
	{ label: '天津', value: 'tianjin' },
	{ label: '重庆', value: 'chongqing' },
	{ label: '河北', value: 'hebei' },
	{ label: '山西', value: 'shanxi' },
	{ label: '辽宁', value: 'liaoning' },
	{ label: '吉林', value: 'jilin' },
	{ label: '黑龙江', value: 'heilongjiang' },
	{ label: '江苏', value: 'jiangsu' },
	{ label: '浙江', value: 'zhejiang' },
	{ label: '安徽', value: 'anhui' },
	{ label: '福建', value: 'fujian' },
	{ label: '江西', value: 'jiangxi' },
	{ label: '山东', value: 'shandong' },
	{ label: '河南', value: 'henan' },
	{ label: '湖北', value: 'hubei' },
	{ label: '湖南', value: 'hunan' },
	{ label: '广东', value: 'guangdong' },
	{ label: '广西', value: 'guangxi' },
	{ label: '海南', value: 'hainan' },
	{ label: '四川', value: 'sichuan' },
	{ label: '贵州', value: 'guizhou' },
	{ label: '云南', value: 'yunnan' },
	{ label: '西藏', value: 'tibet' },
	{ label: '陕西', value: 'shaanxi' },
	{ label: '甘肃', value: 'gansu' },
	{ label: '青海', value: 'qinghai' },
	{ label: '宁夏', value: 'ningxia' },
	{ label: '新疆', value: 'xinjiang' },
	{ label: '内蒙古', value: 'neimenggu' },
	{ label: '香港', value: 'hongkong' },
	{ label: '澳门', value: 'macao' },
	{ label: '台湾', value: 'taiwan' }
]

const weightUnitOptions = [
	{ label: '千克 (kg)', value: 'kg' },
	{ label: '克 (g)', value: 'g' },
	{ label: '磅 (lb)', value: 'lb' },
	{ label: '盎司 (oz)', value: 'oz' }
]

const dimensionUnitOptions = [
	{ label: '厘米 (cm)', value: 'cm' },
	{ label: '米 (m)', value: 'm' },
	{ label: '英寸 (in)', value: 'in' },
	{ label: '英尺 (ft)', value: 'ft' }
]

// 加载物流设置
const loadSettings = async () => {
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// 这里应该从后端API加载实际的物流设置
		console.log('物流设置加载完成')
		
	} catch (error) {
		console.error('加载物流设置失败:', error)
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: '加载物流设置时发生错误',
			life: 3000
		})
	}
}

// 保存设置
const saveSettings = async () => {
	saving.value = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 2000))
		
		// 这里应该调用后端API保存物流设置
		console.log('保存物流设置:', shippingSettings)
		
		toast.add({
			severity: 'success',
			summary: '保存成功',
			detail: '物流设置已成功保存',
			life: 3000
		})
		
	} catch (error) {
		console.error('保存物流设置失败:', error)
		toast.add({
			severity: 'error',
			summary: '保存失败',
			detail: '保存物流设置时发生错误',
			life: 3000
		})
	} finally {
		saving.value = false
	}
}

// 重置设置
const resetSettings = () => {
	confirm.require({
		message: '确定要重置所有物流设置吗？此操作不可撤销。',
		header: '重置确认',
		icon: 'pi pi-exclamation-triangle',
		accept: () => {
			// 重置为默认值
			Object.assign(shippingSettings, {
				express: {
					enabled: true,
					baseFee: 10,
					freeThreshold: 99,
					deliveryTime: '1-3个工作日',
					weightUnit: 1,
					weightFee: 5
				},
				local: {
					enabled: false,
					fee: 8,
					range: 20,
					deliveryTime: '2-4小时',
					serviceStart: null,
					serviceEnd: null
				},
				pickup: {
					enabled: true,
					address: '',
					phone: '',
					businessHours: '周一至周日 9:00-18:00',
					prepareTime: '下单后2小时可取'
				},
				international: {
					enabled: false,
					baseFee: 25,
					deliveryTime: '7-15个工作日',
					supportedCountries: [],
					customsNote: ''
				},
				zones: [],
				general: {
					weightUnit: 'kg',
					dimensionUnit: 'cm',
					packagingFee: 2,
					processingTime: 24,
					maxWeight: 30,
					autoCalculate: true,
					trackingApiUrl: '',
					trackingApiKey: '',
					enableTracking: false
				}
			})
			
			toast.add({
				severity: 'success',
				summary: '重置成功',
				detail: '物流设置已重置为默认值',
				life: 3000
			})
		}
	})
}

// 添加配送区域
const addShippingZone = () => {
	const newZone: ShippingZone = {
		id: Date.now().toString(),
		name: '',
		areas: [],
		baseFee: 10,
		freeThreshold: 99,
		enabled: true
	}
	shippingSettings.zones.push(newZone)
}

// 删除配送区域
const removeShippingZone = (index: number) => {
	confirm.require({
		message: '确定要删除这个配送区域吗？',
		header: '删除确认',
		icon: 'pi pi-exclamation-triangle',
		accept: () => {
			shippingSettings.zones.splice(index, 1)
			toast.add({
				severity: 'success',
				summary: '删除成功',
				detail: '配送区域已删除',
				life: 3000
			})
		}
	})
}

// 组件挂载时加载设置
onMounted(() => {
	loadSettings()
})
</script>

<style scoped>
/* 自定义样式 */
.p-datatable .p-datatable-tbody > tr > td {
	padding: 0.5rem;
}

.p-card .p-card-content {
	padding: 1.5rem;
}

.p-inputswitch.p-inputswitch-sm {
	width: 2rem;
	height: 1.25rem;
}

.p-inputswitch.p-inputswitch-sm .p-inputswitch-slider {
	height: 1.25rem;
	width: 2rem;
}

.p-inputswitch.p-inputswitch-sm .p-inputswitch-slider:before {
	height: 1rem;
	width: 1rem;
	margin-top: 0.125rem;
}
</style>