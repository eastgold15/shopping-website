import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { elysiaAuthDrizzlePlugin } from "@pori15/elysia-auth-drizzle";
import { Elysia } from "elysia";

import { autoload } from "elysia-autoload";
import { envConfig } from "./config/env.ts";
import { db } from "./db/connection.ts";
import { tokenSchema, userSchema } from "./db/schema/auth.ts";
import { logPlugin } from "./plugins/logger.ts";
import { err_handler } from "./utils/err.global.ts";

// 创建 Elysia 应用
export const app = new Elysia()
	// // 日志
	.use(logPlugin)
	// 静态文件服务
	.use(staticPlugin())
	.use(cors())
	// 认证插件
	.use(
		elysiaAuthDrizzlePlugin({
			jwtSecret: envConfig.get("JWT_SECRET") || "your-jwt-secret-key",
			cookieSecret: envConfig.get("COOKIE_SECRET") || "your-cookie-secret-key",
			drizzle: {
				db,
				usersSchema: userSchema,
				tokensSchema: tokenSchema,
			},
			getTokenFrom: {
				from: "header", // 从请求头获取token
				headerName: "authorization",
			},
			PublicUrlConfig: [
				{ url: "/", method: "*" },
				{ url: "/register", method: "*" },
				{ url: "/login", method: "*" },
				{ url: "**", method: "*" },
			],
		}),
	)

	// // swagger 文档
	.use(
		swagger({
			path: "/swagger",
			documentation: {
				info: {
					title: "末世机械师 API",
					version: "1.0.0",
					description: "末世机械师游戏后端API文档",
				},
				tags: [
					{ name: "System", description: "系统相关接口" },
					{ name: "Auth", description: "用户认证相关接口" },
					{ name: "User", description: "用户管理相关接口" },
					{ name: "Weapon", description: "武器管理相关接口" },
					{ name: "Stage", description: "关卡管理相关接口" },
					{ name: "Monster", description: "怪物管理相关接口" },
				],
			},
		}),
	)
	// 自动加载路由 - 配合swagger使用
	.use(
		// @ts-ignore
		await autoload({
			dir: "routes",
			pattern: "**/*.{ts,tsx}",
			// 在可执行文件中禁用类型生成，避免权限问题
			// types: {
			//   output: "types/routes.ts",
			//   typeName: "Route",
			// },
			ignore: ["**/*.model.ts"],
			tsconfigPath: "./tsconfig.json",
			// @ts-ignore
			schema: ({ path, url, detail }) => {
				// 从URL中提取模块名作为标签
				const segments = url.split("/").filter(Boolean);
				const moduleName = segments[0] || "system";
				const defaultTag =
					moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

				// 合并路由文件中的detail配置
				return {
					detail: {
						...detail,
						tags: detail?.tags || [defaultTag],
						description:
							detail?.description || `${defaultTag} 模块 - 自动加载自 ${path}`,
						// operationId:
						// 	detail?.operationId ||
						// 	`${moduleName}_${path.split("/").pop()?.replace(".ts", "")}`,
					},
				};
			},
		}),
	)
	// // test
	.use(html())

	.get("/", () => {
		return `	
<html lang='en'>
              <head>
                  <title>末世机械师</title>
              </head>
              <body>
                  <h1>Hello 末世机械师</h1>
									<a href='/swagger'>查看文档</a>
              </body>
          </html>
`;
	})

	// 全局错误处理中间件
	.use(err_handler);

export type ElysiaApp = typeof app;
