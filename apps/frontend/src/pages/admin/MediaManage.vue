<script setup lang="ts">
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import ConfirmDialog from 'primevue/confirmdialog';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Paginator from 'primevue/paginator';
import ProgressSpinner from 'primevue/progressspinner';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import Badge from 'primevue/badge';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { client } from '@/share/useTreaty';
import type { ImageListQueryDto, UpdateImageDto, BatchDeleteImageDto } from '@/server/src/routes/images.model';
import { formatSize,formatFileSize, formatDate, generateId, getImageUrl, copyToClipboard, openInNewTab } from '@/share/utils/formatUtils';

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

// 视频数据类型
interface VideoData {
  id: string;
  fileName: string;
  url: string;
  category: string;
  fileSize: number;
  uploadDate: string;
  duration?: number;
  thumbnail?: string;
  altText?: string;
}

// 响应式数据
const activeTab = ref('0'); // 当前活动标签页
const loading = ref(false);
const saving = ref(false);

// 图片相关数据
const images = ref<ImageData[]>([]);
const selectedImages = ref<string[]>([]);
const imageSearchQuery = ref('');
const imageSelectedCategory = ref('all');
const showImageUploadDialog = ref(false);
const showImagePreviewDialog = ref(false);
const showImageEditDialog = ref(false);
const previewImageData = ref<ImageData | null>(null);
const editImageData = ref<ImageData | null>(null);
const imageUploadCategory = ref('general');
const showPreviewDialog = ref(false);
const showEditDialog = ref(false);

// 视频相关数据
const videos = ref<VideoData[]>([]);
const selectedVideos = ref<string[]>([]);
const videoSearchQuery = ref('');
const videoSelectedCategory = ref('all');
const showVideoUploadDialog = ref(false);
const showVideoPreviewDialog = ref(false);
const showVideoEditDialog = ref(false);
const previewVideoData = ref<VideoData | null>(null);
const editVideoData = ref<VideoData | null>(null);
const videoUploadCategory = ref('general');

// 分页数据
const imageMeta = reactive({
  pageSize: 12,
  page: 0,
  total: 0,
  totalPages: 0
});

const videoMeta = reactive({
  pageSize: 12,
  page: 0,
  total: 0,
  totalPages: 0
});

// Toast 和 Confirm
const toast = useToast();
const confirm = useConfirm();

// 图片分类选项
const imageCategoryOptions = [
  { label: '全部', value: 'all' },
  { label: '轮播图', value: 'carousel' },
  { label: 'Banner图', value: 'banner' },
  { label: '新闻图片', value: 'news' },
  { label: '产品图片', value: 'product' },
  { label: '分类图片', value: 'category' },
  { label: '其他', value: 'general' }
];

// 视频分类选项
const videoCategoryOptions = [
  { label: '全部', value: 'all' },
  { label: '产品视频', value: 'product' },
  { label: '宣传视频', value: 'promotion' },
  { label: '教程视频', value: 'tutorial' },
  { label: '新闻视频', value: 'news' },
  { label: '其他', value: 'general' }
];

// 计算属性

/**
 * 过滤后的图片列表
 */
const filteredImages = computed(() => {
  let result = images.value;

  // 按分类过滤
  if (imageSelectedCategory.value !== 'all') {
    result = result.filter(img => img.category === imageSelectedCategory.value);
  }

  // 按搜索关键词过滤
  if (imageSearchQuery.value.trim()) {
    const query = imageSearchQuery.value.toLowerCase();
    result = result.filter(img =>
      img.fileName.toLowerCase().includes(query) ||
      img.altText?.toLowerCase().includes(query)
    );
  }

  // 更新总数
  imageMeta.total = result.length;
  imageMeta.totalPages = Math.ceil(result.length / imageMeta.pageSize);

  return result;
});

/**
 * 分页后的图片列表
 */
