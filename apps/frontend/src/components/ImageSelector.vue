<script setup lang="ts">
import type { ImageModel, ImageQueryDto } from "@backend/modules/image/images.model";
import {
  formatDate,
  formatSize,
  getImageUrl,
} from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, reactive, ref, watch } from "vue";
const toast = useToast();
// Props
interface Props {
  category?: string; // 可选的分类过滤
}
const visible = defineModel("visible", { default: false });

// Emits
type Emits = (e: "select", imageUrl: string, imageData: ImageModel) => void;

const props = withDefaults(defineProps<Props>(), {
  category: "all",
});

const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const images = ref<ImageModel[]>([]);
const searchQuery = ref("");
const selectedCategory = ref(props.category);
const hoveredImage = ref<number | undefined>(undefined);

const meta = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
});
// 分类选项
const categoryOptions = [
  { label: "全部", value: "all" },
  { label: "轮播图", value: "carousel" },
  { label: "商品图片", value: "product" },
  { label: "分类图片", value: "category" },
  { label: "其他", value: "general" },
];

// 计算属性

// 方法

/**
 * 加载图片列表
 */
const loadImages = async () => {
  loading.value = true;
  try {
    const params: ImageQueryDto = {
      page: meta.page,
      pageSize: meta.pageSize,
    };

    // 添加分类过滤
    if (selectedCategory.value !== "all") {
      params.category = selectedCategory.value;
    }

    // 添加搜索过滤
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }


    const { code, data, message } = await useCmsApi.images.list(params);

    console.log(code, data, message);
    console.log("data", data);

    console.log("code", code);
    if (code !== 200) {
      toast.add({
        severity: "error",
        summary: "加载失败",
        detail: message,
        life: 3000,
      });
      return;
    }

    images.value = data.items;
    // 更新分页信息
    if (data.meta) {
      meta.page = data.meta.page;
      meta.pageSize = data.meta.pageSize;
      // 可以存储总页数等信息
      if (data.meta.totalPages !== undefined) {
        meta.totalPages = data.meta.totalPages;
      }
      if (data.meta.total !== undefined) {
        meta.total = data.meta.total;
      }
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "加载失败",
      detail: (error as Error).message,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 按分类过滤
 */
const filterByCategory = () => {
  meta.page = 1; // 重置到第一页
  loadImages(); // 重新加载数据
};

/**
 * 搜索图片
 */
const searchImages = () => {
  meta.page = 1; // 重置到第一页
  loadImages(); // 重新加载数据
};

/**
 * 选择图片
 */
const selectImage = (image: ImageModel) => {
  const imageUrl = getImageUrl(image.url);
  emit("select", imageUrl, image);
};

/**
 * 获取分类标签
 */
const getCategoryLabel = (category: string): string => {
  const option = categoryOptions.find((opt) => opt.value === category);
  return option?.label || category;
};

/**
 * 分页事件处理
 */
const onPageChange = (event: any) => {
  meta.page = event.page + 1; // PrimeVue分页器页码从0开始，我们的API从1开始
  meta.pageSize = event.rows;
  loadImages();
};

/**
 * 计算分页信息
 */
const paginationOptions = computed(() => ({
  first: (meta.page - 1) * meta.pageSize,
  rows: meta.pageSize,
  totalRecords: meta.total,
  rowsPerPageOptions: [12, 24, 36, 48],
}));

// 监听visible变化，当对话框打开时加载图片
watch(
  () => visible.value,
  (newVisible) => {
    if (newVisible) {
      loadImages();
    }
  },
);

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
        placeholder="选择分类" @change="filterByCategory">
        <template #emptyfilter></template>
      </Select>

      <!-- 搜索框 -->
      <InputText v-model="searchQuery" placeholder="搜索图片..." @input="searchImages" />
    </div>

    <!-- 图片网格 -->
    <div class=" min-h-300px flex-center-center">
      <div v-if="loading" class="text-center">
        <ProgressSpinner />
        <p>加载中...</p>
      </div>

      <div v-else-if="images.length === 0" class="text-center mb-4">
        <i class="pi pi-image empty-icon"></i>
        <h3>暂无图片</h3>
        <p>没有找到符合条件的图片</p>
      </div>

      <div v-else class="image-grid ">
        <div v-for="image in images" :key="image.id" class="image-card"
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
    <template #footer>

      <div class="w-full flex justify-around items-center">
        <!-- 分页器 -->
        <Paginator v-if="meta.total > 0" :first="paginationOptions.first" :rows="paginationOptions.rows"
          :totalRecords="paginationOptions.totalRecords" :rowsPerPageOptions="paginationOptions.rowsPerPageOptions"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="显示 {first} 到 {last} 条，共 {totalRecords} 张图片" @page="onPageChange" class="mt-4" />
        <!-- <Button class="w-25 " label="取消" icon="pi pi-times" @click="visible = false" /> -->
      </div>

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