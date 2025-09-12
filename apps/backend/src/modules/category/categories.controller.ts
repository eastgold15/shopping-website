import { commonRes } from "@backend/utils/Res";
import { Elysia, t } from "elysia";
import { categoriesModel } from "./categories.model";
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
  .guard(
    {
      transform({ body }: { body: any }) {
        // 只对有 body 的请求进行处理
        if (!body) return;

        // 处理parentId：支持字符串转整数和对象格式{"key":true}
        if (body?.parentId) {
          if (typeof body.parentId === "string") {
            // 字符串转整数
            const parsed = parseInt(body.parentId);
            body.parentId = isNaN(parsed) ? null : parsed;
          } else if (
            typeof body.parentId === "object" &&
            body.parentId !== null
          ) {
            // 从对象中提取第一个key作为parentId
            const keys = Object.keys(body.parentId);
            if (keys.length > 0) {
              body.parentId = parseInt(keys[0]);
            }
          }
        }
      },
    },
    (app) =>
      app
        // 创建分类
        .post(
          "",
          async ({ body, categoriesService }) => {
            try {
              const newCategory = await categoriesService.createCategory(body);
              return commonRes(newCategory, 201, "分类创建成功");
            } catch (error) {
              console.error("创建分类失败:", error);
              return commonRes(
                null,
                500,
                error instanceof Error ? error.message : "创建分类失败",
              );
            }
          },
          {
            body: "CreateCategoryDto",
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
          async ({ params: { id }, body, categoriesService }) => {
            try {
              const updatedCategory = await categoriesService.updateCategory(
                id,
                body,
              );
              return commonRes(updatedCategory, 200, "分类更新成功");
            } catch (error) {
              console.error("更新分类失败:", error);
              const statusCode =
                error instanceof Error && error.message === "分类不存在"
                  ? 404
                  : 500;
              return commonRes(
                null,
                statusCode,
                error instanceof Error ? error.message : "更新分类失败",
              );
            }
          },
          {
            params: t.Object({
              id: t.Number(),
            }),
            body: "UpdateCategoryDto",
            detail: {
              tags: ["Categories"],
              summary: "更新分类",
              description: "更新分类",
            },
          },
        ),
  )

  // 获取分类树形结构
  .get(
    "/tree",
    async ({ categoriesService }) => {
      try {
        const tree = await categoriesService.getCategoryTree();
        return commonRes(tree, 200, "获取分类树成功");
      } catch (error) {
        console.error("获取分类树失败:", error);
        return commonRes(
          null,
          500,
          error instanceof Error ? error.message : "获取分类树失败",
        );
      }
    },
    {
      detail: {
        tags: ["Categories"],
        summary: "获取分类树形结构",
        description: "获取分类树形结构",
      },
    },
  )

  // 获取分类列表（分页）
  .get(
    "",
    async ({ query, categoriesService }) => {
      try {
        const result = await categoriesService.getCategoryList(query);
        return commonRes(result)
      } catch (error) {
        console.error("获取分类列表失败:", error);
        return commonRes(
          null,
          500,
          error instanceof Error ? error.message : "获取分类列表失败",
        );
      }
    },
    {
      query: "CategoriesQuery",
      detail: {
        tags: ["Categories"],
        summary: "获取分类列表",
        description: "获取分类列表，支持分页、搜索、筛选和排序",
      },
    },
  )

  // 根据ID获取分类详情
  .get(
    "/:id",
    async ({ params: { id }, categoriesService }) => {
      try {
        const category = await categoriesService.getCategoryById(id);
        return commonRes(category, 200, "获取分类详情成功");
      } catch (error) {
        console.error("获取分类详情失败:", error);
        const statusCode =
          error instanceof Error && error.message === "分类不存在" ? 404 : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "获取分类详情失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
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
      try {
        const res = await categoriesService.deleteCategory(id);
        return commonRes(null, 200, "分类删除成功");
      } catch (error) {
        console.error("删除分类失败:", error);
        const statusCode =
          error instanceof Error &&
            (error.message === "分类不存在" || error.message.includes("子分类"))
            ? 400
            : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "删除分类失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "删除分类",
        description: "删除指定分类，删除前会检查是否有子分类",
      },
    },
  )

  // // 获取分类的子分类
  // .get(
  //   "/:id/children",
  //   async ({ params: { id }, categoriesService }) => {
  //     try {
  //       const children = await categoriesService.getCategoryChildren(id);
  //       return commonRes(children, 200, "获取子分类成功");
  //     } catch (error) {
  //       console.error("获取子分类失败:", error);
  //       return commonRes(
  //         null,
  //         500,
  //         error instanceof Error ? error.message : "获取子分类失败",
  //       );
  //     }
  //   },
  //   {
  //     params: t.Object({
  //       id: t.Number(),
  //     }),
  //     detail: {
  //       tags: ["Categories"],
  //       summary: "获取子分类",
  //       description: "获取指定分类的所有子分类",
  //     },
  //   },
  // )

  // 更新分类排序
  .patch(
    "/:id/sort",
    async ({ params: { id }, body, categoriesService }) => {
      try {
        const updatedCategory = await categoriesService.updateCategorySort(
          id,
          body,
        );
        return commonRes(updatedCategory, 200, "排序更新成功");
      } catch (error) {
        console.error("更新排序失败:", error);
        const statusCode =
          error instanceof Error && error.message === "分类不存在" ? 404 : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "更新排序失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: "UpdateSortDto",
      detail: {
        tags: ["Categories"],
        summary: "更新分类排序",
        description: "更新指定分类的排序权重",
      },
    },
  )

  // 切换分类可见性
  .patch(
    "/:id/toggle-visibility",
    async ({ params: { id }, categoriesService }) => {
      try {
        const updatedCategory =
          await categoriesService.toggleCategoryVisibility(id);
        return commonRes(updatedCategory, 200, "可见性切换成功");
      } catch (error) {
        console.error("切换可见性失败:", error);
        const statusCode =
          error instanceof Error && error.message === "分类不存在" ? 404 : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "切换可见性失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "切换分类可见性",
        description: "切换指定分类的显示/隐藏状态",
      },
    },
  )

  // 分类上移
  .patch(
    "/:id/move-up",
    async ({ params: { id }, categoriesService }) => {
      try {
        const updatedCategory = await categoriesService.moveCategoryUp(id);
        return commonRes(updatedCategory, 200, "分类上移成功");
      } catch (error) {
        console.error("分类上移失败:", error);
        const statusCode =
          error instanceof Error &&
            (error.message === "分类不存在" || error.message.includes("第一个"))
            ? 400
            : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "分类上移失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "分类上移",
        description: "将指定分类在同级别中向上移动一位",
      },
    },
  )

  // 分类下移
  .patch(
    "/:id/move-down",
    async ({ params: { id }, categoriesService }) => {
      try {
        const updatedCategory = await categoriesService.moveCategoryDown(id);
        return commonRes(updatedCategory, 200, "分类下移成功");
      } catch (error) {
        console.error("分类下移失败:", error);
        const statusCode =
          error instanceof Error &&
            (error.message === "分类不存在" || error.message.includes("最后一个"))
            ? 400
            : 500;
        return commonRes(
          null,
          statusCode,
          error instanceof Error ? error.message : "分类下移失败",
        );
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        tags: ["Categories"],
        summary: "分类下移",
        description: "将指定分类在同级别中向下移动一位",
      },
    },
  );
