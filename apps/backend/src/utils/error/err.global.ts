import { Elysia } from "elysia";
import * as CustomError from "./customError";

export const err_handler = new Elysia()
  .error({
    ...CustomError,
  })
  .onError(({ error, code, set, status, path }) => {

    // 业务错误处理
    if (error instanceof CustomError.CustomeError) {
      return error.toResponse();
    }
    // 处理其他类型的错误
    if (error instanceof Error) {
      return Response.json(
        {
          message: error.message,
          code: 500,
          data: false,
        },
        { status: 500 },
      );
    }
    // 开发追踪错误
    console.groupCollapsed(`🔴 ${path} 路由错误`);
    console.log("code  ===============\n", code);
    console.log("status ===============\n", status);
    console.log("error ===============\n");
    console.trace(error); // 显示调用栈
    console.groupEnd();


  })
  .as("global");
