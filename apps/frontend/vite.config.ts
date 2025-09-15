import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import UnoCSS from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      vue(),
      UnoCSS(), // 添加UnoCSS插件
      // 自动导入 Vue API
      AutoImport({
        imports: ["vue", "vue-router", "@vueuse/core"],
        dts: true, // 生成类型声明文件
      }),
      // 自动导入组件
      Components({
        resolvers: [PrimeVueResolver()],
        dts: true, // 生成组件类型声明文件
        dirs: ["src/components"], // 自动导入的组件目录
        extensions: ["vue"], // 组件文件扩展名
        deep: true, // 深度搜索子目录
        include: [/\.vue$/, /\.vue\?vue/], // 包含的文件类型
      }),
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
    build: {
      rollupOptions: {
        external: [],
      },
      // 跳过类型检查以加快构建速度
      skipTypeCheck: true,
    },
  };
});
