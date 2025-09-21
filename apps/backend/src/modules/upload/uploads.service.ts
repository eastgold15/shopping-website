// 文件上传管理服务

import {
  CustomeError,
  handleDatabaseError,
  InternalServerError,
} from "@backend/utils/error/customError";

import { UploadImagesDto } from "@backend/db/models";
import { ImageService } from "../image/images.service";
import { type FileInfo, ossService } from "../oss";

export class UploadService {
  /**
   * 批量上传文件
   */
  async uploadFiles({ files, folder }: UploadImagesDto) {
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // 生成文件名
          const fileName = file.name;
          // 读取文件内容
          const fileBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(fileBuffer);

          // 上传到OSS
          const key = `${folder}/${fileName}`;
          const url = await ossService.uploadFileDirect(buffer, key, file.type);

          const fileInfo: FileInfo = {
            url,
            fileName,
            size: file.size,
            contentType: file.type,
          };
          return { success: true, fileInfo, error: null };
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
          return {
            success: false,
            fileInfo: null,
            error: `文件 ${file.name}: ${error instanceof Error ? error.message : "上传失败"}`,
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      const uploadResults: FileInfo[] = [];
      const errors: string[] = [];

      results.forEach((result) => {
        if (result.success && result.fileInfo) {
          uploadResults.push(result.fileInfo);
        } else if (result.error) {
          errors.push(result.error);
        }
      });

      if (uploadResults.length === 0) {
        throw new InternalServerError(`所有文件上传失败: ${errors.join(", ")}`);
      }

      // 如果有部分失败，记录警告但返回成功结果
      if (errors.length > 0) {
        console.warn(`部分文件上传失败: ${errors.join(", ")}`);
      }

      return uploadResults;
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
    }
  }

  /**
   * 批量上传图片
   */
  async uploadImages({ files, folder }: UploadImagesDto) {
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const fileName = file.name;
          const url = await ossService.uploadImage(file, folder, fileName);
          // 创建图片记录
          const imageRecord = await new ImageService().create(
            {
              fileName,
              imageUrl: url,
              fileSize: file.size,
              mimeType: file.type,
              category: folder,
              alt: file.name,
            }
          )

          if (!imageRecord) {
            throw new InternalServerError("创建图片记录失败");
          }

          return imageRecord;
        } catch (error) {
          console.error(`图片 ${file.name} 上传失败:`, error);
          return {
            success: false,
            imageData: null,
            error: `图片 ${file.name}: ${error instanceof Error ? error.message : "上传失败"}`,
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      const uploadResults: any[] = [];
      const errors: string[] = [];

      results.forEach((result) => {
        if (result) {
          uploadResults.push(result);
        } else if (!result) {
          errors.push(result);
        }
      });

      if (uploadResults.length === 0) {
        throw new InternalServerError(`所有图片上传失败: ${errors.join(", ")}`);
      }

      // 如果有部分失败，记录警告但返回成功结果
      if (errors.length > 0) {
        console.warn(`部分图片上传失败: ${errors.join(", ")}`);
      }

      return uploadResults;
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      console.error("批量图片上传失败:", error);
      handleDatabaseError(error);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileUrl: string) {
    try {
      // 从URL中提取文件key
      const url = new URL(fileUrl);
      const pathname = url.pathname;

      // 移除开头的斜杠
      let key = pathname.startsWith("/") ? pathname.substring(1) : pathname;

      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== "obs.cn-north-4.myhuaweicloud.com") {
        // 从URL中提取相对路径
        const match = pathname.match(/\/uploads\/(.+)/);
        if (match) {
          key = `uploads/${match[1]}`;
        }
      }

      return await ossService.deleteFile(key);
    } catch (error) {
      throw new InternalServerError("文件删除失败", error);
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(fileUrl: string) {
    try {
      // 从URL中提取文件key
      const url = new URL(fileUrl);
      const pathname = url.pathname;

      let key = pathname.startsWith("/") ? pathname.substring(1) : pathname;

      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== "obs.cn-north-4.myhuaweicloud.com") {
        const match = pathname.match(/\/uploads\/(.+)/);
        if (match) {
          key = `uploads/${match[1]}`;
        }
      }

      const exists = await ossService.fileExists(key);

      return exists;
    } catch (error) {
      throw new InternalServerError("文件删除失败", error);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileUrl: string) {
    try {
      // 从URL中提取文件key
      const url = new URL(fileUrl);
      const pathname = url.pathname;

      let key = pathname.startsWith("/") ? pathname.substring(1) : pathname;

      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== "obs.cn-north-4.myhuaweicloud.com") {
        const match = pathname.match(/\/uploads\/(.+)/);
        if (match) {
          key = `uploads/${match[1]}`;
        }
      }
      const stats = await ossService.getFileStats(key);

      const fileInfo: FileInfo = {
        url: fileUrl,
        fileName: key.split("/").pop() || "unknown",
        size: stats.size,
      };
      return fileInfo;
    } catch (error) {
      throw new InternalServerError("文件删除失败", error);
    }
  }
}

