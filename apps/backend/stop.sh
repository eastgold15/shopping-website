#!/bin/bash

# 后端服务停止脚本
# 使用方式: ./stop.sh 或 bash stop.sh

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 停止后端服务...${NC}"

# 检查pid文件是否存在
if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    
    # 检查进程是否存在
    if kill -0 $PID 2>/dev/null; then
        echo -e "${BLUE}📊 找到进程: $PID${NC}"
        
        # 优雅停止
        kill $PID
        
        # 等待进程停止
        for i in {1..10}; do
            if ! kill -0 $PID 2>/dev/null; then
                echo -e "${GREEN}✅ 服务已优雅停止${NC}"
                break
            fi
            echo -e "${YELLOW}⏳ 等待服务停止... ($i/10)${NC}"
            sleep 1
        done
        
        # 强制停止
        if kill -0 $PID 2>/dev/null; then
            echo -e "${YELLOW}⚠️ 强制停止服务...${NC}"
            kill -9 $PID
        fi
        
        # 删除pid文件
        rm -f app.pid
        echo -e "${GREEN}✅ 服务已完全停止${NC}"
        
    else
        echo -e "${YELLOW}⚠️ 进程不存在，清理pid文件${NC}"
        rm -f app.pid
    fi
else
    echo -e "${YELLOW}⚠️ 未找到pid文件，尝试通过端口查找进程${NC}"
    
    # 通过端口查找进程
    PORT=9004
    PID=$(lsof -ti:$PORT 2>/dev/null)
    
    if [ ! -z "$PID" ]; then
        echo -e "${BLUE}📊 找到占用端口 $PORT 的进程: $PID${NC}"
        kill $PID
        echo -e "${GREEN}✅ 进程已停止${NC}"
    else
        echo -e "${YELLOW}⚠️ 未找到运行中的服务${NC}"
    fi
fi

# 记录停止时间
echo "停止时间: $(date)" >> logs/stop.log

echo -e "${BLUE}📋 服务停止日志: logs/stop.log${NC}"