import { config } from 'dotenv';
import { resolve } from 'path';

export class EnvLoader {
  /**
   * 加载环境变量
   * @param envFile 环境变量文件路径
   * @param root 项目根目录
   */
  static load(envFile: string = '.env', root: string = process.cwd()): void {
    const envPath = resolve(root, envFile);
    config({ path: envPath });
  }

  /**
   * 根据环境加载不同的环境变量文件
   * @param env 环境名称 (development/production/test)
   * @param root 项目根目录
   */
  static loadByEnv(env: string = process.env.NODE_ENV || 'development', root: string = process.cwd()): void {
    const envFiles = [
      `.env.${env}.local`,
      `.env.${env}`,
      '.env.local',
      '.env'
    ];

    for (const file of envFiles) {
      const envPath = resolve(root, file);
      try {
        config({ path: envPath });
        break;
      } catch (error) {
        // 文件不存在，继续尝试下一个
      }
    }
  }

  /**
   * 验证必需的环境变量
   * @param requiredVars 必需的环境变量列表
   */
  static validate(requiredVars: string[]): void {
    const missing: string[] = [];
    
    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        missing.push(variable);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}