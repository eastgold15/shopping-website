<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Paginator from 'primevue/paginator';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, onMounted, ref, watch } from 'vue';
import { client } from '@/share/useTreaty';
import { formatSize, formatDate, getImageUrl } from '@/share/utils/formatUtils';
import { useToast } from 'primevue/usetoast';
import { handleApiRes } from '../utils/handleApi';

// 图片数据类型
interface ImageData {
  id: string;
  fileName: string;
  url: string;
  category: string;
  fileSize: number;
  uploadDate: string;
  altText?: string;
}

// Props
interface Props {
  visible: boolean;
  category?: string; // 可选的分类过滤
}

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'select', imageUrl: string, imageData: ImageData): void;
}

const props = withDefaults(defineProps<Props>(), {
  category: 'all'
});

const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const images = ref<ImageData[]>([]);
const searchQuery = ref('');
const selectedCategory = ref(props.category);
const hoveredImage = ref<string | null>(null);

// 分页
const first = ref(0);
const pageSize = ref(12);

// Toast
const toast = useToast();

// 分类选项
const categoryOptions = [
  { label: '全部', value: 'all' },
  { label: '轮播图', value: 'carousel' },
  { label: 'Banner图', value: 'banner' },
  { label: '新闻图片', value: 'news' },
  { label: '产品图片', value: 'product' },
  { label: '分类图片', value: 'category' },
  { label: '其他', value: 'general' }
];

// 计算属性

/**
 * 过滤后的图片列表
 */
const filteredImages = computed(() => {
  let result = images.value;

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter(img => img.category === selectedCategory.value);
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(img =>
      img.fileName.toLowerCase().includes(query) ||
      img.altText?.toLowerCase().includes(query)
    );
  }

  return result;
});

/**
 * 分页后的图片列表
 */
const paginatedImages = computed(() => {
  const start = first.value;
  const end = start + pageSize.value;
  return filteredImages.value.slice(start, end);
});

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(filteredImages.value.length / pageSize.value);
});

// 方法

/**
 * 加载图片列表
 */
const loadImages = async () => {
  loading.value = true;
  try {
    // @ts-ignore
    const response = await handleApiRes(client.api.images.get());
    if (!response) {
      throw new Error("加载图片列表失败");
    }
    console.log("111111111111", response)



    if (response.code === 200) {
      // @ts-ignore
      images.value = response.data
    }
  } catch (error) {


    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: (error as Error).message,
      life: 3000
    });




    // if (error instanceof Error) {
    //   error.message
    // }
  } finally {
    loading.value = false;
  }
};

/**
 * 按分类过滤
 */
const filterByCategory = () => {
  first.value = 0; // 重置到第一页
};

/**
 * 搜索图片
 */
const searchImages = () => {
  first.value = 0; // 重置到第一页
};

/**
 * 分页变化
 */
const onPageChange = (event: any) => {
  first.value = event.first;
  pageSize.value = event.rows;
};

/**
 * 选择图片
 */
const selectImage = (image: ImageData) => {
  const imageUrl = getImageUrl(image.url);
  emit('select', imageUrl, image);
  emit('update:visible', false);
};

/**
 * 关闭对话框
 */
const closeDialog = () => {
  emit('update:visible', false);
};

/**
 * 获取分类标签
 */
const getCategoryLabel = (category: string): string => {
  const option = categoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};

// 监听visible变化，当对话框打开时加载图片
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadImages();
  }
});

// 生命周期
onMounted(() => {
  if (props.visible) {
    loadImages();
  }
});
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" :modal="true" :closable="true"
    :draggable="false" class="image-selector-dialog" header="选择图片" :style="{ width: '90vw', maxWidth: '1200px' }">
    <div class="image-selector">
      <!-- 搜索和筛选工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <!-- 分类筛选 -->
          <Select v-model="selectedCategory" :options="categoryOptions" optionLabel="label" optionValue="value"
            placeholder="选择分类" class="category-filter" @change="filterByCategory" />

          <!-- 搜索框 -->
          <InputGroup class="search-box">
            <InputGroupAddon>
              <i class="pi pi-search" />
            </InputGroupAddon>
            <InputText v-model="searchQuery" placeholder="搜索图片..." @input="searchImages" />
          </InputGroup>
        </div>
      </div>

      <!-- 图片网格 -->
      <div class="images-container">
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredImages.length === 0" class="empty-state">
          <i class="pi pi-image empty-icon"></i>
          <h3>暂无图片</h3>
          <p>没有找到符合条件的图片</p>
        </div>

        <div v-else class="images-grid">
          <div v-for="image in paginatedImages" :key="image.id" class="image-card"
            :class="{ 'hovered': hoveredImage === image.id }" @mouseenter="hoveredImage = image.id"
            @mouseleave="hoveredImage = null" @click="selectImage(image)">
            <!-- 图片预览 -->
            <div class="image-preview">
              <img :src="getImageUrl(image.url)" :alt="image.fileName" class="preview-img" loading="lazy" />
              <div class="image-overlay">
                <Button icon="pi pi-check" class="p-button-rounded p-button-sm p-button-success" label="选择" />
              </div>
            </div>

            <!-- 图片信息 -->
            <div class="image-info">
              <h4 class="image-name" :title="image.fileName">{{ image.fileName }}</h4>
              <div class="image-meta">
                <span class="image-category">{{ getCategoryLabel(image.category) }}</span>
                <span class="image-size">{{ formatSize(image.fileSize) }}</span>
              </div>
              <div class="image-date">
                <small>{{ formatDate(image.uploadDate) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <Paginator v-model:first="first" :rows="pageSize" :totalRecords="filteredImages.length"
          :rowsPerPageOptions="[12, 24, 48]" @page="onPageChange" />
      </div>
    </div>

    <template #footer>
      <Button label="取消" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
    </template>
  </Dialog>
</template>

<style scoped>
/* 对话框样式 */
.image-selector-dialog {
  @apply w-full;
}

.image-selector {
  @apply space-y-4;
}

/* 工具栏 */
.toolbar {
  @apply flex items-center justify-between gap-4 pb-4 border-b;
}

.toolbar-left {
  @apply flex items-center gap-4;
}

.category-filter {
  @apply w-40;
}

.search-box {
  @apply w-64;
}

/* 图片容器 */
.images-container {
  @apply min-h-96 max-h-96 overflow-y-auto;
}

.loading-container {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-container p {
  @apply mt-4 text-gray-600;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold mb-2;
}

/* 图片网格 */
.images-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4;
}

.image-card {
  @apply bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer;
  @apply border-2 border-transparent hover:border-primary;
}

.image-card.hovered {
  @apply border-primary shadow-lg transform scale-105;
}

.image-preview {
  @apply relative;
  height: 120px;
}

.preview-img {
  @apply w-full h-full object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 transition-opacity duration-300;
}

.image-card:hover .image-overlay {
  @apply opacity-100;
}

.image-info {
  @apply p-3;
}

.image-name {
  @apply text-sm font-medium text-gray-800 truncate mb-2;
}

.image-meta {
  @apply flex justify-between items-center mb-2;
}

.image-category {
  @apply text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded;
}

.image-size {
  @apply text-xs text-gray-500;
}

.image-date {
  @apply text-xs text-gray-500;
}

/* 分页 */
.pagination-container {
  @apply mt-4 flex justify-center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    @apply flex-col gap-4;
  }

  .toolbar-left {
    @apply w-full justify-center;
  }

  .category-filter,
  .search-box {
    @apply w-full;
  }

  .images-grid {
    @apply grid-cols-2;
  }

  .image-preview {
    height: 100px;
  }
}
</style>