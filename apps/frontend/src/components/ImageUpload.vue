<template>
  <div class="image-upload-component">
    <!-- 上传区域 -->
    <div class="upload-area" :class="{ 'drag-over': isDragOver }" @drop="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave" @click="triggerFileInput">
      <input ref="fileInput" type="file" :accept="acceptedTypes.join(',')" :multiple="multiple" @change="handleFileSelect"
        class="hidden" />

      <!-- 上传图标和文本 -->
      <div class="upload-content">
        <i class="pi pi-cloud-upload upload-icon"></i>
        <p class="upload-text">点击或拖拽图片到此处上传</p>
        <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 5MB</p>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <ProgressBar :value="uploadProgress" :showValue="true" />
      <span class="progress-text">上传中... {{ uploadProgress }}%</span>
    </div>

    <!-- 已上传的图片预览 -->
    <div v-if="uploadedImages.length > 0" class="uploaded-images">
      <h4 class="images-title">已上传的图片</h4>
      <div class="images-grid">
        <div v-for="(image, index) in uploadedImages" :key="index" class="image-item">
          <div class="image-preview">
            <img :src="image.url" :alt="image.fileName" class="preview-img" />
            <div class="image-overlay">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-sm p-button-secondary"
                @click="previewImage(image)" v-tooltip="'预览'" />
              <Button icon="pi pi-copy" class="p-button-rounded p-button-sm p-button-info" @click="copyImageUrl(image)"
                v-tooltip="'复制链接'" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-sm p-button-danger"
                @click="deleteImage(image, index)" v-tooltip="'删除'" />
            </div>
          </div>
          <div class="image-info">
            <p class="image-name">{{ image.fileName }}</p>
            <p class="image-url">{{ image.url }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <Dialog v-model:visible="showPreview" :modal="true" :closable="true" :draggable="false" class="image-preview-dialog">
      <template #header>
        <span>图片预览</span>
      </template>
      <div class="preview-content" v-if="previewImageData">
        <img :src="previewImageData.url" :alt="previewImageData.fileName" class="preview-large-img" />
        <div class="preview-info">
          <p><strong>文件名:</strong> {{ previewImageData.fileName }}</p>
          <p><strong>URL:</strong> {{ previewImageData.url }}</p>
        </div>
      </div>
    </Dialog>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <Message severity="error" :closable="true" @close="clearError">
        {{ errorMessage }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressBar from 'primevue/progressbar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { $fetch } from 'ofetch';

// Props
interface Props {
  folder?: string; // 上传文件夹
  multiple?: boolean; // 是否支持多选
  maxSize?: number; // 最大文件大小(字节)
  acceptedTypes?: string[]; // 接受的文件类型
}

const props = withDefaults(defineProps<Props>(), {
  folder: 'general',
  multiple: true,
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: () => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
});

// Emits
interface Emits {
  uploaded: [images: UploadedImage[]];
  error: [error: string];
}

const emit = defineEmits<Emits>();

// 上传的图片数据类型
interface UploadedImage {
  url: string;
  fileName: string;
}

// 响应式数据
const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadedImages = ref<UploadedImage[]>([]);
const errorMessage = ref('');
const showPreview = ref(false);
const previewImageData = ref<UploadedImage | null>(null);

// Toast
const toast = useToast();

// 计算属性
const acceptedTypesString = computed(() => props.acceptedTypes.join(','));

// 方法

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    handleFiles(Array.from(files));
  }
};

/**
 * 处理拖拽放置
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (files) {
    handleFiles(Array.from(files));
  }
};

/**
 * 处理拖拽悬停
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

/**
 * 处理拖拽离开
 */
const handleDragLeave = () => {
  isDragOver.value = false;
};

/**
 * 处理文件列表
 */
const handleFiles = async (files: File[]) => {
  // 验证文件
  const validFiles = files.filter(file => validateFile(file));
  
  if (validFiles.length === 0) {
    return;
  }
  
  // 如果不支持多选，只取第一个文件
  const filesToUpload = props.multiple ? validFiles : [validFiles[0]];
  
  await uploadFiles(filesToUpload);
};

/**
 * 验证文件
 */
const validateFile = (file: File): boolean => {
  // 检查文件类型
  if (!props.acceptedTypes.includes(file.type)) {
    showError(`不支持的文件类型: ${file.name}`);
    return false;
  }
  
  // 检查文件大小
  if (file.size > props.maxSize) {
    showError(`文件大小超过限制: ${file.name} (最大 ${formatFileSize(props.maxSize)})`);
    return false;
  }
  
  return true;
};

/**
 * 上传文件
 */
