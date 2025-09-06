<template>
	<div class="carousel-ads" v-if="advertisements.length > 0">
		<Carousel :value="advertisements" :numVisible="1" :numScroll="1" :autoplayInterval="autoplayInterval"
			:showNavigators="showNavigators" :showIndicators="showIndicators" class="custom-carousel">
			<template #item="{ data }">
				<div class="carousel-item">
					<a v-if="data.link" :href="data.link" class="carousel-link"
						:target="isExternalLink(data.link) ? '_blank' : '_self'"
						:rel="isExternalLink(data.link) ? 'noopener noreferrer' : ''">
						<img :src="data.image" :alt="data.title" class="carousel-image" @error="handleImageError"
							@load="handleImageLoad" />
						<div v-if="showTitle" class="carousel-overlay">
							<h3 class="carousel-title">{{ data.title }}</h3>
						</div>
					</a>
					<div v-else class="carousel-item-no-link">
						<img :src="data.image" :alt="data.title" class="carousel-image" @error="handleImageError"
							@load="handleImageLoad" />
						<div v-if="showTitle" class="carousel-overlay">
							<h3 class="carousel-title">{{ data.title }}</h3>
						</div>
					</div>
				</div>
			</template>
		</Carousel>

		<!-- 加载状态 -->
		<div v-if="loading" class="carousel-loading">
			<ProgressSpinner size="50px" strokeWidth="4" />
			<p class="loading-text">加载中...</p>
		</div>
	</div>

	<!-- 空状态 -->
	<div v-else-if="!loading" class="carousel-empty">
		<div class="empty-content">
			<i class="pi pi-image empty-icon"></i>
			<p class="empty-text">暂无轮播广告</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import Carousel from 'primevue/carousel';
import { computed, onMounted, ref } from 'vue';
import { client } from '@/share/useTreaty';
import type { Advertisement } from '../types/advertisement';
import { handleApiRes } from '../utils/handleApi';
import { useToast } from 'primevue/usetoast';

// Props
interface Props {
	/** 自动播放间隔时间（毫秒） */
	autoplayInterval?: number;
	/** 是否显示导航按钮 */
	showNavigators?: boolean;
	/** 是否显示指示器 */
	showIndicators?: boolean;
	/** 是否显示标题 */
	showTitle?: boolean;
	/** 轮播图高度 */
	height?: string;
	/** 是否圆角 */
	rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	autoplayInterval: 5000,
	showNavigators: true,
	showIndicators: true,
	showTitle: false,
	height: '400px',
	rounded: true
});

// 响应式数据
const loading = ref(false);
const advertisements = ref<Advertisement[]>([]);
const imageLoadErrors = ref<Set<string>>(new Set());
const toast = useToast()
// 计算属性
const carouselStyle = computed(() => ({
	height: props.height,
	borderRadius: props.rounded ? '8px' : '0'
}));

// 方法
/**
 * 加载轮播图广告
 */
const loadCarouselAds = async () => {
	loading.value = true;
	try {
		const res = await handleApiRes(client.api.advertisements.carousel.get());

		console.log("aaaa", res)

		if (!res) {
			throw new Error("加载轮播图广告失敗")
		}

		if (res.code == 200) {
			advertisements.value = res.data as any
		}

	} catch (error) {
		toast.add({
			severity: 'error',
			summary: '加载失败',
			detail: (error as Error).message,
			life: 3000
		})
		console.error('加载轮播图广告失败:', error);
		advertisements.value = [];
	} finally {
		loading.value = false;
	}
};

/**
 * 判断是否为外部链接
 */
const isExternalLink = (url: string): boolean => {
	if (!url) return false;
	return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

/**
 * 图片加载错误处理
 */
const handleImageError = (event: Event) => {
	const img = event.target as HTMLImageElement;
	const src = img.src;

	// 避免无限循环
	if (!imageLoadErrors.value.has(src)) {
		imageLoadErrors.value.add(src);
		// 设置默认图片
		img.src = '/placeholder-carousel.png';
	}
};

/**
 * 图片加载成功处理
 */
const handleImageLoad = (event: Event) => {
	const img = event.target as HTMLImageElement;
	img.classList.add('loaded');
};

/**
 * 刷新轮播图数据
 */
const refresh = () => {
	loadCarouselAds();
};

// 暴露方法给父组件
defineExpose({
	refresh
});

// 生命周期
onMounted(() => {
	loadCarouselAds();
});
</script>

<style scoped>
.carousel-ads {
	@apply relative w-full overflow-hidden;
}

.custom-carousel {
	@apply w-full;
}

.custom-carousel :deep(.p-carousel-content) {
	@apply relative;
}

.custom-carousel :deep(.p-carousel-container) {
	@apply relative;
}

.carousel-item {
	@apply relative w-full;
	height: v-bind('props.height');
}

.carousel-link,
.carousel-item-no-link {
	@apply block relative w-full h-full;
}

.carousel-image {
	@apply w-full h-full object-cover transition-opacity duration-300;
	opacity: 0;
}

.carousel-image.loaded {
	@apply opacity-100;
}

.carousel-overlay {
	@apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6;
}

.carousel-title {
	@apply text-white text-xl md:text-2xl font-bold m-0;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 导航按钮样式 */
.custom-carousel :deep(.p-carousel-prev),
.custom-carousel :deep(.p-carousel-next) {
	@apply bg-white/20 backdrop-blur-sm border-none text-white hover:bg-white/30 transition-all duration-200;
	border-radius: 50%;
	width: 48px;
	height: 48px;
}

.custom-carousel :deep(.p-carousel-prev:hover),
.custom-carousel :deep(.p-carousel-next:hover) {
	@apply bg-white/40;
}

/* 指示器样式 */
.custom-carousel :deep(.p-carousel-indicators) {
	@apply flex justify-center gap-2 absolute bottom-4 left-1/2 transform -translate-x-1/2;
}

.custom-carousel :deep(.p-carousel-indicator) {
	@apply w-3 h-3 bg-white/50 rounded-full cursor-pointer transition-all duration-200;
}

.custom-carousel :deep(.p-carousel-indicator.p-highlight) {
	@apply bg-white w-6;
}

.custom-carousel :deep(.p-carousel-indicator:hover) {
	@apply bg-white/80;
}

/* 加载状态 */
.carousel-loading {
	@apply flex flex-col items-center justify-center;
	height: v-bind('props.height');
	@apply bg-gray-100 rounded-lg;
}

.loading-text {
	@apply mt-4 text-gray-600 text-lg;
}

/* 空状态 */
.carousel-empty {
	@apply flex items-center justify-center;
	height: v-bind('props.height');
	@apply bg-gray-50 rounded-lg border-2 border-dashed border-gray-300;
}

.empty-content {
	@apply text-center;
}

.empty-icon {
	@apply text-6xl text-gray-400 mb-4;
}

.empty-text {
	@apply text-gray-500 text-lg;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.carousel-title {
		@apply text-lg;
	}

	.carousel-overlay {
		@apply p-4;
	}

	.custom-carousel :deep(.p-carousel-prev),
	.custom-carousel :deep(.p-carousel-next) {
		width: 40px;
		height: 40px;
	}

	.custom-carousel :deep(.p-carousel-indicators) {
		@apply bottom-2;
	}
}

/* 圆角样式 */
.carousel-ads[data-rounded="true"] {
	@apply rounded-lg overflow-hidden;
}

.carousel-ads[data-rounded="true"] .carousel-image {
	@apply rounded-lg;
}
</style>