<template>
  <div class="image-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">图片管理</h1>
      <p class="page-description">管理网站中的所有图片资源，包括轮播图、Banner图、新闻图片等</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 分类筛选 -->
        <Dropdown v-model="selectedCategory" :options="categoryOptions" optionLabel="label" optionValue="value"
          placeholder="选择分类" class="category-filter" @change="filterByCategory" />
        
        <!-- 搜索框 -->
        <span class="p-input-icon-left search-box">
          <i class="pi pi-search" />
          <InputText v-model="searchQuery" placeholder="搜索图片..." @input="searchImages" />
        </span>
      </div>
      
      <div class="toolbar-right">
        <!-- 批量操作 -->
        <Button v-if="selectedImages.length > 0" icon="pi pi-trash" label="批量删除" severity="danger"
          @click="confirmBatchDelete" class="batch-delete-btn" />
        
        <!-- 上传按钮 -->
        <Button icon="pi pi-upload" label="上传图片" @click="showUploadDialog = true" class="upload-btn" />
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
        <p>点击上传按钮添加图片</p>
      </div>
      
      <div v-else class="images-grid">
        <div v-for="image in paginatedImages" :key="image.id" class="image-card"
          :class="{ 'selected': selectedImages.includes(image.id) }">
          <!-- 选择框 -->
          <Checkbox v-model="selectedImages" :inputId="`img-${image.id}`" :value="image.id"
            class="image-checkbox" />
          
          <!-- 图片预览 -->
          <div class="image-preview" @click="previewImage(image)">
            <img :src="image.url" :alt="image.fileName" class="preview-img" loading="lazy" />
            <div class="image-overlay">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-sm p-button-secondary"
                @click.stop="previewImage(image)" v-tooltip="'预览'" />
              <Button icon="pi pi-copy" class="p-button-rounded p-button-sm p-button-info"
                @click.stop="copyImageUrl(image)" v-tooltip="'复制链接'" />
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-sm p-button-warning"
                @click.stop="editImage(image)" v-tooltip="'编辑'" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-sm p-button-danger"
                @click.stop="confirmDelete(image)" v-tooltip="'删除'" />
            </div>
          </div>
          
          <!-- 图片信息 -->
          <div class="image-info">
            <h4 class="image-name" :title="image.fileName">{{ image.fileName }}</h4>
            <div class="image-meta">
              <span class="image-category">{{ getCategoryLabel(image.category) }}</span>
              <span class="image-size">{{ formatFileSize(image.fileSize) }}</span>
            </div>
            <div class="image-actions">
              <small class="image-date">{{ formatDate(image.uploadDate) }}</small>
              <div class="action-buttons">
                <Button icon="pi pi-external-link" class="p-button-text p-button-sm"
                  @click="openImageInNewTab(image)" v-tooltip="'在新标签页打开'" />
              </div>
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

    <!-- 上传对话框 -->
    <Dialog v-model:visible="showUploadDialog" :modal="true" :closable="true" :draggable="false"
      class="upload-dialog" header="上传图片">
      <div class="upload-dialog-content">
        <!-- 分类选择 -->
        <div class="form-field">
          <label for="upload-category">图片分类</label>
          <Dropdown v-model="uploadCategory" :options="categoryOptions.filter(c => c.value !== 'all')"
            optionLabel="label" optionValue="value" placeholder="选择分类" inputId="upload-category" />
        </div>
        
        <!-- 图片上传组件 -->
        <ImageUpload :folder="uploadCategory" :multiple="true" @uploaded="onImagesUploaded" @error="onUploadError" />
      </div>
    </Dialog>

    <!-- 图片预览对话框 -->
    <Dialog v-model:visible="showPreviewDialog" :modal="true" :closable="true" :draggable="false"
      class="preview-dialog" :header="previewImageData?.fileName">
      <div class="preview-dialog-content" v-if="previewImageData">
        <img :src="previewImageData.url" :alt="previewImageData.fileName" class="preview-large-img" />
        <div class="preview-info">
          <div class="info-row">
            <strong>文件名:</strong> {{ previewImageData.fileName }}
          </div>
          <div class="info-row">
            <strong>分类:</strong> {{ getCategoryLabel(previewImageData.category) }}
          </div>
          <div class="info-row">
            <strong>大小:</strong> {{ formatFileSize(previewImageData.fileSize) }}
          </div>
          <div class="info-row">
            <strong>上传时间:</strong> {{ formatDate(previewImageData.uploadDate) }}
          </div>
          <div class="info-row">
            <strong>URL:</strong>
            <InputText :value="previewImageData.url" readonly class="url-input" />
            <Button icon="pi pi-copy" class="p-button-sm" @click="copyImageUrl(previewImageData)" />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- 编辑图片对话框 -->
    <Dialog v-model:visible="showEditDialog" :modal="true" :closable="true" :draggable="false"
      class="edit-dialog" header="编辑图片">
      <div class="edit-dialog-content" v-if="editImageData">
        <div class="form-field">
          <label for="edit-filename">文件名</label>
          <InputText v-model="editImageData.fileName" inputId="edit-filename" />
        </div>
        
        <div class="form-field">
          <label for="edit-category">分类</label>
          <Dropdown v-model="editImageData.category" :options="categoryOptions.filter(c => c.value !== 'all')"
            optionLabel="label" optionValue="value" inputId="edit-category" />
        </div>
        
        <div class="form-field">
          <label for="edit-alt">Alt文本</label>
          <InputText v-model="editImageData.altText" inputId="edit-alt" placeholder="图片描述" />
        </div>
      </div>
      
      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="showEditDialog = false" class="p-button-text" />
        <Button label="保存" icon="pi pi-check" @click="saveImageEdit" :loading="saving" />
      </template>
    </Dialog>

    <!-- 删除确认对话框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Paginator from 'primevue/paginator';
