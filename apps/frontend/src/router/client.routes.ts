import ClientLayout from "@frontend/layouts/ClientLayout.vue";
import ProductDetail from "@frontend/pages/ProductDetail.vue";
import Search from "@frontend/pages/Search.vue";

const clientRoutes = [
	{
		path: "/",
		component: ClientLayout,
		children: [
			{
				path: "product/:id",
				name: "product-detail",
				component: ProductDetail,
			},
			{
				path: "search",
				name: "search",
				component: Search,
			},
		],
	},
];

export default clientRoutes;
