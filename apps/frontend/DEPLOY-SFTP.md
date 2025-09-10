# SFTP部署说明

## 功能特性

- 基于 SFTP 协议的安全文件传输
- 自动构建和部署前端项目
- 支持密码和SSH密钥认证
- 自动清理远程目录
- 递归上传文件和目录
- 自动设置文件权限
- 部署验证和日志记录

## 安装依赖

```bash
bun install
```

## 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的服务器信息：
```env
# SFTP服务器配置
SFTP_HOST=your_server_ip
SFTP_PORT=22
SFTP_USER=root
SFTP_PASSWORD=your_password

# 远程部署路径
REMOTE_PATH=/opt/1panel/www/sites/shop/index
```

## 使用方法

### 基本部署

```bash
# 部署到默认环境
bun run deploy

# 或者使用生产环境部署
bun run deploy:prod
```

### 直接运行脚本

```bash
node deploy-sftp.js
```

## 配置选项

### 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `SFTP_HOST` | SFTP服务器地址 | `your_server_ip` |
| `SFTP_PORT` | SFTP服务器端口 | `22` |
| `SFTP_USER` | SFTP用户名 | `root` |
| `SFTP_PASSWORD` | SFTP密码 | `your_password` |
| `SFTP_PRIVATE_KEY` | SSH私钥路径 | `null` |
| `SFTP_PASSPHRASE` | SSH私钥密码 | `null` |
| `REMOTE_PATH` | 远程部署路径 | `/opt/1panel/www/sites/shop/index` |
| `LOCAL_DIST` | 本地构建产物目录 | `dist` |

### SSH密钥认证

如果使用SSH密钥认证，配置如下：
```env
SFTP_PRIVATE_KEY=/path/to/private/key
SFTP_PASSPHRASE=your_passphrase
```

## 部署流程

1. **检查本地构建产物** - 验证 `dist` 目录是否存在
2. **构建项目** - 运行 `bun run build` 构建前端项目
3. **连接SFTP服务器** - 建立安全连接
4. **创建远程目录** - 确保目标目录存在
5. **清理远程目录** - 删除旧文件，准备新部署
6. **上传文件** - 递归上传所有构建产物
7. **设置权限** - 配置文件和目录权限
8. **验证部署** - 检查部署结果

## 安全建议

1. **不要将 `.env` 文件提交到版本控制**
2. **使用SSH密钥认证而不是密码**
3. **限制SFTP用户的权限**
4. **定期更换密钥和密码**

## 故障排除

### 常见问题

1. **连接失败**
   - 检查服务器地址和端口
   - 验证用户名和密码
   - 确保防火墙允许SFTP连接

2. **权限错误**
   - 确保SFTP用户有写入权限
   - 检查远程目录权限设置

3. **构建失败**
   - 确保所有依赖已安装
   - 检查TypeScript类型错误

### 调试模式

脚本包含详细的日志输出，可以帮助定位问题：
- 🚀 开始部署
- 📦 构建项目
- 🔌 连接SFTP
- 📁 创建目录
- 🧹 清理目录
- 📤 上传文件
- 🔐 设置权限
- ✅ 验证部署

## 与现有部署脚本的比较

| 特性 | SFTP脚本 | 原有脚本 |
|------|----------|----------|
| 协议 | SFTP | SCP |
| 认证方式 | 密码/SSH密钥 | 仅密码 |
| 错误处理 | 完整的错误处理 | 基础错误处理 |
| 日志记录 | 彩色日志 + 详细信息 | 基础日志 |
| 权限管理 | 自动设置权限 | 手动设置 |
| 依赖 | Node.js + ssh2-sftp-client | sshpass + OpenSSH |

## 注意事项

- 确保服务器已安装并运行SFTP服务
- 网络连接稳定，避免大文件上传中断
- 定期备份服务器上的重要数据