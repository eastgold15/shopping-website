# 容器化配置目录

本目录包含了项目的开发和生产环境配置文件，便于环境管理和项目复用。

## 目录结构

```
.container/
├── dev/                    # 开发环境配置
│   ├── .env.development   # 开发环境变量
│   ├── docker-compose.yml # 开发环境Docker配置
│   └── drizzle-dev.config.ts # 开发环境Drizzle配置
└── prod/                   # 生产环境配置
    ├── .env.production    # 生产环境变量
    ├── docker-compose.prod.yml # 生产环境Docker配置
    ├── drizzle-prod.config.ts # 生产环境Drizzle配置
    ├── Dockerfile         # Docker镜像构建文件
    └── Caddyfile         # Caddy反向代理配置
```

## 使用方法

### 开发环境

1. **启动开发数据库**:
   ```bash
   bun run docker
   ```
   这会使用 `.container/dev/docker-compose.yml` 启动PostgreSQL数据库。

2. **数据库操作**:
   ```bash
   # 生成迁移文件
   bun run dev:generate
   
   # 推送schema到数据库
   bun run dev:push
   
   # 启动Drizzle Studio
   bun run db:studio
   ```

### 生产环境

1. **数据库操作**:
   ```bash
   # 生成生产环境迁移文件
   bun run prod:generate
   
   # 推送schema到生产数据库
   bun run prod:push
   ```

2. **Docker部署**:
   ```bash
   # 使用生产环境配置启动服务
   docker-compose -f .container/prod/docker-compose.prod.yml up -d
   ```

## 环境变量说明

### 开发环境 (.container/dev/.env.development)
- 本地开发数据库配置
- 调试模式开启
- 本地端口配置

### 生产环境 (.container/prod/.env.production)
- 生产数据库配置
- 性能优化设置
- 安全配置

## 配置文件说明

### Drizzle配置
- `drizzle-dev.config.ts`: 开发环境数据库配置
- `drizzle-prod.config.ts`: 生产环境数据库配置

### Docker配置
- `docker-compose.yml`: 开发环境容器配置
- `docker-compose.prod.yml`: 生产环境容器配置
- `Dockerfile`: 应用镜像构建配置

### 反向代理
- `Caddyfile`: Caddy反向代理和HTTPS配置

## 项目复用

当创建新项目时，可以直接复制整个 `.container` 目录，然后根据新项目需求修改配置文件中的具体参数，如：
- 数据库名称和连接信息
- 端口配置
- 域名配置
- 应用名称等

这样可以快速搭建新项目的开发和生产环境。