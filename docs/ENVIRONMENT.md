# 环境变量配置

## 环境变量文件优先级

环境变量按照以下优先级加载（优先级从高到低）：

1. `.env.{NODE_ENV}.local`
2. `.env.{NODE_ENV}`
3. `.env.local`
4. `.env`

## 基础环境变量

### 应用配置
- `NODE_ENV`: 运行环境 (development/production/test)
- `PORT`: 后端服务端口 (默认: 3001)
- `FRONTEND_URL`: 前端应用 URL
- `FRONTEND_PORT`: 前端开发服务器端口 (默认: 3000)

### 数据库配置
- `DATABASE_URL`: 数据库连接字符串
- `REDIS_URL`: Redis 连接字符串

### 安全配置
- `JWT_SECRET`: JWT 密钥 (生产环境必须更改)
- `JWT_EXPIRES_IN`: JWT 过期时间 (默认: 7d)

### 支付配置
- `STRIPE_SECRET_KEY`: Stripe 密钥
- `STRIPE_PUBLISHABLE_KEY`: Stripe 公钥

### 邮件配置
- `SMTP_HOST`: SMTP 服务器地址
- `SMTP_PORT`: SMTP 端口
- `SMTP_USER`: SMTP 用户名
- `SMTP_PASS`: SMTP 密码

### 文件上传配置
- `UPLOAD_MAX_SIZE`: 最大上传文件大小 (字节)
- `ALLOWED_FILE_TYPES`: 允许的文件类型 (逗号分隔)

### 第三方服务配置
- `GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 客户端密钥

## 前端环境变量

前端应用使用 `VITE_` 前缀的环境变量：

- `VITE_API_URL`: API 基础 URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe 公钥
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID
- `VITE_APP_VERSION`: 应用版本

## 使用示例

### 后端使用
```typescript
import { env } from '@shopping/core';

// 直接使用验证过的环境变量
const dbUrl = env.DATABASE_URL;
const jwtSecret = env.JWT_SECRET;
```

### 前端使用
```typescript
import { frontendEnv } from './env';

// 使用前端环境变量
const apiUrl = frontendEnv.VITE_API_URL;
const stripeKey = frontendEnv.VITE_STRIPE_PUBLISHABLE_KEY;
```

### 工具函数使用
```typescript
import { EnvUtils } from '@shopping/utils';

// 获取环境变量（带默认值）
const port = EnvUtils.getNumber('PORT', 3000);

// 验证必需的环境变量
EnvUtils.validateRequired(['DATABASE_URL', 'JWT_SECRET']);
```

## 安全注意事项

1. **永远不要将 `.env.local` 文件提交到版本控制**
2. **生产环境的密钥必须使用强密码**
3. **定期轮换密钥和令牌**
4. **使用环境特定的配置文件**
5. **前端只暴露必要的公开配置**