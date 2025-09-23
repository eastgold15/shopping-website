<script lang="ts" setup>
import { useFrontApi } from "@frontend/utils/handleApi";

const frontApi = useFrontApi();

// 商品数据
const products = ref<any[]>([]);
const loading = ref(true);

// 获取商品列表
const fetchProducts = async () => {
  try {
    loading.value = true;
    const result = await frontApi.products.list({
      page: 1,
      limit: 8,
      isActive: true,
      isFeatured: true,
    });

    if (result && result.data && result.data.items) {
      // 转换数据格式以匹配前端展示需求
      products.value = result.data.items.map((product: any) => ({
        id: product.id,
        name: product.name,
        subtitle: product.shortDescription || "",
        price: `¥${product.price}`,
        // 使用第一张图片作为主图，如果没有图片则使用默认图片
        image:
          product.images && product.images.length > 0
            ? product.images.find((img: any) => img.isMain)?.url ||
            product.images[0].url
            : "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
        category: product.categoryName || "未分类",
      }));
    }
  } catch (error) {
    console.error("获取商品列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center min-h-96">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>

    <!-- 主要内容区域 -->
    <div v-else>
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-light tracking-wider text-gray-900 mb-4">GINA COLLECTION</h1>
        <p class="text-gray-600 max-w-2xl mx-auto">
          探索我们精心打造的奢华鞋履系列，每一双都体现了意大利工艺的精湛技艺和现代设计的完美融合。
        </p>
      </div>

      <!-- 商品网格布局 -->
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

            <!-- 收藏按钮 -->
            <button
              class="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50">
              <i class="pi pi-heart text-gray-600 hover:text-red-500 transition-colors"></i>
            </button>
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

      <!-- 加载更多按钮 -->
      <div class="text-center mt-16">
        <button
          class="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors duration-300 font-medium">
          查看更多商品
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义样式 */
.aspect-square {
  aspect-ratio: 1 / 1;
}

/* 确保图片在不同屏幕尺寸下都能正确显示 */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
  }
}

@media (min-width: 1025px) and (max-width: 1280px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
  }
}

@media (min-width: 1281px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2rem;
  }
}
</style>