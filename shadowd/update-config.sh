#!/bin/bash

# 更新 shadowd 配置文件以支持局域网连接

echo "=== 更新 Shadowd 配置 ==="
echo ""

CONFIG_FILE="/etc/shadowd/shadowd.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件不存在: $CONFIG_FILE"
    exit 1
fi

echo "备份原配置文件..."
sudo cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ 备份完成"
echo ""

echo "更新配置文件..."
sudo tee "$CONFIG_FILE" > /dev/null <<'EOF'
headscale:
  url: "https://your-headscale-server.com"
  preauth_key: "your-preauth-key"

device:
  name: "630MacBook-Air"

ssh:
  port: 2222
  host_key_path: "/etc/shadowd/ssh_host_key"
  authorized_keys_path: "/etc/shadowd/authorized_keys"
  password_auth_enabled: true
  users:
    a0000: "liu630"
    admin: "liu630"
  allowed_networks:
    - "0.0.0.0/0"  # 允许所有网络（开发环境）

grpc:
  port: 50051
  tls_enabled: false
EOF

echo "✓ 配置文件已更新"
echo ""

echo "重启 shadowd 服务..."
if [ -f "/Library/LaunchDaemons/com.shadowshuttle.shadowd.plist" ]; then
    # macOS
    sudo launchctl unload /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
    sleep 2
    sudo launchctl load /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
    echo "✓ shadowd 服务已重启 (macOS)"
elif [ -f "/etc/systemd/system/shadowd.service" ]; then
    # Linux
    sudo systemctl restart shadowd
    echo "✓ shadowd 服务已重启 (Linux)"
else
    echo "⚠ 无法自动重启服务，请手动重启 shadowd"
    echo "  macOS: sudo launchctl unload/load /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist"
    echo "  Linux: sudo systemctl restart shadowd"
fi

echo ""
echo "等待服务启动..."
sleep 3

echo ""
echo "检查服务状态..."
if pgrep -x "shadowd" > /dev/null; then
    echo "✓ shadowd 正在运行"
else
    echo "✗ shadowd 未运行，请检查日志"
    exit 1
fi

echo ""
echo "检查端口监听..."
if netstat -an | grep "2222" | grep "LISTEN" > /dev/null; then
    echo "✓ SSH 端口 2222 正在监听"
    netstat -an | grep "2222" | grep "LISTEN"
else
    echo "✗ SSH 端口 2222 未监听"
fi

if netstat -an | grep "8022" | grep "LISTEN" > /dev/null; then
    echo "✓ WebSocket 端口 8022 正在监听"
    netstat -an | grep "8022" | grep "LISTEN"
else
    echo "✗ WebSocket 端口 8022 未监听"
fi

echo ""
echo "=== 配置更新完成 ==="
echo ""
echo "现在可以从移动设备连接了！"
echo "连接信息:"
echo "  IP 地址: $(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')"
echo "  SSH 端口: 2222"
echo "  WebSocket 端口: 8022"
echo "  用户名: a0000"
echo "  密码: liu630"