const paginatedImages = computed(() => {
  const start = imageMeta.page * imageMeta.pageSize;
  const end = start + imageMeta.pageSize;
  return filteredImages.value.slice(start, end);
});

/**
 * 过滤后的视频列表
 */
const filteredVideos = computed(() => {
  let result = videos.value;

  // 按分类过滤
  if (videoSelectedCategory.value !== 'all') {
    result = result.filter(video => video.category === videoSelectedCategory.value);
  }

  // 按搜索关键词过滤
  if (videoSearchQuery.value.trim()) {
    const query = videoSearchQuery.value.toLowerCase();
    result = result.filter(video =>
      video.fileName.toLowerCase().includes(query) ||
      video.altText?.toLowerCase().includes(query)
    );
  }

  // 更新总数
  videoMeta.total = result.length;
  videoMeta.totalPages = Math.ceil(result.length / videoMeta.pageSize);

  return result;
});

/**
 * 分页后的视频列表
 */
const paginatedVideos = computed(() => {
  const start = videoMeta.page * videoMeta.pageSize;
  const end = start + videoMeta.pageSize;
  return filteredVideos.value.slice(start, end);
});

// 方法

/**
 * 加载图片列表
 */
const loadImages = async () => {
  loading.value = true;
  try {
    const response = await client.api.images.get();

    console.log('加载图片成功:', response);
    if (response.status === 200 && response.data.code == 200) {
      images.value = response.data.data;
    } else {
      throw new Error(response.data?.error || '加载失败');
    }
  } catch (error) {
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
 * 按分类过滤图片
 */
const filterImagesByCategory = () => {
  imageMeta.page = 0; // 重置到第一页
};

/**
 * 搜索图片
 */
const searchImages = () => {
  imageMeta.page = 0; // 重置到第一页
};

/**
 * 图片分页变化
 */
const onImagePageChange = (event: any) => {
  imageMeta.page = Math.floor(event.first / event.rows);
  imageMeta.pageSize = event.rows;
};

/**
 * 按分类过滤视频
 */
const filterVideosByCategory = () => {
  videoMeta.page = 0; // 重置到第一页
};

/**
 * 搜索视频
 */
const searchVideos = () => {
  videoMeta.page = 0; // 重置到第一页
};

/**
 * 视频分页变化
 */
const onVideoPageChange = (event: any) => {
  videoMeta.page = Math.floor(event.first / event.rows);
  videoMeta.pageSize = event.rows;
};

/**
 * 加载视频列表
 */
const loadVideos = async () => {
  loading.value = true;
  try {
    // TODO: 实现视频API调用
    // const response = await client.api.videos.get();
    // if (response.status === 200 && response.data.code == 200) {
    //   videos.value = response.data.data;
    // }
    
    // 临时模拟数据
    videos.value = [];
    
    console.log('视频列表加载成功');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: '无法加载视频列表',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
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
    const updateData: UpdateImageDto = {
      fileName: editImageData.value.fileName,
      category: editImageData.value.category,
      altText: editImageData.value.altText
    };

    const response = await client.api.images({ id: editImageData.value.id }).put(updateData);

    if (response.status === 200 && response.data?.code == 200) {
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
      throw new Error(response.data?.error || '保存失败');
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
  const success = await copyToClipboard(getImageUrl(image.url));

  if (success) {
    toast.add({
      severity: 'success',
      summary: '复制成功',
      detail: '图片链接已复制到剪贴板',
      life: 2000
    });
  } else {
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
  openInNewTab(getImageUrl(image.url));
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
    const response = await client.api.images({ id: imageId }).delete();

    if (response.status == 200 && response.data?.code == 200) {
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
      throw new Error(response.data?.error || '删除失败');
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
    const batchDeleteData: BatchDeleteImageDto = {
      imageIds: selectedImages.value
    };

    const response = await client.api.images.batch.delete(batchDeleteData);

    if (response.status == 200 && response.data?.code == 200) {
      // 从列表中移除
      images.value = images.value.filter(img => !selectedImages.value.includes(img.id));
      // 清空选中列表
      selectedImages.value = [];
      toast.add({
        severity: 'success',
        summary: '删除成功',
        detail: `已删除 ${response.data.data.deletedCount} 张图片`,
        life: 3000
      });
    } else {
      throw new Error(response.data?.error || '批量删除失败');
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

// FileUpload 组件相关的响应式数据
const totalSize = ref(0);
const totalSizePercent = ref(0);
const uploadFiles = ref([]);

/**
 * 获取图片上传URL
 */
const getImageUploadUrl = () => {
  return `/api/upload/images/${imageUploadCategory.value}`;
};

/**
 * 获取视频上传URL
 */
const getVideoUploadUrl = () => {
  return `/api/upload/videos/${videoUploadCategory.value}`;
};

/**
 * 文件选择回调
 */
const onSelectedFiles = (event: any) => {
  uploadFiles.value = event.files;
  uploadFiles.value.forEach((file: any) => {
    totalSize.value += parseInt(formatSize(file.size));
  });
};

/**
 * 移除待上传文件
 */
const onRemoveTemplatingFile = (file: any, removeFileCallback: Function, index: number) => {
  removeFileCallback(index);
  totalSize.value -= parseInt(formatSize(file.size));
  totalSizePercent.value = totalSize.value / 10;
};

/**
 * 上传事件
 */
const uploadEvent = (callback: Function) => {
  totalSizePercent.value = totalSize.value / 10;
  callback();
};

/**
 * 图片上传完成回调
 */
const onImageUpload = (event: any) => {
  toast.add({
    severity: 'success',
    summary: '上传成功',
    detail: '图片上传完成',
    life: 3000
  });

  // 重新加载图片列表
  loadImages();

  // 关闭上传对话框
  showImageUploadDialog.value = false;

  // 重置上传状态
  totalSize.value = 0;
  totalSizePercent.value = 0;
};

/**
 * 视频上传完成回调
 */
const onVideoUpload = (event: any) => {
  toast.add({
    severity: 'success',
    summary: '上传成功',
    detail: '视频上传完成',
    life: 3000
  });

  // 重新加载视频列表
  loadVideos();

  // 关闭上传对话框
  showVideoUploadDialog.value = false;

  // 重置上传状态
  totalSize.value = 0;
  totalSizePercent.value = 0;
};



/**
 * 获取图片分类标签
 */
const getImageCategoryLabel = (category: string): string => {
  const option = imageCategoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};

/**
 * 获取视频分类标签
 */
const getVideoCategoryLabel = (category: string): string => {
  const option = videoCategoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};





// 生命周期
onMounted(() => {
  loadImages();
  loadVideos();
});

/**
 * 切换标签页
 */
const onTabChange = (value: string) => {
  activeTab.value = value;
};
</script>
<template>
  <div class="media-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">媒体管理</h1>
      <p class="page-description">管理网站中的所有媒体资源，包括图片和视频</p>
    </div>

    <!-- 标签页 -->
    <Tabs v-model:value="activeTab" @update:value="onTabChange">
      <TabList>
        <Tab value="0">图片管理</Tab>
        <Tab value="1">视频管理</Tab>
      </TabList>
      <TabPanels>
        <!-- 图片管理标签页 -->
        <TabPanel value="0">

          <!-- 操作工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <!-- 分类筛选 -->
              <Dropdown v-model="imageSelectedCategory" :options="imageCategoryOptions" optionLabel="label" optionValue="value"
                placeholder="选择分类" class="category-filter" @change="filterImagesByCategory" />

              <!-- 搜索框 -->
              <span class="p-input-icon-left search-box">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-search" />
                  </InputGroupAddon>
                  <InputText v-model="imageSearchQuery" placeholder="搜索图片..." @input="searchImages" />
                </InputGroup>
              </span>
            </div>

            <div class="toolbar-right">
              <!-- 批量操作 -->
              <Button v-if="selectedImages.length > 0" icon="pi pi-trash" label="批量删除" severity="danger"
                @click="confirmBatchDelete" class="batch-delete-btn" />

              <!-- 上传按钮 -->
              <Button icon="pi pi-upload" label="上传图片" @click="showImageUploadDialog = true" class="upload-btn" />
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
                <Checkbox v-model="selectedImages" :inputId="`img-${image.id}`" :value="image.id" class="image-checkbox" />

                <!-- 图片预览 -->
                <div class="image-preview" @click="previewImage(image)">
                  <img :src="getImageUrl(image.url)" :alt="image.fileName" class="preview-img" loading="lazy" />
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
                    <span class="image-category">{{ getImageCategoryLabel(image.category) }}</span>
                    <span class="image-size">{{ formatSize(image.fileSize) }}</span>
                  </div>
                  <div class="image-actions">
                    <small class="image-date">{{ formatDate(image.uploadDate) }}</small>
                    <div class="action-buttons">
                      <Button icon="pi pi-external-link" class="p-button-text p-button-sm" @click="openImageInNewTab(image)"
                        v-tooltip="'在新标签页打开'" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="imageMeta.totalPages > 1" class="pagination-container">
            <Paginator :first="imageMeta.page * imageMeta.pageSize" :rows="imageMeta.pageSize" :totalRecords="imageMeta.total"
              :rowsPerPageOptions="[12, 24, 48]" @page="onImagePageChange" />
          </div>
        </TabPanel>

        <!-- 视频管理标签页 -->
        <TabPanel value="1">
          <!-- 操作工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <!-- 分类筛选 -->
              <Dropdown v-model="videoSelectedCategory" :options="videoCategoryOptions" optionLabel="label" optionValue="value"
                placeholder="选择分类" class="category-filter" @change="filterVideosByCategory" />

              <!-- 搜索框 -->
              <span class="p-input-icon-left search-box">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-search" />
                  </InputGroupAddon>
                  <InputText v-model="videoSearchQuery" placeholder="搜索视频..." @input="searchVideos" />
                </InputGroup>
              </span>
            </div>

            <div class="toolbar-right">
              <!-- 批量操作 -->
              <Button v-if="selectedVideos.length > 0" icon="pi pi-trash" label="批量删除" severity="danger"
                @click="confirmBatchDeleteVideos" class="batch-delete-btn" />

              <!-- 上传按钮 -->
              <Button icon="pi pi-upload" label="上传视频" @click="showVideoUploadDialog = true" class="upload-btn" />
            </div>
          </div>

          <!-- 视频网格 -->
          <div class="videos-container">
            <div v-if="loading" class="loading-container">
              <ProgressSpinner />
              <p>加载中...</p>
            </div>

            <div v-else-if="filteredVideos.length === 0" class="empty-state">
              <i class="pi pi-video empty-icon"></i>
              <h3>暂无视频</h3>
              <p>点击上传按钮添加视频</p>
            </div>

            <div v-else class="videos-grid">
              <div v-for="video in paginatedVideos" :key="video.id" class="video-card"
                :class="{ 'selected': selectedVideos.includes(video.id) }">
                <!-- 选择框 -->
                <Checkbox v-model="selectedVideos" :inputId="`video-${video.id}`" :value="video.id" class="video-checkbox" />

                <!-- 视频预览 -->
                <div class="video-preview" @click="previewVideo(video)">
                  <div class="video-thumbnail">
                    <img v-if="video.thumbnail" :src="getImageUrl(video.thumbnail)" :alt="video.fileName" class="thumbnail-img" loading="lazy" />
                    <div v-else class="no-thumbnail">
                      <i class="pi pi-video"></i>
                    </div>
                    <div class="play-overlay">
                      <i class="pi pi-play"></i>
                    </div>
                  </div>
                  <div class="video-overlay">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-sm p-button-secondary"
                      @click.stop="previewVideo(video)" v-tooltip="'预览'" />
                    <Button icon="pi pi-copy" class="p-button-rounded p-button-sm p-button-info"
                      @click.stop="copyVideoUrl(video)" v-tooltip="'复制链接'" />
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-sm p-button-warning"
                      @click.stop="editVideo(video)" v-tooltip="'编辑'" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-sm p-button-danger"
                      @click.stop="confirmDeleteVideo(video)" v-tooltip="'删除'" />
                  </div>
                </div>

                <!-- 视频信息 -->
                <div class="video-info">
                  <h4 class="video-name" :title="video.fileName">{{ video.fileName }}</h4>
                  <div class="video-meta">
                    <span class="video-category">{{ getVideoCategoryLabel(video.category) }}</span>
                    <span class="video-size">{{ formatSize(video.fileSize) }}</span>
                  </div>
                  <div class="video-actions">
                    <small class="video-date">{{ formatDate(video.uploadDate) }}</small>
                    <div class="action-buttons">
                      <Button icon="pi pi-external-link" class="p-button-text p-button-sm" @click="openVideoInNewTab(video)"
                        v-tooltip="'在新标签页打开'" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="videoMeta.totalPages > 1" class="pagination-container">
            <Paginator :first="videoMeta.page * videoMeta.pageSize" :rows="videoMeta.pageSize" :totalRecords="videoMeta.total"
              :rowsPerPageOptions="[12, 24, 48]" @page="onVideoPageChange" />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- 图片上传对话框 -->
    <Dialog v-model:visible="showImageUploadDialog" :modal="true" :closable="true" :draggable="false" class="upload-dialog"
      header="上传图片">
      <div class="upload-dialog-content">
        <!-- 分类选择 -->
        <div class="form-field">
          <label for="image-upload-category">图片分类</label>
          <Dropdown v-model="imageUploadCategory" :options="imageCategoryOptions.filter(c => c.value !== 'all')"
            optionLabel="label" optionValue="value" placeholder="选择分类" inputId="image-upload-category" />
        </div>

        <!-- 图片上传组件 -->
        <FileUpload name="file" :url="getImageUploadUrl()" @upload="onImageUpload($event)" :multiple="true"
          accept="image/*" :maxFileSize="5000000" @select="onSelectedFiles">
          <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
            <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
              <div class="flex gap-2">
                <Button @click="chooseCallback()" icon="pi pi-images" rounded variant="outlined"
                  severity="secondary"></Button>
                <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload" rounded variant="outlined"
                  severity="success" :disabled="!files || files.length === 0"></Button>
                <Button @click="clearCallback()" icon="pi pi-times" rounded variant="outlined" severity="danger"
                  :disabled="!files || files.length === 0"></Button>
              </div>
              <ProgressBar :value="totalSizePercent" :showValue="false" class="md:w-[20rem] h-1 w-full md:ml-auto">
                <span class="whitespace-nowrap">{{ totalSize }}B / 5MB</span>
              </ProgressBar>
            </div>
          </template>
          <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
            <div class="flex flex-col gap-8 pt-4">
              <div v-if="files.length > 0">
                <h5>待上传</h5>
                <div class="flex flex-wrap gap-4">
                  <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                    class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50" />
                    </div>
                    <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name
                    }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="待上传" severity="warn" />
                    <Button icon="pi pi-times" @click="onRemoveTemplatingFile(file, removeFileCallback, index)"
                      variant="outlined" rounded severity="danger" />
                  </div>
                </div>
              </div>

              <div v-if="uploadedFiles.length > 0">
                <h5>已完成</h5>
                <div class="flex flex-wrap gap-4">
                  <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size"
                    class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50" />
                    </div>
                    <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name
                    }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="已完成" class="mt-4" severity="success" />
                    <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)" variant="outlined" rounded
                      severity="danger" />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #empty>
            <div class="flex items-center justify-center flex-col">
              <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
              <p class="mt-6 mb-0">拖拽文件到此处上传</p>
            </div>
          </template>
        </FileUpload>
      </div>
    </Dialog>

    <!-- 视频上传对话框 -->
    <Dialog v-model:visible="showVideoUploadDialog" :modal="true" :closable="true" :draggable="false" class="upload-dialog"
      header="上传视频">
      <div class="upload-dialog-content">
        <!-- 分类选择 -->
        <div class="form-field">
          <label for="video-upload-category">视频分类</label>
          <Dropdown v-model="videoUploadCategory" :options="videoCategoryOptions.filter(c => c.value !== 'all')"
            optionLabel="label" optionValue="value" placeholder="选择分类" inputId="video-upload-category" />
        </div>

        <!-- 视频上传组件 -->
        <FileUpload name="file" :url="getVideoUploadUrl()" @upload="onVideoUpload($event)" :multiple="true"
          accept="video/*" :maxFileSize="50000000" @select="onSelectedFiles">
          <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
            <div class="upload-header">
              <Button @click="chooseCallback()" icon="pi pi-plus" label="选择视频" class="p-button-outlined" />
              <Button @click="uploadCallback()" icon="pi pi-upload" label="上传" :disabled="!files || files.length === 0"
                class="p-button-success" />
              <Button @click="clearCallback()" icon="pi pi-times" label="清空" :disabled="!files || files.length === 0"
                class="p-button-danger" />
            </div>
          </template>
          <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
            <div class="upload-content">
              <!-- 待上传文件预览 -->
              <div v-if="files && files.length > 0" class="pending-files">
                <h4>待上传视频</h4>
                <div class="file-list">
                  <div v-for="(file, index) in files" :key="index" class="file-item">
                    <div class="file-info">
                      <i class="pi pi-video text-2xl"></i>
                      <div class="file-details">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      </div>
                    </div>
                    <Button icon="pi pi-times" @click="removeFileCallback(index)" class="p-button-text p-button-danger" />
                  </div>
                </div>
              </div>

              <!-- 已上传文件 -->
              <div v-if="uploadedFiles && uploadedFiles.length > 0" class="uploaded-files">
                <h4>已上传视频</h4>
                <div class="file-list">
                  <div v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
                    <div class="file-info">
                      <i class="pi pi-check-circle text-2xl text-green-500"></i>
                      <div class="file-details">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      </div>
                    </div>
                    <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)" class="p-button-text p-button-danger" />
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="(!files || files.length === 0) && (!uploadedFiles || uploadedFiles.length === 0)" class="empty-state">
                <i class="pi pi-video text-6xl text-gray-400"></i>
                <p class="text-gray-500 mt-4">拖拽视频文件到此处或点击选择视频</p>
                <p class="text-sm text-gray-400 mt-2">支持 MP4, AVI, MOV 等格式，最大 50MB</p>
              </div>
            </div>
          </template>
        </FileUpload>
      </div>
    </Dialog>

    <!-- 图片预览对话框 -->
    <Dialog v-model:visible="showPreviewDialog" :modal="true" :closable="true" :draggable="false" class="preview-dialog"
      :header="previewImageData?.fileName">
      <div class="preview-dialog-content" v-if="previewImageData">
        <img :src="getImageUrl(previewImageData.url)" :alt="previewImageData.fileName" class="preview-large-img" />
        <div class="preview-info">
          <div class="info-row">
            <strong>文件名:</strong> {{ previewImageData.fileName }}
          </div>
          <div class="info-row">
            <strong>分类:</strong> {{ getCategoryLabel(previewImageData.category) }}
          </div>
          <div class="info-row">
            <strong>大小:</strong> {{ formatSize(previewImageData.fileSize) }}
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
    <Dialog v-model:visible="showEditDialog" :modal="true" :closable="true" :draggable="false" class="edit-dialog"
      header="编辑图片">
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