// 图片管理相关的类型定义示例
// 展示如何复用后端类型并扩展前端特定需求

import type { 
  // 从后端导入的基础类型
  CreateImageDto, 
  UpdateImageDto,
  ImageListQueryDto,
  // 从后端导入的数据库类型
  imagesSchema
} from '@frontend/types/models';

import type { 
  ApiResponse,
  ApiListResponse,
  FormState,
  ModalState,
  ImageUploadRequest
} from '@frontend/types/api';

// 扩展的图片类型 - 包含前端特有的字段
export interface ImageItem extends imagesSchema {
  id: string;
  uploadDate: string;
  fileSize: number;
  formattedSize?: string; // 前端格式化显示
  previewUrl?: string;   // 前端预览URL
  isSelected?: boolean;  // 前端选择状态
}

// 图片表单状态类型
export interface ImageFormState extends FormState<Partial<CreateImageDto>> {
  uploadedFiles: File[];
  uploadProgress: number;
}

// 图片模态框状态类型
export interface ImageModalState extends ModalState<ImageItem> {
  mode: 'upload' | 'edit' | 'view' | 'select';
  selectedCategory?: string;
  allowMultiple?: boolean;
}

// 图片查询参数扩展
export interface ImageQueryParams extends ImageListQueryDto {
  startDate?: string;
  endDate?: string;
  uploaderId?: string;
}

// 图片API响应类型
export interface ImageApiResponse extends ApiResponse<ImageItem> {}
export interface ImageListApiResponse extends ApiListResponse<ImageItem> {}

// 图片上传任务类型
export interface ImageUploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: ImageItem;
}

// 图片选择器组件类型
export interface ImageSelectorProps {
  visible: boolean;
  multiple?: boolean;
  category?: string;
  onSelect?: (images: ImageItem | ImageItem[]) => void;
  onCancel?: () => void;
}

export interface ImageSelectorEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'select', images: ImageItem | ImageItem[]): void;
  (e: 'cancel'): void;
}