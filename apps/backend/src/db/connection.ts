

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";


// PostgreSQL 客户端实例
const client = postgres(process.env.DATABASE_URL!);


// 创建 Drizzle ORM 实例
export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});
