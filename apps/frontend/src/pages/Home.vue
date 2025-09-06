<script setup lang="ts">

import Rating from 'primevue/rating';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Advertisement } from '../types/advertisement';
import type { Products } from '../types/product';
import { handleApiRes } from '../utils/handleApi';
import { useToast } from 'primevue/usetoast';

// 路由
const router = useRouter();

// 响应式数据

const hotProducts = ref<Products[]>([]);
const loadingProducts = ref(false);
const latestNews = ref<any[]>([]);

const pageMeta = ref({
	total: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
})

// 方法
/**
 * 加载热门商品
 */
const loadHotProducts = async () => {
	loadingProducts.value = true;
	try {
		const res = await handleApiRes(client.api.products.hot.get({
			query: {
				page: 1,
				pageSize: 10
			}
		}))
		console.log("response", res)

		if (!res) {
			return
		}
		if (res.code === 200) {
			hotProducts.value = res.data?.items as any;
			pageMeta.value = res.data?.meta as any
		}
	} catch (error) {
		console.error('加载热门商品失败:', error);
	} finally {
		loadingProducts.value = false;
	}
};


const carouselAds = ref<Advertisement[]>([])

const toast = useToast()

// 加载轮播图广告
const loadCarouselAds = async () => {

	try {

		const res = await handleApiRes(client.api.advertisements.position({ position: "home-hero" }).get())
		if (!res) {
			throw new Error("加载轮播图广告失敗")
		}

		if (res.code === 200) {
			carouselAds.value = res.data as any
		}
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: (error as Error).message,
			life: 3000
		})
	}
};
loadCarouselAds()
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
	loadHotProducts();
	loadLatestNews();
});
</script>


<template>
	<div class="w-[100%]">
		<div class="grid grid-cols-5 gap-8">
			<!-- 左侧广告（2:1 比例） -->
			<div class="col-span-4 overflow-hidden aspect-[2/1]  max-h-[400px]">

				<Carousel class="inline-flex" :value="carouselAds" :numVisible="1" :numScroll="3" circular
					:showIndicators="false" :pt="{
						root: { class: 'h-full' },
						content: { class: 'relative !block  h-full' }, // 确保 Carousel 继承高度
						viewport: { class: '!h-full', root: { class: '!h-full' } }, pcPrevButton: {
							root: {
								class: '!absolute top-1/2 -translate-y-1/2 left-4 z-1'
							}
						}, pcNextButton: {
							root: {
								class: '!absolute top-1/2 -translate-y-1/2 right-4'
							}
						}
					}">



					<template #item="slotProps">
						<div class="relative w-full aspect-[2/1]"> <!-- 父容器固定比例 -->
							<img :src="slotProps.data.image" :alt="slotProps.data.name" class=" w-full h-full object-cover " />
						</div>
					</template>
				</Carousel>
			</div>

			<!-- 右侧（等高布局） -->
			<div class="col-span-1 grid grid-rows-2 gap-4 min-w-[200px] h-full"> <!-- 关键：h-full -->
				<!-- 上部：4个图标 -->
				<div class="grid grid-cols-2 grid-rows-2 gap-4">
					<!-- 图标项（保持和左侧等高） -->
					<div class="flex-center-center bg-white rounded-lg shadow-sm">
						<div class="flex flex-col items-center p-3">
							<i class="i-ic:outline-shopify text-6 text-blue-500"></i>
							<span class="text-sm mt-2">我的订单</span>
						</div>
					</div>


					<div class="flex-center-center bg-white rounded-lg shadow-sm">
						<div class="flex flex-col items-center p-3">
							<i class="i-ic:outline-shopify text-6 text-blue-500"></i>
							<span class="text-sm mt-2">我的订单</span>
						</div>
					</div>


					<div class="flex-center-center bg-white rounded-lg shadow-sm">
						<div class="flex flex-col items-center p-3">
							<i class="i-ic:outline-shopify text-6 text-blue-500"></i>
							<span class="text-sm mt-2">我的订单</span>
						</div>
					</div>
					<!-- 其他3个图标同理... -->
				</div>

				<!-- 下部：Banner -->
				<div class="bg-yellow-200 rounded-lg overflow-hidden">
					<img src="./../public/01.jpg" alt="Banner" class="w-full h-full object-cover" />
				</div>
			</div>
		</div>





		<!-- 热门商品 -->
		<section class="featured-products">
			<div class="">
				<div class="section-header">
					<h2 class="section-title">热门商品</h2>
					<Button label="查看全部" icon="pi pi-arrow-right" iconPos="right" class="p-button-text"
						@click="viewAllProducts" />
				</div>

				<div class="products-grid" v-if="hotProducts.length > 0">
					<div v-for="product in hotProducts" :key="product.id" class="product-card" @click="viewProduct(product.id)">
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