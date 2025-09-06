<template>
  <nav class="category-nav" :class="{ 'mobile-nav': isMobile }">
    <div class="category-container">
      <!-- 桌面端分类导航菜单 -->
      <ul v-if="!isMobile" class="category-list">
        <li v-for="category in categories" :key="category.id" class="category-item"
          @mouseenter="showDropdown(category.id)" @mouseleave="hideDropdown">
          <a href="#" class="category-link" @click.prevent="navigateToCategory(category)">
            <i v-if="category.icon" :class="category.icon" class="category-icon"></i>
            {{ category.name }}
            <i v-if="category.children && category.children.length > 0" class="pi pi-angle-down dropdown-arrow"></i>
          </a>

          <!-- 桌面端下拉菜单 -->
          <div v-if="category.children && category.children.length > 0 && activeDropdown === category.id"
            class="dropdown-menu" @mouseenter="keepDropdownOpen" @mouseleave="hideDropdown">
            <div class="dropdown-content">
              <div class="subcategory-grid">
                <div v-for="subcategory in category.children" :key="subcategory.id" class="subcategory-group">
                  <h4 class="subcategory-title">
                    <a href="#" @click.prevent="navigateToCategory(subcategory)" class="subcategory-link">
                      {{ subcategory.name }}
                    </a>
                  </h4>

                  <!-- 三级分类 -->
                  <ul v-if="subcategory.children && subcategory.children.length > 0" class="third-level-list">
                    <li v-for="thirdLevel in subcategory.children" :key="thirdLevel.id" class="third-level-item">
                      <a href="#" @click.prevent="navigateToCategory(thirdLevel)" class="third-level-link">
                        {{ thirdLevel.name }}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- 移动端分类菜单 -->
      <div v-else class="mobile-category-list">
        <div v-for="category in categories" :key="category.id" class="mobile-category-item">
          <!-- 一级分类 -->
          <div class="mobile-category-header">
            <a href="#" class="mobile-category-link" @click.prevent="navigateToCategory(category)">
              <i v-if="category.icon" :class="category.icon" class="mobile-category-icon"></i>
              <span class="mobile-category-name">{{ category.name }}</span>
            </a>

            <!-- 展开/收起按钮 -->
            <button v-if="category.children && category.children.length > 0" @click="toggleMobileCategory(category.id)"
              class="mobile-expand-btn">
              <i class="pi pi-angle-down transition-transform duration-200"
                :class="{ 'rotate-180': isCategoryExpanded(category.id) }"></i>
            </button>
          </div>

          <!-- 二级分类 -->
          <div v-if="category.children && category.children.length > 0 && isCategoryExpanded(category.id)"
            class="mobile-subcategory-list">
            <div v-for="subcategory in category.children" :key="subcategory.id" class="mobile-subcategory-item">
              <a href="#" @click.prevent="navigateToCategory(subcategory)" class="mobile-subcategory-link">
                {{ subcategory.name }}
              </a>

              <!-- 三级分类 -->
              <div v-if="subcategory.children && subcategory.children.length > 0" class="mobile-third-level-list">
                <a v-for="thirdLevel in subcategory.children" :key="thirdLevel.id" href="#"
                  @click.prevent="navigateToCategory(thirdLevel)" class="mobile-third-level-link">
                  {{ thirdLevel.name }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { client } from '@/share/useTreaty';
import { onMounted, ref } from 'vue';
import type { CategoryTree } from '../types/layout';
import { handleApiRes } from '../utils/handleApi';

// Props
interface Props {
  isMobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false
});

// Emits
const emit = defineEmits<{
  categorySelected: [category: CategoryTree];
}>();






// 响应式数据
const categories = ref<CategoryTree[]>([]);
const activeDropdown = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// 下拉菜单控制
let hideTimeout: NodeJS.Timeout | null = null;

// 显示下拉菜单
const showDropdown = (categoryId: string) => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  activeDropdown.value = categoryId;
};

// 隐藏下拉菜单
const hideDropdown = () => {
  hideTimeout = setTimeout(() => {
    activeDropdown.value = null;
  }, 200); // 200ms延迟，避免鼠标移动时闪烁
};

// 保持下拉菜单打开
const keepDropdownOpen = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

