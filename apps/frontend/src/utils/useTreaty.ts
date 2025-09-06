
import { treaty } from '@elysiajs/eden'

import type { EndApp } from "@backend/server"
// 创建Eden Treaty客户端
export const client = treaty<EndApp>('localhost:9003')

// 导出类型以供其他组件使用
export type ApiClient = typeof client


