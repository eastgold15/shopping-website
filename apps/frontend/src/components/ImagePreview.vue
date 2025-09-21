<template>
  <div class="image-preview-container">
    <!-- 主图片显示 -->
    <div class="main-image-container" @click="openPreview">
      <img v-if="mainImage" :src="getImageUrl(mainImage.imageUrl)" :alt="mainImage.fileName || '图片预览'"
        class="main-image" @error="handleImageError" />
      <div v-else class="no-image-placeholder">
        <i class="pi pi-image"></i>
      </div>

      <!-- 多图片指示器 -->
      <div v-if="imageList.length > 1" class="image-indicator">
        <span class="image-count">{{ imageList.length }}</span>
        <i class="pi pi-images"></i>
      </div>

      <!-- 悬停遮罩 -->
      <div class="hover-overlay">
        <i class="pi pi-expand"></i>
        <span class="view-text">预览</span>
      </div>
    </div>

    <!-- 图片预览Dialog -->
    <Dialog v-model:visible="previewVisible" modal :header="`图片预览 (${currentImageIndex + 1}/${imageList.length})`"
      :style="{ width: '80vw', height: '80vh' }" class="image-preview-dialog" :draggable="false" :resizable="false"
      :dismissableMask="true">
      <div class="preview-container">
        <!-- 主图片区域 -->
        <div class="main-preview-area">
          <img v-if="currentImage" :src="getImageUrl(currentImage.imageUrl)" :alt="currentImage.fileName || '图片预览'"
            class="preview-image" @error="handlePreviewImageError" />
          <div v-else class="no-preview-image">
            <i class="pi pi-image"></i>
            <span>暂无图片</span>
          </div>

          <!-- 图片信息 -->
          <div class="image-info-panel">
            <div class="info-item">
              <i class="pi pi-file"></i>
              <span class="info-label">文件名:</span>
              <span class="info-value">{{ currentImage?.fileName || '未知' }}</span>
            </div>
            <div class="info-item">
              <i class="pi pi-tag"></i>
              <span class="info-label">分类:</span>
              <span class="info-value">{{ currentImage?.category || 'general' }}</span>
            </div>
            <div class="info-item">
              <i class="pi pi-hdd"></i>
              <span class="info-label">大小:</span>
              <span class="info-value">{{ formatFileSize(currentImage?.fileSize || 0) }}</span>
            </div>
            <div class="info-item">
              <i class="pi pi-clock"></i>
              <span class="info-label">创建时间:</span>
              <span class="info-value">{{ formatDate(currentImage?.createdAt || new Date()) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <!-- 缩略图区域 -->
        <div v-if="imageList.length > 1" class="thumbnail-area">
          <div class="thumbnail-container">
            <div v-for="(image, index) in imageList" :key="image.id" class="thumbnail-item"
              :class="{ active: index === currentImageIndex }" @click="selectImage(index)">
              <img :src="getImageUrl(image.imageUrl)" :alt="image.fileName" class="thumbnail-img"
                @error="handleThumbnailError" />
            </div>
          </div>

          <!-- 导航按钮 -->
          <div class="nav-buttons">
            <Button icon="pi pi-chevron-left" class="nav-button" :disabled="currentImageIndex === 0"
              @click="previousImage" severity="secondary" outlined />
            <Button icon="pi pi-chevron-right" class="nav-button" :disabled="currentImageIndex === imageList.length - 1"
              @click="nextImage" severity="secondary" outlined />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { SelectImagesVo } from '@backend/types';
import { formatDate, getImageUrl } from '@frontend/utils/formatUtils';
import { computed, ref } from 'vue';

interface Props {
  images?: SelectImagesVo[];
  maxDisplay?: number; // 最大显示数量，默认为1
  size?: 'small' | 'medium' | 'large'; // 图片尺寸
  showIndicator?: boolean; // 是否显示图片数量指示器
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  maxDisplay: 1,
  size: 'small',
  showIndicator: true,
});

console.log("preview", props.images)

// 响应式数据
const previewVisible = ref(false);
const currentImageIndex = ref(0);

// 计算属性
const imageList = computed(() => {
  return props.images || [];
});

const mainImage = computed(() => {
  return imageList.value[0] || null;
});

const currentImage = computed(() => {
  return imageList.value[currentImageIndex.value] || null;
});

// 方法
const openPreview = () => {
  if (imageList.value.length === 0) return;

  currentImageIndex.value = 0;
  previewVisible.value = true;
};

const selectImage = (index: number) => {
  currentImageIndex.value = index;
};

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
};

