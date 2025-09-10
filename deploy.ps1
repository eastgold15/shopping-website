# 购物网站部署脚本 (PowerShell版本)
# 支持构建、推送到阿里云容器镜像服务和远程部署

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "push", "deploy", "full", "cleanup", "help")]
    [string]$Action
)

# 配置变量
$IMAGE_NAME = "shopping-website"
$VERSION = "latest"
$REGISTRY = "registry.cn-hangzhou.aliyuncs.com"
$NAMESPACE = "your-namespace"  # 请替换为您的阿里云命名空间
$REPOSITORY = "$REGISTRY/$NAMESPACE/$IMAGE_NAME"

# 远程服务器配置
$REMOTE_HOST = "your-server.com"  # 请替换为您的服务器地址
$REMOTE_USER = "root"             # 请替换为您的服务器用户名
$REMOTE_PATH = "/opt/shopping-website"

# 日志函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查必要工具
function Test-Dependencies {
    Write-Info "检查依赖工具..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker 未安装或不在 PATH 中"
        exit 1
    }
    
    if (!(Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Error "Bun 未安装或不在 PATH 中"
        exit 1
    }
    
    Write-Info "依赖检查完成"
}

# 构建前端
function Build-Frontend {
    Write-Info "构建前端应用..."
    Push-Location "apps/frontend"
    try {
        bun install
        bun run build
        Write-Info "前端构建完成"
    }
    finally {
        Pop-Location
    }
}

# 构建后端
function Build-Backend {
    Write-Info "构建后端应用..."
    Push-Location "apps/backend"
    try {
        bun install
        bun build --target node
        Write-Info "后端构建完成"
    }
    finally {
        Pop-Location
    }
}

# 构建Docker镜像
function Build-Image {
    Write-Info "构建 Docker 镜像..."
    docker build --no-cache -f Dockerfile.simple -t "${IMAGE_NAME}:${VERSION}" .
    docker tag "${IMAGE_NAME}:${VERSION}" "${REPOSITORY}:${VERSION}"
    Write-Info "Docker 镜像构建完成: ${REPOSITORY}:${VERSION}"
}

# 推送到阿里云
function Push-ToRegistry {
    Write-Info "推送镜像到阿里云容器镜像服务..."
    
    # 检查是否已登录
    $dockerInfo = docker info 2>$null
    if ($dockerInfo -notmatch "Username") {
        Write-Warn "请先登录阿里云容器镜像服务:"
        Write-Host "docker login --username=your-username $REGISTRY"
        exit 1
    }
    
    docker push "${REPOSITORY}:${VERSION}"
    Write-Info "镜像推送完成: ${REPOSITORY}:${VERSION}"
}

# 部署到远程服务器
function Deploy-ToServer {
    Write-Info "部署到远程服务器..."
    
    # 创建部署脚本内容
    $deployScript = @"
#!/bin/bash
set -e

# 停止并删除旧容器
docker stop shopping-website || true
docker rm shopping-website || true

# 拉取最新镜像
docker pull $REPOSITORY:$VERSION

# 启动新容器
docker run -d \\
  --name shopping-website \\
  --restart unless-stopped \\
  -p 80:80 \\
  -p 443:443 \\
  -v /opt/shopping-website/data:/app/data \\
  -v /opt/shopping-website/uploads:/app/uploads \\
  -e NODE_ENV=production \\
  -e APP_PORT=9004 \\
  $REPOSITORY:$VERSION

echo "部署完成！"
"@

    # 保存部署脚本到临时文件
    $tempScript = "deploy-remote.sh"
    $deployScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    try {
        # 上传并执行部署脚本
        scp $tempScript "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
        ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod +x ${REMOTE_PATH}/deploy-remote.sh && ${REMOTE_PATH}/deploy-remote.sh"
        
        Write-Info "远程部署完成！"
    }
    finally {
        # 清理临时文件
        if (Test-Path $tempScript) {
            Remove-Item $tempScript
        }
    }
}

# 清理本地镜像
function Remove-LocalImages {
    Write-Info "清理本地镜像..."
    try {
        docker rmi "${IMAGE_NAME}:${VERSION}" 2>$null
    } catch {}
    try {
        docker rmi "${REPOSITORY}:${VERSION}" 2>$null
    } catch {}
    Write-Info "清理完成"
}

# 显示帮助信息
function Show-Help {
    Write-Host "购物网站部署脚本 (PowerShell版本)"
    Write-Host ""
    Write-Host "用法: .\deploy.ps1 -Action <action>"
    Write-Host ""
    Write-Host "操作:"
    Write-Host "  build     构建前后端和Docker镜像"
    Write-Host "  push      推送镜像到阿里云"
    Write-Host "  deploy    部署到远程服务器"
    Write-Host "  full      执行完整部署流程 (build + push + deploy)"
    Write-Host "  cleanup   清理本地镜像"
    Write-Host "  help      显示此帮助信息"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\deploy.ps1 -Action build          # 只构建"
    Write-Host "  .\deploy.ps1 -Action push           # 只推送"
    Write-Host "  .\deploy.ps1 -Action deploy         # 只部署"
    Write-Host "  .\deploy.ps1 -Action full           # 完整流程"
}

# 主函数
switch ($Action) {
    "build" {
        Test-Dependencies
        Build-Frontend
        Build-Backend
        Build-Image
    }
    "push" {
        Push-ToRegistry
    }
    "deploy" {
        Deploy-ToServer
    }
    "full" {
        Test-Dependencies
        Build-Frontend
        Build-Backend
        Build-Image
        Push-ToRegistry
        Deploy-ToServer
        Remove-LocalImages
    }
    "cleanup" {
        Remove-LocalImages
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "未知操作: $Action"
        Show-Help
        exit 1
    }
}