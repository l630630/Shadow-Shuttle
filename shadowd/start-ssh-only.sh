#!/bin/bash

# 仅启动 SSH 服务器的测试脚本
# 跳过 WireGuard 和 gRPC，只测试 SSH 功能

echo "🚀 启动 shadowd SSH 服务器（测试模式）"
echo "========================================"
echo ""

# 检查配置文件
if [ ! -f "shadowd.yaml" ]; then
    echo "❌ 配置文件不存在: shadowd.yaml"
    echo "📝 正在创建测试配置..."
    
    cat > shadowd.yaml << 'EOF'
# Shadowd Test Configuration - SSH Only

headscale:
  url: https://test.example.com
  preauth_key: test-key

ssh:
  enabled: true
  port: 2222
  host_key_path: ./ssh_host_key
  authorized_keys_path: ./authorized_keys
  allowed_networks:
    - 127.0.0.0/8
    - 10.0.0.0/8
    - 192.168.0.0/16
    - 100.64.0.0/10

grpc:
  port: 50051
  tls_enabled: false

device:
  name: MacBook Air
  hostname: 630MacBook-Air.local
EOF
    
    echo "✅ 配置文件已创建"
fi

# 创建 authorized_keys 文件
if [ ! -f "authorized_keys" ]; then
    touch authorized_keys
    echo "✅ 创建了空的 authorized_keys 文件"
fi

echo ""
echo "⚠️  注意: shadowd 需要 WireGuard 连接"
echo "   对于 SSH 测试，我们建议使用系统 SSH 服务器"
echo ""
echo "📝 替代方案："
echo "   1. 使用系统 SSH 服务器（推荐）"
echo "   2. 修改 shadowd 代码以支持独立 SSH 模式"
echo ""
echo "🔧 使用系统 SSH 服务器："
echo "   1. 启用远程登录:"
echo "      sudo systemsetup -setremotelogin on"
echo ""
echo "   2. 在 mobile-app/src/services/sshService.ts 中配置:"
echo "      host: 'localhost'"
echo "      port: 22"
echo ""
echo "   3. 启动代理服务器:"
echo "      ./test-websocket-ssh.sh"
echo ""
echo "   4. 测试连接"
echo ""
