import { createRouter, createWebHistory } from 'vue-router'
import clientRoutes from './client.routes'
import adminRoutes from './admin.routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [...clientRoutes, ...adminRoutes]
})

export default router