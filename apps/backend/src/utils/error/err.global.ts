import { Elysia } from "elysia";
import * as CustomError from "./customError";

export const err_handler = new Elysia()
	.error({
		...CustomError,
	})
	.onError(({ error, code, set, status, path }) => {
		// 开发追踪错误
		console.groupCollapsed(`🔴 ${path} 路由错误`);
		console.log("code  ===============\n", code);
		console.log("status ===============\n", status);
		console.log("error ===============\n");
		console.trace(error); // 显示调用栈
		console.groupEnd();

		// 业务错误处理
		if (error instanceof CustomError.CustomeError) {
			return error.toResponse();
		}

		// 处理其他类型的错误
		if (error instanceof Error) {
			return Response.json(
				{
					error: error.message,
					code: 50000,
					success: false,
				},
				{ status: 500 },
			);
		}

		// 处理未知错误
		return Response.json(
			{
				error: "服务器内部错误",
				code: 50000,
				success: false,
			},
			{ status: 500 },
		);
	})
	.as("global");
