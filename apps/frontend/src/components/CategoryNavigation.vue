<template>
	<div class="category-navigation">
		<!-- 主分类导航 -->
		<div class="main-categories" v-if="categories.length > 0">
			<div 
				v-for="category in visibleCategories" 
				:key="category.id"
				class="category-item"
				@mouseenter="showSubCategories(category)"
				@mouseleave="hideSubCategories"
			>
				<router-link 
					:to="`/category/${category.slug}`"
					class="category-link"
					:class="{ 'active': isActiveCategory(category.id) }"
				>
					<i v-if="category.icon" :class="category.icon" class="category-icon"></i>
					<span class="category-name">{{ category.name }}</span>
					<i v-if="category.children && category.children.length > 0" class="pi pi-angle-down arrow-icon"></i>
				</router-link>
				
				<!-- 子分类下拉菜单 -->
				<div 
					v-if="hoveredCategory?.id === category.id && category.children && category.children.length > 0"
					class="subcategory-dropdown"
					@mouseenter="keepSubCategoriesVisible"
					@mouseleave="hideSubCategories"
				>
					<div class="subcategory-grid">
						<div 
							v-for="subCategory in category.children" 
							:key="subCategory.id"
							class="subcategory-item"
						>
							<router-link 
								:to="`/category/${subCategory.slug}`"
								class="subcategory-link"
							>
								<div class="subcategory-image" v-if="subCategory.image">
									<img :src="subCategory.image" :alt="subCategory.name" />
								</div>
								<div class="subcategory-info">
									<h4 class="subcategory-name">{{ subCategory.name }}</h4>
									<p class="subcategory-description" v-if="subCategory.description">
										{{ subCategory.description }}
									</p>
									<span class="product-count" v-if="subCategory.productCount">
										{{ subCategory.productCount }} 件商品
									</span>
								</div>
							</router-link>
						</div>
					</div>
					
					<!-- 查看全部链接 -->
					<div class="view-all-section">
						<router-link 
							:to="`/category/${category.slug}`"
							class="view-all-link"
						>
							查看 {{ category.name }} 全部商品
							<i class="pi pi-arrow-right"></i>
						</router-link>
					</div>
				</div>
			</div>
			
			<!-- 显示更多分类按钮 -->
			<div v-if="showAllCategories && categories.length > maxVisibleCategories" class="more-categories">
				<Button 
					label="更多分类" 
					icon="pi pi-angle-down"
					class="p-button-text"
					@click="toggleShowAll"
				/>
			</div>
		</div>
		
		<!-- 加载状态 -->
		<div v-else-if="loading" class="loading-state">
			<ProgressSpinner size="30px" strokeWidth="4" />
			<span class="loading-text">加载分类中...</span>
		</div>
		
		<!-- 空状态 -->
		<div v-else class="empty-state">
			<i class="pi pi-list empty-icon"></i>
			<p class="empty-text">暂无分类</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { client } from '@frontend/utils/useTreaty';
import type { Category } from '../types/category';

// Props
interface Props {
	/** 是否显示所有分类 */
	showAllCategories?: boolean;
	/** 最大显示分类数量 */
	maxVisibleCategories?: number;
	/** 布局模式 */
	layout?: 'horizontal' | 'vertical' | 'grid';
	/** 是否显示图标 */
	showIcons?: boolean;
	/** 是否显示商品数量 */
	showProductCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	showAllCategories: false,
	maxVisibleCategories: 8,
	layout: 'horizontal',
	showIcons: true,
	showProductCount: true
});

// 路由
const route = useRoute();

// 响应式数据
const loading = ref(false);
const categories = ref<Category[]>([]);
const hoveredCategory = ref<Category | null>(null);
const showAll = ref(false);
const hideTimeout = ref<NodeJS.Timeout | null>(null);

// 计算属性
const visibleCategories = computed(() => {
	if (props.showAllCategories || showAll.value) {
		return categories.value;
	}
	return categories.value.slice(0, props.maxVisibleCategories);
});

// 方法
/**
 * 加载分类数据
 */
const loadCategories = async () => {
	loading.value = true;
	try {
		const { data, error } = await client.api.categories.tree.get();
		if (data && Array.isArray(data)) {
			categories.value = data.filter((cat: Category) => cat.isVisible);
		} else {
			console.error('获取分类失败:', error);
			categories.value = [];
		}
	} catch (error) {
		console.error('加载分类失败:', error);
		categories.value = [];
	} finally {
		loading.value = false;
	}
};

