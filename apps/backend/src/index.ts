import { Elysia, redirect, t } from "elysia";
import { openapi } from '@elysiajs/openapi';
import { fromTypes } from '@elysiajs/openapi/gen';
import { logPlugin } from "./plugins/logger";
import { err_handler } from "./utils/error/err.global";
import path from 'path';

// 导入模块化控制器
import { userController } from './modules/user';
import { uploadController } from './modules/upload';
import { imageController } from './modules/image';
import { ossController } from './modules/oss';
import { categoryController } from './modules/category';
import { productController } from './modules/product';
import { siteConfigController } from './modules/siteConfig';
import { advertisementController } from './modules/advertisements';
import { orderController } from './modules/order';
import { statisticsController } from './modules/statistics';
import { partnerController } from './modules/partner';



const globalModel = {
  id: t.Number()
};

const api = new Elysia({ prefix: '/api' })
  .model(globalModel)
  .use(userController)
  .use(uploadController)
  .use(imageController)
  .use(ossController)
  .use(categoryController)
  .use(productController)
  .use(siteConfigController)
  .use(advertisementController)
  .use(orderController)
  .use(statisticsController)
  .use(partnerController);


export const app = new Elysia()
  .get('/', redirect('/openapi'), {
    detail: {
      hide: true
    }
  })
  .use(
    openapi({
      references: fromTypes('server.ts', {
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

  if (import.meta.env.NODE_ENV === "production") {
    console.log("当前环境：生产环境: https://wx.cykycyky.top");
    console.log("版本号:", APP_VERSION);
  } else {
    console.log("当前环境：开发环境");
    console.log("版本号:", APP_VERSION);
  }
})();