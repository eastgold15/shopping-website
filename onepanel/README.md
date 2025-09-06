# 1Panel 统一部署指南

这是一个为 1Panel 管理平台优化的统一部署方案，将前端、后端和反向代理打包到单个 Docker 镜像中。

## 📁 文件结构

```
onepanel/
├── docker-compose.yml  # Docker Compose 配置
├── .env               # 环境变量配置
└── README.md          # 本说明文档
```

## 🎯 方案特点

- ✅ **单镜像部署** - 前端、后端、反向代理集成在一个镜像中
- ✅ **内置配置** - Caddyfile 配置内置到镜像，无需外部挂载
- ✅ **1Panel 友好** - 专为 1Panel 管理平台优化
- ✅ **自动 HTTPS** - Caddy 自动申请和管理 SSL 证书
- ✅ **健康检查** - 内置服务健康监控
- ✅ **资源控制** - 合理的资源限制配置

## 🚀 部署步骤

### 1. 构建统一镜像

在项目根目录执行：

```powershell
# 使用构建脚本
.\build-unified.bat

# 或手动构建
docker build -f Dockerfile.unified -t shopping-website:latest .
```

### 2. 准备部署文件

将 `onepanel` 目录上传到服务器：

```powershell
# 创建部署目录
mkdir C:\1panel-apps\shopping-website
cd C:\1panel-apps\shopping-website

# 复制以下文件到此目录：
# - docker-compose.yml
# - .env
# - README.md
```

### 3. 配置环境变量

编辑 `.env` 文件，配置必要参数：

```bash
# 重要配置项
DOMAIN=your-domain.com                    # 你的域名
DATABASE_URL=postgres://user:pass@host:5432/db  # 数据库连接
JWT_SECRET=your-super-secret-key           # JWT 密钥
DB_PASSWORD=your-secure-password           # 数据库密码
```

### 4. 在 1Panel 中部署

#### 方法1：通过 1Panel Web 界面

1. 登录 1Panel 管理界面
2. 进入「容器」→「编排」
3. 点击「创建编排」
4. 上传 `docker-compose.yml` 文件
5. 配置环境变量
6. 启动服务

#### 方法2：命令行部署

```powershell
# 进入部署目录
cd C:\1panel-apps\shopping-website

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 📊 服务访问

部署成功后，可通过以下方式访问：

- **网站首页**: `https://your-domain.com`
- **API 接口**: `https://your-domain.com/api`
- **上传文件**: `https://your-domain.com/uploads`
- **Caddy 管理**: `http://your-domain.com:2019/metrics`

## 🔧 管理命令

### 基本操作

```powershell
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务
docker-compose pull
docker-compose up -d
```

### 健康检查

```powershell
# 检查容器健康状态
docker ps

# 检查网站访问
curl https://your-domain.com

# 检查 API 健康
curl https://your-domain.com/api/health

# 查看 Caddy 指标
curl http://localhost:2019/metrics
```

### 日志管理

```powershell
# 查看应用日志
docker-compose logs shopping-website

# 查看 Caddy 访问日志
docker exec shopping-website cat /var/log/caddy/access.log

# 实时监控日志
docker-compose logs -f --tail=100
```

## 🔄 更新部署

### 更新镜像

```powershell
# 1. 构建新镜像
docker build -f Dockerfile.unified -t shopping-website:latest .

# 2. 重启服务
docker-compose down
docker-compose up -d

# 3. 清理旧镜像
docker image prune -f
```

### 配置更新

```powershell
# 修改环境变量后重启
notepad .env
docker-compose restart
```

## 🛠️ 故障排除

### 常见问题

1. **容器启动失败**
   ```powershell
   # 查看详细错误
   docker-compose logs shopping-website
   
   # 检查配置文件
   docker-compose config
   ```

2. **网站无法访问**
   ```powershell
   # 检查端口占用
   netstat -an | findstr :80
   netstat -an | findstr :443
   
   # 检查防火墙
   # 确保 80 和 443 端口开放
   ```

3. **数据库连接失败**
   ```powershell
   # 检查数据库配置
   echo %DATABASE_URL%
   
   # 测试数据库连接
   # 确保数据库服务正常运行
   ```

4. **SSL 证书问题**
   ```powershell
   # 查看 Caddy 日志
   docker exec shopping-website cat /var/log/caddy/access.log
   
   # 检查域名解析
   nslookup your-domain.com
   ```

### 性能优化

1. **资源监控**
   ```powershell
   # 查看资源使用
   docker stats shopping-website
   
   # 调整资源限制
   # 编辑 docker-compose.yml 中的 deploy.resources 部分
   ```

2. **日志轮转**
   ```powershell
   # 配置日志大小限制
   # 在 docker-compose.yml 中添加 logging 配置
   ```

## 🔒 安全配置

### 必要的安全措施

1. **强密码策略**
   - 使用复杂的 JWT_SECRET
   - 设置强数据库密码
   - 定期更换密钥

2. **网络安全**
   ```powershell
   # 配置防火墙规则
   netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
   netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
   ```

3. **数据备份**
   ```powershell
   # 备份上传文件
   docker cp shopping-website:/var/www/uploads ./backup/uploads
   
   # 备份数据库
   # 根据数据库类型执行相应备份命令
   ```

### 监控告警

1. **健康检查监控**
   - 配置 1Panel 的监控告警
   - 设置服务异常通知

2. **资源监控**
   - 监控 CPU、内存使用率
   - 设置磁盘空间告警

## 📝 配置说明

### 环境变量详解

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| DOMAIN | 网站域名 | example.com |
| DATABASE_URL | 数据库连接字符串 | postgres://user:pass@host:5432/db |
| JWT_SECRET | JWT 加密密钥 | your-secret-key |
| MAX_FILE_SIZE | 最大上传文件大小 | 10485760 |

### 端口说明

| 端口 | 用途 | 说明 |
|------|------|------|
| 80 | HTTP | 自动重定向到 HTTPS |
| 443 | HTTPS | 主要服务端口 |
| 2019 | Caddy 管理 | 指标和管理接口 |

---

**需要帮助？** 查看容器日志或联系技术支持。

**1Panel 官方文档**: https://1panel.cn/docs/