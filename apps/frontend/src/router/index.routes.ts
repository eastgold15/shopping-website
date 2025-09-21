import ClientLayout from "@frontend/layouts/ClientLayout.vue";

const IndexRoutes = [
	{
		path: "/",
		component: ClientLayout,
		children: [
			{
				path: "/",
				name: "home",
				component: () => import("@frontend/pages/index.vue"),
			},
			{
				path: "products",
				name: "products",
				component: () => import("@frontend/pages/ProductDetail.vue"),
			},
			{
				path: "about",
				name: "about",
				component: () => import("@frontend/pages/About.vue"),
			},
			{
				path: "contact",
				name: "contact",
				component: () => import("@frontend/pages/Contact.vue"),
			},
			{
				path: "category/:id",
				name: "category",
				component: () => import("@frontend/pages/Category.vue"),
			},
		],
	},
];

export default IndexRoutes;
