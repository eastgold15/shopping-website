<template>
	<div class="login-page">
		<div class="login-container">
			<div class="login-card">
				<!-- 登录标题 -->
				<div class="login-header">
					<h2>欢迎登录</h2>
					<p>请输入您的账号信息</p>
				</div>

				<!-- 登录表单 -->
				<form @submit.prevent="handleLogin" class="login-form">
					<!-- 用户名/邮箱输入 -->
					<div class="form-group">
						<label for="username">用户名或邮箱</label>
						<input
							id="username"
							v-model="loginForm.username"
							type="text"
							placeholder="请输入用户名或邮箱"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 密码输入 -->
					<div class="form-group">
						<label for="password">密码</label>
						<input
							id="password"
							v-model="loginForm.password"
							type="password"
							placeholder="请输入密码"
							required
							:disabled="loading"
						/>
					</div>

					<!-- 记住我 -->
					<div class="form-options">
						<label class="checkbox-label">
							<input
								v-model="loginForm.remember"
								type="checkbox"
								:disabled="loading"
							/>
							<span>记住我</span>
						</label>
					</div>

					<!-- 错误提示 -->
					<div v-if="errorMessage" class="error-message">
						{{ errorMessage }}
					</div>

					<!-- 登录按钮 -->
					<button
						type="submit"
						class="login-button"
						:disabled="loading"
					>
						<span v-if="loading">登录中...</span>
						<span v-else>登录</span>
					</button>
				</form>

				<!-- 分割线 -->
				<div class="divider">
					<span>或</span>
				</div>

				<!-- Google 登录 -->
				<GoogleLoginButton />

				<!-- 注册链接 -->
				<div class="register-link">
					<span>还没有账号？</span>
					<router-link to="/register">立即注册</router-link>
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

// 登录表单数据
const loginForm = ref({
	username: '',
	password: '',
	remember: false
})

// 登录处理
const handleLogin = async () => {
	// 清除之前的错误信息
	errorMessage.value = ''
	loading.value = true

	try {
		// 调用登录API
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(loginForm.value)
		})

		const result = await response.json()

		if (result.code === 200) {
			// 登录成功，存储令牌
			localStorage.setItem('access_token', result.data.token.accessToken)
			localStorage.setItem('refresh_token', result.data.token.refreshToken)
			
			// 存储用户信息
			localStorage.setItem('user_info', JSON.stringify(result.data.user))

			// 跳转到首页
			router.push('/')
		} else {
			// 显示错误信息
			errorMessage.value = result.message || '登录失败，请重试'
		}
	} catch (error) {
		console.error('登录错误:', error)
		errorMessage.value = '网络错误，请检查网络连接'
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
/* 登录页面容器 */
.login-page {
	@apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4;
}

.login-container {
	@apply w-full max-w-md;
}

/* 登录卡片 */
.login-card {
	@apply bg-white rounded-lg shadow-md p-8;
}

/* 登录头部 */
.login-header {
	@apply text-center mb-8;
}

.login-header h2 {
	@apply text-2xl font-bold text-gray-900 mb-2;
}

.login-header p {
	@apply text-gray-600;
}

/* 登录表单 */
.login-form {
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

/* 表单选项 */
.form-options {
	@apply flex items-center justify-between;
}

.checkbox-label {
	@apply flex items-center cursor-pointer;
}

.checkbox-label input[type="checkbox"] {
	@apply mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

/* 错误信息 */
.error-message {
	@apply text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3;
}

/* 登录按钮 */
.login-button {
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

/* 注册链接 */
.register-link {
	@apply text-center mt-6 text-sm;
}

.register-link span {
	@apply text-gray-600;
}

.register-link a {
	@apply text-blue-600 hover:text-blue-500 font-medium;
}

/* 响应式设计 */
@media (max-width: 640px) {
	.login-card {
		@apply p-6;
	}
	
	.login-header h2 {
		@apply text-xl;
	}
}
</style>