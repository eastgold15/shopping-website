<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div v-if="loading" class="space-y-4">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-600">正在处理登录...</p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <div class="text-red-500 text-4xl">❌</div>
        <h2 class="text-xl font-bold text-red-600">登录失败</h2>
        <p class="text-gray-600">{{ errorMessage }}</p>
        <button @click="goToLogin" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          返回登录
        </button>
      </div>

      <div v-else class="space-y-4">
        <div class="text-green-500 text-4xl">✅</div>
        <h2 class="text-xl font-bold text-green-600">登录成功</h2>
        <p class="text-gray-600">即将跳转到首页...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')

// 处理 OAuth 回调
onMounted(() => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const refreshToken = urlParams.get('refresh_token')
    const errorParam = urlParams.get('error')

    if (errorParam) {
      // 处理错误
      handleError(errorParam)
      return
    }

    if (token) {
      // 存储令牌
      localStorage.setItem('access_token', token)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      // 清理URL参数
      window.history.replaceState({}, document.title, window.location.pathname)

      loading.value = false

      // 延迟跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      handleError('no_token')
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    handleError('callback_processing_error')
  }
})

function handleError(errorType: string) {
  loading.value = false
  error.value = true

  switch (errorType) {
    case 'oauth_error':
      errorMessage.value = '授权过程中发生错误，请重试'
      break
    case 'callback_error':
      errorMessage.value = '登录回调处理失败，请重试'
      break
    case 'no_token':
      errorMessage.value = '未收到登录令牌，请重试'
      break
    default:
      errorMessage.value = '登录过程中发生未知错误'
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>