<script setup lang="ts">
import type { SelectAdvertisementsVo, SelectProductVo } from "@backend/types";
import { computed, onUnmounted } from 'vue';
import { useCmsApi } from "../utils/handleApi";


// 路由
const router = useRouter();

// 响应式数据

const hotProducts = ref<SelectProductVo[]>([]);
const loadingProducts = ref(false);



const pageMeta = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});
const api = useCmsApi();
// 方法
/**
 * 加载热门商品
 */
const loadHotProducts = async () => {
  try {
    loadingProducts.value = true;
    const res = await api.products.list({
      page: 1,
      limit: 10,
    });
    console.log("response", res);

    if (!res) {
      return;
    }
    if (res.code === 200) {
      // 处理商品数据，添加必要的字段
      hotProducts.value = (res.data?.items as any[])?.map(item => ({
        ...item,
        // 确保价格是数字类型
        price: parseFloat(item.price),
        // 计算原价（如果没有comparePrice，则设为价格的1.2倍）
        originalPrice: item.comparePrice && parseFloat(item.comparePrice) > 0
          ? parseFloat(item.comparePrice)
          : parseFloat(item.price) * 1.2,
        // 处理图片URL，移除反引号
        imageUrl: item.images && item.images.length > 0
          ? item.images[0].url.replace(/`/g, '')
          : 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(item.name),
        // 计算折扣百分比
        discount: item.comparePrice && parseFloat(item.comparePrice) > 0
          ? Math.round((1 - parseFloat(item.price) / parseFloat(item.comparePrice)) * 100)
          : Math.floor(Math.random() * 20) + 10,
        // 添加评分（模拟数据）
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0之间的评分
        reviewCount: Math.floor(Math.random() * 500) + 10 // 10-510之间的评论数
      })) || [];
      pageMeta.value = res.data?.meta as any;
    }
  } catch (error) {
    console.error("加载热门商品失败:", error);
  } finally {
    loadingProducts.value = false;
  }
};

const carouselAds = ref<SelectAdvertisementsVo[]>([]);



/**
 * 加载轮播图广告
 */
const loadCarouselAds = async () => {
  try {
    // 使用真实的广告API数据
    const res = await api.advertisements.list({ type: "carousel" })
    console.log('用真实的广告API数据:', res)

    // 处理API返回的数据
    if (res.code === 200) {
      carouselAds.value = res.data.items as any
    }
  } catch (error) {
    console.error("加载轮播广告失败:", error);
  }
};
loadCarouselAds();

/**
 * 查看商品详情
 */
const viewProduct = (productId: number) => {
  router.push(`/product/${productId}`);
};

/**
 * 查看所有商品
 */
const viewAllProducts = () => {
  router.push("/products");
};




// 轮播图控制方法
const currentSlide = ref(0); // 当前轮播图索引
const totalSlides = computed(() => carouselAds.value.length); // 总轮播图数量
let autoPlayTimer: NodeJS.Timeout | null = null;

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--;
  } else {
    // 循环到最后一张
    currentSlide.value = totalSlides.value - 1;
  }
};

const nextSlide = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    currentSlide.value++;
  } else {
    // 循环到第一张
    currentSlide.value = 0;
  }
};

const goToSlide = (index: number) => {
  currentSlide.value = index;
};

const handleImageClick = (ad: SelectAdvertisementsVo) => {
  if (ad.link) {
    router.push(ad.link);
  }
};

// 获取商品图片URL
const getProductImage = (product: any) => {
  if (product.images && product.images.length > 0) {
    // 移除URL中的反引号
    return product.images[0].url.replace(/`/g, '').trim();
  }
  return `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`;
};

// 自动播放功能
const startAutoPlay = () => {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  autoPlayTimer = setInterval(() => {
    nextSlide();
  }, 5000); // 每5秒切换一次
};

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
};

// 生命周期
onMounted(() => {
  loadHotProducts();
  startAutoPlay();
});

onUnmounted(() => {
  stopAutoPlay();
});


</script>


<template>
  <div class="w-full bg-gradient-to-br from-gray-50 to-white min-h-screen">
    <!-- 主要内容区域 -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-5 gap-8 mb-12">
        <!-- 左侧轮播图（自定义实现） -->
        <div class="col-span-4 relative">
          <!-- 轮播图标题 -->
          <div class="mb-4">
            <h2 class="text-xl font-bold text-gray-800">精选推荐</h2>
          </div>
          <!-- 自定义轮播图容器 -->
          <div class="relative aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100" @mouseenter="stopAutoPlay"
            @mouseleave="startAutoPlay">
            <!-- 轮播图控制按钮 - 绝对定位在图片上 -->
            <button @click="prevSlide"
              class="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white/90 text-gray-700 border border-gray-200/50 rounded-full w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm">
              <i class="i-ic:outline-chevron-left text-xl"></i>
            </button>
            <button @click="nextSlide"
              class="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white/90 text-gray-700 border border-gray-200/50 rounded-full w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm">
              <i class="i-ic:outline-chevron-right text-xl"></i>
            </button>

            <!-- 轮播图片容器 -->
            <div class="relative w-full h-full overflow-hidden">
              <div class="flex transition-transform duration-500 ease-in-out h-full"
                :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
                <div v-for="(ad, index) in carouselAds" :key="index"
                  class="w-full h-full flex-shrink-0 relative group cursor-pointer" @click="handleImageClick(ad)">
                  <img :src="ad.image_url" :alt="ad.title"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  </div>
                  <div
                    class="absolute bottom-6 left-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 class="text-2xl font-bold mb-2">{{ ad.title }}</h3>
                    <p class="text-white/90">点击探索更多精彩内容</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 指示器 -->
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              <button v-for="(ad, index) in carouselAds" :key="index" @click="goToSlide(index)"
                @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="currentSlide === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'">
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧功能区域（优化样式） -->
        <div class="col-span-1 space-y-6">
          <!-- 快捷功能按钮 -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">快捷功能</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="group cursor-pointer" @click="router.push('/orders')">
                <div
                  class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <i class="i-ic:outline-receipt text-3xl text-blue-600 mb-2 block"></i>
                  <span class="text-sm font-medium text-gray-700">我的订单</span>
                </div>
              </div>

              <div class="group cursor-pointer" @click="router.push('/favorites')">
                <div
                  class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <i class="i-ic:outline-favorite text-3xl text-red-600 mb-2 block"></i>
                  <span class="text-sm font-medium text-gray-700">我的收藏</span>
                </div>
              </div>

              <div class="group cursor-pointer" @click="router.push('/cart')">
                <div
                  class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <i class="i-ic:outline-shopping-cart text-3xl text-green-600 mb-2 block"></i>
                  <span class="text-sm font-medium text-gray-700">购物车</span>
                </div>
              </div>

              <div class="group cursor-pointer" @click="router.push('/profile')">
                <div
                  class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <i class="i-ic:outline-person text-3xl text-purple-600 mb-2 block"></i>
                  <span class="text-sm font-medium text-gray-700">个人中心</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 推广横幅 -->
          <div class="relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer">
            <div class="aspect-[4/3] bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400">
              <div class="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div class="absolute inset-0 flex flex-col justify-center items-center text-white p-4">
                <i class="i-ic:outline-local-fire-department text-4xl mb-2 animate-pulse"></i>
                <h4 class="text-lg font-bold mb-1">限时优惠</h4>
                <p class="text-sm opacity-90">精选商品</p>
                <p class="text-xs opacity-75 mt-1">低至5折</p>
              </div>
            </div>
          </div>
        </div>
      </div>





      <!-- 热门商品区域（优化样式） -->
      <section class="bg-white rounded-2xl shadow-lg p-8">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center gap-3">
            <div class="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <h2 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">热门商品
            </h2>
          </div>
          <Button label="查看全部" icon="pi pi-arrow-right" iconPos="right"
            class="bg-gradient-to-r from-blue-500 to-purple-600 border-0 px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            @click="viewAllProducts" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8" v-if="hotProducts.length > 0">
          <div v-for="product in hotProducts" :key="product.id"
            class="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-2"
            @click="viewProduct(product.id)">
            <div class="relative overflow-hidden">
              <div class="aspect-square bg-gray-100">
                <img :src="getProductImage(product)" :alt="product.name"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              </div>
              <div
                class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                <Button icon="pi pi-eye"
                  class="p-button-rounded bg-white/90 text-gray-700 border-0 w-10 h-10 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                  @click.stop="viewProduct(product.id)" />
              </div>
              <!-- 折扣标签 -->
              <div v-if="product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)"
                class="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {{ Math.round((1 - parseFloat(product.price) / parseFloat(product.comparePrice)) * 100) }}% OFF
              </div>
            </div>
            <div class="p-6">
              <h3
                class="text-lg font-semibold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                {{ product.name }}</h3>
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl font-bold text-blue-600">¥{{ parseFloat(product.price).toFixed(2) }}</span>
                <span v-if="product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)"
                  class="text-sm text-gray-400 line-through">
                  ¥{{ parseFloat(product.comparePrice).toFixed(2) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">库存: {{ product.stock }}</span>
                </div>
                <i
                  class="pi pi-heart text-gray-300 hover:text-red-500 cursor-pointer transition-colors duration-300"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loadingProducts" class="flex flex-col items-center justify-center py-20">
          <ProgressSpinner class="mb-4" />
          <span class="text-gray-500 text-lg">加载商品中...</span>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
          <i class="pi pi-shopping-bag text-6xl mb-4"></i>
          <p class="text-xl">暂无热门商品</p>
          <p class="text-sm mt-2">请稍后再试</p>
        </div>
      </section>
    </div>



  </div>
</template>


<style scoped>
.home-page {
  @apply min-h-screen;
}


/* 轮播图区域 */
.hero-section {
  @apply mb-8 w-full;
  height: 400px;
}

/* Banner广告区域 */
.banner-section {
  @apply mb-8 px-4;
}

/* 通用容器 */
.container {
  @apply max-w-7xl mx-auto px-4;
}

/* 区域标题 */
.section-title {
  @apply text-2xl font-bold text-gray-800 mb-6;
}

.section-header {
  @apply flex justify-between items-center mb-6;
}

/* 分类区域 */
.categories-section {
  @apply py-8 bg-gray-50;
}

/* 热门商品区域 */
.featured-products {
  @apply py-8;
}

.products-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6;
}

.product-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105;
}

.product-image {
  @apply relative overflow-hidden;
  height: 250px;
}

.product-img {
  @apply w-full h-full object-cover;
}

.product-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 transition-opacity duration-300;
}

.product-card:hover .product-overlay {
  @apply opacity-100;
}

.product-info {
  @apply p-4;
}

.product-name {
  @apply text-lg font-semibold text-gray-800 mb-2 line-clamp-2;
}

.product-price {
  @apply flex items-center gap-2 mb-2;
}

.current-price {
  @apply text-xl font-bold text-primary;
}

.original-price {
  @apply text-sm text-gray-500 line-through;
}

.product-rating {
  @apply flex items-center gap-2;
}

.rating-count {
  @apply text-sm text-gray-500;
}

/* 加载和空状态 */
.loading-products,
.empty-products {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.empty-icon {
  @apply text-4xl mb-4;
}

/* 品牌区域 */
.brands-section {
  @apply py-8 bg-gray-50;
}

/* 新闻区域 */
.news-section {
  @apply py-8;
}

.news-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.news-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg;
}

.news-image {
  @apply h-48 overflow-hidden;
}

.news-image img {
  @apply w-full h-full object-cover;
}

.news-content {
  @apply p-4;
}

.news-title {
  @apply text-lg font-semibold text-gray-800 mb-2 line-clamp-2;
}

.news-excerpt {
  @apply text-gray-600 mb-3 line-clamp-3;
}

.news-meta {
  @apply flex justify-between items-center text-sm text-gray-500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    height: 250px;
  }

  .section-title {
    @apply text-xl;
  }

  .section-header {
    @apply flex-col items-start gap-4;
  }

  .products-grid {
    @apply grid-cols-2;
  }

  .product-image {
    height: 200px;
  }

  .news-grid {
    @apply grid-cols-1;
  }
}

/* 工具类 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>