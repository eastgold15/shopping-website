#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 停止服务...${NC}"

# ========== 检查 PID 文件是否存在 ==========
if [ ! -f "app.pid" ]; then
    echo -e "${YELLOW}⚠️  app.pid 不存在，服务可能未运行${NC}"
    
    # 尝试查找并停止所有相关进程
    echo -e "${BLUE}🔍 查找相关进程...${NC}"
    PIDS=$(pgrep -f "bun.*index.js" 2>/dev/null || true)
    
    if [ -n "$PIDS" ]; then
        echo -e "${YELLOW}⚠️  发现运行中的进程: $PIDS${NC}"
        echo -e "${BLUE}⏳ 正在停止所有相关进程...${NC}"
        pkill -f "bun.*index.js" 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✅ 已尝试停止所有相关进程${NC}"
    else
        echo -e "${GREEN}✅ 未发现运行中的进程${NC}"
    fi
    
    exit 0
fi

# ========== 读取 PID ==========
PID=$(cat app.pid)
echo -e "${BLUE}📝 读取到 PID: $PID${NC}"

# ========== 检查进程是否存在 ==========
if kill -0 $PID 2>/dev/null; then
    echo -e "${BLUE}⏳ 正在停止进程 $PID...${NC}"
    kill $PID
    sleep 2
    
    # 检查是否成功停止
    if kill -0 $PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  优雅停止失败，强制终止...${NC}"
        kill -9 $PID
        sleep 1
    fi
    
    # 再次检查
    if kill -0 $PID 2>/dev/null; then
        echo -e "${RED}❌ 进程停止失败${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ 服务已停止${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  进程 $PID 不存在，可能已停止${NC}"
fi

# ========== 清理 PID 文件 ==========
rm -f app.pid
echo -e "${GREEN}🧹 已清理 PID 文件${NC}"