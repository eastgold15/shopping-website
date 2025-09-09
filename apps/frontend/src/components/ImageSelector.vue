<script setup lang="ts">
import type { ImageEntity } from '@backend/modules/image/images.model';
import { formatDate, formatSize, getImageUrl } from '@frontend/utils/formatUtils';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { api } from '@frontend/utils/handleApi';
import { useToast } from 'primevue/usetoast';
// Toast
const toast = useToast();
// Props
interface Props {
  category?: string; // 可选的分类过滤
}

const visible = defineModel('visible', { default: false })


// Emits
interface Emits {

  (e: 'select', imageUrl: string, imageData: ImageEntity): void;
}

const props = withDefaults(defineProps<Props>(), {
  category: 'all'
});

const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const images = ref<ImageEntity[]>([]);
const searchQuery = ref('');
const selectedCategory = ref(props.category);
const hoveredImage = ref<number | undefined>(undefined);

const meta = reactive({
  page: 1,
  pageSize: 10
})
// 分类选项
const categoryOptions = [
  { label: '全部', value: 'all' },
  { label: '轮播图', value: 'carousel' },
  { label: '商品图片', value: 'product' },
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
  const start = meta.page;
  const end = start + meta.pageSize
  return filteredImages.value.slice(start, end);
});

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(filteredImages.value.length / meta.pageSize);
});

// 方法

/**
 * 加载图片列表
 */
const loadImages = async () => {
  loading.value = true;
  try {
    const { code, data, message } = await api.images.list() as any
    if (code !== 200) {
      toast.add({
        severity: 'error',
        summary: '加载失败',
        detail: message,
        life: 3000
      });
    }
    images.value = data.items
    meta = data.meta
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: (error as Error).message,
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 按分类过滤
 */
const filterByCategory = () => {
  meta.page = 0; // 重置到第一页
};

/**
 * 搜索图片
 */
const searchImages = () => {
  meta.page = 0;  // 重置到第一页
};

/**
 * 分页变化
 */
const onPageChange = (event: any) => {
  meta.page = event.first;
  meta.pageSize = event.rows;
};

/**
 * 选择图片
 */
const selectImage = (image: ImageEntity) => {
  const imageUrl = getImageUrl(image.url);
  emit('select', imageUrl, image);

};



/**
 * 获取分类标签
 */
const getCategoryLabel = (category: string): string => {
  const option = categoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};

// 监听visible变化，当对话框打开时加载图片
watch(() => visible.value, (newVisible) => {
  if (newVisible) {
    loadImages();
  }
});

// 生命周期
onMounted(() => {
  if (visible.value) {
    loadImages();
  }
});
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="'选择图片'" class="w-80vw h-80vh">
    <!-- 工具栏 -->
    <div class=" flex justify-between items-center ">
      <!-- 分类筛选 -->
      <Select v-model="selectedCategory" :options="categoryOptions" optionLabel="label" optionValue="value"
        placeholder="选择分类" @change="filterByCategory" />

      <!-- 搜索框 -->
      <InputText v-model="searchQuery" placeholder="搜索图片..." @input="searchImages" />
    </div>

    <!-- 图片网格 -->
    <div class=" min-h-300px flex-center-center">
      <div v-if="loading" class="text-center">
        <ProgressSpinner />
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredImages.length === 0" class="text-center mb-4">
        <i class="pi pi-image empty-icon"></i>
        <h3>暂无图片</h3>
        <p>没有找到符合条件的图片</p>
      </div>

      <div v-else class="image-grid ">
        <div v-for="image in paginatedImages" :key="image.id" class="image-card"
          :class="{ 'hovered': hoveredImage === image.id }" @mouseenter="hoveredImage = image.id"
          @mouseleave="hoveredImage = undefined" @click="selectImage(image)">
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
              <span class="image-category">{{ getCategoryLabel(image.category || 'general') }}</span>
              <span class="image-size">{{ formatSize(image.fileSize) }}</span>
            </div>
            <small class="image-date">{{ formatDate(image.createdAt || new Date()) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <Paginator v-model:first="meta.page" :rows="meta.pageSize" :totalRecords="filteredImages.length"
        :rowsPerPageOptions="[12, 24, 48]" @page="onPageChange" />
    </div>




    <template #footer>
      <Button label="取消" icon="pi pi-times" @click="visible = false" class="" />
    </template>
  </Dialog>
</template>

<style scoped>
.image-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.image-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
}

.image-card.hovered {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-preview {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card.hovered .image-overlay {
  opacity: 1;
}

.image-info {
  padding: 1rem;
}

.image-name {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.image-category,
.image-size {
  font-size: 0.8rem;
  color: #6c757d;
}

.image-date {
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  color: #ced4da;
  margin-bottom: 1rem;
}

.pagination-container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>