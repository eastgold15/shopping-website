import { createRouter, createWebHistory } from 'vue-router'
import clientRoutes from './client.routes'
import adminRoutes from './admin.routes'
import IndexRoutes from './index.routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [...IndexRoutes, ...clientRoutes, ...adminRoutes,]
})

export default router