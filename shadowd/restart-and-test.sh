#!/bin/bash

echo "🔄 重启 shadowd 并测试 SSH 连接"
echo "=================================="
echo ""

# 1. 停止旧进程
echo "1️⃣ 停止旧的 shadowd 进程..."
pkill -f "./shadowd" || echo "   没有运行中的 shadowd 进程"
sleep 1

# 2. 重新编译
echo ""
echo "2️⃣ 重新编译 shadowd..."
make build
if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi
echo "✅ 编译成功"

# 3. 启动 shadowd
echo ""
echo "3️⃣ 启动 shadowd..."
./shadowd -config shadowd.yaml > shadowd.log 2>&1 &
SHADOWD_PID=$!
echo "   PID: $SHADOWD_PID"

# 等待启动
echo "   等待服务启动..."
sleep 3

# 检查是否启动成功
if ! ps -p $SHADOWD_PID > /dev/null; then
    echo "❌ shadowd 启动失败"
    echo ""
    echo "📋 日志内容："
    tail -20 shadowd.log
    exit 1
fi

echo "✅ shadowd 启动成功"

# 4. 检查端口
echo ""
echo "4️⃣ 检查端口监听..."
echo "   SSH Server (2222):"
lsof -i :2222 | grep LISTEN || echo "   ⚠️  未监听"
echo "   WebSocket Proxy (8022):"
lsof -i :8022 | grep LISTEN || echo "   ⚠️  未监听"
echo "   gRPC Server (50052):"
lsof -i :50052 | grep LISTEN || echo "   ⚠️  未监听"
echo "   HTTP API (8080):"
lsof -i :8080 | grep LISTEN || echo "   ⚠️  未监听"

# 5. 测试 WebSocket 连接
echo ""
echo "5️⃣ 测试 WebSocket SSH 连接..."
if command -v node &> /dev/null; then
    node test-websocket-ssh.js
else
    echo "⚠️  Node.js 未安装，跳过 WebSocket 测试"
    echo "   手动测试命令："
    echo "   node test-websocket-ssh.js"
fi

echo ""
echo "📋 查看实时日志："
echo "   tail -f shadowd.log"
echo ""
echo "🛑 停止 shadowd："
echo "   pkill -f './shadowd'"
