// 文件上传管理服务

import { ossService } from '../oss';
import { ServiceResponse } from '../services/types';
import { commonRes } from '../Res';
import { ValidationError, DatabaseError, UploadError, CustomeError, handleDatabaseError } from '../error/customError';

// 导入模型类型和常量
import type {
  FileInfo
} from './model';
import { MAX_FILE_SIZE, SUPPORTED_IMAGE_TYPES, UPLOAD_TYPE } from './model';

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
  generateUniqueName?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class UploadService {
  private readonly defaultAllowedTypes = SUPPORTED_IMAGE_TYPES;
  private readonly defaultMaxSize = MAX_FILE_SIZE;

  /**
   * 验证文件
   */
  private validateFile(file: any, options: UploadOptions = {}): FileValidationResult {
    const allowedTypes = options.allowedTypes || this.defaultAllowedTypes;
    const maxSize = options.maxSize || this.defaultMaxSize;

    // 验证文件类型
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件类型 ${file.type}，请上传 ${allowedTypes.join(', ')} 格式的文件`
      };
    }

    // 验证文件大小
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        isValid: false,
        error: `文件大小不能超过 ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * 生成唯一文件名
   */
  private generateUniqueName(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${randomStr}.${extension}`;
  }

  /**
   * 上传单个文件
   */
  async uploadFile(
    file: any, 
    folder: string = 'general',
    options: UploadOptions = {}
  ): Promise<ServiceResponse<FileInfo>> {
    try {
      // 验证文件
      const validation = this.validateFile(file, options);
      if (!validation.isValid) {
        throw new ValidationError(validation.error!);
      }

      // 生成文件名
      const fileName = options.generateUniqueName !== false 
        ? this.generateUniqueName(file.name) 
        : file.name;

      // 读取文件内容
      const fileBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(fileBuffer);

      // 上传到OSS
      const url = await ossService.uploadImage(buffer, folder, fileName);

      const fileInfo: FileInfo = {
        url,
        fileName,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      return commonRes(fileInfo);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      
      console.error('文件上传失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: any[], 
    folder: string = 'general',
    options: UploadOptions = {}
  ): Promise<ServiceResponse<FileInfo[]>> {
    try {
      if (!files || files.length === 0) {
        throw new ValidationError('没有上传文件');
      }

      const uploadResults: FileInfo[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // 验证文件
          const validation = this.validateFile(file, options);
          if (!validation.isValid) {
            errors.push(`文件 ${file.name}: ${validation.error}`);
            continue;
          }

          // 生成文件名
          const fileName = options.generateUniqueName !== false 
            ? this.generateUniqueName(file.name) 
            : file.name;

          // 读取文件内容
          const fileBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(fileBuffer);

          // 上传到OSS
          const url = await ossService.uploadImage(buffer, folder, fileName);

          const fileInfo: FileInfo = {
            url,
            fileName,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          };

          uploadResults.push(fileInfo);
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
          errors.push(`文件 ${file.name}: ${error instanceof Error ? error.message : '上传失败'}`);
        }
      }

      if (uploadResults.length === 0) {
        throw new DatabaseError(`所有文件上传失败: ${errors.join(', ')}`);
      }

      // 如果有部分失败，记录警告但返回成功结果
      if (errors.length > 0) {
        console.warn(`部分文件上传失败: ${errors.join(', ')}`);
      }

      return commonRes(uploadResults);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      
      console.error('批量文件上传失败:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * 上传广告图片
   */
  async uploadAdvertisement(file: any): Promise<ServiceResponse<FileInfo>> {
    return this.uploadFile(file, UPLOAD_TYPE.ADVERTISEMENT, {
      allowedTypes: SUPPORTED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE
    });
  }

  /**
   * 上传商品图片（支持批量）
   */
  async uploadProductImages(files: any): Promise<ServiceResponse<FileInfo[]>> {
    const fileArray = Array.isArray(files) ? files : [files];
    return this.uploadFiles(fileArray, UPLOAD_TYPE.PRODUCT, {
      allowedTypes: SUPPORTED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE
    });
  }

  /**
   * 上传分类图片
   */
  async uploadCategoryImage(file: any): Promise<ServiceResponse<FileInfo>> {
    return this.uploadFile(file, UPLOAD_TYPE.CATEGORY, {
      allowedTypes: SUPPORTED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE
    });
  }

  /**
   * 通用文件上传
   */
  async uploadGeneralFile(file: any, folder?: string): Promise<ServiceResponse<FileInfo>> {
    return this.uploadFile(file, folder || UPLOAD_TYPE.GENERAL, {
      allowedTypes: SUPPORTED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(fileUrl: string): Promise<ServiceResponse<{ success: boolean }>> {
    try {
      // 从URL中提取文件key
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      
      // 移除开头的斜杠
      let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      
      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== 'obs.cn-north-4.myhuaweicloud.com') {
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
      console.error('文件删除失败:', error);
      throw new UploadError(
        error instanceof Error ? error.message : '文件删除失败'
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
      
      let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      
      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== 'obs.cn-north-4.myhuaweicloud.com') {
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
      console.error('检查文件存在性失败:', error);
      throw new UploadError(
        error instanceof Error ? error.message : '检查文件存在性失败'
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
      
      let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      
      // 如果是自定义域名，需要进一步处理
      if (url.hostname !== 'obs.cn-north-4.myhuaweicloud.com') {
        const match = pathname.match(/\/uploads\/(.+)/);
        if (match) {
          key = `uploads/${match[1]}`;
        }
      }

      const stats = await ossService.getFileStats(key);
      
      const fileInfo: FileInfo = {
        url: fileUrl,
        fileName: key.split('/').pop() || 'unknown',
        size: stats.size,
        type: 'unknown', // OSS不直接返回文件类型
        uploadedAt: stats.lastModified.toISOString()
      };

      return commonRes(fileInfo);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }
      console.error('获取文件信息失败:', error);
      throw new UploadError(
        error instanceof Error ? error.message : '获取文件信息失败'
      );
    }
  }
}

// 导出服务实例
export const uploadService = new UploadService();