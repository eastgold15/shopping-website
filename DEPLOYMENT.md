# 🚀 部署指南

本项目支持前后端分离的自动化部署，使用GitHub Actions进行CI/CD和基于Caddy的简化部署方案。

### 🎯 部署方案选择

1. **GitHub Actions自动部署** - 推荐用于生产环境
2. **Caddy简化部署** - 推荐用于开发/测试环境，部署流程更简单

## 📋 目录结构

```
.github/workflows/
├── ci-cd.yml              # 主要的CI/CD流水线
├── deploy-frontend.yml    # 前端独立部署
└── deploy-backend.yml     # 后端独立部署
```

## 🔧 GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

### 🖥️ 服务器连接配置

| 密钥名称 | 描述 | 示例值 |
|---------|------|--------|
| `SERVER_HOST` | 服务器IP地址 | `192.168.1.100` |
| `SERVER_USERNAME` | SSH用户名 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH端口（可选，默认22） | `22` |

### 🐳 Docker镜像仓库配置

| 密钥名称 | 描述 | 示例值 |
|---------|------|--------|
| `ALIYUN_REGISTRY_USERNAME` | 阿里云容器镜像服务用户名 | `your-username` |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云容器镜像服务密码 | `your-password` |

### 🌐 应用配置

| 密钥名称 | 描述 | 示例值 |
|---------|------|--------|
| `FRONTEND_URL` | 前端访问地址 | `https://your-domain.com` |
| `BACKEND_URL` | 后端API地址 | `https://api.your-domain.com` |
| `VITE_API_URL` | 前端构建时的API地址 | `https://api.your-domain.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公钥（可选） | `pk_live_...` |

## 🖥️ 服务器环境准备

### 方案一：GitHub Actions自动部署

#### Linux服务器
```bash
# 运行自动化设置脚本
bash scripts/setup-server.sh
```

#### Windows服务器
```powershell
# 以管理员身份运行
PowerShell -ExecutionPolicy Bypass -File scripts/setup-server.ps1
```

### 方案二：Caddy简化部署

#### 环境要求
- Docker 和 Docker Compose
- Node.js 18+ (前端构建)
- pnpm (前端包管理)
- Bun (后端运行时)

#### 快速开始
```bash
# Linux/macOS
bash scripts/deploy-with-caddy.sh all

# Windows PowerShell
PowerShell -ExecutionPolicy Bypass -File scripts/deploy-with-caddy.ps1 all
```

#### 分别部署
```bash
# 仅部署前端
bash scripts/deploy-with-caddy.sh frontend

# 仅部署后端
bash scripts/deploy-with-caddy.sh backend
```

### 1. 安装必要软件（手动安装）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo apt install docker-compose-plugin -y

# 安装Nginx（前端部署）
sudo apt install nginx -y
```

### 2. 创建项目目录

```bash
# 后端项目目录
sudo mkdir -p /path/to/your/project/backend
sudo chown $USER:$USER /path/to/your/project/backend

# 前端部署目录
sudo mkdir -p /var/www/shopping-frontend
sudo chown www-data:www-data /var/www/shopping-frontend
```

### 3. 配置Nginx（前端）

创建 `/etc/nginx/sites-available/shopping-frontend`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/shopping-frontend;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 处理Vue Router的history模式
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理（可选）
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/shopping-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 后端项目配置

将后端项目的 `.container` 目录上传到服务器：

```bash
# 在服务器上
cd /path/to/your/project/backend

# 复制配置文件
cp .container/prod/.env.production .env.production

# 编辑环境变量
nano .env.production
```

## 🚀 部署流程

### 自动部署

1. **推送代码到 main 分支**：自动触发完整的 CI/CD 流程
2. **创建 Pull Request**：只运行测试，不部署
3. **推送到 develop 分支**：运行测试，不部署

### 手动部署

可以在 GitHub Actions 页面手动触发特定的工作流：

- `ci-cd.yml`：完整的CI/CD流程
- `deploy-frontend.yml`：仅部署前端
- `deploy-backend.yml`：仅部署后端

## 📊 监控和日志

### 查看部署状态

```bash
# 查看后端容器状态
docker-compose -f .container/prod/docker-compose.prod.yml ps

# 查看后端日志
docker-compose -f .container/prod/docker-compose.prod.yml logs -f

# 查看Nginx状态
sudo systemctl status nginx

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 健康检查

```bash
# 前端健康检查
curl -I https://your-domain.com

