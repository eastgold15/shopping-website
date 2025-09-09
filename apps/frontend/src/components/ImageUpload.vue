<script setup lang="ts">
import { formatSize } from '@frontend/utils/formatUtils';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

// Props
interface Props {
  category?: string;
}

const visible = defineModel('visible', { default: false })

const props = withDefaults(defineProps<Props>(), {
  category: 'general'
});

// Emits
interface Emits {
  'upload-success': [images: any[]];
}

const emit = defineEmits<Emits>();

// 响应式数据
const toast = useToast();
const uploadCategory = ref(props.category);
const uploading = ref(false);
const totalSize = ref(0);
const totalSizePercent = ref(0);

// 分类选项
const categoryOptions = [
  { label: '通用', value: 'general' },
  { label: '产品', value: 'product' },
  { label: '用户头像', value: 'avatar' },
  { label: '轮播图', value: 'banner' },
  { label: '其他', value: 'other' }
];

/**
 * 获取上传URL
 */
const getUploadUrl = () => {
  console.log("ssss", import.meta.env.VITE_API_URL)
  return `${import.meta.env.VITE_API_URL}/api/upload/images`;
};

/**
 * 获取上传请求头
 */
const getUploadHeaders = () => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  };
};

/**
 * 文件选择事件
 */
const onSelectedFiles = (event: any) => {
  totalSize.value = 0;
  totalSizePercent.value = 0;

  event.files.forEach((file: File) => {
    totalSize.value += file.size;
  });

  // 计算总大小百分比（基于5MB限制）
  totalSizePercent.value = Math.round((totalSize.value / 5000000) * 100);
};

/**
 * 上传文件
 */
const uploadFiles = async (uploadCallback: Function) => {
  if (!uploadCategory.value) {
    toast.add({
      severity: 'warn',
      summary: '请选择分类',
      detail: '请先选择图片分类',
      life: 3000
    });
    return;
  }

  uploading.value = true;

  try {
    // 调用PrimeVue的上传回调
    uploadCallback();
  } catch (error) {
    console.error('Upload error:', error);
    toast.add({
      severity: 'error',
      summary: '上传失败',
      detail: (error as Error).message,
      life: 3000
    });
  } finally {
    uploading.value = false;
  }
};

/**
 * 上传完成事件
 */
const onUploadComplete = (event: any) => {
  try {
    const { code, data, message } = JSON.parse(event.xhr.response);
    if (code === 200) {
      toast.add({
        severity: 'success',
        summary: '上传成功',
        detail: `成功上传 ${data.length} 张图片`,
        life: 3000
      });

      // 发送上传成功事件
      emit('upload-success', data);

      // 关闭对话框
      // visible.value = false
    } else {
      throw new Error(message || '上传失败');
    }
  } catch (error) {
    console.error('Upload response error:', error);
    toast.add({
      severity: 'error',
      summary: '上传失败',
      detail: (error as Error).message,
      life: 3000
    });
  }
};


</script>

<template>


  <Dialog v-model:visible="visible" :modal="true" :closable="true" :draggable="false" class="upload-dialog  min-w-600px"
    header="上传图片">
    <div class="flex flex-col gap-4">
      <!-- 分类选择 -->
      <div class="flex  gap-2 items-center">
        <label for="upload-category">图片分类</label>
        <Select v-model="uploadCategory" :options="categoryOptions" optionLabel="label" optionValue="value"
          placeholder="选择分类" inputId="upload-category" />
      </div>

      <!-- 图片上传组件 -->
      <FileUpload name="files" :url="getUploadUrl()" @upload="onUploadComplete($event)" :multiple="true"
        accept="image/*" :maxFileSize="5000000" @select="onSelectedFiles" :headers="getUploadHeaders()"
        :disabled="uploading">
        <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
          <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
            <div class="flex gap-2">
              <Button class="w-30" @click="chooseCallback()" label="选择文件" icon="pi pi-images" iconPos="left"
                variant="outlined" severity="secondary" :disabled="uploading"></Button>
              <Button @click="uploadFiles(uploadCallback)" label="上传" icon="pi pi-cloud-upload" iconPos="left"
                variant="outlined" severity="success" :disabled="!files || files.length === 0 || uploading"
                :loading="uploading"></Button>
              <Button @click="clearCallback()" label="清空" icon="pi pi-times" iconPos="left" variant="outlined"
                severity="danger" :disabled="!files || files.length === 0 || uploading"></Button>
            </div>
            <ProgressBar :value="totalSizePercent" :showValue="false" class="md:w-[20rem] h-1 w-full md:ml-auto">
              <span class="whitespace-nowrap">{{ formatSize(totalSize) }} / 5MB</span>
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
                  <Button icon="pi pi-times" @click="removeFileCallback(index)" variant="outlined" rounded
                    severity="danger" :disabled="uploading" />
                </div>
              </div>
            </div>

            <div v-if="uploadedFiles.length > 0">
              <h5>已完成</h5>
              <div class="flex flex-wrap gap-4">
                <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size"
                  class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                  <div>

                    <!-- 类型没有问题 -->
                    <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50" />
                  </div>
                  <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name
                    }}</span>
                  <div>{{ formatSize(file.size) }}</div>
                  <Badge value="已完成" class="mt-4" severity="success" />
                  <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)" variant="outlined" rounded
                    severity="danger" :disabled="uploading" />
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

    <template #footer>
      <Button label="取消" icon="pi pi-times" @click="visible = !visible" :disabled="uploading" />
    </template>
  </Dialog>
</template>

<style scoped></style>