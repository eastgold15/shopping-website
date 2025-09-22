#!/bin/bash
set -e

# ========== 防重复启动 ==========
if [ -f "app.pid" ]; then
    OLD_PID=$(cat app.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  服务已在运行 (PID: $OLD_PID)，请先停止再启动${NC}"
        echo -e "${BLUE}💡 停止命令: ./stop.sh${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠️  app.pid 存在但进程已死，清理中...${NC}"
        rm -f app.pid
    fi
fi

# ========== 颜色定义 ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ========== 启动横幅 ==========
echo -e "${GREEN}🚀 启动后端服务...${NC}"

# ========== 检查当前目录 ==========
if [ ! -f "index.js" ]; then
    echo -e "${RED}❌ 错误: 当前目录没有找到 index.js 文件${NC}"
    echo -e "${YELLOW}请确保在项目根目录（如 /1）下运行此脚本${NC}"
    exit 1
fi

# ========== 显式加载 volta 环境（关键！）==========
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

# # ========== 检查 bun 是否可用 ==========
# echo -e "${BLUE}🔍 检查 bun 环境...${NC}"

# if command -v bun &> /dev/null; then
#     BUN_CMD="bun"
#     echo -e "${GREEN}✅ bun 路径: $(which bun)${NC}"
#     echo -e "${GREEN}✅ bun 版本: $(bun --version)${NC}"
# else
#     echo -e "${YELLOW}⚠️  bun 未在 PATH 中找到，尝试常见路径...${NC}"
    
#     BUN_PATHS=(
#         "$HOME/.volta/bin/bun"
#         "$HOME/.bun/bin/bun"
#         "/usr/local/bin/bun"
#         "/opt/homebrew/bin/bun"
#         "$HOME/.local/bin/bun"
#         "/usr/bin/bun"
#     )
    
#     BUN_FOUND=""
#     for path in "${BUN_PATHS[@]}"; do
#         if [ -f "$path" ]; then
#             BUN_FOUND="$path"
#             echo -e "${GREEN}✅ 找到 bun: $BUN_FOUND${NC}"
#             break
#         fi
#     done
    
#     if [ -z "$BUN_FOUND" ]; then
#         echo -e "${RED}❌ 错误: 未找到 bun 命令${NC}"
#         echo -e "${YELLOW}💡 请先安装: curl -fsSL https://bun.sh/install | bash${NC}"
#         exit 1
#     fi

#     BUN_CMD="$BUN_FOUND"
# fi

# ========== 创建日志目录 ==========
mkdir -p logs

# ========== 设置环境变量 ==========
export NODE_ENV=production

# ========== 启动参数预览 ==========
echo -e "${BLUE}🔧 启动配置:${NC}"
echo -e "${BLUE}  - 环境: $NODE_ENV${NC}"
echo -e "${BLUE}  - .env 文件: $( [ -f .env ] && echo '✅ 存在' || echo '⚠️ 不存在' )${NC}"
echo -e "${BLUE}  - .env.production: $( [ -f .env.production ] && echo '✅ 存在' || echo '⚠️ 不存在' )${NC}"
echo -e "${BLUE}  - 执行文件: index.js${NC}"
echo -e "${YELLOW}🔄 正在启动服务...${NC}"

# ========== 记录启动时间 ==========
echo "=== 启动于: $(date) ===" >> logs/app.log

# ========== 启动服务（只启动一次！）==========
nohup  bun --env-file=.env --env-file=.env.production  ./index.js &

# ========== 保存 PID ==========
PID=$!
echo "启动进程 PID: $PID" >> logs/app.log
echo $PID > app.pid

# ========== 验证 PID 文件创建 ==========
if [ ! -f "app.pid" ]; then
    echo -e "${RED}❌ 错误: PID 文件创建失败${NC}"
    exit 1
fi

echo -e "${BLUE}📝 PID 已保存到 app.pid: $PID${NC}"

# ========== 等待并检查 ==========
sleep 3

if kill -0 $PID 2>/dev/null; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}📊 进程ID: $PID${NC}"
    echo -e "${GREEN}📋 日志文件: logs/app.log${NC}"
    echo -e "${GREEN}🌐 服务端口: 9004${NC}"
    echo -e "${BLUE}💡 管理命令:${NC}"
    echo -e "${BLUE}   停止: ./stop.sh${NC}"
    echo -e "${BLUE}   查看日志: tail -f logs/app.log${NC}"
    echo -e "${BLUE}   查看状态: ./status.sh${NC}"
else
    echo -e "${RED}❌ 服务启动失败！${NC}"
    echo -e "${YELLOW}🔍 请检查日志: cat logs/app.log${NC}"
    exit 1
fi