
import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./admin.routes";
import IndexRoutes from "./index.routes";

const router = createRouter({
	history: createWebHistory(),
	routes: [...IndexRoutes, ...adminRoutes],
});

export default router;
