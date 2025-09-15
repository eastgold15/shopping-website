
import ClientLayout from "@frontend/layouts/ClientLayout.vue";
import Home from "@frontend/pages/Home.vue";
import ProductDetail from "@frontend/pages/ProductDetail.vue";
import Search from "@frontend/pages/Search.vue";
import Test from "@frontend/pages/test.vue";

const clientRoutes = [
  {
    path: "/",
    component: ClientLayout,
    children: [
      {
        path: "home",
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
      {
        path: "test",
        name: "test",
        component: Test,
      },
    ],
  },
];

export default clientRoutes;
