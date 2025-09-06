import { envConfig } from "./config/env.ts";
import { app } from "./server.ts";
import { startupHealthCheck } from "./utils/healthyCheck.ts";

// 构建时版本号 - 避免运行时依赖package.json
const APP_VERSION = "1.0.71"; // 构建时手动更新或通过构建脚本注入

const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		await app.stop();
		process.exit(0);
	});
}

process.on("uncaughtException", (error) => {
	console.error(error);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
});

// 异步启动函数
async function startServer() {
	try {
		// 执行启动前健康检查
		await startupHealthCheck();
		// 启动服务器
		app.listen(Number.parseInt(envConfig.get("APP_PORT") || "3000"), () => {
			console.log(
				`🦊 Elysia is running at ${envConfig.get("APP_NAME")}:: ${envConfig.get("APP_HOST")}:${envConfig.get("APP_PORT")}`,
			);

			import.meta.env.NODE_ENV === "production" ?
				(() => {
					console.log("当前环境：生产环境: https://wx.cykycyky.top");
					// 使用构建时硬编码的版本号，避免依赖package.json文件
					console.log("版本号:", APP_VERSION);
				})()
				:
				(() => {
					console.log("当前环境：开发环境");
					console.log("版本号:", APP_VERSION);
				})();
		});
	} catch (error) {
		console.error("服务器启动失败:", error);
		process.exit(1);
	}
}

// 启动服务器
startServer();
