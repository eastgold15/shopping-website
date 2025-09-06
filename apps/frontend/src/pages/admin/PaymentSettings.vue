<template>
	<div class="p-6">
		<!-- 页面标题 -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">支付设置</h1>
				<p class="text-gray-600 mt-1">配置网站支付方式和相关参数</p>
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

		<!-- 支付方式配置 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 支付宝配置 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-credit-card text-blue-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">支付宝</h3>
								<p class="text-sm text-gray-500">Alipay 支付配置</p>
							</div>
						</div>
						<ToggleSwitch v-model="paymentSettings.alipay.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !paymentSettings.alipay.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">应用ID (App ID)</label>
							<InputText 
								v-model="paymentSettings.alipay.appId" 
								placeholder="请输入支付宝应用ID"
								class="w-full"
								:disabled="!paymentSettings.alipay.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">商户私钥</label>
							<Textarea 
								v-model="paymentSettings.alipay.privateKey" 
								placeholder="请输入商户私钥"
								rows="3"
								class="w-full"
								:disabled="!paymentSettings.alipay.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支付宝公钥</label>
							<Textarea 
								v-model="paymentSettings.alipay.publicKey" 
								placeholder="请输入支付宝公钥"
								rows="3"
								class="w-full"
								:disabled="!paymentSettings.alipay.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">环境设置</label>
							<Select 
								v-model="paymentSettings.alipay.environment" 
								:options="environmentOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择环境"
								class="w-full"
								:disabled="!paymentSettings.alipay.enabled"
							/>
						</div>
						<div class="flex items-center gap-2">
							<Button 
								label="测试连接" 
								icon="pi pi-check" 
								size="small" 
								severity="info" 
								@click="testConnection('alipay')"
								:disabled="!paymentSettings.alipay.enabled"
								:loading="testing.alipay"
							/>
						</div>
					</div>
				</template>
			</Card>

			<!-- 微信支付配置 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-mobile text-green-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">微信支付</h3>
								<p class="text-sm text-gray-500">WeChat Pay 支付配置</p>
							</div>
						</div>
						<ToggleSwitch v-model="paymentSettings.wechat.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !paymentSettings.wechat.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">应用ID (AppID)</label>
							<InputText 
								v-model="paymentSettings.wechat.appId" 
								placeholder="请输入微信应用ID"
								class="w-full"
								:disabled="!paymentSettings.wechat.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">商户号 (MCH ID)</label>
							<InputText 
								v-model="paymentSettings.wechat.mchId" 
								placeholder="请输入微信商户号"
								class="w-full"
								:disabled="!paymentSettings.wechat.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
							<Password 
								v-model="paymentSettings.wechat.apiKey" 
								placeholder="请输入API密钥"
								class="w-full"
								:disabled="!paymentSettings.wechat.enabled"
								:feedback="false"
								toggleMask
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">证书文件</label>
							<FileUpload 
								mode="basic" 
								chooseLabel="选择证书文件"
								accept=".p12,.pem"
								:maxFileSize="1000000"
								@select="onCertificateSelect"
								:disabled="!paymentSettings.wechat.enabled"
								class="w-full"
							/>
							<small class="text-gray-500">支持 .p12 和 .pem 格式的证书文件</small>
						</div>
						<div class="flex items-center gap-2">
							<Button 
								label="测试连接" 
								icon="pi pi-check" 
								size="small" 
								severity="info" 
								@click="testConnection('wechat')"
								:disabled="!paymentSettings.wechat.enabled"
								:loading="testing.wechat"
							/>
						</div>
					</div>
				</template>
			</Card>

			<!-- PayPal配置 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-paypal text-blue-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">PayPal</h3>
								<p class="text-sm text-gray-500">PayPal 支付配置</p>
							</div>
						</div>
						<ToggleSwitch v-model="paymentSettings.paypal.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !paymentSettings.paypal.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">客户端ID (Client ID)</label>
							<InputText 
								v-model="paymentSettings.paypal.clientId" 
								placeholder="请输入PayPal客户端ID"
								class="w-full"
								:disabled="!paymentSettings.paypal.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">客户端密钥 (Client Secret)</label>
							<Password 
								v-model="paymentSettings.paypal.clientSecret" 
								placeholder="请输入PayPal客户端密钥"
								class="w-full"
								:disabled="!paymentSettings.paypal.enabled"
								:feedback="false"
								toggleMask
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">环境设置</label>
							<Select 
								v-model="paymentSettings.paypal.environment" 
								:options="environmentOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择环境"
								class="w-full"
								:disabled="!paymentSettings.paypal.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支持的货币</label>
							<MultiSelect 
								v-model="paymentSettings.paypal.supportedCurrencies" 
								:options="currencyOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择支持的货币"
								class="w-full"
								:disabled="!paymentSettings.paypal.enabled"
								display="chip"
							/>
						</div>
						<div class="flex items-center gap-2">
							<Button 
								label="测试连接" 
								icon="pi pi-check" 
								size="small" 
								severity="info" 
								@click="testConnection('paypal')"
								:disabled="!paymentSettings.paypal.enabled"
								:loading="testing.paypal"
							/>
						</div>
					</div>
				</template>
			</Card>

			<!-- 银行卡支付配置 -->
			<Card>
				<template #header>
					<div class="flex items-center justify-between p-4 border-b">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
								<i class="pi pi-credit-card text-purple-600 text-xl"></i>
							</div>
							<div>
								<h3 class="text-lg font-semibold">银行卡支付</h3>
								<p class="text-sm text-gray-500">银联、Visa、MasterCard等</p>
							</div>
						</div>
						<ToggleSwitch v-model="paymentSettings.bankCard.enabled" />
					</div>
				</template>
				<template #content>
					<div class="space-y-4" :class="{ 'opacity-50': !paymentSettings.bankCard.enabled }">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支付网关</label>
							<Select 
								v-model="paymentSettings.bankCard.gateway" 
								:options="gatewayOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择支付网关"
								class="w-full"
								:disabled="!paymentSettings.bankCard.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">商户ID</label>
							<InputText 
								v-model="paymentSettings.bankCard.merchantId" 
								placeholder="请输入商户ID"
								class="w-full"
								:disabled="!paymentSettings.bankCard.enabled"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
							<Password 
								v-model="paymentSettings.bankCard.apiKey" 
								placeholder="请输入API密钥"
								class="w-full"
								:disabled="!paymentSettings.bankCard.enabled"
								:feedback="false"
								toggleMask
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支持的卡类型</label>
							<MultiSelect 
								v-model="paymentSettings.bankCard.supportedCards" 
								:options="cardTypeOptions" 
								optionLabel="label" 
								optionValue="value"
								placeholder="选择支持的卡类型"
								class="w-full"
								:disabled="!paymentSettings.bankCard.enabled"
								display="chip"
							/>
						</div>
						<div class="flex items-center gap-2">
							<Button 
								label="测试连接" 
								icon="pi pi-check" 
								size="small" 
								severity="info" 
								@click="testConnection('bankCard')"
								:disabled="!paymentSettings.bankCard.enabled"
								:loading="testing.bankCard"
							/>
						</div>
					</div>
				</template>
			</Card>
		</div>

		<!-- 通用设置 -->
		<Card class="mt-6">
			<template #header>
				<div class="p-4 border-b">
					<h3 class="text-lg font-semibold">通用设置</h3>
					<p class="text-sm text-gray-500 mt-1">支付相关的通用配置</p>
				</div>
			</template>
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<!-- 默认货币 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">默认货币</label>
						<Select 
							v-model="paymentSettings.general.defaultCurrency" 
							:options="currencyOptions" 
							optionLabel="label" 
							optionValue="value"
							placeholder="选择默认货币"
							class="w-full"
						/>
					</div>

					<!-- 支付超时时间 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">支付超时时间（分钟）</label>
						<InputNumber 
							v-model="paymentSettings.general.paymentTimeout" 
							:min="5" 
							:max="1440"
							placeholder="输入超时时间"
							class="w-full"
							suffix=" 分钟"
						/>
					</div>

					<!-- 最小支付金额 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">最小支付金额</label>
						<InputNumber 
							v-model="paymentSettings.general.minAmount" 
							:min="0.01" 
							:maxFractionDigits="2"
							placeholder="输入最小金额"
							class="w-full"
							mode="currency"
							currency="CNY"
						/>
					</div>

					<!-- 最大支付金额 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">最大支付金额</label>
						<InputNumber 
							v-model="paymentSettings.general.maxAmount" 
							:min="1" 
							:maxFractionDigits="2"
							placeholder="输入最大金额"
							class="w-full"
							mode="currency"
							currency="CNY"
						/>
					</div>

					<!-- 手续费率 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">手续费率（%）</label>
						<InputNumber 
							v-model="paymentSettings.general.feeRate" 
							:min="0" 
							:max="10"
							:maxFractionDigits="2"
							placeholder="输入手续费率"
							class="w-full"
							suffix="%"
						/>
					</div>

					<!-- 自动确认支付 -->
					<div class="flex items-center gap-3">
						<ToggleSwitch v-model="paymentSettings.general.autoConfirm" />
						<div>
							<label class="block text-sm font-medium text-gray-700">自动确认支付</label>
							<p class="text-xs text-gray-500">收到支付通知后自动确认订单</p>
						</div>
					</div>
				</div>

				<!-- 回调设置 -->
				<div class="mt-6 pt-6 border-t border-gray-200">
					<h4 class="text-md font-semibold mb-4">回调设置</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支付成功回调URL</label>
							<InputText 
								v-model="paymentSettings.general.successCallbackUrl" 
								placeholder="https://your-domain.com/payment/success"
								class="w-full"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">支付失败回调URL</label>
							<InputText 
								v-model="paymentSettings.general.failureCallbackUrl" 
								placeholder="https://your-domain.com/payment/failure"
								class="w-full"
							/>
						</div>
					</div>
				</div>
			</template>
		</Card>

		<!-- 测试工具 -->
		<Card class="mt-6">
			<template #header>
				<div class="p-4 border-b">
					<h3 class="text-lg font-semibold">测试工具</h3>
					<p class="text-sm text-gray-500 mt-1">测试支付配置和功能</p>
				</div>
			</template>
			<template #content>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Button 
						label="测试支付宝" 
						icon="pi pi-credit-card" 
						severity="info" 
						@click="testPayment('alipay')"
						:disabled="!paymentSettings.alipay.enabled"
						class="w-full"
					/>
					<Button 
						label="测试微信支付" 
						icon="pi pi-mobile" 
						severity="success" 
						@click="testPayment('wechat')"
						:disabled="!paymentSettings.wechat.enabled"
						class="w-full"
					/>
					<Button 
						label="测试PayPal" 
						icon="pi pi-paypal" 
						severity="warning" 
						@click="testPayment('paypal')"
						:disabled="!paymentSettings.paypal.enabled"
						class="w-full"
					/>
					<Button 
						label="测试银行卡" 
						icon="pi pi-credit-card" 
						severity="secondary" 
						@click="testPayment('bankCard')"
						:disabled="!paymentSettings.bankCard.enabled"
						class="w-full"
					/>
				</div>
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
// PrimeVue 组件
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import FileUpload from 'primevue/fileupload'
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
interface PaymentSettings {
	alipay: {
		enabled: boolean
		appId: string
		privateKey: string
		publicKey: string
		environment: string
	}
	wechat: {
		enabled: boolean
		appId: string
		mchId: string
		apiKey: string
		certificateFile?: string
	}
	paypal: {
		enabled: boolean
		clientId: string
		clientSecret: string
		environment: string
		supportedCurrencies: string[]
	}
	bankCard: {
		enabled: boolean
		gateway: string
		merchantId: string
		apiKey: string
		supportedCards: string[]
	}
	general: {
		defaultCurrency: string
		paymentTimeout: number
		minAmount: number
		maxAmount: number
		feeRate: number
		autoConfirm: boolean
		successCallbackUrl: string
		failureCallbackUrl: string
	}
}