import ConfirmDialog from 'primevue/confirmdialog';
import ImageUpload from '../../components/ImageUpload.vue';
import { $fetch } from 'ofetch';

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

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const images = ref<ImageData[]>([]);
const selectedImages = ref<string[]>([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const showUploadDialog = ref(false);
const showPreviewDialog = ref(false);
const showEditDialog = ref(false);
const previewImageData = ref<ImageData | null>(null);
const editImageData = ref<ImageData | null>(null);
const uploadCategory = ref('general');

// 分页
const first = ref(0);
const pageSize = ref(12);

// Toast 和 Confirm
const toast = useToast();
const confirm = useConfirm();

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
    const response = await $fetch('/api/images');
    if (response.success) {
      images.value = response.data;
    } else {
      throw new Error(response.error || '加载失败');
    }
  } catch (error) {
    console.error('加载图片失败:', error);
    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: '无法加载图片列表',
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
 * 预览图片
 */
const previewImage = (image: ImageData) => {
  previewImageData.value = image;
  showPreviewDialog.value = true;
};

/**
 * 编辑图片
 */
const editImage = (image: ImageData) => {
  editImageData.value = { ...image };
  showEditDialog.value = true;
};

/**
 * 保存图片编辑
 */
const saveImageEdit = async () => {
  if (!editImageData.value) return;
  
  saving.value = true;
  try {
    const response = await $fetch(`/api/images/${editImageData.value.id}`, {
      method: 'PUT',
      body: {
        fileName: editImageData.value.fileName,
        category: editImageData.value.category,
        altText: editImageData.value.altText
      }
    });
    
    if (response.success) {
      // 更新本地数据
      const index = images.value.findIndex(img => img.id === editImageData.value!.id);
      if (index !== -1) {
        images.value[index] = { ...editImageData.value };
      }
      
      showEditDialog.value = false;
      toast.add({
        severity: 'success',
        summary: '保存成功',
        detail: '图片信息已更新',
        life: 3000
      });
    } else {
      throw new Error(response.error || '保存失败');
    }
  } catch (error) {
    console.error('保存失败:', error);
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存图片信息',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

/**
 * 复制图片URL
 */
const copyImageUrl = async (image: ImageData) => {
  try {
    await navigator.clipboard.writeText(image.url);
    toast.add({
      severity: 'success',
      summary: '复制成功',
      detail: '图片链接已复制到剪贴板',
      life: 2000
    });
  } catch (error) {
    console.error('复制失败:', error);
    toast.add({
      severity: 'error',
      summary: '复制失败',
      detail: '无法复制到剪贴板',
      life: 2000
    });
  }
};

/**
 * 在新标签页打开图片
 */
const openImageInNewTab = (image: ImageData) => {
  window.open(image.url, '_blank');
};

/**
 * 确认删除单个图片
 */
const confirmDelete = (image: ImageData) => {
  confirm.require({
    message: `确定要删除图片 "${image.fileName}" 吗？`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteImage(image.id)
  });
};

/**
 * 确认批量删除
 */
const confirmBatchDelete = () => {
  confirm.require({
    message: `确定要删除选中的 ${selectedImages.value.length} 张图片吗？`,
    header: '批量删除确认',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => batchDeleteImages()
  });
};

/**
 * 删除单个图片
 */
const deleteImage = async (imageId: string) => {
  try {
    const response = await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      // 从列表中移除
      images.value = images.value.filter(img => img.id !== imageId);
      
      // 从选中列表中移除
      selectedImages.value = selectedImages.value.filter(id => id !== imageId);
      
      toast.add({
        severity: 'success',
        summary: '删除成功',
        detail: '图片已删除',
        life: 2000
      });
    } else {
      throw new Error(response.error || '删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    toast.add({
      severity: 'error',
      summary: '删除失败',
      detail: '无法删除图片',
      life: 2000
    });
  }
};

/**
 * 批量删除图片
 */
const batchDeleteImages = async () => {
  try {
    const response = await $fetch('/api/images/batch', {
      method: 'DELETE',
      body: { imageIds: selectedImages.value }
    });
    
    if (response.success) {
      // 从列表中移除
      images.value = images.value.filter(img => !selectedImages.value.includes(img.id));
      
      // 清空选中列表
      selectedImages.value = [];
      
      toast.add({
        severity: 'success',
        summary: '删除成功',
        detail: `已删除 ${response.data.deletedCount} 张图片`,
        life: 3000
      });
    } else {
      throw new Error(response.error || '批量删除失败');
    }
  } catch (error) {
    console.error('批量删除失败:', error);
    toast.add({
      severity: 'error',
      summary: '删除失败',
      detail: '无法批量删除图片',
      life: 3000
    });
  }
};

/**
 * 图片上传成功回调
 */
const onImagesUploaded = (uploadedImages: any[]) => {
  // 添加到图片列表
  const newImages: ImageData[] = uploadedImages.map(img => ({
    id: generateId(),
    fileName: img.fileName,
    url: img.url,
    category: uploadCategory.value,
    fileSize: 0, // 需要从服务器获取
    uploadDate: new Date().toISOString(),
    altText: ''
  }));
  
  images.value.unshift(...newImages);
  
  // 关闭上传对话框
  showUploadDialog.value = false;
  
  toast.add({
    severity: 'success',
    summary: '上传成功',
    detail: `成功上传 ${uploadedImages.length} 张图片`,
    life: 3000
  });
};

/**
 * 图片上传错误回调
 */
const onUploadError = (error: string) => {
  toast.add({
    severity: 'error',
    summary: '上传失败',
    detail: error,
    life: 3000
  });
};

/**
 * 获取分类标签
 */
const getCategoryLabel = (category: string): string => {
  const option = categoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 生成ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 生命周期
onMounted(() => {
  loadImages();
});
</script>

<style scoped>
.image-manager {
  @apply p-6;
}

/* 页面标题 */
.page-header {
  @apply mb-6;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.page-description {
  @apply text-gray-600;
}

/* 工具栏 */
.toolbar {
  @apply flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm;
}

.toolbar-left {
  @apply flex items-center gap-4;
}

.toolbar-right {
  @apply flex items-center gap-3;
}

.category-filter {
  @apply w-48;
}

.search-box {
  @apply w-64;
}

.batch-delete-btn {
  @apply mr-2;
}

/* 图片容器 */
.images-container {
  @apply min-h-96;
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
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4;
}

.image-card {
  @apply bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md;
  @apply border-2 border-transparent;
}

.image-card.selected {
  @apply border-primary;
}

.image-checkbox {
  @apply absolute top-2 left-2 z-10;
}

.image-preview {
  @apply relative cursor-pointer;
  height: 200px;
}

.preview-img {
  @apply w-full h-full object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300;
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

.image-actions {
  @apply flex justify-between items-center;
}

.image-date {
  @apply text-xs text-gray-500;
}

.action-buttons {
  @apply flex gap-1;
}

/* 分页 */
.pagination-container {
  @apply mt-6 flex justify-center;
}

/* 对话框 */
.upload-dialog,
.preview-dialog,
.edit-dialog {
  @apply w-full max-w-4xl;
}

.upload-dialog-content,
.edit-dialog-content {
  @apply space-y-4;
}

.form-field {
  @apply space-y-2;
}

.form-field label {
  @apply block text-sm font-medium text-gray-700;
}

.preview-dialog-content {
  @apply text-center;
}

.preview-large-img {
  @apply max-w-full max-h-96 object-contain mx-auto mb-4;
}

.preview-info {
  @apply text-left space-y-3;
}

.info-row {
  @apply flex items-center gap-2;
}

.url-input {
  @apply flex-1 mr-2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    @apply flex-col gap-4;
  }
  
  .toolbar-left,
  .toolbar-right {
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
    height: 150px;
  }
}
</style>