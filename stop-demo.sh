#!/bin/bash

# Shadow Shuttle 演示模式停止脚本
# 用于停止所有服务

set -e

echo "🛑 Shadow Shuttle 演示模式停止脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 停止 Shadowd
echo "🛡️  停止 Shadowd 守护进程..."
if [ -f "shadowd/shadowd.pid" ]; then
    SHADOWD_PID=$(cat shadowd/shadowd.pid)
    if ps -p $SHADOWD_PID > /dev/null 2>&1; then
        kill $SHADOWD_PID
        echo -e "${GREEN}✅ Shadowd 已停止 (PID: $SHADOWD_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Shadowd 进程不存在 (PID: $SHADOWD_PID)${NC}"
    fi
    rm shadowd/shadowd.pid
else
    # 尝试通过端口查找进程
    if lsof -i :2222 > /dev/null 2>&1; then
        PID=$(lsof -ti :2222)
        kill $PID
        echo -e "${GREEN}✅ Shadowd 已停止 (PID: $PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Shadowd 未运行${NC}"
    fi
fi
echo ""

# 停止 Headscale
echo "🌐 停止 Headscale 服务器..."
cd headscale
if docker compose ps | grep -q "Up"; then
    docker compose down
    echo -e "${GREEN}✅ Headscale 已停止${NC}"
else
    echo -e "${YELLOW}⚠️  Headscale 未运行${NC}"
fi
cd ..
echo ""

echo "=================================="
echo -e "${GREEN}🎉 所有服务已停止！${NC}"
echo ""
