#!/bin/bash

# 前端部署脚本
# 将前端构建产物部署到服务器 /opt/1panel/www/sites/shop/index

# 服务器配置
SERVER_HOST="your_server_ip"  # 替换为你的服务器IP
SERVER_USER="root"            # 服务器用户名
SERVER_PASSWORD="your_password" # 服务器密码
SERVER_PATH="/opt/1panel/www/sites/shop/index"

# 本地构建产物目录
LOCAL_DIST="./dist"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署前端项目...${NC}"

# 检查本地构建产物是否存在
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}❌ 本地构建产物目录不存在: $LOCAL_DIST${NC}"
    echo -e "${YELLOW}请先运行 'bun run build' 构建项目${NC}"
    exit 1
fi

# 构建项目
echo -e "${YELLOW}📦 构建前端项目...${NC}"
bun run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

# 安装sshpass（如果不存在）
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}📥 安装sshpass...${NC}"
    
    # Windows (Git Bash) 或 Linux
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo -e "${YELLOW}Windows系统请手动安装sshpass: https://sourceforge.net/projects/sshpass/files/${NC}"
        exit 1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y sshpass
        # CentOS/RHEL
        elif command -v yum &> /dev/null; then
            sudo yum install -y sshpass
        # Fedora
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y sshpass
        else
            echo -e "${RED}❌ 无法自动安装sshpass，请手动安装${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ 不支持的操作系统${NC}"
        exit 1
    fi
fi

# 创建远程目录
echo -e "${YELLOW}📁 创建远程目录...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"

# 清理远程目录
echo -e "${YELLOW}🧹 清理远程目录...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "rm -rf $SERVER_PATH/*"

# 上传构建产物
echo -e "${YELLOW}📤 上传构建产物...${NC}"
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r $LOCAL_DIST/* $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# 设置权限
echo -e "${YELLOW}🔐 设置文件权限...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "chown -R www:www $SERVER_PATH && chmod -R 755 $SERVER_PATH"

# 验证部署
echo -e "${YELLOW}✅ 验证部署...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "ls -la $SERVER_PATH"

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}📍 访问地址: http://$SERVER_HOST${NC}"