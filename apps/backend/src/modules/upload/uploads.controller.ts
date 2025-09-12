import { commonRes } from "@backend/types";
import { Elysia } from "elysia";
import { uploadsModel } from "./uploads.model";
import { uploadService } from "./uploads.service";

/**
 * 文件上传控制器
 * 处理文件上传相关的HTTP请求
 */
export const uploadsController = new Elysia({ prefix: "/upload" })
  .model(uploadsModel)
  .guard({
    detail: {
      tags: ["Upload"],
    },
  })

  // 上传图片
  .post(
    "/image",
    async ({ body: { file, folder } }) => {
      // 将单个文件转换为数组，调用批量上传服务
      const result = await uploadService.uploadImages({
        files: [file],
        folder,
      });
      return commonRes(result);
    },
    {
      body: "UploadImageDto",
      detail: {
        summary: "上传通用图片",
        description: "上传通用图片到指定文件夹",
      },
    },
  )

  // 批量上传图片
  .post(
    "/images",
    async ({ body }) => {
      // 直接调用批量上传服务
      const result = await uploadService.uploadImages(body);
      return commonRes(result);
    },
    {
      body: "UploadImagesDto",
      detail: {
        summary: "批量上传通用图片",
        description: "批量上传多个图片到指定文件夹",
      },
    },
  )

  // 删除文件
  .delete(
    "/file",
    async ({ query }) => {
      const { url } = query;
      const result = await uploadService.deleteFile(url);
      return commonRes(result);
    },
    {
      detail: {
        summary: "删除文件",
        description: "根据URL删除OSS中的文件",
      },
    },
  )
  // 检查文件是否存在
  .get(
    "/file/exists",
    async ({ query }) => {
      const { url } = query;
      if (!url) {
        return {
          success: false,
          error: "文件URL不能为空",
        };
      }
      const result = await uploadService.fileExists(url);
      return commonRes(result);
    },
    {
      detail: {
        summary: "检查文件是否存在",
        description: "检查指定URL的文件是否存在",
      },
    },
  )

  // 获取文件信息
  .get(
    "/file/info",
    async ({ query }) => {
      const { url } = query;
      if (!url) {
        return {
          success: false,
          error: "文件URL不能为空",
        };
      }
      const result = await uploadService.getFileInfo(url);
      return commonRes(result);
    },
    {
      detail: {
        summary: "获取文件信息",
        description: "获取指定URL文件的详细信息",
      },
    },
  );
