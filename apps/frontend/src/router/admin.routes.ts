import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@frontend/layouts/AdminLayout.vue'
import Dashboard from '@frontend/pages/admin/Dashboard.vue'
import CategoryManagement from '@frontend/pages/admin/CategoryManagement.vue'
import ProductsManagement from '@frontend/pages/admin/ProductsManagement.vue'
import AddProduct from '@frontend/pages/admin/AddProduct.vue'
import OrdersManagement from '@frontend/pages/admin/OrdersManagement.vue'
import UsersManagement from '@frontend/pages/admin/UsersManagement.vue'
import AdminsManagement from '@frontend/pages/admin/AdminsManagement.vue'
import SiteConfig from '@frontend/pages/admin/SiteConfig.vue'
import AdvertisementManagement from '@frontend/pages/admin/AdvertisementManagement.vue'
import ImageManager from '@frontend/pages/admin/ImageManager.vue'
import PartnersManagement from '@frontend/pages/admin/PartnersManagement.vue'
import RefundsManagement from '@frontend/pages/admin/RefundsManagement.vue'
import PaymentSettings from '@frontend/pages/admin/PaymentSettings.vue'
import ShippingSettings from '@frontend/pages/admin/ShippingSettings.vue'
import SalesReports from '@frontend/pages/admin/SalesReports.vue'
import UsersReports from '@frontend/pages/admin/UsersReports.vue'

const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard
      },
      {
        path: 'categories',
        name: 'category-management',
        component: CategoryManagement
      },
      {
        path: 'products',
        name: 'products-management',
        component: ProductsManagement
      },
      {
        path: 'products/add',
        name: 'add-product',
        component: AddProduct
      },
      {
        path: 'orders',
        name: 'orders-management',
        component: OrdersManagement
      },
      {
        path: 'users',
        name: 'users-management',
        component: UsersManagement
      },
      {
        path: 'admins',
        name: 'admins-management',
        component: AdminsManagement
      },
      {
        path: 'site-config',
        name: 'site-config',
        component: SiteConfig
      },
      {
        path: 'advertisements',
        name: 'advertisement-management',
        component: AdvertisementManagement
      },
      {
        path: 'images',
        name: 'image-manager',
        component: ImageManager
      },
      {
        path: 'partners',
        name: 'partners-management',
        component: PartnersManagement
      },
      {
        path: 'refunds',
        name: 'refunds-management',
        component: RefundsManagement
      },
      {
        path: 'payment-settings',
        name: 'payment-settings',
        component: PaymentSettings
      },
      {
        path: 'shipping-settings',
        name: 'shipping-settings',
        component: ShippingSettings
      },
      {
        path: 'sales-reports',
        name: 'sales-reports',
        component: SalesReports
      },
      {
        path: 'users-reports',
        name: 'users-reports',
        component: UsersReports
      }
    ]
  }
]

export default adminRoutes