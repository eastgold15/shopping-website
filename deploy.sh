#!/bin/bash

# 购物网站部署脚本
# 支持构建、推送到阿里云容器镜像服务和远程部署

set -e

# 配置变量
IMAGE_NAME="shopping-website"
VERSION="latest"
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="your-namespace"  # 请替换为您的阿里云命名空间
REPOSITORY="$REGISTRY/$NAMESPACE/$IMAGE_NAME"

# 远程服务器配置
REMOTE_HOST="your-server.com"  # 请替换为您的服务器地址
REMOTE_USER="root"             # 请替换为您的服务器用户名
REMOTE_PATH="/opt/shopping-website"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在 PATH 中"
        exit 1
    fi
    
    if ! command -v bun &> /dev/null; then
        log_error "Bun 未安装或不在 PATH 中"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    cd apps/frontend
    bun install
    bun run build
    cd ../..
    log_info "前端构建完成"
}

# 构建后端
build_backend() {
    log_info "构建后端应用..."
    cd apps/backend
    bun install
    bun build --target node
    cd ../..
    log_info "后端构建完成"
}

# 构建Docker镜像
build_image() {
    log_info "构建 Docker 镜像..."
    docker build --no-cache -f Dockerfile.simple -t $IMAGE_NAME:$VERSION .
    docker tag $IMAGE_NAME:$VERSION $REPOSITORY:$VERSION
    log_info "Docker 镜像构建完成: $REPOSITORY:$VERSION"
}

# 推送到阿里云
push_to_registry() {
    log_info "推送镜像到阿里云容器镜像服务..."
    
    # 检查是否已登录
    if ! docker info | grep -q "Username"; then
        log_warn "请先登录阿里云容器镜像服务:"
        echo "docker login --username=your-username $REGISTRY"
        exit 1
    fi
    
    docker push $REPOSITORY:$VERSION
    log_info "镜像推送完成: $REPOSITORY:$VERSION"
}

# 部署到远程服务器
deploy_to_server() {
    log_info "部署到远程服务器..."
    
    # 创建部署脚本
    cat > deploy-remote.sh << EOF
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
EOF

    # 上传并执行部署脚本
    scp deploy-remote.sh $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
    ssh $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_PATH/deploy-remote.sh && $REMOTE_PATH/deploy-remote.sh"
    
    # 清理临时文件
    rm deploy-remote.sh
    
    log_info "远程部署完成！"
}

# 清理本地镜像
cleanup() {
    log_info "清理本地镜像..."
    docker rmi $IMAGE_NAME:$VERSION || true
    docker rmi $REPOSITORY:$VERSION || true
    log_info "清理完成"
}

# 显示帮助信息
show_help() {
    echo "购物网站部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  build     构建前后端和Docker镜像"
    echo "  push      推送镜像到阿里云"
    echo "  deploy    部署到远程服务器"
    echo "  full      执行完整部署流程 (build + push + deploy)"
    echo "  cleanup   清理本地镜像"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build          # 只构建"
    echo "  $0 push           # 只推送"
    echo "  $0 deploy         # 只部署"
    echo "  $0 full           # 完整流程"
}

# 主函数
main() {
    case "$1" in
        "build")
            check_dependencies
            build_frontend
            build_backend
            build_image
            ;;
        "push")
            push_to_registry
            ;;
        "deploy")
            deploy_to_server
            ;;
        "full")
            check_dependencies
            build_frontend
            build_backend
            build_image
            push_to_registry
            deploy_to_server
            cleanup
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            log_error "请指定操作类型"
            show_help
            exit 1
            ;;
        *)
            log_error "未知操作: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"