import { z } from 'zod';

// 环境变量工具函数
export class EnvUtils {
  // 获取环境变量，带默认值
  static get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }

  // 获取数字类型环境变量
  static getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} is not a valid number`);
    }
    return num;
  }

  // 获取布尔类型环境变量
  static getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value.toLowerCase() === 'true';
  }

  // 获取数组类型环境变量（逗号分隔）
  static getArray(key: string, defaultValue: string[] = []): string[] {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
  }

  // 验证必需的环境变量
  static validateRequired(keys: string[]): void {
    const missing: string[] = [];
    
    for (const key of keys) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // 使用 Zod 验证环境变量
  static validateWithSchema<T>(schema: z.ZodSchema<T>, config: Record<string, any> = process.env): T {
    return schema.parse(config);
  }
}