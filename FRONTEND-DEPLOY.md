# 前端部署脚本使用说明

本项目提供了三种前端部署脚本，用于构建前端项目并将产物上传到服务器指定位置。

## 脚本说明

### 1. deploy-frontend.ps1 (PowerShell 完整版)
- **适用环境**: Windows PowerShell 5.1+
- **功能**: 完整的部署流程，包含多种上传方式
- **依赖**: bun, Git for Windows (包含 ssh/scp)

### 2. deploy-frontend-simple.ps1 (PowerShell 简化版)
- **适用环境**: Windows PowerShell 5.1+ 或 PowerShell Core
- **功能**: 使用 WinSCP 或 Posh-SSH 模块上传
- **依赖**: bun, WinSCP 或 Posh-SSH 模块

### 3. deploy-frontend.bat (批处理版)
- **适用环境**: Windows 命令提示符
- **功能**: 使用 Git Bash 和 expect 自动化上传
- **依赖**: bun, Git for Windows

## 使用方法

### 方法一：PowerShell 脚本 (推荐)

```powershell
# 基本用法
.\deploy-frontend-simple.ps1 -ServerIP "192.168.1.100" -Username "root" -Password "your_password"

# 指定自定义远程路径
.\deploy-frontend-simple.ps1 -ServerIP "your-server.com" -Username "admin" -Password "password123" -RemotePath "/var/www/html"
```

### 方法二：批处理脚本

```cmd
# 基本用法
deploy-frontend.bat 192.168.1.100 root password123

# 指定自定义远程路径
deploy-frontend.bat your-server.com admin password123 /var/www/html
```

## 参数说明

| 参数 | 说明 | 必需 | 默认值 |
|------|------|------|--------|
| ServerIP | 服务器IP地址或域名 | 是 | - |
| Username | SSH用户名 | 是 | - |
| Password | SSH密码 | 是 | - |
| RemotePath | 远程部署路径 | 否 | `/opt/1panel/www/sites/shop/index` |

## 部署流程

1. **环境检查**: 验证必要工具是否安装
2. **依赖安装**: 执行 `bun install` 安装前端依赖
3. **项目构建**: 执行 `bun run build` 构建前端项目
4. **文件上传**: 将 `dist` 目录内容上传到服务器
5. **结果验证**: 验证文件是否成功上传

## 前置要求

### 必需工具
- **bun**: 用于构建前端项目
  ```bash
  # 安装 bun
  npm install -g bun
  # 或者从官网下载: https://bun.sh
  ```

### 上传工具 (选择其一)

#### 选项1: Git for Windows (推荐)
- 下载地址: https://git-scm.com/download/win
- 包含 ssh, scp, expect 等工具
- 适用于所有脚本

#### 选项2: WinSCP
- 下载地址: https://winscp.net/
- 仅适用于 PowerShell 脚本
- 提供图形界面和命令行工具

#### 选项3: Posh-SSH 模块
- PowerShell 模块，脚本会自动安装
- 仅适用于 PowerShell 脚本

## 服务器要求

- 支持 SSH 连接
- 支持 SCP/SFTP 文件传输
- 远程路径具有写权限
- 防火墙允许 SSH 连接 (通常是22端口)

## 故障排除

### 常见问题

1. **"未找到 bun 命令"**
   - 解决方案: 安装 bun 或确保 bun 在 PATH 环境变量中

2. **"构建失败"**
   - 检查前端项目是否有语法错误
   - 确保所有依赖都已正确安装
   - 查看构建日志中的具体错误信息

3. **"连接服务器失败"**
   - 检查服务器IP地址是否正确
   - 确认用户名和密码是否正确
   - 验证服务器SSH服务是否运行
   - 检查网络连接和防火墙设置

4. **"权限被拒绝"**
   - 确认用户有远程路径的写权限
   - 尝试使用 sudo 权限的用户
   - 检查远程目录是否存在

5. **"文件上传失败"**
   - 检查远程磁盘空间是否充足
   - 确认远程路径格式正确 (使用 Unix 路径格式)
   - 验证网络连接稳定性

### 调试模式

如果遇到问题，可以手动执行各个步骤进行调试：

```bash
# 1. 测试构建
cd apps/frontend
bun install
bun run build
ls dist  # 检查构建产物

# 2. 测试SSH连接
ssh username@server_ip

# 3. 测试文件传输
scp -r dist/* username@server_ip:/remote/path/
```

## 安全注意事项

1. **密码安全**: 避免在命令历史中暴露密码
2. **权限控制**: 使用最小权限原则的用户账户
3. **网络安全**: 在生产环境中考虑使用SSH密钥认证
4. **备份**: 部署前备份服务器上的现有文件

## 高级配置

### 使用SSH密钥认证 (推荐)

如果服务器支持SSH密钥认证，可以修改脚本使用密钥而非密码：

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096

# 将公钥复制到服务器
ssh-copy-id username@server_ip

# 修改脚本中的scp命令，移除密码参数
scp -i ~/.ssh/id_rsa -r dist/* username@server_ip:/remote/path/
```

### 自定义构建命令

如果需要自定义构建命令，可以修改脚本中的构建部分：

```powershell
# 替换默认的构建命令
# bun run build
# 改为自定义命令，例如：
bun run build:prod
# 或
npm run build
```

## 联系支持

如果遇到无法解决的问题，请提供以下信息：
- 使用的脚本版本
- 完整的错误信息
- 操作系统版本
- 服务器环境信息
- 网络配置情况