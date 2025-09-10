#!/bin/bash

# 后端服务启动脚本
# 使用方式: ./start.sh 或 bash start.sh

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 启动后端服务...${NC}"

# 检查是否在正确的目录
if [ ! -f "index.js" ]; then
    echo -e "${RED}❌ 错误: 当前目录没有找到 index.js 文件${NC}"
    echo -e "${YELLOW}请确保在 /1 目录下运行此脚本${NC}"
    exit 1
fi

# 检查bun是否安装
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 bun 命令${NC}"
    echo -e "${YELLOW}请先安装 bun: curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
fi



# 创建日志目录
mkdir -p logs

# 设置环境变量
export NODE_ENV=production

# 启动服务
echo -e "${BLUE}🔧 启动参数:${NC}"
echo -e "${BLUE}  - 环境文件: .env${NC}"
echo -e "${BLUE}  - 生产环境: .env.production${NC}"
echo -e "${BLUE}  - 执行文件: index.js${NC}"
echo -e "${YELLOW}🔄 正在启动服务...${NC}"

# 记录启动时间
echo "启动时间: $(date)" >> logs/start.log

# 启动服务并重定向日志
nohup bun --env-file=.env --env-file=.env.production ./index.js > logs/app.log 2>&1 &

# 获取进程ID
PID=$!

echo $PID > app.pid

# 等待服务启动
sleep 3

# 检查服务是否正常运行
if kill -0 $PID 2>/dev/null; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
    echo -e "${GREEN}📊 进程ID: $PID${NC}"
    echo -e "${GREEN}📋 日志文件: logs/app.log${NC}"
    echo -e "${GREEN}🌐 服务端口: 9004${NC}"
    echo -e "${BLUE}💡 停止服务: ./stop.sh${NC}"
    echo -e "${BLUE}📊 查看日志: tail -f logs/app.log${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}🔍 请检查日志: logs/app.log${NC}"
    exit 1
fi