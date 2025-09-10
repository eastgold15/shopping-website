import type { EndApp } from "@backend/server";
import { treaty } from "@elysiajs/eden";
// 创建Eden Treaty客户端
export const client = treaty<EndApp>(
	import.meta.env.VITE_API_URL || "http://localhost:9003",
);

// 导出类型以供其他组件使用
export type ApiClient = typeof client;