/**
 * 显示子分类
 */
const showSubCategories = (category: Category) => {
	if (hideTimeout.value) {
		clearTimeout(hideTimeout.value);
		hideTimeout.value = null;
	}
	hoveredCategory.value = category;
};

/**
 * 隐藏子分类
 */
const hideSubCategories = () => {
	hideTimeout.value = setTimeout(() => {
		hoveredCategory.value = null;
	}, 300); // 300ms 延迟，避免鼠标移动过快导致菜单闪烁
};

/**
 * 保持子分类可见
 */
const keepSubCategoriesVisible = () => {
	if (hideTimeout.value) {
		clearTimeout(hideTimeout.value);
		hideTimeout.value = null;
	}
};

/**
 * 切换显示全部分类
 */
const toggleShowAll = () => {
	showAll.value = !showAll.value;
};

/**
 * 判断是否为当前激活分类
 */
const isActiveCategory = (categoryId: number): boolean => {
	// 这里可以根据当前路由判断激活状态
	return route.params.categoryId === categoryId.toString();
};

/**
 * 刷新分类数据
 */
const refresh = () => {
	loadCategories();
};

// 暴露方法给父组件
defineExpose({
	refresh
});

// 生命周期
onMounted(() => {
	loadCategories();
});

// 监听路由变化
watch(() => route.path, () => {
	// 路由变化时可以重新加载分类或更新激活状态
});
</script>

<style scoped>
.category-navigation {
	@apply relative;
}

/* 主分类导航 */
.main-categories {
	@apply flex flex-wrap items-center gap-1;
}

.category-item {
	@apply relative;
}

.category-link {
	@apply flex items-center gap-2 px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200 no-underline;
}

.category-link.active {
	@apply text-primary bg-primary/10;
}

.category-icon {
	@apply text-lg;
}

.category-name {
	@apply font-medium;
}

.arrow-icon {
	@apply text-sm transition-transform duration-200;
}

.category-item:hover .arrow-icon {
	@apply rotate-180;
}

/* 子分类下拉菜单 */
.subcategory-dropdown {
	@apply absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-96 max-w-4xl;
	animation: fadeInDown 0.2s ease-out;
}

.subcategory-grid {
	@apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6;
}

.subcategory-item {
	@apply block;
}

.subcategory-link {
	@apply flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 no-underline text-gray-700 hover:text-primary;
}

.subcategory-image {
	@apply w-12 h-12 rounded-lg overflow-hidden flex-shrink-0;
}

.subcategory-image img {
	@apply w-full h-full object-cover;
}

.subcategory-info {
	@apply flex-1 min-w-0;
}

.subcategory-name {
	@apply font-semibold text-sm mb-1 line-clamp-1;
}

.subcategory-description {
	@apply text-xs text-gray-500 mb-1 line-clamp-2;
}

.product-count {
	@apply text-xs text-gray-400;
}

/* 查看全部区域 */
.view-all-section {
	@apply border-t border-gray-100 p-4;
}

.view-all-link {
	@apply flex items-center justify-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors duration-200 no-underline;
}

/* 更多分类按钮 */
.more-categories {
	@apply ml-4;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
	@apply flex items-center justify-center gap-2 py-8 text-gray-500;
}

.loading-text {
	@apply text-sm;
}

.empty-icon {
	@apply text-2xl;
}

.empty-text {
	@apply text-sm;
}

/* 动画 */
@keyframes fadeInDown {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 垂直布局 */
.category-navigation[data-layout="vertical"] .main-categories {
	@apply flex-col items-stretch;
}

.category-navigation[data-layout="vertical"] .category-link {
	@apply justify-between;
}

.category-navigation[data-layout="vertical"] .subcategory-dropdown {
	@apply left-full top-0 ml-1 mt-0;
}

/* 网格布局 */
.category-navigation[data-layout="grid"] .main-categories {
	@apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.category-navigation[data-layout="grid"] .category-link {
	@apply flex-col text-center p-6;
}

.category-navigation[data-layout="grid"] .category-icon {
	@apply text-2xl mb-2;
}

.category-navigation[data-layout="grid"] .arrow-icon {
	@apply hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.main-categories {
		@apply flex-col gap-2;
	}
	
	.category-link {
		@apply w-full justify-between;
	}
	
	.subcategory-dropdown {
		@apply left-0 right-0 min-w-full;
	}
	
	.subcategory-grid {
		@apply grid-cols-1;
	}
}

/* 工具类 */
.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>