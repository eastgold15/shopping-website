import HomeLayout from '@frontend/layouts/IndexLayout.vue'
import { redirect } from 'elysia'

const IndexRoutes = [
  {
    path: '/',
    component: HomeLayout,
    redirect: 'index',
    children: [
      {
        path: '',
        name: 'index',
        component: () => import('@frontend/pages/index.vue'),
      },
    ]
  }
]

export default IndexRoutes