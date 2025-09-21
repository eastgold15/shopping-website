// import { createRouter, createWebHistory } from 'vue-router' // 未使用的导入
import AdminLayout from "@frontend/layouts/AdminLayout.vue";
import AddProduct from "@frontend/pages/admin/AddProduct.vue";
import AdvertisementManagement from "@frontend/pages/admin/AdvertisementManagement.vue";
import CategoryManagement from "@frontend/pages/admin/CategoryManagement.vue";
// import PaymentSettings from "@frontend/pages/admin/PaymentSettings.vue";
import ImageManager from "@frontend/pages/admin/ImageManager.vue";
import PrimePartnersManagement from "@frontend/pages/admin/PrimePartnersManagement.vue";
import ProductsManagement from "@frontend/pages/admin/ProductsManagement.vue";
import SiteConfigForm from "@frontend/pages/admin/SiteConfigForm.vue";

const adminRoutes = [
	{
		path: "/admin",
		component: AdminLayout,
		children: [
			// 	{
			// 		path: "dashboard",
			// 		name: "admin-dashboard",
			// 		component: Dashboard,
			// 	},
			{
				path: "categories",
				name: "category-management",
				component: CategoryManagement,
			},
			{
				path: "products",
				name: "products-management",
				component: ProductsManagement,
			},
			{
				path: "products/add",
				name: "add-product",
				component: AddProduct,
			},
			{
				path: "site-config",
				name: "site-config",
				component: SiteConfigForm,
			},
			{
				path: "advertisements",
				name: "advertisement-management",
				component: AdvertisementManagement,
			},
			{
				path: "images",
				name: "image-manager",
				component: ImageManager,
			},
			{
				path: "partners",
				name: "partners-management",
				component: PrimePartnersManagement,
			},
			// 	{
			// 		path: "orders",
			// 		name: "orders-management",
			// 		component: OrdersManagement,
			// 	},
			// 	{
			// 		path: "users",
			// 		name: "users-management",
			// 		component: UsersManagement,
			// 	},
			// 	{
			// 		path: "admins",
			// 		name: "admins-management",
			// 		component: AdminsManagement,
			// 	},

			// 	{
			// 		path: "refunds",
			// 		name: "refunds-management",
			// 		component: RefundsManagement,
			// 	},
			// 	// {
			// 	//   path: "payment-settings",
			// 	//   name: "payment-settings",
			// 	//   component: PaymentSettings,
			// 	// },
			// 	{
			// 		path: "shipping-settings",
			// 		name: "shipping-settings",
			// 		component: ShippingSettings,
			// 	},
			// 	{
			// 		path: "sales-reports",
			// 		name: "sales-reports",
			// 		component: SalesReports,
			// 	},
			// 	{
			// 		path: "users-reports",
			// 		name: "users-reports",
			// 		component: UsersReports,
			// 	},
		],
	},
];

export default adminRoutes;