const nextImage = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    currentImageIndex.value++;
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const container = img.closest('.main-image-container');
  if (container) {
    const placeholder = document.createElement('div');
    placeholder.className = 'no-image-placeholder';
    placeholder.innerHTML = '<i class="pi pi-image"></i>';
    container.appendChild(placeholder);
  }
};

const handlePreviewImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const container = img.closest('.main-preview-area');
  if (container) {
    const placeholder = document.createElement('div');
    placeholder.className = 'no-preview-image';
    placeholder.innerHTML = '<i class="pi pi-image"></i><span>图片加载失败</span>';
    container.appendChild(placeholder);
  }
};

const handleThumbnailError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const thumbnailItem = img.closest('.thumbnail-item');
  if (thumbnailItem) {
    thumbnailItem.classList.add('thumbnail-error');
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '未知大小';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// 图片尺寸类
const getImageSizeClass = computed(() => {
  switch (props.size) {
    case 'medium':
      return 'image-medium';
    case 'large':
      return 'image-large';
    default:
      return 'image-small';
  }
});
</script>

<style scoped>
.image-preview-container {
  position: relative;
  flex: 1
    /* display: inline-block; */
}

.main-image-container {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.main-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-medium .main-image {
  width: 64px;
  height: 64px;
}

.image-large .main-image {
  width: 96px;
  height: 96px;
}

.main-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.no-image-placeholder {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d1d5db;
  color: #9ca3af;
  font-size: 18px;
}

.image-medium .no-image-placeholder {
  width: 64px;
  height: 64px;
}

.image-large .no-image-placeholder {
  width: 96px;
  height: 96px;
}

.image-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  z-index: 1;
}

.image-count {
  line-height: 1;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.main-image-container:hover .hover-overlay {
  opacity: 1;
}

.hover-overlay i {
  color: white;
  font-size: 16px;
  margin-bottom: 4px;
}

.view-text {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* Dialog 自定义样式 */
:deep(.image-preview-dialog) {
  .p-dialog {
    border-radius: 12px;
    overflow: hidden;

    .p-dialog-header {
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;

      .p-dialog-title {
        font-weight: 600;
        color: #1e293b;
      }
    }

    .p-dialog-content {
      padding: 0;
      background: #f8fafc;
      height: calc(90vh - 120px);
      /* 减去header和footer的高度 */
      overflow: hidden;
      /* 禁止内容区域滚动 */
    }

    .p-dialog-footer {
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
    }
  }
}

.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  /* 禁止容器滚动 */
}

.main-preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  min-height: 0;
  /* 防止flex子元素溢出 */
}

.preview-image {
  max-width: 50%;
  max-height: 80%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.no-preview-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748b;
  font-size: 1.2rem;

  i {
    font-size: 4rem;
    opacity: 0.5;
  }
}

.image-info-panel {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  min-width: 280px;
  max-width: 350px;
  overflow-y: auto;
  /* 只允许信息面板滚动 */
  max-height: 80%;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  i {
    color: #3b82f6;
    width: 16px;
    text-align: center;
  }

  .info-label {
    font-weight: 500;
    color: #475569;
    min-width: 80px;
  }

  .info-value {
    color: #1e293b;
    font-weight: 500;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.thumbnail-area {
  width: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.thumbnail-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  /* 只允许横向滚动 */
  overflow-y: hidden;
  /* 禁止纵向滚动 */
  padding: 0.5rem 0;
  justify-content: center;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
}

.thumbnail-item {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #3b82f6;
    transform: scale(1.05);
  }

  &.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  &.thumbnail-error {
    background: #fef2f2;
    border-color: #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '❌';
      font-size: 1.5rem;
    }
  }
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.nav-button {
  min-width: 40px;
  border-radius: 50%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  :deep(.image-preview-dialog) {
    .p-dialog-content {
      height: calc(90vh - 140px);
      /* 移动端调整高度 */
    }
  }

  .main-preview-area {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .preview-image {
    max-width: 90%;
    max-height: 40%;
  }

  .image-info-panel {
    min-width: 100%;
    max-width: 100%;
    max-height: 200px;
  }

  .thumbnail-container {
    justify-content: flex-start;
  }

  .dialog-footer {
    flex-wrap: wrap;

    .p-button {
      flex: 1;
      min-width: 100px;
    }
  }
}

/* 超大屏幕调整 */
@media (min-width: 1400px) {
  .preview-image {
    max-width: 40%;
  }

  .image-info-panel {
    max-width: 400px;
  }
}
</style>