const confirm = useConfirm()
const toast = useToast()

// 响应式数据
const saving = ref(false)
const testing = reactive({
	alipay: false,
	wechat: false,
	paypal: false,
	bankCard: false
})

// 支付设置数据
const paymentSettings = reactive<PaymentSettings>({
	alipay: {
		enabled: false,
		appId: '',
		privateKey: '',
		publicKey: '',
		environment: 'sandbox'
	},
	wechat: {
		enabled: false,
		appId: '',
		mchId: '',
		apiKey: '',
		certificateFile: ''
	},
	paypal: {
		enabled: false,
		clientId: '',
		clientSecret: '',
		environment: 'sandbox',
		supportedCurrencies: ['USD', 'EUR']
	},
	bankCard: {
		enabled: false,
		gateway: 'stripe',
		merchantId: '',
		apiKey: '',
		supportedCards: ['visa', 'mastercard']
	},
	general: {
		defaultCurrency: 'CNY',
		paymentTimeout: 30,
		minAmount: 0.01,
		maxAmount: 50000,
		feeRate: 0.6,
		autoConfirm: true,
		successCallbackUrl: '',
		failureCallbackUrl: ''
	}
})

// 选项数据
const environmentOptions = [
	{ label: '沙箱环境', value: 'sandbox' },
	{ label: '生产环境', value: 'production' }
]

