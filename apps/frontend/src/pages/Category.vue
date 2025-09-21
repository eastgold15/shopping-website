<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 分类标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-light tracking-wider text-gray-900 mb-2">
        {{ category?.name || '商品分类' }}
      </h1>
      <p v-if="category?.description" class="text-gray-600">
        {{ category.description }}
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center min-h-96">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>

    <!-- 商品列表 -->
    <div v-else-if="products.length > 0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div v-for="product in products" :key="product.id"
          class="group cursor-pointer transition-all duration-300 hover:scale-105"
          @click="$router.push({ name: 'product-detail', params: { id: product.id } })">
          <!-- 商品图片容器 -->
          <div class="relative overflow-hidden bg-gray-50 rounded-lg aspect-square mb-4">
            <img :src="product.image" :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              @error="($event) => { ($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800' }">

            <!-- 悬停时显示的遮罩层 -->
            <div
              class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  class="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="text-center space-y-2">
            <h3 class="font-semibold text-lg text-gray-900 tracking-wide">
              {{ product.name }}
            </h3>
            <p class="text-sm text-gray-600 italic">
              {{ product.subtitle }}
            </p>
            <p class="text-lg font-medium text-gray-900">
              {{ product.price }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-16">
      <i class="pi pi-box text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">该分类下暂无商品</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFrontApi } from "@frontend/utils/handleApi";

const route = useRoute();
const router = useRouter();
const frontApi = useFrontApi();

// 响应式数据
const category = ref<any>(null);
const products = ref<any[]>([]);
const loading = ref(true);

// 获取分类和商品数据
const fetchCategoryData = async () => {
	try {
		loading.value = true;

		const categoryId = route.params.id as string;
		if (!categoryId) {
			router.push("/");
			return;
		}

		// 并行获取分类信息和商品列表
		const [categoryRes, productsRes] = await Promise.all([
			frontApi.categories.getById(parseInt(categoryId)),
			frontApi.products.list({
				page: 1,
				pageSize: 12,
				categoryId: parseInt(categoryId),
				isActive: true,
			}),
		]);

		if (categoryRes && categoryRes.data) {
			category.value = categoryRes.data;
		}

		if (productsRes && productsRes.data && productsRes.data.items) {
			products.value = productsRes.data.items.map((product: any) => ({
				id: product.id,
				name: product.name,
				subtitle: product.shortDescription || "",
				price: `¥${product.price}`,
				image:
					product.images && product.images.length > 0
						? product.images.find((img: any) => img.isMain)?.url ||
							product.images[0].url
						: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
			}));
		}
	} catch (error) {
		console.error("获取分类数据失败:", error);
	} finally {
		loading.value = false;
	}
};

// 监听路由参数变化
watch(() => route.params.id, fetchCategoryData, { immediate: true });

// 页面元信息
useHead({
	title: computed(() =>
		category.value?.name ? `${category.value.name} - GINA` : "商品分类 - GINA",
	),
	meta: [
		{
			name: "description",
			content: computed(
				() =>
					category.value?.description ||
					"GINA精品女鞋分类，探索我们的奢华鞋履系列",
			),
		},
	],
});
</script>

<style scoped>
/* 自定义样式 */
.aspect-square {
  aspect-ratio: 1 / 1;
}
</style>