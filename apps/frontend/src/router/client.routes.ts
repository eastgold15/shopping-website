
import ClientLayout from "@frontend/layouts/ClientLayout.vue";
import Home from "@frontend/pages/Home.vue";
import ProductDetail from "@frontend/pages/ProductDetail.vue";
import Search from "@frontend/pages/Search.vue";


const clientRoutes = [
  {
    path: "/home",
    component: ClientLayout,
    children: [
      {
        path: "/",
        name: "home",
        component: Home,
      },
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
