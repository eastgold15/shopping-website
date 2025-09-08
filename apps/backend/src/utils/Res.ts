// Elysia + Drizzle 统一响应格式工具文件

import { type TSchema, t } from "elysia";



export const Meta = t.Object({
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number(),
  totalPages: t.Number(),
});


export const commonResSchema = <T extends TSchema>(dataSchema: T) => {
  return t.Object({
    code: t.Number(),
    message: t.String(),
    data: dataSchema,
  });
};
// 成功响应函数
export function commonRes<T>(
  data: T,
  code = 200,
  message = "操作成功",
): {
  code: number;
  message: string;
  data: T;
} {
  return {
    code,
    message,
    data,
  };
}












/**
 * 分页响应的 Elysia 类型定义工厂
 * 复用 pageResSchema 函数
 * @param dataSchema 数据项的类型定义
 * @returns 完整的分页响应类型定义
 */
export const pageResSchema = <T extends TSchema>(dataSchema: T) => {
  return t.Object({
    code: t.Number(),
    message: t.String(),
    data: t.Object({
      items: t.MaybeEmpty(t.Array(dataSchema)),
      meta: Meta,
    }),
  });
};


/**
 * 创建符合项目规范的分页响应
 * 复用 pageRes 函数
 * @param data 数据数组
 * @param total 总数
 * @param page 当前页码
 * @param pageSize 每页大小
 * @param message 响应消息
 * @returns 符合项目规范的分页响应
 */

export function pageRes<T>(
  data: T[],
  total: number,
  page = 1,
  pageSize = 10,
  message = "获取成功",
) {
  return commonRes(
    {
      items: data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    200,
    message,
  );
}
