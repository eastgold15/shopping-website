import { redirect } from "elysia";
import Elysia from 'elysia';
import { categoriesRoute } from './routes/categories';
import { productsRoute } from './routes/products';
import { siteConfigsRoute } from './routes/siteConfigs';

import { openapi } from '@elysiajs/openapi';
import { fromTypes } from '@elysiajs/openapi/gen';
import { logPlugin } from "./plugins/logger";
import { advertisementsRoute } from './routes/advertisements';
import { imagesRoute } from './routes/images';
import { ordersRoute } from './routes/orders';
import { partnersRoute } from './routes/partners';
import { statisticsRoute } from './routes/statistics';
import { uploadRoute } from './routes/upload';
import { usersRoute } from './routes/users';
import { err_handler } from "./utils/err.global";

import path from 'path';



const api = new Elysia({ prefix: '/api' })
  .use(categoriesRoute)
  .use(productsRoute)
  .use(siteConfigsRoute)

  .use(advertisementsRoute)
  .use(uploadRoute)
  .use(imagesRoute)
  .use(ordersRoute)
  .use(usersRoute)
  .use(statisticsRoute)
  .use(partnersRoute)


export const app = new Elysia()
  .use(
    openapi({
      references: fromTypes('src/server.ts', {
        projectRoot: path.join(import.meta.dir)
      })
    })
  )
  .use(logPlugin)
  // 使用模块化路由
  .use(api)

  //全局错误
  .use(err_handler)
  .listen(Number(process.env.APP_PORT || "3000"));


export type EndApp = typeof app







// 构建时版本号 - 避免运行时依赖package.json
const APP_VERSION = "1.0.71"; // 构建时手动更新或通过构建脚本注入

(() => {
  console.log(
    `🦊 Elysia is running at ${process.env.APP_NAME}:: ${process.env.APP_HOST}:${process.env.APP_PORT}`,
  );

  import.meta.env.NODE_ENV === "production" ?
    (() => {
      console.log("当前环境：生产环境: https://wx.cykycyky.top");
      // 使用构建时硬编码的版本号，避免依赖package.json文件
      console.log("版本号:", APP_VERSION);
    })()
    :
    (() => {
      console.log("当前环境：开发环境");
      console.log("版本号:", APP_VERSION);
    })();


})()