# 后端健康检查
curl -I https://api.your-domain.com/health
```

## 🔧 故障排除

### 常见问题

1. **Docker镜像拉取失败**
   - 检查阿里云镜像仓库凭据
   - 确认镜像名称和标签正确

2. **前端部署失败**
   - 检查Nginx配置
   - 确认目录权限正确
   - 查看Nginx错误日志

3. **后端启动失败**
   - 检查环境变量配置
   - 查看Docker容器日志
   - 确认数据库连接

4. **SSH连接失败**
   - 检查服务器IP和端口
   - 确认SSH密钥格式正确
   - 检查服务器防火墙设置

### 回滚操作

```bash
# 前端回滚
cd /var/www
sudo rm -rf shopping-frontend
sudo mv shopping-frontend-backup-YYYYMMDD-HHMMSS shopping-frontend
sudo systemctl reload nginx

# 后端回滚
cd /path/to/your/project/backend
docker-compose -f .container/prod/docker-compose.prod.yml down
# 修改 IMAGE_TAG 为之前的版本
export IMAGE_TAG=previous-sha
docker-compose -f .container/prod/docker-compose.prod.yml up -d
```

## 🔒 安全建议

1. **使用HTTPS**：配置SSL证书（推荐使用Let's Encrypt）
2. **防火墙配置**：只开放必要的端口
3. **定期更新**：保持系统和Docker镜像更新
4. **备份策略**：定期备份数据库和重要文件
5. **监控告警**：设置服务监控和告警机制

## 📝 环境变量说明

### GitHub Actions部署配置

#### GitHub Secrets 配置

在GitHub仓库的Settings > Secrets and variables > Actions中添加以下secrets：

##### 服务器连接
- `SSH_HOST`: 服务器IP地址
- `SSH_USERNAME`: SSH用户名
- `SSH_PRIVATE_KEY`: SSH私钥
- `SERVER_PORT`: SSH端口（默认22）

##### 部署路径（可选）
- `FRONTEND_DEPLOY_PATH`: 前端部署路径（默认：/1/MechanicEndWorld2/front）
- `BACKEND_DEPLOY_PATH`: 后端部署路径（默认：~/shopping-backend）

##### 阿里云容器镜像服务
- `ALIYUN_REGISTRY_USERNAME`: 阿里云容器镜像服务用户名
- `ALIYUN_REGISTRY_PASSWORD`: 阿里云容器镜像服务密码
- `ALIYUN_REGISTRY`: 阿里云容器镜像服务地址

##### 应用配置
- `APP_PORT`: 后端应用端口（默认3001）
- `DATABASE_URL`: 数据库连接字符串
- `JWT_SECRET`: JWT密钥

##### 前端环境变量
- `VITE_API_BASE_URL`: API基础URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe公钥（如果使用）

### Caddy简化部署配置

#### 环境变量（可选）
```bash
# 服务器配置
export SERVER_HOST="your-server-ip"          # 默认：localhost
export REMOTE_USER="your-username"           # 默认：当前用户

# 部署路径
export FRONTEND_DEPLOY_PATH="/path/to/frontend"  # 默认：/1/MechanicEndWorld2/front
export BACKEND_DEPLOY_PATH="/path/to/backend"    # 默认：~/shopping-backend
```

#### Caddy配置文件

项目已包含预配置的Caddyfile (`apps/backend/.container/prod/Caddyfile`)，主要配置：

- **主域名**: `wx.cykycyky.top` - 后端API反向代理
- **前端服务**: 端口 `9010` - 静态文件服务
- **资源服务**: `assets.cykycyky.top` - 静态资源服务
- **本地开发**: `localhost` - 开发环境

##### 自定义域名

修改 `apps/backend/.container/prod/Caddyfile`：
```caddyfile
# 替换为您的域名
your-domain.com {
    reverse_proxy app:{env.APP_PORT}
    # ... 其他配置
}
```

### 后端环境变量 (.env.production)

```bash
# 应用配置
APP_PORT=3001
NODE_ENV=production

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/shopping

# JWT配置
JWT_SECRET=your-jwt-secret

# AWS S3配置（如果使用）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 前端环境变量

```bash
# API配置
VITE_API_URL=https://api.your-domain.com

# 第三方服务
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

📚 **更多信息**：
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 文档](https://docs.docker.com/)
- [Nginx 文档](https://nginx.org/en/docs/)