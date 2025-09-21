/**
 * 华为云OSS服务模块
 * 使用AWS SDK S3 Client实现文件上传和管理
 */

import {
	DeleteObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { ValidationError } from "@backend/utils/error/customError";
import { IMAGE_MIME_TYPE_MAP } from "./oss.model";

// 创建华为云OSS客户端
const createOSSClient = () => {
	const accessKeyId = process.env.HUAWEI_ACCESS_KEY_ID || "";
	const secretAccessKey = process.env.HUAWEI_SECRET_ACCESS_KEY || "";
	const bucket = process.env.HUAWEI_BUCKET || "";
	const region = process.env.HUAWEI_REGION || "cn-north-4";
	const endpoint =
		process.env.HUAWEI_ENDPOINT || `https://obs.${region}.myhuaweicloud.com`;

	console.log("华为云OSS配置:", {
		accessKeyId,
		secretAccessKey,
		bucket,
		endpoint,
		region,
	});

	if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
		console.warn("华为云OSS配置不完整，将使用模拟模式");
		return null;
	}

	return new S3Client({
		region,
		endpoint,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
		forcePathStyle: false, // 华为云OBS需要使用虚拟主机样式
	});
};

// OSS服务类
export class OssService {
	private client: S3Client | null = null;
	private bucket: string;
	private initialized = false;

	constructor() {
		this.bucket = process.env.HUAWEI_BUCKET || "";
	}

	private initialize() {
		if (this.initialized) return;
		try {
			this.client = createOSSClient();
			this.initialized = true;
		} catch (error) {
			console.error("初始化华为云OSS客户端失败:", error);
			this.client = null;
			this.initialized = true;
		}
	}

	/**
	 * 生成唯一文件名
	 */
	private generateUniqueKey(originalName: string, folder?: string): string {
		// 生成较短的随机字符串
		const randomStr = Math.random().toString(36).substring(2, 8);
		const extension = originalName.split(".").pop() || "jpg";
		// 使用较短的文件名格式
		const shortName = originalName.split(".")[0].substring(0, 20); // 限制原始文件名长度
		return `${folder || "uploads"}/${shortName}_${randomStr}.${extension}`;
	}