const currencyOptions = [
	{ label: '人民币 (CNY)', value: 'CNY' },
	{ label: '美元 (USD)', value: 'USD' },
	{ label: '欧元 (EUR)', value: 'EUR' },
	{ label: '英镑 (GBP)', value: 'GBP' },
	{ label: '日元 (JPY)', value: 'JPY' },
	{ label: '港币 (HKD)', value: 'HKD' }
]

const gatewayOptions = [
	{ label: 'Stripe', value: 'stripe' },
	{ label: '银联', value: 'unionpay' },
	{ label: 'Square', value: 'square' },
	{ label: 'Adyen', value: 'adyen' }
]

const cardTypeOptions = [
	{ label: 'Visa', value: 'visa' },
	{ label: 'MasterCard', value: 'mastercard' },
	{ label: '银联', value: 'unionpay' },
	{ label: 'American Express', value: 'amex' },
	{ label: 'Discover', value: 'discover' },
	{ label: 'JCB', value: 'jcb' }
]

// 加载支付设置
const loadSettings = async () => {
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// 这里应该从后端API加载实际的支付设置
		console.log('支付设置加载完成')
		
	} catch (error) {
		console.error('加载支付设置失败:', error)
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: '加载支付设置时发生错误',
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
		
		// 这里应该调用后端API保存支付设置
		console.log('保存支付设置:', paymentSettings)
		
		toast.add({
			severity: 'success',
			summary: '保存成功',
			detail: '支付设置已成功保存',
			life: 3000
		})
		
	} catch (error) {
		console.error('保存支付设置失败:', error)
		toast.add({
			severity: 'error',
			summary: '保存失败',
			detail: '保存支付设置时发生错误',
			life: 3000
		})
	} finally {
		saving.value = false
	}
}

