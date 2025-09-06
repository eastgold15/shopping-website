<template>
  <div class="home-page">
    <!-- 轮播图广告 -->
    <section class="hero-section">
      <CarouselAds :autoplay-interval="5000" :show-navigators="true" :show-indicators="true" :show-title="true" />
    </section>

    <!-- Banner广告区域 -->
    <section class="banner-section" v-if="showHomeBanners">
      <BannerAds position="home-banner" :show-title="false" height="200px" layout="horizontal" :gap="'1rem'"
        :rounded="true" :shadow="true" />
    </section>

    <!-- 商品分类导航 -->
    <section class="categories-section">
      <div class="container">
        <h2 class="section-title">商品分类</h2>
        <CategoryNavigation :show-all-categories="true" />
      </div>
    </section>

    <!-- 热门商品 -->
    <section class="featured-products">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">热门商品</h2>
          <Button label="查看全部" icon="pi pi-arrow-right" iconPos="right" class="p-button-text"
            @click="viewAllProducts" />
        </div>

        <div class="products-grid" v-if="featuredProducts.length > 0">
          <div v-for="product in featuredProducts" :key="product.id" class="product-card"
            @click="viewProduct(product.id)">
            <div class="product-image">
              <img :src="product.images?.[0] || '/placeholder-product.png'" :alt="product.name" class="product-img" />
              <div class="product-overlay">
                <Button icon="pi pi-eye" class="p-button-rounded p-button-secondary"
                  @click.stop="viewProduct(product.id)" />
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">
                <span class="current-price">${{ product.price }}</span>
                <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                  ${{ product.originalPrice }}
                </span>
              </div>
              <div class="product-rating" v-if="product.rating">
                <Rating :modelValue="product.rating" readonly :cancel="false" />
                <span class="rating-count">({{ product.reviewCount || 0 }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loadingProducts" class="loading-products">
          <ProgressSpinner />
          <span>加载商品中...</span>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-products">
          <i class="pi pi-shopping-bag empty-icon"></i>
          <p>暂无热门商品</p>
        </div>
      </div>
    </section>

    <!-- 品牌展示 -->
    <section class="brands-section">
      <div class="container">
        <h2 class="section-title">合作品牌</h2>
        <BannerAds position="brand-showcase" :show-title="false" height="120px" layout="grid" :grid-cols="4"
          :gap="'1rem'" :rounded="true" :shadow="false" :show-empty="false" />
      </div>
    </section>

    <!-- 新闻资讯 -->
    <section class="news-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">最新资讯</h2>
          <Button label="查看更多" icon="pi pi-arrow-right" iconPos="right" class="p-button-text" @click="viewAllNews" />
        </div>

        <div class="news-grid">
          <div v-for="news in latestNews" :key="news.id" class="news-card" @click="viewNews(news.id)">
            <div class="news-image">
              <img :src="news.image || '/placeholder-news.png'" :alt="news.title" />
            </div>
            <div class="news-content">
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-excerpt">{{ news.excerpt }}</p>
              <div class="news-meta">
                <span class="news-date">{{ formatDate(news.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CarouselAds from '../components/CarouselAds.vue';
import BannerAds from '../components/BannerAds.vue';
import CategoryNavigation from '@frontend/components/CategoryNavigation.vue';
import Rating from 'primevue/rating';
import type { Product } from '../types/product';

// 路由
const router = useRouter();

// 响应式数据
const showHomeBanners = ref(true);
const featuredProducts = ref<Product[]>([]);
const loadingProducts = ref(false);
const latestNews = ref<any[]>([]);

// 方法
/**
 * 加载热门商品
 */
const loadFeaturedProducts = async () => {
  loadingProducts.value = true;
  try {
    const response = await api.getFeaturedProducts({ pageSize: 8 });
    
    if (response.success && response.data) {
      featuredProducts.value = response.data;
    } else {
      console.error('加载热门商品失败:', response.error);
    }
  } catch (error) {
    console.error('加载热门商品失败:', error);
  } finally {
    loadingProducts.value = false;
  }
};

/**
 * 加载最新资讯
 */
const loadLatestNews = async () => {
  try {
    // 模拟新闻数据
    latestNews.value = [
      {
        id: 1,
        title: '2024春季新品发布会',
        excerpt: '全新春季服装系列即将上市，敬请期待...',
        image: '/news-1.jpg',
        createdAt: new Date('2024-03-01')
      },
      {
        id: 2,
        title: '品牌合作伙伴计划',
        excerpt: '我们正在寻找优质的品牌合作伙伴...',
        image: '/news-2.jpg',
        createdAt: new Date('2024-02-28')
      },
      {
        id: 3,
        title: '可持续发展倡议',
        excerpt: '我们致力于环保和可持续发展...',
        image: '/news-3.jpg',
        createdAt: new Date('2024-02-25')
      }
    ];
  } catch (error) {
    console.error('加载新闻失败:', error);
  }
};

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
  router.push('/products');
};

/**
 * 查看新闻详情
 */
const viewNews = (newsId: number) => {
  router.push(`/news/${newsId}`);
};

/**
 * 查看所有新闻
 */
const viewAllNews = () => {
  router.push('/news');
};

/**
 * 格式化日期
 */
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// 生命周期
onMounted(() => {
  loadFeaturedProducts();
  loadLatestNews();
});
</script>

<style scoped>
.home-page {
  @apply min-h-screen bg-gradient-to-br from-gray-50 to-white;
}

/* 轮播图区域 */
.hero-section {
  @apply mb-12 w-full relative overflow-hidden rounded-2xl shadow-xl;
  height: 500px;
}

.hero-section::before {
  content: '';
  @apply absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-10;
}

/* Banner广告区域 */
.banner-section {
  @apply mb-12 px-4;
}

/* 通用容器 */
.container {
  @apply max-w-7xl mx-auto px-4;
}

/* 区域标题 */
.section-title {
  @apply text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 relative;
}

.section-title::after {
  content: '';
  @apply absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full;
}

.section-header {
  @apply flex justify-between items-center mb-8;
}

/* 分类区域 */
.categories-section {
  @apply py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl mx-4 mb-12;
}

/* 热门商品区域 */
.featured-products {
  @apply py-12;
}

.products-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8;
}

.product-card {
  @apply bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 group;
}

.product-image {
  @apply relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200;
  height: 280px;
}

.product-img {
  @apply w-full h-full object-cover transition-transform duration-700 group-hover:scale-110;
}

.product-overlay {
  @apply absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center opacity-0 transition-opacity duration-500;
}

.product-card:hover .product-overlay {
  @apply opacity-100;
}

.product-info {
  @apply p-6 bg-gradient-to-b from-white to-gray-50;
}

.product-name {
  @apply text-lg font-semibold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors;
}

.product-price {
  @apply flex items-center gap-3 mb-3;
}

.current-price {
  @apply text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
}

.original-price {
  @apply text-sm text-gray-400 line-through;
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
  @apply flex flex-col items-center justify-center py-16 text-gray-500;
}

.empty-icon {
  @apply text-6xl mb-4 text-gray-300;
}

/* 品牌区域 */
.brands-section {
  @apply py-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl mx-4 mb-12;
}

/* 新闻区域 */
.news-section {
  @apply py-12;
}

.news-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8;
}

.news-card {
  @apply bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 group;
}

.news-image {
  @apply h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200;
}

.news-image img {
  @apply w-full h-full object-cover transition-transform duration-700 group-hover:scale-110;
}

.news-content {
  @apply p-6 bg-gradient-to-b from-white to-gray-50;
}

.news-title {
  @apply text-xl font-semibold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors;
}

.news-excerpt {
  @apply text-gray-600 mb-4 line-clamp-3 leading-relaxed;
}

.news-meta {
  @apply flex justify-between items-center text-sm text-gray-500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    height: 300px;
  }

  .section-title {
    @apply text-2xl;
  }

  .section-header {
    @apply flex-col items-start gap-4;
  }

  .products-grid {
    @apply grid-cols-2 gap-6;
  }

  .product-image {
    height: 200px;
  }

  .news-grid {
    @apply grid-cols-1 gap-6;
  }

  .categories-section,
  .brands-section {
    @apply mx-0 rounded-2xl;
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

/* 按钮美化 */
.p-button-text {
  @apply text-blue-600 hover:text-blue-700 font-semibold transition-all duration-200 hover:scale-105;
}

/* 加载动画 */
.p-progress-spinner {
  @apply w-12 h-12;
}

/* 商品卡片悬停效果 */
.product-card .p-button-rounded {
  @apply opacity-0 transform scale-75 transition-all duration-300;
}

.product-card:hover .p-button-rounded {
  @apply opacity-100 transform scale-100;
}
</style>