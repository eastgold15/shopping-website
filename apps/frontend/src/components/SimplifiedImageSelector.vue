<script setup lang="ts">
import { ref, computed } from "vue";
import type { SelectImagesVo } from "@backend/types";
import { getImageUrl } from "@frontend/utils/formatUtils";

// Props
interface Props {
  modelValue?: number;
  placeholder?: string;
  category?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "选择图片",
  category: "all",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number | undefined): void;
  (e: "select", imageUrl: string, imageData: SelectImagesVo): void;
}>();

// 响应式数据
const selectedImage = ref<SelectImagesVo | null>(null);
const showSelector = ref(false);

// 计算属性
const displayValue = computed(() => {
  if (selectedImage.value) {
    return selectedImage.value.fileName;
  }
  return props.placeholder;
});

// 方法
const selectImage = (image: SelectImagesVo) => {
  selectedImage.value = image;
  emit("update:modelValue", image.id);
  emit("select", getImageUrl(image.imageUrl), image);
  showSelector.value = false;
};

const removeSelection = () => {
  selectedImage.value = null;
  emit("update:modelValue", undefined);
};

// 模拟图片数据 - 实际使用时应从API获取
const images = ref<SelectImagesVo[]>([
  {
    id: 1,
    fileName: "product-1.jpg",
    imageUrl: "/images/product-1.jpg",
    category: "product",
    fileSize: 102400,
    mimeType: "image/jpeg",
    alt: "Product 1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    fileName: "product-2.jpg",
    imageUrl: "/images/product-2.jpg",
    category: "product",
    fileSize: 204800,
    mimeType: "image/jpeg",
    alt: "Product 2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    fileName: "logo.png",
    imageUrl: "/images/logo.png",
    category: "logo",
    fileSize: 51200,
    mimeType: "image/png",
    alt: "Logo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const filteredImages = computed(() => {
  if (props.category === "all") {
    return images.value;
  }
  return images.value.filter(image => image.category === props.category);
});
</script>

<template>
  <div class="image-selector">
    <!-- 选中的图片预览 -->
    <div v-if="selectedImage" class="selected-image flex items-center gap-2 p-2 border rounded">
      <img 
        :src="getImageUrl(selectedImage.imageUrl)" 
        :alt="selectedImage.fileName" 
        class="w-10 h-10 object-cover rounded"
      />
      <span class="flex-1 text-sm truncate">{{ selectedImage.fileName }}</span>
      <Button icon="pi pi-times" text rounded size="small" @click="removeSelection" />
    </div>
    
    <!-- 选择图片按钮 -->
    <div v-else class="select-trigger flex items-center justify-between p-2 border rounded cursor-pointer hover:border-blue-500" @click="showSelector = true">
      <span class="text-gray-500">{{ displayValue }}</span>
      <i class="pi pi-image" />
    </div>
    
    <!-- 图片选择对话框 -->
    <Dialog v-model:visible="showSelector" :header="placeholder" modal :style="{ width: '50vw' }">
      <div class="image-grid grid grid-cols-3 gap-4">
        <div 
          v-for="image in filteredImages" 
          :key="image.id"
          class="image-card border rounded cursor-pointer hover:border-blue-500 transition-all"
          :class="{ 'border-blue-500 ring-2 ring-blue-500': selectedImage?.id === image.id }"
          @click="selectImage(image)"
        >
          <div class="image-preview relative">
            <img 
              :src="getImageUrl(image.imageUrl)" 
              :alt="image.fileName" 
              class="w-full h-24 object-cover rounded-t"
            />
            <div v-if="selectedImage?.id === image.id" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t">
              <i class="pi pi-check text-white text-2xl" />
            </div>
          </div>
          <div class="p-2">
            <div class="text-sm font-medium truncate">{{ image.fileName }}</div>
            <div class="text-xs text-gray-500">{{ image.category }}</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="showSelector = false" severity="secondary" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.image-selector {
  width: 100%;
}

.selected-image {
  background-color: #f8f9fa;
}

.select-trigger {
  background-color: #fff;
}

.image-card {
  transition: all 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>