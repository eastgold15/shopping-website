import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import { Elysia, redirect } from "elysia";
import path from "node:path";
// 导入模块化控制器
import { advertisementsController } from "./modules/advertisements";
import { categoriesController } from "./modules/category";
import { imagesController } from "./modules/image";
import { ordersController } from "./modules/order";
import { ossController } from "./modules/oss";
import { partnersController } from "./modules/partner";
import { productsController } from "./modules/product";
import { siteConfigsController } from "./modules/siteConfig";
import { statisticsController } from "./modules/statistics";
import { uploadsController } from "./modules/upload";
import { usersController } from "./modules/user";
import { logPlugin } from "./plugins/logger";
import { err_handler } from "./utils/error/err.global";
import { startupHealthCheck } from "./utils/healthyCheck";

const api = new Elysia({ prefix: "/api" })
  .use(usersController)
  .use(uploadsController)
  .use(imagesController)
  .use(ossController)
  .use(categoriesController)
  .use(productsController)
  .use(siteConfigsController)
  .use(advertisementsController)
  .use(ordersController)
  .use(statisticsController)
  .use(partnersController);

export const app = new Elysia()
  .use(cors())
  .get("/", redirect("/openapi"), {
    detail: {
      hide: true,
    },
  })
  .get('/favicon.ico', () => 'ssds')
  .use(
    openapi({
      references: fromTypes(process.env.NODE_ENV === 'production'
        ? 'dist/index.d.ts'
        : 'src/index.ts', {
        projectRoot: path.join(import.meta.dir, '../',),
      }),
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
