// plugins/error-handler.ts

import { Elysia } from "elysia";
import { CustomError } from "./customError";




export const err_handler = new Elysia()
  .onError(({ error, set, path }) => {

    const err = error as any; // 👈 强制断言

    // ========================
    // 🧭 1. 判断是否为自定义错误
    // ========================
    if (err instanceof CustomError) {
      set.status = err.status;
      return err.toResponse(); // ← 关键！返回结构化响应
    }

    // ========================
    // 🛡️ 2. 未知错误（兜底）
    // ========================
    const isDev = process.env.NODE_ENV === 'development';

    // 📝 日志记录（安全模式）
    console.groupCollapsed(`🔴 ${path} 路由发生未捕获错误`);
    console.log('时间:', new Date().toISOString());
    console.log('错误类型:', err.constructor.name);
    console.log('错误消息:', err.message);

    if (isDev && err.stack) {
      console.log('堆栈跟踪:');
      console.trace(err); // 开发环境显示堆栈
    } else {
      console.log('堆栈跟踪: [生产环境隐藏]');
    }

    console.groupEnd();

    // 🚫 返回通用 500 响应（不暴露内部细节）
    set.status = 500;
    return Response.json({
      code: 500,
      message: isDev ? err.message : '服务器内部错误',
      data: null,
    }, { status: 500 });
  })
  .as("global");