// 导航到分类页面
const navigateToCategory = (category: CategoryTree) => {
  // TODO: 实现分类页面导航
  console.log('导航到分类:', category.name, category.id);
  // 这里可以使用 Vue Router 进行页面跳转
  // router.push(`/category/${category.id}`);

  // 在移动端模式下，触发分类选择事件
  if (props.isMobile) {
    emit('categorySelected', category);
  }
};

// 移动端子分类展开状态
const expandedCategories = ref<Set<string>>(new Set());

// 切换移动端分类展开状态
const toggleMobileCategory = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
};

// 检查分类是否展开
const isCategoryExpanded = (categoryId: string) => {
  return expandedCategories.value.has(categoryId);
};

// 获取分类数据
const fetchCategories = async () => {
  try {
    loading.value = true;
    error.value = null;

    const res = await handleApiRes(client.api.categories.tree.get())

    console.log("11",res)
    if (!res) {
      return;
    }

    if (res.code === 200 && res.data) {
      categories.value = (res.data as any )
    } else {
      // 使用模拟数据作为后备
      categories.value = [];
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '网络请求失败';
    console.error('获取分类数据失败:', err);
    // 使用模拟数据作为后备
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据（只在客户端执行）
onMounted(async () => {

  await fetchCategories();

});
</script>

<style scoped>
/* 基础样式 */
.category-nav {
  @apply bg-white;
}

.category-nav:not(.mobile-nav) {
  @apply shadow-sm border-b border-gray-200;
}

.category-container {
  @apply w-full mx-auto px-[2.5%];
}

/* 桌面端样式 */
.category-list {
  @apply flex items-center space-x-8 py-3;
  list-style: none;
  margin: 0;
  padding: 0;
}

.category-item {
  @apply relative;
}

.category-link {
  @apply flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 no-underline;
  font-weight: 500;
}

.category-icon {
  @apply text-lg;
}

.dropdown-arrow {
  @apply text-xs transition-transform duration-200;
}

.category-item:hover .dropdown-arrow {
  @apply transform rotate-180;
}

.dropdown-menu {
  @apply absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-lg z-50;
  min-width: 50vw;
  max-width: 80vw;
  margin-top: 8px;
}

.dropdown-content {
  @apply p-6;
}

.subcategory-grid {
  @apply grid grid-cols-3 gap-6;
}

.subcategory-group {
  @apply space-y-3;
}

.subcategory-title {
  @apply text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2;
  margin: 0;
}

.subcategory-link {
  @apply text-gray-900 hover:text-blue-600 no-underline transition-colors duration-200;
}

.third-level-list {
  @apply space-y-2;
  list-style: none;
  margin: 0;
  padding: 0;
}

.third-level-item {
  @apply text-sm;
}

.third-level-link {
  @apply text-gray-600 hover:text-blue-600 no-underline transition-colors duration-200;
}

/* 移动端样式 */
.mobile-nav {
  @apply h-full;
}

.mobile-nav .category-container {
  @apply px-0;
}

.mobile-category-list {
  @apply divide-y divide-gray-100;
}

.mobile-category-item {
  @apply border-b border-gray-100 last:border-b-0;
}

.mobile-category-header {
  @apply flex items-center justify-between px-4 py-3;
}

.mobile-category-link {
  @apply flex items-center space-x-3 flex-1 text-gray-800 hover:text-blue-600 no-underline transition-colors duration-200;
}

.mobile-category-icon {
  @apply text-lg text-blue-600;
}

.mobile-category-name {
  @apply font-medium text-base;
}

.mobile-expand-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.mobile-subcategory-list {
  @apply bg-gray-50 px-4 pb-3;
}

.mobile-subcategory-item {
  @apply py-2 border-b border-gray-200 last:border-b-0;
}

.mobile-subcategory-link {
  @apply block text-gray-700 hover:text-blue-600 font-medium text-sm no-underline transition-colors duration-200 py-1;
}

.mobile-third-level-list {
  @apply mt-2 ml-4 space-y-1;
}

.mobile-third-level-link {
  @apply block text-gray-600 hover:text-blue-600 text-sm no-underline transition-colors duration-200 py-1;
}

/* 响应式优化 */
@media (max-width: 480px) {
  .mobile-category-header {
    @apply px-3 py-2;
  }

  .mobile-category-name {
    @apply text-sm;
  }

  .mobile-subcategory-list {
    @apply px-3;
  }
}
</style>