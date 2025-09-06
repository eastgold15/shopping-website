import { t } from 'elysia';
import { DbType } from '../db/database.types';
import { UnoQuery } from '../utils/common.model';
// 分类基础类型
export interface Category {
  id: string;
  slug: string; // URL友好的标识符
  name: string; // 分类名称
  parentId?: string; // 父分类ID，用于构建树形结构
  sortOrder: number; // 排序权重
  isVisible: boolean; // 是否显示
  description?: string; // 分类描述
  icon?: string; // 分类图标
  image?: string; // 分类图片
  createdAt: Date;
  updatedAt: Date;
}

// 分类树形结构
export interface CategoryTree extends Category {
  children: CategoryTree[];
}




// Elysia模型定义
export const categoriesModel = {
  // 创建分类请求参数
  CreateCategoryDto: DbType.typebox.insert.categoriesSchema,

  // 更新分类请求参数
  UpdateCategoryDto: t.Object({
    ...DbType.spreads.insert.categoriesSchema
  }),

  // 排序更新请求
  UpdateSortRequest: t.Object({
    sortOrder: t.Number({ minimum: 0 })
  }),

  // 统一查询参数
  UnifiedQueryParams: t.Object({
    ...UnoQuery.properties,
    name: t.Optional(t.String()), // 分类名称搜索
    parentId: t.Optional(t.String()), // 父分类ID筛选
    isVisible: t.Optional(t.Boolean()) // 显示状态筛选
  })
};



// 排序更新请求类型
export type UpdateSortRequest = {
  sortOrder: number;
};