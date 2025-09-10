// 文件上传管理服务

import {
	CustomeError,
	DatabaseError,
	handleDatabaseError,
	UploadError,
} from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import type { ServiceResponse } from "@backend/utils/services";
import { imageService } from "../image/images.service";
import { type FileInfo, ossService } from "../oss";
import type { GeneralFilesUploadDto } from "./uploads.model";

export class UploadService {
	/**
	 * 生成唯一文件名
	 */
	private generateUniqueName(originalName: string): string {
		const randomStr = Math.random().toString(36).substring(2, 8);
		const extension = originalName.split(".").pop() || "jpg";
		return `${originalName}_${randomStr}.${extension}`;
	}
	/**
	 * 批量上传文件
	 */
	async uploadFiles({
		files,
		folder,
	}: GeneralFilesUploadDto): Promise<ServiceResponse<FileInfo[]>> {
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
					const url = await ossService.uploadFile(buffer, key, file.type);

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
				throw new DatabaseError(`所有文件上传失败: ${errors.join(", ")}`);
			}

			// 如果有部分失败，记录警告但返回成功结果
			if (errors.length > 0) {
				console.warn(`部分文件上传失败: ${errors.join(", ")}`);
			}

			return commonRes(uploadResults);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}

			console.error("批量文件上传失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 批量上传图片
	 */
	async uploadImages({
		files,
		folder = "general",
	}: GeneralFilesUploadDto): Promise<ServiceResponse<any[]>> {
		try {
			const uploadPromises = files.map(async (file) => {
				try {
					const fileName = file.name;
					const url = await ossService.uploadImage(file, folder, fileName);

					// 创建图片记录
					const imageRecord = await imageService.createImage({
						fileName,
						url,
						fileSize: file.size,
						mimeType: file.type,
						category: folder,
						altText: fileName,
					});

					if (imageRecord.code !== 200 || !imageRecord.data) {
						throw new Error("创建图片记录失败");
					}

					return { success: true, imageData: imageRecord.data, error: null };
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
				if (result.success && result.imageData) {
					uploadResults.push(result.imageData);
				} else if (result.error) {
					errors.push(result.error);
				}
			});

			if (uploadResults.length === 0) {
				throw new DatabaseError(`所有图片上传失败: ${errors.join(", ")}`);
			}

			// 如果有部分失败，记录警告但返回成功结果
			if (errors.length > 0) {
				console.warn(`部分图片上传失败: ${errors.join(", ")}`);
			}

			return commonRes(uploadResults);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}

			console.error("批量图片上传失败:", error);
			throw handleDatabaseError(error);
		}
	}

	/**
	 * 删除文件
	 */
	async deleteFile(
		fileUrl: string,
	): Promise<ServiceResponse<{ success: boolean }>> {
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

			await ossService.deleteFile(key);

			return commonRes({ success: true });
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			console.error("文件删除失败:", error);
			throw new UploadError(
				error instanceof Error ? error.message : "文件删除失败",
			);
		}
	}

	/**
	 * 检查文件是否存在
	 */
	async fileExists(fileUrl: string): Promise<ServiceResponse<boolean>> {
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

			return commonRes(exists);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			console.error("检查文件存在性失败:", error);
			throw new UploadError(
				error instanceof Error ? error.message : "检查文件存在性失败",
			);
		}
	}

	/**
	 * 获取文件信息
	 */
	async getFileInfo(fileUrl: string): Promise<ServiceResponse<FileInfo>> {
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
			return commonRes(fileInfo);
		} catch (error) {
			if (error instanceof CustomeError) {
				throw error;
			}
			console.error("获取文件信息失败:", error);
			throw new UploadError(
				error instanceof Error ? error.message : "获取文件信息失败",
			);
		}
	}
}

// 导出服务实例
export const uploadService = new UploadService();
