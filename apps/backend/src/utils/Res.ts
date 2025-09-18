// Elysia + Drizzle 统一响应格式工具文件

import { z } from "zod/v4";


/**
 * 前端用的响应类型定义
 * 错误也使用这个
 */
export type CommonRes<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * // 成功响应函数
 * 错误也使用这个响应函数
 * @param data 数据
 * @param code
 * @param message
 * @returns
 */
export function commonRes<T>(
  data: T,
  code = 200,
  message = "操作成功",
): CommonRes<T> {
  return {
    code,
    message,
    data,
  };
}


/**
 * 分页查询参数的 Zod 类型定义
 */
export const PaginationQueryZod = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type PaginationQueryType = z.infer<typeof PaginationQueryZod>;
/**
 * 分页元数据 Zod 类型定义
 */
export const PageMetaZod = z.object({
  total: z.coerce.number(),
  page: z.coerce.number(),
  limit: z.coerce.number(),
  totalPages: z.coerce.number(),
});
export type PageMeta = z.infer<typeof PageMetaZod>;
export interface PageData<T> {
  items: T[]; // 当前页数据
  meta: PageMeta,
}


/**
 * 前端用的分页响应类型定义
 */
export type PageRes<T> = {
  code: number;
  message: string;
  data: PageData<T>;
};





/**
 * 分页选项 Zod 类型定义
 */
export const PaginationOptionsZod = z.object({
  page: z.coerce.number(),
  limit: z.coerce.number(),
  orderBy: z.any().optional(), // Column | SQL | SQL.Aliased 类型复杂，使用 any
  orderDirection: z.enum(["asc", "desc"]).optional(),
  scope: z.any().optional(), // QueryScope 类型
  table: z.any().optional(), // SoftDeletableTable 类型
});

export type PaginationOptionsType = z.infer<typeof PaginationOptionsZod>;



/**
 * 分页结果 Zod 类型定义工厂
 */
export const createPaginationResultZod = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    code: z.number(),
    message: z.string(),
    data: z.object({
      items: z.array(itemSchema),
      meta: PageMetaZod,
    }),
  });
};


/**
 * 分页数据 Zod 类型定义工厂
 */
export const createPageDataZod = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    items: z.array(itemSchema),
    meta: PageMetaZod,
  });
};


// ==================== Zod 工具函数 ====================

/**
 * 合并多个 zod 对象类型
 * @param schemas 要合并的 zod 对象数组
 * @returns 合并后的 zod 对象类型
 */
export const mergeZodObjects = <T extends z.ZodRawShape[]>(...schemas: T) => {
  return schemas.reduce((acc, schema) => acc.merge(schema), z.object({}) as any);
};

/**
 * 创建可选字段的 zod 对象
 * @param schema 原始 zod 对象
 * @returns 所有字段都变为可选的 zod 对象
 */
export const makeOptional = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema.partial();
};

/**
 * 创建必填字段的 zod 对象
 * @param schema 原始 zod 对象
 * @returns 所有字段都变为必填的 zod 对象
 */
export const makeRequired = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema.required();
};

/**
 * 验证数据并返回类型安全的结果
 * @param schema zod 类型定义
 * @param data 要验证的数据
 * @returns 验证结果
 */
export const validateWithZod = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * 从 Elysia TSchema 转换为 Zod 类型（简单转换）
 * 注意：这是一个简化的转换，复杂类型可能需要手动处理
 */
export const elysiaToZod = {
  // 基础类型转换映射
  string: () => z.string(),
  number: () => z.number(),
  boolean: () => z.boolean(),
  array: <T extends z.ZodTypeAny>(itemSchema: T) => z.array(itemSchema),
  object: <T extends z.ZodRawShape>(shape: T) => z.object(shape),
  optional: <T extends z.ZodTypeAny>(schema: T) => schema.optional(),
};

// ==================== 响应函数 ====================

/**
 * 创建符合项目规范的分页响应
 * 复用 pageRes 函数
 * @param data 数据数组
 * @param total 总数
 * @param page 当前页码
 * @param limit 每页大小
 * @param message 响应消息
 * @returns 符合项目规范的分页响应
 */
export function pageRes<T>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
  message = "获取成功",
) {
  return commonRes(
    {
      items: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    200,
    message,
  );
}

// ==================== 使用示例 ====================

/**
 * 使用示例：
 *
 * // 1. 创建用户数据的 zod 类型
 * const UserZod = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * // 2. 创建用户列表的分页响应类型
 * const UserPageResZod = createPageResZod(UserZod);
 *
 * // 3. 创建通用响应类型
 * const UserResZod = createCommonResZod(UserZod);
 *
 * // 4. 合并类型示例
 * const BaseUserZod = z.object({ id: z.number(), name: z.string() });
 * const ExtendedUserZod = z.object({ email: z.string(), age: z.number() });
 * const FullUserZod = mergeZodObjects(BaseUserZod, ExtendedUserZod);
 *
 * // 5. 验证数据
 * const result = validateWithZod(UserZod, userData);
 * if (result.success) {
 *   console.log('验证成功:', result.data);
 * } else {
 *   console.log('验证失败:', result.error.issues);
 * }
 */

// ==================== 导出汇总 ====================

/**
 * 主要导出：
 * 
 * Zod 类型定义：
 * - PaginationQueryZod: 分页查询参数
 * - PaginationOptionsZod: 分页选项
 * - PageMetaZod: 分页元数据
 * - createCommonResZod: 通用响应类型工厂
 * - createPageResZod: 分页响应类型工厂
 * - createPageDataZod: 分页数据类型工厂
 * - createPaginationResultZod: 分页结果类型工厂
 * 
 * 工具函数：
 * - mergeZodObjects: 合并 zod 对象
 * - makeOptional: 创建可选字段对象
 * - makeRequired: 创建必填字段对象
 * - validateWithZod: 类型安全的验证函数
 * - elysiaToZod: Elysia 到 Zod 的转换工具
 * 
 * 兼容性导出（保留原有 Elysia 类型）：
 * - PaginationQuery, PageMetaSchema, CreateCommonResSchema, CreatePageResSchema
 * - PaginationOptions, CommonRes, PageRes, PageData 等接口
 */
