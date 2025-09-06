

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { envConfig } from "../config/env";
import * as schema from "./schema/index";

// 确保环境配置已加载
envConfig.loadConfig();

// 获取数据库连接URL
const databaseUrl = envConfig.get(
	"DATABASE_URL",
	"postgres://app_user:app_pass@localhost:5432/buy_db",
);

console.log("1111", databaseUrl);

// PostgreSQL 客户端实例
const client = postgres(databaseUrl!);


// 创建 Drizzle ORM 实例
export const db = drizzle(client, {
	schema,
	casing: "snake_case",
});

// - PostgreSQL 提供了可靠的数据库连接
// - Drizzle ORM 提供了类型安全和查询构建功能
// - 这种结合提供了完整的数据库操作解决方案


// import { SQL } from 'bun'
// import { drizzle } from "drizzle-orm/bun-sql";
// const client = new SQL(databaseUrl!)
// export const db = drizzle({
// 	connection: {
// 		url: process.env.DATABASE_URL!,
// 	},
// 	schema,
// 	client,
// 	casing: "snake_case",
// });