const uploadFiles = async (files: File[]) => {
  uploading.value = true;
  uploadProgress.value = 0;
  
  try {
    const uploadPromises = files.map(file => uploadSingleFile(file));
    const results = await Promise.allSettled(uploadPromises);
    
    const successfulUploads: UploadedImage[] = [];
    const failedUploads: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        failedUploads.push(files[index].name);
      }
    });
    
    // 更新上传的图片列表
    uploadedImages.value.push(...successfulUploads);
    
    // 发出事件
    emit('uploaded', successfulUploads);
    
    // 显示结果
    if (successfulUploads.length > 0) {
      toast.add({
        severity: 'success',
        summary: '上传成功',
        detail: `成功上传 ${successfulUploads.length} 个文件`,
        life: 3000
      });
    }
    
    if (failedUploads.length > 0) {
      showError(`以下文件上传失败: ${failedUploads.join(', ')}`);
    }
    
  } catch (error) {
    console.error('上传失败:', error);
    showError('上传失败，请重试');
    emit('error', '上传失败，请重试');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

/**
 * 上传单个文件
 */
const uploadSingleFile = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', props.folder);
  
  const response = await $fetch('/api/upload/general', {
    method: 'POST',
    body: formData,
    onUploadProgress: (progress) => {
      uploadProgress.value = Math.round((progress.loaded / progress.total) * 100);
    }
  });
  
  if (!response.success) {
    throw new Error(response.error || '上传失败');
  }
  
  return {
    url: response.data.url,
    fileName: response.data.fileName
  };
};

/**
 * 预览图片
 */
const previewImage = (image: UploadedImage) => {
  previewImageData.value = image;
  showPreview.value = true;
};

/**
 * 复制图片URL
 */
const copyImageUrl = async (image: UploadedImage) => {
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
 * 删除图片
 */
const deleteImage = async (image: UploadedImage, index: number) => {
  try {
    // 从OSS删除文件
    const key = encodeURIComponent(image.url.split('/').slice(-3).join('/'));
    await $fetch(`/api/upload/file/${key}`, {
      method: 'DELETE'
    });
    
    // 从列表中移除
    uploadedImages.value.splice(index, 1);
    
    toast.add({
      severity: 'success',
      summary: '删除成功',
      detail: '图片已删除',
      life: 2000
    });
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
 * 显示错误信息
 */
const showError = (message: string) => {
  errorMessage.value = message;
  emit('error', message);
};

/**
 * 清除错误信息
 */
const clearError = () => {
  errorMessage.value = '';
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

// 暴露方法给父组件
defineExpose({
  uploadedImages,
  clearImages: () => {
    uploadedImages.value = [];
  }
});
</script>

<style scoped>
.image-upload-component {
  @apply w-full;
}

/* 上传区域 */
.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-300;
  @apply hover:border-primary hover:bg-primary-50;
}

.upload-area.drag-over {
  @apply border-primary bg-primary-50;
}

.upload-content {
  @apply flex flex-col items-center;
}

.upload-icon {
  @apply text-4xl text-gray-400 mb-4;
}

.upload-text {
  @apply text-lg font-medium text-gray-700 mb-2;
}

.upload-hint {
  @apply text-sm text-gray-500;
}

/* 上传进度 */
.upload-progress {
  @apply mt-4;
}

.progress-text {
  @apply text-sm text-gray-600 mt-2 block;
}

/* 已上传图片 */
.uploaded-images {
  @apply mt-6;
}

.images-title {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.images-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.image-item {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.image-preview {
  @apply relative;
  height: 200px;
}

.preview-img {
  @apply w-full h-full object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300;
}

.image-item:hover .image-overlay {
  @apply opacity-100;
}

.image-info {
  @apply p-3;
}

.image-name {
  @apply text-sm font-medium text-gray-800 truncate mb-1;
}

.image-url {
  @apply text-xs text-gray-500 truncate;
}

/* 预览对话框 */
.image-preview-dialog {
  @apply w-full max-w-4xl;
}

.preview-content {
  @apply text-center;
}

.preview-large-img {
  @apply max-w-full max-h-96 object-contain mx-auto mb-4;
}

.preview-info {
  @apply text-left space-y-2;
}

.preview-info p {
  @apply text-sm;
}

/* 错误信息 */
.error-message {
  @apply mt-4;
}

/* 隐藏文件输入 */
.hidden {
  @apply sr-only;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area {
    @apply p-6;
  }
  
  .upload-icon {
    @apply text-3xl;
  }
  
  .upload-text {
    @apply text-base;
  }
  
  .images-grid {
    @apply grid-cols-2;
  }
  
  .image-preview {
    height: 150px;
  }
}
</style>