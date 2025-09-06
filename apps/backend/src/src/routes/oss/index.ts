/**
 * 华为云OSS服务模块
 * 使用AWS SDK S3 Client实现文件上传和管理
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { envConfig } from "../../config/env.ts";

// 创建华为云OSS客户端
const createOSSClient = () => {
  const accessKeyId = envConfig.get('HUAWEI_ACCESS_KEY_ID') || "";
  const secretAccessKey = envConfig.get('HUAWEI_SECRET_ACCESS_KEY') || "";
  const bucket = envConfig.get('HUAWEI_BUCKET') || "";

  const endpoint = envConfig.get('HUAWEI_ENDPOINT') || `https://obs.${region}.myhuaweicloud.com`;
  const region = envConfig.get('HUAWEI_REGION') || "cn-north-4";

  console.log("华为云OSS配置:", { accessKeyId, secretAccessKey, bucket, endpoint, region });


  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    console.warn("华为云OSS配置不完整，将使用模拟模式");
    return null;
  }

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: false // 华为云OBS需要使用虚拟主机样式
  });
};

// OSS服务类
export class HuaweiOSSService {
  private client: S3Client | null = null;
  private bucket: string;
  private initialized = false;

  constructor() {
    this.bucket = envConfig.get('HUAWEI_BUCKET') || "";
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
   * 上传文件到OSS
   * @param file 文件内容
   * @param key 文件在OSS中的路径
   * @param contentType 文件类型
   * @returns 上传后的文件URL
   */
  async uploadFile(
    file: Buffer | Uint8Array | string | Blob,
    key: string,
    contentType?: string
  ): Promise<string> {
    this.initialize();

    if (!this.client) {
      console.warn('OSS客户端未初始化，返回模拟URL');
      return `/uploads/${key}`;
    }

    try {
      let body: Buffer | Uint8Array;
      if (file instanceof Blob) {
        body = new Uint8Array(await file.arrayBuffer());
      } else if (typeof file === 'string') {
        body = Buffer.from(file);
      } else {
        body = file;
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream"
      });

      await this.client.send(command);
      return this.getPublicUrl(key);
    } catch (error) {
      // 如果是存储桶不存在或配置错误，切换到模拟模式
      if (error instanceof Error && (
        error.message.includes('NoSuchBucket') || error.name === 'NoSuchBucket' ||
        error.message.includes('VirtualHostDomainRequired') || error.name === 'VirtualHostDomainRequired'
      )) {
        console.warn('OSS配置错误或存储桶不存在，切换到模拟模式');
        this.client = null; // 禁用客户端，后续请求将使用模拟模式
        return `/uploads/${key}`;
      }
      console.error("文件上传失败:", error);
      throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 上传图片文件
   * @param imageFile 图片文件
   * @param folder 存储文件夹
   * @param filename 可选的文件名
   * @returns 图片的公共访问URL
   */
  async uploadImage(
    imageFile: Buffer | Uint8Array | Blob,
    folder: string,
    filename?: string
  ): Promise<string> {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = filename ? filename.split('.').pop() : 'jpg';
    const key = `${folder}/${timestamp}_${randomStr}.${extension}`;

    let contentType = 'image/jpeg';
    if (extension) {
      const typeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      contentType = typeMap[extension.toLowerCase()] || 'image/jpeg';
    }

    return this.uploadFile(imageFile, key, contentType);
  }

  /**
   * 删除文件
   * @param key 文件在OSS中的路径
   */
  async deleteFile(key: string): Promise<void> {
    this.initialize();

    if (!this.client) {
      console.warn('OSS客户端未初始化，跳过删除操作');
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.client.send(command);
    } catch (error) {
      // 如果是存储桶不存在或配置错误，切换到模拟模式
      if (error instanceof Error && (
        error.message.includes('NoSuchBucket') || error.name === 'NoSuchBucket' ||
        error.message.includes('VirtualHostDomainRequired') || error.name === 'VirtualHostDomainRequired'
      )) {
        console.warn('OSS配置错误或存储桶不存在，切换到模拟模式');
        this.client = null; // 禁用客户端，后续请求将使用模拟模式
        return;
      }
      console.error("文件删除失败:", error);
      throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      console.warn('OSS客户端未初始化，返回false');
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      // 如果是存储桶不存在或配置错误，切换到模拟模式
      if (error instanceof Error && (
        error.message.includes('NoSuchBucket') || error.name === 'NoSuchBucket' ||
        error.message.includes('VirtualHostDomainRequired') || error.name === 'VirtualHostDomainRequired'
      )) {
        console.warn('OSS配置错误或存储桶不存在，切换到模拟模式');
        this.client = null; // 禁用客户端，后续请求将使用模拟模式
        return false;
      }
      console.error("检查文件存在性失败:", error);
      return false;
    }
  }

  /**
   * 生成预签名URL用于直接上传
   * @param key 文件在OSS中的路径
   * @param expiresIn 过期时间(秒)
   * @param contentType 文件类型
   * @returns 预签名URL
   */
  async generatePresignedUploadUrl(
    key: string,
    expiresIn: number = 3600,
    contentType?: string
  ): Promise<string> {
    this.initialize();

    if (!this.client) {
      console.warn('OSS客户端未初始化，返回模拟URL');
      return `/uploads/${key}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType || "application/octet-stream"
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("生成预签名上传URL失败:", error);
      return `/uploads/${key}`;
    }
  }

  /**
   * 生成预签名下载URL
   * @param key 文件在OSS中的路径
   * @param expiresIn 过期时间(秒)
   * @returns 预签名下载URL
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    this.initialize();

    if (!this.client) {
      console.warn('OSS客户端未初始化，返回公共URL');
      return this.getPublicUrl(key);
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("生成预签名下载URL失败:", error);
      return this.getPublicUrl(key);
    }
  }

  /**
   * 获取文件的公共访问URL
   * @param key 文件在OSS中的路径
   * @returns 公共访问URL
   */
  getPublicUrl(key: string): string {
    const endpoint = envConfig.get('HUAWEI_ENDPOINT') || "";


    // 域名
    const domain = envConfig.get('HUAWEI_DOMAIN') || "";
    const bucket = envConfig.get('HUAWEI_BUCKET') || "";


    console.log(111, domain, key, endpoint)
    // 如果OSS客户端未初始化或者endpoint是自定义域名，直接返回自定义域名的URL
    if (!this.client || endpoint.includes('myhuaweicloud.com')) {
      console.log(111, domain, key)
      return `${domain}/${key}`;
    }

    return `${endpoint}/${bucket}/${key}`;
  }

  /**
   * 获取文件信息
   * @param key 文件在OSS中的路径
   * @returns 文件统计信息
   */
  async getFileStats(key: string) {
    this.initialize();

    if (!this.client) {
      console.warn('OSS客户端未初始化，返回模拟文件信息');
      return {
        size: 0,
        lastModified: new Date(),
        etag: 'mock-etag'
      };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || 'unknown'
      };
    } catch (error) {
      console.warn("获取文件信息失败，返回模拟数据:", error.message || error);
      return {
        size: 0,
        lastModified: new Date(),
        etag: 'mock-etag'
      };
    }
  }
}

// 导出单例实例
export const ossService = new HuaweiOSSService();

// 导出便捷方法
export const uploadImage = ossService.uploadImage.bind(ossService);
export const uploadFile = ossService.uploadFile.bind(ossService);
export const deleteFile = ossService.deleteFile.bind(ossService);
export const fileExists = ossService.fileExists.bind(ossService);
export const getPublicUrl = ossService.getPublicUrl.bind(ossService);

export default ossService;