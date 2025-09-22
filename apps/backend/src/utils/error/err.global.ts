import { Elysia } from "elysia";

export const err_handler = new Elysia()
	.onError(({ error, code, set, status, path }) => {
		// 开发追踪错误
		console.groupCollapsed(`🔴 ${path} 路由错误`);
		console.log("code  ===============\n", code);
		console.log("status ===============\n", status);
		console.log("error ===============\n");
		console.trace(error); // 显示调用栈
    console.groupEnd();
  })
  .as("global");
