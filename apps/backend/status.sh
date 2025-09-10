#!/bin/bash

# 后端服务状态检查脚本
# 使用方式: ./status.sh 或 bash status.sh

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 检查后端服务状态...${NC}"

PORT=9004
SERVICE_NAME="后端服务"

# 检查端口占用
PORT_PID=$(lsof -ti:$PORT 2>/dev/null)

if [ ! -z "$PORT_PID" ]; then
    echo -e "${GREEN}✅ $SERVICE_NAME 正在运行${NC}"
    echo -e "${BLUE}📊 进程ID: $PORT_PID${NC}"
    echo -e "${BLUE}🌐 监听端口: $PORT${NC}"
    
    # 显示进程详细信息
    echo -e "${BLUE}📋 进程详情:${NC}"
    ps -p $PORT_PID -o pid,ppid,cmd,etime,pcpu,pmem --no-headers | sed 's/^/  /'
    
    # 检查服务是否响应
    echo -e "${BLUE}🔗 测试服务连接...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|404"; then
        echo -e "${GREEN}✅ 服务响应正常${NC}"
    else
        echo -e "${YELLOW}⚠️ 服务可能无响应${NC}"
    fi
    
    # 检查日志
    if [ -f "logs/app.log" ]; then
        echo -e "${BLUE}📝 最近日志:${NC}"
        tail -n 5 logs/app.log | sed 's/^/  /'
    fi
    
else
    echo -e "${RED}❌ $SERVICE_NAME 未运行${NC}"
    echo -e "${YELLOW}💡 启动命令: ./start.sh${NC}"
    
    # 检查是否有相关进程但端口不正确
    echo -e "${BLUE}🔍 检查相关进程...${NC}"
    ps aux | grep -v grep | grep "index.js" | sed 's/^/  /'
fi

# 检查系统资源
echo -e "${BLUE}💻 系统资源:${NC}"
echo -e "  CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo -e "  内存使用: $(free -h | grep Mem | awk '{print $3 "/" $2}')"

# 检查bun版本
if command -v bun &> /dev/null; then
    echo -e "${BLUE}📦 Bun版本: $(bun --version)${NC}"
else
    echo -e "${RED}❌ 未找到bun${NC}"
fi

# 检查文件完整性
echo -e "${BLUE}📁 文件检查:${NC}"
required_files=("index.js" "package.json" ".env" ".env.production")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${RED}❌ $file 缺失${NC}"
    fi
done