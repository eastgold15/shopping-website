// 类型使用示例
// 展示如何在组件中导入和使用定义的类型

<script setup lang="ts">
// 1. 导入后端数据库相关类型
import type { 
  imagesSchema, 
  CreateImageDto, 
  UpdateImageDto,
  BatchDeleteImageDto 
} from '@backend/routes/images.model';

// 2. 导入API相关类型
import type { 
  ApiResponse, 
  ApiListResponse, 
  ImageUploadRequest,
  FormState 
} from '@frontend/types/api';

// 3. 导入前端自定义类型
import type { 
  ImageItem, 
  ImageFormState, 
  ImageModalState,
  ProductItem 
} from '@frontend/types/frontend';

// 4. 导入特定业务类型
import type { 
  ImageQueryParams, 
  ImageApiResponse,
  ImageUploadTask 
} from '@frontend/types/frontend/images';

// 5. 导入通用类型
import type { 
  ID, 
  Status, 
  AsyncState, 
  PaginationState 
} from '@frontend/types';

// 使用示例
interface Props {
  // 使用后端类型
  image: imagesSchema;
  // 使用前端扩展类型
  imageData: ImageItem;
  // 使用API类型
  onSuccess: (response: ImageApiResponse) => void;
}

// 组件状态定义
const images = ref<ImageItem[]>([]);
const selectedImages = ref<ID[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

// 表单状态
const formState = ref<FormState<CreateImageDto>>({
  data: {
    fileName: '',
    url: '',
    category: 'general',
    fileSize: 0,
    mimeType: '',
    altText: ''
  },
  loading: false,
  error: null,
  dirty: false,
  touched: {}
});

// 分页状态
const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 1
});

// 查询参数
const queryParams = ref<ImageQueryParams>({
  page: 1,
  pageSize: 12,
  category: undefined,
  search: undefined,
  mimeType: undefined,
  startDate: undefined,
  endDate: undefined
});

// API调用示例
const loadImages = async () => {
  loading.value = true;
  try {
    const response = await client.api.images.get(queryParams.value);
    
    if (response.code === 200) {
      // 将后端数据转换为前端类型
      images.value = response.data.map((item: any): ImageItem => ({
        ...item,
        formattedSize: formatSize(item.fileSize),
        previewUrl: getImageUrl(item.url),
        isSelected: false
      }));
      
      // 更新分页信息
      pagination.value = {
        page: response.page || 1,
        pageSize: response.pageSize || 12,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.pageSize || 12))
      };
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

// 上传图片示例
const uploadImage = async (file: File) => {
  const uploadTask: ImageUploadTask = {
    id: Date.now().toString(),
    file,
    progress: 0,
    status: 'pending'
  };
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'general');
    
    const response = await client.api.images.upload.post(formData);
    
    if (response.code === 200) {
      uploadTask.status = 'success';
      uploadTask.result = response.data;
      // 添加到图片列表
      images.value.unshift(response.data);
    }
  } catch (err) {
    uploadTask.status = 'error';
    uploadTask.error = err instanceof Error ? err.message : '上传失败';
  }
  
  return uploadTask;
};

// 删除图片示例
const deleteImages = async (imageIds: ID[]) => {
  const deleteDto: BatchDeleteImageDto = {
    imageIds
  };
  
  try {
    const response = await client.api.images.delete(deleteDto);
    
    if (response.code === 200) {
      // 从列表中移除已删除的图片
      images.value = images.value.filter(img => !imageIds.includes(img.id));
      selectedImages.value = [];
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败';
  }
};

// 类型守卫示例
const isImageItem = (item: any): item is ImageItem => {
  return item && 
         typeof item.id === 'string' &&
         typeof item.fileName === 'string' &&
         typeof item.url === 'string';
};

// 事件处理示例
const handleImageSelect = (image: ImageItem) => {
  if (isImageItem(image)) {
    selectedImages.value.push(image.id);
  }
};

// 计算属性示例
const selectedImagesData = computed<ImageItem[]>(() => {
  return images.value.filter(img => selectedImages.value.includes(img.id));
});

const hasSelectedImages = computed<boolean>(() => {
  return selectedImages.value.length > 0;
});

// 生命周期
onMounted(() => {
  loadImages();
});
</script>

<template>
  <!-- 使用类型定义的props -->
  <div>
    <div v-if="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- 图片列表 -->
    <div class="image-grid">
      <div 
        v-for="image in images" 
        :key="image.id"
        class="image-item"
        :class="{ selected: selectedImages.includes(image.id) }"
        @click="handleImageSelect(image)"
      >
        <img :src="image.previewUrl" :alt="image.fileName" />
        <div class="image-info">
          <h3>{{ image.fileName }}</h3>
          <p>{{ image.formattedSize }}</p>
          <p>{{ image.category }}</p>
        </div>
      </div>
    </div>
  </div>
</template>