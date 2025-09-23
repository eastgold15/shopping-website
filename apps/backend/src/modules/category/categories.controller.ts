import { commonRes } from "@backend/utils/Res";
import { Elysia } from "elysia";
import { z } from "zod/v4";
import { categoriesModel } from "../../db/models/category.model";
import { CategoriesService } from "./categories.service";

/**
 * 分类控制器
 * 处理分类相关的HTTP请求
 */
export const categoriesController = new Elysia({
  prefix: "/categories",
  tags: ["Categories"],
})
  .model(categoriesModel)
  .decorate("categoriesService", new CategoriesService())
  // 创建分类 - RESTful标准设计
  .post(
    "/",
    async ({
      body,
      categoriesService,
    }) => {
      const newCategory = await categoriesService.createCategory(body);
      return commonRes(newCategory, 201, "分类创建成功");
    },
    {
      body: "insertCategoryDto",
      detail: {
        tags: ["Categories"],
        summary: "创建分类",
        description: "创建分类",
      },
    },
  )

  // 更新分类
  .put(
    "/:id",
    async ({
      params: { id },
      body,
      categoriesService,
    }: {
      params: { id: number };
      body: any;
      categoriesService: CategoriesService;
    }) => {
      const updatedCategory = await categoriesService.updateCategory(
        id,
        body,
      );
      return commonRes(updatedCategory, 200, "分类更新成功");
    },
    {
      params: z.object({
        id: z.number(),
      }),
      body: categoriesModel.updateCategoryDto,
      detail: {
        tags: ["Categories"],
        summary: "更新分类",
        description: "更新分类",
      },
    },
  )

  // 获取分类树形列表 - 管理端使用
  .get(
    "/",
    async ({ categoriesService }) => {
      const result = await categoriesService.getCategoryTree();
      return commonRes(result, 200, "获取分类树形列表成功");

    },
    {
      detail: {
        tags: ["Categories"],
        summary: "获取分类树形列表",
        description:
          "获取所有分类的树形结构列表，支持搜索和筛选，主要用于管理端",
      },
    },
  )



  // 根据ID获取分类详情
  .get(
    "/:id",
    async ({ params: { id }, categoriesService }) => {
      const category = await categoriesService.getCategoryById(id);
      return commonRes(category, 200, "获取分类详情成功");
    },
    {
      params: z.object({
        id: z.coerce.number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "获取分类详情",
        description: "根据ID获取分类详情",
      },
    },
  )

  // 删除分类
  .delete(
    "/:id",
    async ({ params: { id }, categoriesService }) => {

      const _res = await categoriesService.deleteCategory(id);
      return commonRes(null, 204, "分类删除成功");

    },
    {
      params: z.object({
        id: z.coerce.number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "删除分类",
        description: "删除指定分类，删除前会检查是否有子分类",
      },
    },
  )

