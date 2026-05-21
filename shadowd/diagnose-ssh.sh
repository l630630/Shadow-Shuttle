#!/bin/bash

# SSH 连接诊断脚本

echo "=== Shadow Shuttle SSH 诊断 ==="
echo ""

# 1. 检查 shadowd 进程
echo "1. 检查 shadowd 进程状态..."
if pgrep -x "shadowd" > /dev/null; then
    echo "   ✓ shadowd 正在运行"
    ps aux | grep shadowd | grep -v grep
else
    echo "   ✗ shadowd 未运行"
    exit 1
fi
echo ""

# 2. 检查端口监听
echo "2. 检查端口监听状态..."
echo "   SSH 端口 (2222):"
if lsof -i :2222 > /dev/null 2>&1; then
    echo "   ✓ 端口 2222 正在监听"
    lsof -i :2222 | grep LISTEN
else
    echo "   ✗ 端口 2222 未监听"
fi

echo ""
echo "   WebSocket 端口 (8022):"
if lsof -i :8022 > /dev/null 2>&1; then
    echo "   ✓ 端口 8022 正在监听"
    lsof -i :8022 | grep LISTEN
else
    echo "   ✗ 端口 8022 未监听"
fi
echo ""

# 3. 检查配置文件
echo "3. 检查配置文件..."
if [ -f "shadowd.yaml" ]; then
    echo "   ✓ 配置文件存在"
    echo ""
    echo "   SSH 配置:"
    grep -A 10 "^ssh:" shadowd.yaml
    echo ""
    echo "   用户配置:"
    grep -A 5 "^  users:" shadowd.yaml
else
    echo "   ✗ 配置文件不存在"
fi
echo ""

# 4. 检查最近的日志
echo "4. 最近的连接日志 (最后 10 条):"
if [ -f "shadowd.log" ]; then
    tail -10 shadowd.log | grep -E "SSH|WebSocket|authentication"
else
    echo "   ✗ 日志文件不存在"
fi
echo ""

# 5. 测试本地 SSH 连接
echo "5. 测试本地 SSH 连接..."
echo "   尝试连接到 localhost:2222..."
timeout 3 bash -c "echo 'test' | nc -w 1 localhost 2222" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ SSH 端口可访问"
else
    echo "   ✗ SSH 端口不可访问"
fi
echo ""

# 6. 测试 WebSocket 连接
echo "6. 测试 WebSocket 连接..."
echo "   尝试连接到 localhost:8022..."
timeout 3 bash -c "echo 'test' | nc -w 1 localhost 8022" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ WebSocket 端口可访问"
else
    echo "   ✗ WebSocket 端口不可访问"
fi
echo ""

# 7. 获取本机 IP 地址
echo "7. 本机 IP 地址:"
echo "   局域网 IP:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   - " $2}'
echo ""

echo "=== 诊断完成 ==="
echo ""
echo "如果所有检查都通过，但移动端仍然无法连接，请检查："
echo "1. 移动设备和电脑是否在同一局域网"
echo "2. 防火墙是否阻止了端口 2222 和 8022"
echo "3. 移动端配置的 IP 地址是否正确"
