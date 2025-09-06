
import vue from "@vitejs/plugin-vue";
import UnoCSS from 'unocss/vite';
import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [
			vue(),
			UnoCSS(), // 添加UnoCSS插件
		],
		server: {
			port: Number(env.VITE_PORT) || 3000,
		},
		resolve: {
			alias: {
				"@frontend": resolve(__dirname, "./src"),
				"@backend": resolve(__dirname, "../backend/src"),
			},
		},
	};
});
