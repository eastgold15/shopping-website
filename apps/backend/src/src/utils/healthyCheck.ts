import { sql } from "drizzle-orm";
import { envConfig } from "../config/env.ts";
import { db } from "../db/connection.ts";

/**
 * 健康检查函数 - 验证数据库连接是否正常
 * @returns 健康检查结果
 */
export async function performHealthCheck() {
	try {
		//打印数据库连接信息
		console.log(
			"数据库连接信息",
			envConfig.get(
				"DATABASE_URL",
				"postgres://app_user:app_pass@localhost:5432/MechanicEndWorld",
			),
		);

		const result = await db.execute(sql`SELECT 1 + 1 AS solution`);
		console.log("数据库连接成功", result);
		return { success: true, message: "健康检查通过" };
	} catch (error) {
		console.error("数据库连接失败:", error);
		return {
			success: false,
			message: `数据库连接失败: ${(error as Error).message}`,
		};
	}
}

// 服务器启动前的健康检查函数
export async function startupHealthCheck() {
	console.log("🔍 正在执行启动健康检查...");
	const result = await performHealthCheck();

	if (result.success) {
		console.log("✅ 数据库健康检查通过");
	} else {
		console.warn(`⚠️ 数据库健康检查失败: ${result.message}`);
		console.warn("⚠️ 继续启动服务器，但数据库相关功能可能不可用");
	}
}
