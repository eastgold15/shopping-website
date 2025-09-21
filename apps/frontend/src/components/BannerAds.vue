<template>
	<div class="banner-ads" v-if="advertisements.length > 0">
		<div 
			v-for="advertisement in advertisements" 
			:key="advertisement.id"
			class="banner-item"
			:class="{
				'banner-clickable': advertisement.link,
				'banner-rounded': rounded,
				'banner-shadow': shadow
			}"
			:style="bannerStyle"
		>
			<a 
				v-if="advertisement.link" 
				:href="advertisement.link" 
				class="banner-link"
				:target="isExternalLink(advertisement.link) ? '_blank' : '_self'"
				:rel="isExternalLink(advertisement.link) ? 'noopener noreferrer' : ''"
			>
				<img 
					:src="advertisement.image" 
					:alt="advertisement.title"
					class="banner-image"
					@error="handleImageError"
					@load="handleImageLoad"
				/>
				<div v-if="showTitle" class="banner-overlay">
					<h3 class="banner-title">{{ advertisement.title }}</h3>
				</div>
			</a>
			<div v-else class="banner-content">
				<img 
					:src="advertisement.image" 
					:alt="advertisement.title"
					class="banner-image"
					@error="handleImageError"
					@load="handleImageLoad"
				/>
				<div v-if="showTitle" class="banner-overlay">
					<h3 class="banner-title">{{ advertisement.title }}</h3>
				</div>
			</div>
		</div>
		
		<!-- 加载状态 -->
		<div v-if="loading" class="banner-loading">
			<ProgressSpinner size="30px" strokeWidth="4" />
			<span class="loading-text">加载中...</span>
		</div>
	</div>
	
	<!-- 空状态 -->
	<div v-else-if="!loading && showEmpty" class="banner-empty">
		<div class="empty-content">
			<i class="pi pi-image empty-icon"></i>
			<p class="empty-text">暂无Banner广告</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { client } from "@frontend/utils/useTreaty";
import type { Advertisement } from "../types/advertisement";

// Props
interface Props {
	/** 广告位置 */
	position?: string;
	/** 是否显示标题 */
	showTitle?: boolean;
	/** Banner高度 */
	height?: string;
	/** Banner宽度 */
	width?: string;
	/** 是否圆角 */
	rounded?: boolean;
	/** 是否显示阴影 */
	shadow?: boolean;
	/** 是否显示空状态 */
	showEmpty?: boolean;
	/** 布局方向 */
	layout?: "horizontal" | "vertical" | "grid";
	/** 网格列数（仅在grid布局下有效） */
	gridCols?: number;
	/** 间距 */
	gap?: string;
}

const props = withDefaults(defineProps<Props>(), {
	position: "",
	showTitle: false,
	height: "auto",
	width: "100%",
	rounded: true,
	shadow: false,
	showEmpty: true,
	layout: "horizontal",
	gridCols: 2,
	gap: "1rem",
});

// 响应式数据
const loading = ref(false);
const advertisements = ref<Advertisement[]>([]);
const imageLoadErrors = ref<Set<string>>(new Set());

// 计算属性
const bannerStyle = computed(() => ({
	height: props.height,
	width: props.width,
}));

const containerClass = computed(() => {
	const classes = ["banner-container"];

	switch (props.layout) {
		case "vertical":
			classes.push("banner-vertical");
			break;
		case "grid":
			classes.push("banner-grid");
			break;
		default:
			classes.push("banner-horizontal");
	}

	return classes.join(" ");
});

const containerStyle = computed(() => ({
	gap: props.gap,
	"--grid-cols": props.gridCols,
}));

// 方法
/**
 * 加载Banner广告
 */
const loadBannerAds = async () => {
	loading.value = true;
	try {
		const query = props.position ? { position: props.position } : {};

		const { data, error } = await client.api.advertisements.get({
			query: { ...query, type: "banner" },
		});

		if (data) {
			advertisements.value = data;
		} else {
			console.error("获取Banner广告失败:", error);
			advertisements.value = [];
		}
	} catch (error) {
		console.error("加载Banner广告失败:", error);
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
	return (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("//")
	);
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
		img.src = "/placeholder-banner.png";
	}
};

/**
 * 图片加载成功处理
 */
const handleImageLoad = (event: Event) => {
	const img = event.target as HTMLImageElement;
	img.classList.add("loaded");
};

/**
 * 刷新Banner数据
 */
const refresh = () => {
	loadBannerAds();
};

// 监听position变化
watch(
	() => props.position,
	() => {
		loadBannerAds();
	},
);

// 暴露方法给父组件
defineExpose({
	refresh,
});

// 生命周期
onMounted(() => {
	loadBannerAds();
});
</script>

<style scoped>
.banner-ads {
	@apply relative w-full;
}

.banner-container {
	@apply flex;
}

.banner-horizontal {
	@apply flex-row flex-wrap;
}

.banner-vertical {
	@apply flex-col;
}

.banner-grid {
	@apply grid;
	grid-template-columns: repeat(var(--grid-cols), 1fr);
}

.banner-item {
	@apply relative overflow-hidden transition-all duration-300;
}

.banner-clickable {
	@apply cursor-pointer hover:scale-105;
}

.banner-rounded {
	@apply rounded-lg;
}

.banner-shadow {
	@apply shadow-lg hover:shadow-xl;
}

.banner-link,
.banner-content {
	@apply block relative w-full h-full;
}

.banner-image {
	@apply w-full h-full object-cover transition-opacity duration-300;
	opacity: 0;
}

.banner-image.loaded {
	@apply opacity-100;
}

.banner-overlay {
	@apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4;
}

.banner-title {
	@apply text-white text-lg font-semibold m-0;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 加载状态 */
.banner-loading {
	@apply flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-lg;
}

.loading-text {
	@apply text-gray-600;
}

/* 空状态 */
.banner-empty {
	@apply flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300;
}

.empty-content {
	@apply text-center;
}

.empty-icon {
	@apply text-4xl text-gray-400 mb-2;
}

.empty-text {
	@apply text-gray-500;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.banner-grid {
		grid-template-columns: 1fr;
	}
	
	.banner-horizontal {
		@apply flex-col;
	}
	
	.banner-title {
		@apply text-base;
	}
	
	.banner-overlay {
		@apply p-3;
	}
}

/* 悬停效果 */
.banner-clickable:hover .banner-image {
	@apply scale-110;
}

.banner-clickable .banner-image {
	@apply transition-transform duration-500;
}

/* 特定位置样式 */
.banner-ads[data-position="home-banner"] .banner-item {
	@apply h-32 md:h-40;
}

.banner-ads[data-position="product-detail"] .banner-item {
	@apply h-24 md:h-32;
}

.banner-ads[data-position="sidebar"] .banner-item {
	@apply h-48;
}

.banner-ads[data-position="category-top"] .banner-item {
	@apply h-20 md:h-24;
}
</style>