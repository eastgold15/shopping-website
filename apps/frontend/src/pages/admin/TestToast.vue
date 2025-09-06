<template>
  <div class="test-toast-page p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h1 class="text-2xl font-bold mb-6">Toast 测试页面</h1>
      
      <!-- 测试组件自动导入 -->
      <TestComponent />
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <!-- 成功消息 -->
          <Button 
            label="测试成功消息" 
            icon="pi pi-check" 
            class="p-button-success"
            @click="showSuccessToast"
          />
          
          <!-- 错误消息 -->
          <Button 
            label="测试错误消息" 
            icon="pi pi-times" 
            class="p-button-danger"
            @click="showErrorToast"
          />
          
          <!-- 警告消息 -->
          <Button 
            label="测试警告消息" 
            icon="pi pi-exclamation-triangle" 
            class="p-button-warning"
            @click="showWarnToast"
          />
          
          <!-- 信息消息 -->
          <Button 
            label="测试信息消息" 
            icon="pi pi-info-circle" 
            class="p-button-info"
            @click="showInfoToast"
          />
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-3">环境信息</h3>
          <!-- <div class="bg-gray-50 p-4 rounded">
            <p><strong>SSR 环境:</strong> {{ import.meta.env.SSR ? '是' : '否' }}</p>
            <p><strong>Toast 实例:</strong> {{ toast ? '已初始化' : '未初始化' }}</p>
            <p><strong>客户端环境:</strong> {{ !import.meta.env.SSR ? '是' : '否' }}</p>
          </div> -->
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-3">批量测试</h3>
          <Button 
            label="连续测试所有类型" 
            icon="pi pi-play" 
            class="p-button-secondary"
            @click="testAllToasts"
          />
        </div>
      </div>
    </div>
    
    <!-- Toast 组件 - 必须添加才能显示toast消息 -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { onMounted } from 'vue'

// Toast 实例 - 使用条件导入解决 SSR 问题
const toast = !import.meta.env.SSR ? useToast() : null

// 测试函数
const showSuccessToast = () => {
  console.log('显示成功消息')
  toast?.add({
    severity: 'success',
    summary: '成功',
    detail: '这是一个成功消息！',
    life: 3000
  })
}

const showErrorToast = () => {
  console.log('显示错误消息')
  toast?.add({
    severity: 'error',
    summary: '错误',
    detail: '这是一个错误消息！',
    life: 5000
  })
}

const showWarnToast = () => {
  console.log('显示警告消息')
  toast?.add({
    severity: 'warn',
    summary: '警告',
    detail: '这是一个警告消息！',
    life: 4000
  })
}

const showInfoToast = () => {
  console.log('显示信息消息')
  toast?.add({
    severity: 'info',
    summary: '信息',
    detail: '这是一个信息消息！',
    life: 3000
  })
}

const testAllToasts = () => {
  console.log('开始批量测试')
  
  // 延迟显示不同类型的消息
  setTimeout(() => showSuccessToast(), 0)
  setTimeout(() => showInfoToast(), 500)
  setTimeout(() => showWarnToast(), 1000)
  setTimeout(() => showErrorToast(), 1500)
}

// 组件挂载时的测试
onMounted(() => {
  console.log('Toast 测试页面已挂载')
  console.log('Toast 实例:', toast)
  console.log('SSR 环境:', import.meta.env.SSR)
  
  // 自动显示一个欢迎消息
  setTimeout(() => {
    toast?.add({
      severity: 'info',
      summary: '欢迎',
      detail: 'Toast 测试页面已加载完成！',
      life: 2000
    })
  }, 500)
})
</script>

<style scoped>
.test-toast-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

/* 按钮样式优化 */
:deep(.p-button) {
  @apply transition-all duration-200;
}

:deep(.p-button:hover) {
  @apply transform scale-105;
}
</style>