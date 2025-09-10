<script setup>
import Counter from "@frontend/components/count.vue";
import { api } from "@frontend/utils/api";

// 使用响应式数据存储API结果
const data = ref(null);
const loading = ref(true);
const error = ref();

// 在组件挂载后获取数据，避免setup函数返回Promise
onMounted(async () => {
	try {
		const { data: result, error: apiError } = await api.test.get();
		if (result) {
			data.value = result;
			console.log("1111", result);
		} else {
			error.value = apiError;
			console.error("API请求失败:", apiError);
		}
	} catch (err) {
		error.value = err;
		console.error("API请求失败:", err);
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<Counter />
	
	<!-- 显示加载状态 -->
	<div v-if="loading">
		加载中...
	</div>
	
	<!-- 显示错误信息 -->
	<div v-else-if="error" class="error">
		请求失败: {{ error?.message || error }}
	</div>
	
	<!-- 显示数据 -->
	<div v-else>
		<p>API响应数据:</p>
		<pre>{{ data }}</pre>
	</div>
</template>