
export interface EnvConfig {
  // 数据库配置
  DATABASE_URL: string;
  REDIS_URL: string;
  
  // JWT 配置
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // 应用配置
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  FRONTEND_URL: string;
  
  // 支付配置
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  
  // 邮件配置
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  
  // 文件上传配置
  UPLOAD_MAX_SIZE: number;
  ALLOWED_FILE_TYPES: string;
  
  // 第三方服务配置
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

// 环境变量验证函数
export function validateEnv(config: Partial<EnvConfig>): config is EnvConfig {
  const required: (keyof EnvConfig)[] = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL'
  ];
  
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  return true;
}