// 重置设置
const resetSettings = () => {
	confirm.require({
		message: '确定要重置所有支付设置吗？此操作不可撤销。',
		header: '重置确认',
		icon: 'pi pi-exclamation-triangle',
		accept: () => {
			// 重置为默认值
			Object.assign(paymentSettings, {
				alipay: {
					enabled: false,
					appId: '',
					privateKey: '',
					publicKey: '',
					environment: 'sandbox'
				},
				wechat: {
					enabled: false,
					appId: '',
					mchId: '',
					apiKey: '',
					certificateFile: ''
				},
				paypal: {
					enabled: false,
					clientId: '',
					clientSecret: '',
					environment: 'sandbox',
					supportedCurrencies: ['USD', 'EUR']
				},
				bankCard: {
					enabled: false,
					gateway: 'stripe',
					merchantId: '',
					apiKey: '',
					supportedCards: ['visa', 'mastercard']
				},
				general: {
					defaultCurrency: 'CNY',
					paymentTimeout: 30,
					minAmount: 0.01,
					maxAmount: 50000,
					feeRate: 0.6,
					autoConfirm: true,
					successCallbackUrl: '',
					failureCallbackUrl: ''
				}
			})
			
			toast.add({
				severity: 'info',
				summary: '重置完成',
				detail: '支付设置已重置为默认值',
				life: 3000
			})
		}
	})
}

// 测试连接
const testConnection = async (provider: string) => {
	testing[provider as keyof typeof testing] = true
	try {
		// 模拟API调用
		await new Promise(resolve => setTimeout(resolve, 2000))
		
		// 这里应该调用后端API测试支付连接
		const success = Math.random() > 0.3 // 模拟70%成功率
		
		if (success) {
			toast.add({
				severity: 'success',
				summary: '连接成功',
				detail: `${getProviderName(provider)} 连接测试成功`,
				life: 3000
			})
		} else {
			toast.add({
				severity: 'error',
				summary: '连接失败',
				detail: `${getProviderName(provider)} 连接测试失败，请检查配置`,
				life: 3000
			})
		}
		
	} catch (error) {
		console.error('测试连接失败:', error)
		toast.add({
			severity: 'error',
			summary: '测试失败',
			detail: '连接测试时发生错误',
			life: 3000
		})
	} finally {
		testing[provider as keyof typeof testing] = false
	}
}

// 测试支付
const testPayment = (provider: string) => {
	toast.add({
		severity: 'info',
		summary: '测试支付',
		detail: `${getProviderName(provider)} 支付测试功能开发中...`,
		life: 3000
	})
}

// 证书文件选择
const onCertificateSelect = (event: any) => {
	const file = event.files[0]
	if (file) {
		paymentSettings.wechat.certificateFile = file.name
		toast.add({
			severity: 'success',
			summary: '文件上传',
			detail: `证书文件 ${file.name} 已选择`,
			life: 3000
		})
	}
}

// 获取支付提供商名称
const getProviderName = (provider: string) => {
	const names: Record<string, string> = {
		alipay: '支付宝',
		wechat: '微信支付',
		paypal: 'PayPal',
		bankCard: '银行卡支付'
	}
	return names[provider] || provider
}

// 组件挂载时加载设置
onMounted(() => {
	loadSettings()
})
</script>

<style scoped>
/* 自定义样式 */
.p-card {
	@apply shadow-sm border border-gray-200;
}

.p-card .p-card-header {
	@apply bg-gray-50;
}

.p-inputtext,
.p-dropdown,
.p-multiselect,
.p-inputnumber,
.p-password {
	@apply border-gray-300 focus:border-blue-500 focus:ring-blue-500;
}

.p-button {
	@apply transition-all duration-200;
}

.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
	@apply bg-blue-500;
}

.p-fileupload .p-button {
	@apply bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200;
}
</style>