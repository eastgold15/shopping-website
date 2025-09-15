import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import { Elysia, redirect } from "elysia";
import path from "node:path";
// 导入模块化控制器
import { advertisementsController } from "./modules/advertisements";
import { categoriesController } from "./modules/category";
import { imagesController } from "./modules/image";
import { partnersController } from "./modules/partner";
import { productsController } from "./modules/product";
import { siteConfigsController } from "./modules/siteConfig";
import { uploadsController } from "./modules/upload";
import { logPlugin } from "./plugins/logger";
import { err_handler } from "./utils/error/err.global";
import { startupHealthCheck } from "./utils/healthyCheck";

console.log("启动检查...");
console.log("启动检查完成", path.join(import.meta.dirname, "../tsconfig.json"));

const api = new Elysia({ prefix: "/api" })
  .use(uploadsController)
  .use(imagesController)
  .use(partnersController)
  .use(categoriesController)
  .use(advertisementsController)
  .use(productsController)
  .use(siteConfigsController)

// .use(ordersController)
// .use(statisticsController)
// .use(usersController);

export const app = new Elysia()
  .use(cors())
  .get("/", redirect("/openapi"), {
    detail: {
      hide: true,
    },
  })
  .get("/favicon.ico", () => "ssds")
  .use(
    openapi({
      references: fromTypes(
        process.env.NODE_ENV === "production"
          ? "dist/index.d.ts"
          : "src/index.ts",
        {
          projectRoot: path.join(import.meta.dirname, "../"),
          tsconfigPath: path.join(import.meta.dirname, "../tsconfig.json"),
        },
      ),
    }),
  )
  .use(logPlugin)
  .use(err_handler)
  .use(api)
  .listen(Number(process.env.APP_PORT || "3000"));

export type EndApp = typeof app;

// 构建时版本号 - 避免运行时依赖package.json
const APP_VERSION = "1.0.71";

(() => {
  console.log(
    `🦊 Elysia is running at ${process.env.APP_NAME}:: ${process.env.APP_HOST}:${process.env.APP_PORT}`,
  );
  startupHealthCheck();

  if (import.meta.env.NODE_ENV === "production") {
    console.log("当前环境：生产环境: https://wx.cykycyky.top");
    console.log("版本号:", APP_VERSION);
  } else {
    console.log("当前环境：开发环境");
    console.log("版本号:", APP_VERSION);
  }
})();
