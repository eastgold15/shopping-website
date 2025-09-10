# 购物网站部署文档

本文档详细说明了如何将购物网站部署到生产环境。

## 目录

- [系统要求](#系统要求)
- [部署准备](#部署准备)
- [本地构建](#本地构建)
- [Docker部署](#docker部署)
- [阿里云部署](#阿里云部署)
- [环境变量配置](#环境变量配置)
- [SSL证书配置](#ssl证书配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 系统要求

### 开发环境
- Node.js 18+ 或 Bun 1.0+
- Docker 20.10+
- Git

### 生产服务器
- Linux 服务器 (Ubuntu 20.04+ 推荐)
- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB RAM
- 至少 20GB 存储空间
- 公网 IP 和域名

## 部署准备

### 1. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建应用目录
sudo mkdir -p /opt/shopping-website
sudo chown $USER:$USER /opt/shopping-website
```

### 2. 域名和DNS配置

将您的域名 A 记录指向服务器 IP 地址：

```
A    @              your-server-ip
A    www            your-server-ip
```

### 3. 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 本地构建

### 使用自动化脚本

```bash
# Linux/macOS
./deploy.sh build

# Windows PowerShell
.\deploy.ps1 -Action build
```

### 手动构建

```bash
# 1. 构建前端
cd apps/frontend
bun install
bun run build
cd ../..

# 2. 构建后端
cd apps/backend
bun install
bun build --target node
cd ../..

# 3. 构建 Docker 镜像
docker build -f Dockerfile.simple -t shopping-website:latest .
```

## Docker部署

### 方式一：使用 docker-compose (推荐)

1. 上传 `docker-compose.yml` 到服务器
2. 配置环境变量文件 `.env`
3. 启动服务

```bash
# 在服务器上
cd /opt/shopping-website

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：直接运行容器

```bash
# 拉取镜像
docker pull your-registry/shopping-website:latest

# 运行容器
docker run -d \
  --name shopping-website \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /opt/shopping-website/data:/app/data \
  -v /opt/shopping-website/uploads:/app/uploads \
  -v /opt/shopping-website/certs:/app/certs \
  --env-file .env \
  your-registry/shopping-website:latest
```

## 阿里云部署

### 1. 配置阿里云容器镜像服务

1. 登录阿里云控制台
2. 开通容器镜像服务
3. 创建命名空间和镜像仓库
4. 获取访问凭证

### 2. 推送镜像到阿里云

```bash
# 登录阿里云镜像仓库
docker login --username=your-username registry.cn-hangzhou.aliyuncs.com

# 标记镜像
docker tag shopping-website:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/shopping-website:latest

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/shopping-website:latest
```

### 3. 使用自动化脚本部署

```bash
# 修改脚本中的配置
# 编辑 deploy.sh 或 deploy.ps1
# 设置正确的 REGISTRY、NAMESPACE、REMOTE_HOST 等

# 执行完整部署
./deploy.sh full
# 或
.\deploy.ps1 -Action full
```

## 环境变量配置

### 1. 复制模板文件

```bash
cp .env.template .env
```

### 2. 修改关键配置

```bash
# 应用配置
NODE_ENV=production
APP_DOMAIN=your-domain.com
APP_BASE_URL=https://your-domain.com

# 数据库配置
DB_PATH=/app/data/database.sqlite

# JWT 密钥 (请生成强密码)
JWT_SECRET=your-super-secret-jwt-key

# 文件上传路径
UPLOAD_PATH=/app/uploads

# CORS 配置
CORS_ORIGINS=https://your-domain.com
```

### 3. 生产环境安全配置

```bash
# 生成强密码
openssl rand -base64 32  # 用于 JWT_SECRET

# 设置合适的文件权限
chmod 600 .env
```

## SSL证书配置

### 使用 Let's Encrypt (推荐)

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 配置自动续期

```bash
# 添加到 crontab
sudo crontab -e

# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart
```

## 监控和维护

### 1. 健康检查

```bash
# 检查服务状态
curl http://localhost/api/health

# 检查容器状态
docker ps
docker logs shopping-website
```

### 2. 日志管理

```bash
# 查看应用日志
docker logs -f shopping-website

# 查看系统日志
sudo journalctl -u docker

# 清理旧日志
docker system prune -f
```

### 3. 备份策略

```bash
#!/bin/bash
# backup.sh - 数据备份脚本

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/shopping-website/data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/shopping-website/uploads/

# 清理30天前的备份
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "备份完成: $DATE"
```

### 4. 性能监控

```bash
# 安装监控工具
docker run -d \
  --name cadvisor \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:ro \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest
```

## 故障排除

### 常见问题

#### 1. 容器无法启动

```bash
# 检查日志
docker logs shopping-website

# 检查端口占用
sudo netstat -tlnp | grep :80

# 检查磁盘空间
df -h
```

#### 2. 数据库连接失败

```bash
# 检查数据库文件权限
ls -la /opt/shopping-website/data/

# 检查环境变量
docker exec shopping-website env | grep DB_
```

#### 3. 文件上传失败

```bash
# 检查上传目录权限
ls -la /opt/shopping-website/uploads/

# 修复权限
sudo chown -R 1000:1000 /opt/shopping-website/uploads/
sudo chmod -R 755 /opt/shopping-website/uploads/
```

#### 4. SSL证书问题

```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重启服务
docker-compose restart
```

### 紧急恢复

```bash
# 回滚到上一个版本
docker pull your-registry/shopping-website:previous
docker stop shopping-website
docker rm shopping-website
docker run -d --name shopping-website ... your-registry/shopping-website:previous

# 从备份恢复数据
cp /opt/backups/database_YYYYMMDD_HHMMSS.sqlite /opt/shopping-website/data/database.sqlite
tar -xzf /opt/backups/uploads_YYYYMMDD_HHMMSS.tar.gz -C /
```

## 更新部署

### 1. 零停机更新

```bash
# 使用 docker-compose 滚动更新
docker-compose pull
docker-compose up -d
```

### 2. 蓝绿部署

```bash
# 启动新版本容器
docker run -d --name shopping-website-new ... new-image

# 测试新版本
curl http://localhost:8081/api/health

# 切换流量
# 更新负载均衡器配置

# 停止旧版本
docker stop shopping-website-old
docker rm shopping-website-old
```

## 联系支持

如果遇到部署问题，请提供以下信息：

1. 服务器系统信息：`uname -a`
2. Docker 版本：`docker --version`
3. 容器日志：`docker logs shopping-website`
4. 系统资源：`free -h && df -h`
5. 网络状态：`sudo netstat -tlnp`

---

**注意**：请在部署前仔细阅读本文档，并在测试环境中验证所有步骤。生产环境部署前请确保已做好数据备份。