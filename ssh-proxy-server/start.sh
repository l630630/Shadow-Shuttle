#!/bin/bash

# SSH Proxy Server 启动脚本

echo "🚀 启动 SSH Proxy Server..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo ""
echo "🌐 服务器配置:"
echo "   端口: 8022"
echo "   Android 模拟器地址: ws://10.0.2.2:8022"
echo "   iOS 模拟器地址: ws://localhost:8022"
echo "   真实设备地址: ws://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):8022"
echo ""
echo "📱 确保 mobile-app/src/services/sshService.ts 中的地址配置正确"
echo ""
echo "🔥 启动服务器..."
echo ""

npm start
