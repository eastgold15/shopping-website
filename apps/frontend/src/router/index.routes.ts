import HomeLayout from "@frontend/layouts/IndexLayout.vue";

const IndexRoutes = [
  {
    path: "/",
    component: HomeLayout,

    children: [
      {
        path: "",
        name: "index",
        component: () => import("@frontend/pages/index.vue"),
      },
    ],
  },
];

export default IndexRoutes;
