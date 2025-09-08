# 前端类型系统使用指南

## 概述

本项目设置了一个完整的类型系统，允许前端直接使用后端定义的类型，同时支持前端自定义类型。

## 类型目录结构

```
src/types/
├── models/          # 从后端导入的类型
│   └── index.ts     # 数据库相关类型
├── api/             # API相关类型
│   └── index.ts     # 请求/响应类型
├── frontend/        # 前端自定义类型
│   ├── index.ts     # 通用前端类型
│   ├── images.ts    # 图片相关类型
│   └── products.ts  # 产品相关类型
└── index.ts         # 统一导出
```

## 使用方法

### 1. 导入后端类型

```typescript
// 导入数据库表结构类型
import type { imagesSchema, productsSchema } from '@backend/db/database.types';

// 导入API模型类型
import type { 
  CreateImageDto, 
  UpdateImageDto, 
  BatchDeleteImageDto 
} from '@backend/routes/images.model';

// 导入产品相关类型
import type { 
  CreateProductDto, 
  UpdateProductDto, 
  ProductListQueryDto 
} from '@backend/routes/products.model';
```

### 2. 导入API相关类型

```typescript
import type { 
  ApiResponse, 
  ApiListResponse, 
  FormState, 
  AsyncState 
} from '@frontend/types/api';
```

### 3. 导入前端自定义类型

```typescript
import type { 
  ImageItem, 
  ProductItem, 
  ImageFormState,
  ProductFilter 
} from '@frontend/types/frontend';
```

### 4. 导入特定业务类型

```typescript
import type { 
  ImageQueryParams, 
  ImageUploadTask,
  ProductCardProps 
} from '@frontend/types/frontend/images';
```

### 5. 导入通用类型

```typescript
import type { ID, Status, UserRole, PaginationState } from '@frontend/types';
```

## 类型扩展示例

### 扩展后端类型

```typescript
// 从后端导入基础类型
import type { imagesSchema } from '@backend/db/database.types';

// 扩展前端特有的字段
export interface ImageItem extends imagesSchema {
  id: string;
  formattedSize?: string;    // 格式化的文件大小
  previewUrl?: string;       // 预览URL
  isSelected?: boolean;      // 选择状态
  uploadDate?: string;       // 上传日期
}
```

### 创建API请求类型

```typescript
import type { CreateImageDto } from '@backend/routes/images.model';

export interface ImageCreateRequest extends Omit<CreateImageDto, 'id'> {
  file?: File;
  onProgress?: (progress: number) => void;
}
```

### 创建组件Props类型

```typescript
export interface ImageSelectorProps {
  visible: boolean;
  multiple?: boolean;
  category?: string;
  onSelect?: (images: ImageItem | ImageItem[]) => void;
  onCancel?: () => void;
}
```

## 最佳实践

### 1. 类型复用

- 优先使用后端定义的数据库类型
- 通过扩展添加前端特有的字段
- 避免重复定义相同的类型结构

### 2. 类型命名

- 后端类型：`CreateXxxDto`, `UpdateXxxDto`, `XxxListQueryDto`
- 前端类型：`XxxItem`, `XxxFormState`, `XxxModalState`
- API类型：`XxxApiResponse`, `XxxListApiResponse`

### 3. 类型导出

- 每个模块都有独立的导出文件
- 通过 `index.ts` 统一导出相关类型
- 使用 `export type *` 进行批量导出

### 4. 类型安全

- 使用 `type` 关键字定义类型
- 使用 `interface` 定义对象类型
- 使用泛型提高类型的复用性

## 常用类型工具

```typescript
// 类型工具
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 常用类型别名
export type ID = string;
export type Timestamp = string;
export type JSONObject = Record<string, any>;
```

## 示例：完整的组件类型定义

```typescript
<script setup lang="ts">
import type { imagesSchema } from '@backend/db/database.types';
import type { CreateImageDto } from '@backend/routes/images.model';
import type { ApiResponse, FormState } from '@frontend/types/api';
import type { ImageItem, ImageFormState } from '@frontend/types/frontend';

// Props定义
interface Props {
  image?: ImageItem;
  mode: 'create' | 'edit' | 'view';
  onSuccess: (response: ApiResponse<ImageItem>) => void;
}

// 组件状态
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

// 事件处理
const handleSubmit = async (data: CreateImageDto) => {
  try {
    const response = await client.api.images.post(data);
    props.onSuccess(response);
  } catch (error) {
    console.error('提交失败:', error);
  }
};
</script>
```

## 注意事项

1. **类型路径**：确保 `tsconfig.json` 中的路径映射配置正确
2. **类型导入**：使用 `type` 关键字导入类型，避免运行时依赖
3. **类型扩展**：通过 `extends` 或交叉类型扩展后端类型
4. **类型检查**：定期运行 `bun run type-check` 确保类型正确性
5. **类型文档**：为复杂的类型添加 JSDoc 注释

通过这个类型系统，你可以确保前后端类型的一致性，同时保持前端类型的灵活性。