import { treaty } from '@elysiajs/eden'
import type { EndApp } from '@backend/server'



console.log('Backend port:', import.meta.env.VITE_BACKEND_PORT)
// 创建Eden Treaty客户端
export const client = treaty<EndApp>(Number(import.meta.env.VITE_BACKEND_PORT) || 3000)


