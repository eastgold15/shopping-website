<template>
  <div class="auto-import-test">
    <h3>自动导入测试组件</h3>
    <p>计数器: {{ count }}</p>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
    <button @click="reset">重置</button>
    
    <div class="mt-4">
      <p>鼠标位置: x={{ x }}, y={{ y }}</p>
      <p>窗口大小: {{ width }} x {{ height }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 这些都是自动导入的，无需手动 import
// Vue API 自动导入
const count = ref(0)
const message = ref('Hello Auto Import!')

// VueUse 自动导入
const { x, y } = useMouse()
const { width, height } = useWindowSize()

// 计算属性自动导入
const doubleCount = computed(() => count.value * 2)

// 方法定义
const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}

// 生命周期钩子自动导入
onMounted(() => {
  console.log('AutoImportTest 组件已挂载')
})

// 监听器自动导入
watch(count, (newVal) => {
  console.log('计数器变化:', newVal)
})
</script>

<style scoped>
.auto-import-test {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px;
}

button {
  margin: 0 5px;
  padding: 5px 10px;
  border: 1px solid #007bff;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

.mt-4 {
  margin-top: 16px;
}
</style>