	/**
	 * 上传文件到OSS（不进行唯一性处理）
	 * @param file 文件内容
	 * @param key 文件在OSS中的路径（已确保唯一性）
	 * @param contentType 文件类型
	 * @returns 上传后的文件URL
	 */
	async uploadFileDirect(
		file: Buffer | Uint8Array | string | Blob,
		key: string,
		contentType?: string,
	): Promise<string> {
		this.initialize();

		if (!this.client) {
			console.warn("OSS客户端未初始化成功");
			throw new ValidationError("OSS客户端未初始化成功,环境变量有问题");
		}

		try {
			let body: Buffer | Uint8Array;
			if (file instanceof Blob) {
				body = new Uint8Array(await file.arrayBuffer());
			} else if (typeof file === "string") {
				body = Buffer.from(file);
			} else {
				body = file;
			}

			const command = new PutObjectCommand({
				Bucket: this.bucket,
				Key: key, // 直接使用传入的key，不进行唯一性处理
				Body: body,
				ContentType: contentType || "application/octet-stream",
			});

			const res = await this.client.send(command);

			// 上传成功，处理返回结果
			console.log("文件上传成功:", {
				key,
				etag: res.ETag,
				size: res.Size,
				versionId: res.VersionId,
				serverSideEncryption: res.ServerSideEncryption,
			});

			// 生成公共访问URL
			const publicUrl = this.getPublicUrl(key);
			console.log("生成的公共URL:", publicUrl);

			return publicUrl;
		} catch (error) {
			throw new Error(
				`文件上传失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	/**
	 * 上传图片文件
	 * @param imageFile 图片文件
	 * @param folder 存储文件夹
	 * @param filename 文件名
	 * @returns 图片的公共访问URL
	 */
	async uploadImage(
		imageFile: Buffer | Uint8Array | Blob,
		folder: string,
		filename: string,
	): Promise<string> {
		// 生成唯一的key
		const key = this.generateUniqueKey(filename, folder);

		// 获取文件扩展名对应的MIME类型
		const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
		const contentType = IMAGE_MIME_TYPE_MAP[extension] || "image/jpeg";

		// 直接上传，不进行二次唯一性处理
		return this.uploadFileDirect(imageFile, key, contentType);
	}

	/**
	 * 删除文件
	 * @param key 文件在OSS中的路径
	 */
	async deleteFile(key: string): Promise<void> {
		this.initialize();

		if (!this.client) {
			console.warn("OSS客户端未初始化，跳过删除操作");
			return;
		}

		try {
			const command = new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			});
			await this.client.send(command);
		} catch (error) {
			// 如果是存储桶不存在或配置错误，切换到模拟模式
			if (
				error instanceof Error &&
				(error.message.includes("NoSuchBucket") ||
					error.name === "NoSuchBucket" ||
					error.message.includes("VirtualHostDomainRequired") ||
					error.name === "VirtualHostDomainRequired")
			) {
				console.warn("OSS配置错误或存储桶不存在，切换到模拟模式");
				this.client = null; // 禁用客户端，后续请求将使用模拟模式
				return;
			}
			console.error("文件删除失败:", error);
			throw new Error(
				`文件删除失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	/**
	 * 检查文件是否存在
	 * @param key 文件在OSS中的路径
	 * @returns 文件是否存在
	 */
	async fileExists(key: string): Promise<boolean> {
		this.initialize();

		if (!this.client) {
			console.warn("OSS客户端未初始化，返回false");
			return false;
		}

		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: key,
			});
			await this.client.send(command);
			return true;
		} catch (error) {
			// 如果是存储桶不存在或配置错误，切换到模拟模式
			if (
				error instanceof Error &&
				(error.message.includes("NoSuchBucket") ||
					error.name === "NoSuchBucket" ||
					error.message.includes("VirtualHostDomainRequired") ||
					error.name === "VirtualHostDomainRequired")
			) {
				console.warn("OSS配置错误或存储桶不存在，切换到模拟模式");
				this.client = null; // 禁用客户端，后续请求将使用模拟模式
				return false;
			}
			console.error("检查文件存在性失败:", error);
			return false;
		}
	}

	/**
	 * 获取文件的公共访问URL
	 * @param key 文件在OSS中的路径
	 * @returns 公共访问URL
	 */
	getPublicUrl(key: string): string {
		const domain = process.env.HUAWEI_DOMAIN || "";
		return `${domain}/${key}`;
	}

	/**
	 * 获取文件信息
	 * @param key 文件在OSS中的路径
	 * @returns 文件统计信息
	 */
	async getFileStats(key: string) {
		this.initialize();

		if (!this.client) {
			console.warn("OSS客户端未初始化，返回模拟文件信息");
			return {
				size: 0,
				updatedAt: new Date(),
			};
		}

		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: key,
			});
			const response = await this.client.send(command);

			return {
				size: response.ContentLength || 0,
				updatedAt: response.LastModified || new Date(),
			};
		} catch (error) {
			console.log(error);
			return {
				size: 0,
				updatedAt: new Date(),
			};
		}
	}

	/**
	 * 批量删除文件
	 * @param keys 文件路径数组
	 */
	async deleteFiles(keys: string[]): Promise<void> {
		for (const key of keys) {
			await this.deleteFile(key);
		}
	}

	/**
	 * 列出文件
	 * @param prefix 文件前缀
	 * @param maxKeys 最大返回数量
	 */
	async listFiles(
		prefix?: string,
		maxKeys: number = 100,
	): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
		// 模拟返回文件列表
		return [];
	}
}

export const ossService = new OssService();
