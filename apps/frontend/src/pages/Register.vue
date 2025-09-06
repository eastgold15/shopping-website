<template>
	<div class="register-page">
		<div class="register-container">
			<div class="register-card">
				<!-- 注册标题 -->
				<div class="register-header">
					<h2>创建账号</h2>
					<p>请填写以下信息完成注册</p>
				</div>

				<!-- 注册表单 -->
				<form @submit.prevent="handleRegister" class="register-form">
					<!-- 用户名输入 -->
					<div class="form-group">
						<label for="username">用户名</label>
						<input
							id="username"
							v-model="registerForm.username"
							type="text"
							placeholder="请输入用户名"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 邮箱输入 -->
					<div class="form-group">
						<label for="email">邮箱</label>
						<input
							id="email"
							v-model="registerForm.email"
							type="email"
							placeholder="请输入邮箱地址"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 密码输入 -->
					<div class="form-group">
						<label for="password">密码</label>
						<input
							id="password"
							v-model="registerForm.password"
							type="password"
							placeholder="请输入密码"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 确认密码输入 -->
					<div class="form-group">
						<label for="confirmPassword">确认密码</label>
						<input
							id="confirmPassword"
							v-model="registerForm.confirmPassword"
							type="password"
							placeholder="请再次输入密码"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 错误提示 -->
					<div v-if="errorMessage" class="error-message">
						{{ errorMessage }}
					</div>

					<!-- 注册按钮 -->
					<button
						type="submit"
						class="register-button"
						:disabled="loading"
					>
						<span v-if="loading">注册中...</span>
						<span v-else>注册</span>
					</button>
				</form>

				<!-- 分割线 -->
				<div class="divider">
					<span>或</span>
				</div>

				<!-- Google 登录 -->
				<GoogleLoginButton />

				<!-- 登录链接 -->
				<div class="login-link">
					<span>已有账号？</span>
					<router-link to="/login">立即登录</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GoogleLoginButton from '@/app/components/GoogleLoginButton.vue'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const errorMessage = ref('')

// 注册表单数据
const registerForm = ref({
	username: '',
	email: '',
	password: '',
	confirmPassword: ''
})

// 注册处理
const handleRegister = async () => {
	// 清除之前的错误信息
	errorMessage.value = ''

	// 验证密码匹配
	if (registerForm.value.password !== registerForm.value.confirmPassword) {
		errorMessage.value = '两次输入的密码不一致'
		return
	}

	// 验证密码长度
	if (registerForm.value.password.length < 6) {
		errorMessage.value = '密码长度至少6位'
		return
	}

	loading.value = true

	try {
		// 这里应该调用注册API
		// 目前显示提示信息，因为还没有实现注册API
		errorMessage.value = '注册功能正在开发中，请使用Google登录或联系管理员'
		
		// 示例代码：
		// const response = await fetch('/api/auth/register', {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({
		// 		username: registerForm.value.username,
		// 		email: registerForm.value.email,
		// 		password: registerForm.value.password
		// 	})
		// })

		// const result = await response.json()

		// if (result.code === 200) {
		// 	// 注册成功，跳转到登录页
		// 	router.push('/login')
		// } else {
		// 	errorMessage.value = result.message || '注册失败，请重试'
		// }
	} catch (error) {
		console.error('注册错误:', error)
		errorMessage.value = '网络错误，请检查网络连接'
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
/* 注册页面容器 */
.register-page {
	@apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4;
}

.register-container {
	@apply w-full max-w-md;
}

/* 注册卡片 */
.register-card {
	@apply bg-white rounded-lg shadow-md p-8;
}

/* 注册头部 */
.register-header {
	@apply text-center mb-8;
}

.register-header h2 {
	@apply text-2xl font-bold text-gray-900 mb-2;
}

.register-header p {
	@apply text-gray-600;
}

/* 注册表单 */
.register-form {
	@apply space-y-6;
}

/* 表单组 */
.form-group {
	@apply space-y-2;
}

.form-group label {
	@apply block text-sm font-medium text-gray-700;
}

.form-group input {
	@apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed;
}

/* 错误信息 */
.error-message {
	@apply text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3;
}

/* 注册按钮 */
.register-button {
	@apply w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

/* 分割线 */
.divider {
	@apply relative my-6;
}

.divider::before {
	@apply absolute inset-0 flex items-center;
	content: '';
}

.divider::before {
	@apply w-full border-t border-gray-300;
}

.divider span {
	@apply relative bg-white px-2 text-sm text-gray-500;
}

/* 登录链接 */
.login-link {
	@apply text-center mt-6 text-sm;
}

.login-link span {
	@apply text-gray-600;
}

.login-link a {
	@apply text-blue-600 hover:text-blue-500 font-medium;
}

/* 响应式设计 */
@media (max-width: 640px) {
	.register-card {
		@apply p-6;
	}
	
	.register-header h2 {
		@apply text-xl;
	}
}
</style>