import { config } from 'dotenv';
import { z } from 'zod';

// 加载环境变量
config({ path: '.env' });

// 环境变量验证 schema
const envSchema = z.object({
  // 数据库配置
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  
  // JWT 配置
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),
  
  // 应用配置
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().min(1).max(65535),
  FRONTEND_URL: z.string().url(),
  
  // 支付配置
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  
  // 邮件配置
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().min(1).max(65535),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  
  // 文件上传配置
  UPLOAD_MAX_SIZE: z.coerce.number().min(1),
  ALLOWED_FILE_TYPES: z.string().min(1),
  
  // 第三方服务配置
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

// 解析和验证环境变量
export const env = envSchema.parse(process.env);

// 导出类型
export type Env = z.infer<typeof envSchema>;