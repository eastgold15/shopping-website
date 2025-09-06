import { Elysia } from "elysia";
export const logPlugin = new Elysia()
	.onTransform(function log({ body, params, path, request: { method } }) {
		console.log(`${method} ${path}`, {
			body,
			params,
		});
	})
	.as("global");
// .use(logger({
//     level: "info",
//     transport: {
//         target: "pino-pretty",
//         options: {
//             colorize: true,
//         },
//     },
//     customProps(ctx) {
//         // 添加请求ID、用户信息等
//         return {
//             requestId: ctx.request.headers.get("x-request-id"),
//             params: ctx.params,
//             query: ctx.query,
//             // 如果是错误，添加错误相关信息
//             ...(ctx.isError ? { errorCode: ctx.code, errorMessage: ctx.error } : {}),
//         };
//     }
// }))
// .as('global')
