import { Elysia, redirect, t } from "elysia";
import { openapi } from '@elysiajs/openapi';
import { fromTypes } from '@elysiajs/openapi/gen';
import { cors } from '@elysiajs/cors';
import { logPlugin } from "./plugins/logger";
import { err_handler } from "./utils/error/err.global";
import path from 'path';

// 导入模块化控制器
import { usersController } from './modules/user/index';
import { uploadsController } from './modules/upload';
import { imagesController } from './modules/image';
import { ossController } from './modules/oss';
import { categoriesController } from './modules/category';
import { productsController } from './modules/product';
import { siteConfigsController } from './modules/siteConfig';
import { advertisementsController } from './modules/advertisements';
import { ordersController } from './modules/order';
import { statisticsController } from './modules/statistics';
import { partnersController } from './modules/partner';
import { startupHealthCheck } from "./utils/healthyCheck";




const api = new Elysia({ prefix: '/api' })
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
  .get('/', redirect('/openapi'), {
    detail: {
      hide: true
    }
  })
  .use(
    openapi({
      references: fromTypes('index.ts', {
        projectRoot: path.join(import.meta.dir)
      })
    })
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
  startupHealthCheck()

  if (import.meta.env.NODE_ENV === "production") {
    console.log("当前环境：生产环境: https://wx.cykycyky.top");
    console.log("版本号:", APP_VERSION);
  } else {
    console.log("当前环境：开发环境");
    console.log("版本号:", APP_VERSION);
  }
})();