
import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./admin.routes";
import clientRoutes from "./client.routes";
import IndexRoutes from "./index.routes";

const router = createRouter({
	history: createWebHistory(),
	routes: [...IndexRoutes, ...clientRoutes, ...adminRoutes],
});

export default router;
