#!/bin/bash

# Shadow Shuttle 演示模式启动脚本
# 用于快速启动所有服务

set -e

echo "🚀 Shadow Shuttle 演示模式启动脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
echo "📦 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行${NC}"
    echo "请先启动 Docker Desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker 正在运行${NC}"
echo ""

# 启动 Headscale
echo "🌐 启动 Headscale 服务器..."
cd headscale
if docker compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Headscale 已经在运行${NC}"
else
    docker compose up -d
    echo -e "${GREEN}✅ Headscale 启动成功${NC}"
fi
cd ..
echo ""

# 等待 Headscale 就绪
echo "⏳ 等待 Headscale 就绪..."
sleep 3
echo -e "${GREEN}✅ Headscale 就绪${NC}"
echo ""

# 检查 Shadowd 是否已编译
echo "🔧 检查 Shadowd 二进制文件..."
if [ ! -f "shadowd/shadowd" ]; then
    echo -e "${YELLOW}⚠️  Shadowd 未编译，正在编译...${NC}"
    cd shadowd
    go build -o shadowd
    cd ..
    echo -e "${GREEN}✅ Shadowd 编译成功${NC}"
else
    echo -e "${GREEN}✅ Shadowd 二进制文件存在${NC}"
fi
echo ""

# 启动 Shadowd
echo "🛡️  启动 Shadowd 守护进程..."
cd shadowd

# 检查是否已经在运行
if lsof -i :2222 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Shadowd 已经在运行（端口 2222 被占用）${NC}"
    echo "如需重启，请先运行: ./stop-demo.sh"
else
    # 在后台启动 Shadowd
    nohup ./shadowd -config test-run-config.yaml > shadowd.log 2>&1 &
    SHADOWD_PID=$!
    echo $SHADOWD_PID > shadowd.pid
    
    # 等待启动
    sleep 2
    
    # 检查是否成功启动
    if ps -p $SHADOWD_PID > /dev/null; then
        echo -e "${GREEN}✅ Shadowd 启动成功 (PID: $SHADOWD_PID)${NC}"
    else
        echo -e "${RED}❌ Shadowd 启动失败${NC}"
        echo "请查看日志: cat shadowd/shadowd.log"
        exit 1
    fi
fi
cd ..
echo ""

# 验证服务
echo "🔍 验证服务状态..."
echo ""

# 检查 Headscale
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Headscale HTTP API (8080)${NC}"
else
    echo -e "${RED}❌ Headscale HTTP API (8080)${NC}"
fi

# 检查 SSH
if nc -z 127.0.0.1 2222 2>/dev/null; then
    echo -e "${GREEN}✅ SSH Server (2222)${NC}"
else
    echo -e "${RED}❌ SSH Server (2222)${NC}"
fi

# 检查 gRPC
if nc -z 127.0.0.1 50052 2>/dev/null; then
    echo -e "${GREEN}✅ gRPC Server (50052)${NC}"
else
    echo -e "${RED}❌ gRPC Server (50052)${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 所有服务启动完成！${NC}"
echo ""
echo "📝 服务信息:"
echo "  - Headscale API: http://localhost:8080"
echo "  - SSH Server:    127.0.0.1:2222"
echo "  - gRPC Server:   127.0.0.1:50052"
echo ""
echo "📚 查看日志:"
echo "  - Headscale: docker compose -f headscale/docker-compose.yml logs -f"
echo "  - Shadowd:   tail -f shadowd/shadowd.log"
echo ""
echo "🛑 停止服务:"
echo "  - 运行: ./stop-demo.sh"
echo ""
echo "🧪 测试 SSH 连接:"
echo "  - ssh -i shadowd/test_client_key -p 2222 test@127.0.0.1"
echo ""
