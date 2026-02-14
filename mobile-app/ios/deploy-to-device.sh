#!/bin/bash

# iOS 真机部署脚本
# 使用方法: ./deploy-to-device.sh

set -e

echo "🚀 开始部署到 iOS 真机..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查设备连接
echo "📱 检查设备连接..."
DEVICE_COUNT=$(xcrun xctrace list devices 2>&1 | grep -c "iPhone" || true)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ 未检测到 iPhone 设备${NC}"
    echo "请确保："
    echo "  1. iPhone 已用数据线连接到 Mac"
    echo "  2. iPhone 已解锁"
    echo "  3. 在 iPhone 上点击了'信任此电脑'"
    exit 1
fi

echo -e "${GREEN}✅ 检测到 iPhone 设备${NC}"
xcrun xctrace list devices 2>&1 | grep "iPhone" | head -1
echo ""

# 检查 Metro Bundler
echo "🔍 检查 Metro Bundler..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Metro Bundler 正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  Metro Bundler 未运行，正在启动...${NC}"
    cd ..
    npm start &
    METRO_PID=$!
    echo "Metro PID: $METRO_PID"
    sleep 5
    cd ios
fi
echo ""

# 获取设备 ID
echo "📋 获取设备信息..."
DEVICE_ID=$(xcrun xctrace list devices 2>&1 | grep "iPhone" | grep -v "Simulator" | head -1 | sed -n 's/.*(\([^)]*\))$/\1/p')
echo "设备 ID: $DEVICE_ID"
echo ""

# 构建并部署
echo "🔨 开始构建应用..."
echo "这可能需要几分钟，请耐心等待..."
echo ""

# 使用 xcodebuild 构建
xcodebuild \
    -workspace ShadowShuttleTemp.xcworkspace \
    -scheme ShadowShuttleTemp \
    -configuration Debug \
    -destination "id=$DEVICE_ID" \
    -allowProvisioningUpdates \
    build

echo ""
echo -e "${GREEN}✅ 构建成功！${NC}"
echo ""

# 安装到设备
echo "📲 正在安装到设备..."
xcodebuild \
    -workspace ShadowShuttleTemp.xcworkspace \
    -scheme ShadowShuttleTemp \
    -configuration Debug \
    -destination "id=$DEVICE_ID" \
    -allowProvisioningUpdates \
    install

echo ""
echo -e "${GREEN}🎉 部署成功！${NC}"
echo ""
echo "📝 下一步："
echo "  1. 如果首次安装，在 iPhone 上："
echo "     设置 → 通用 → VPN与设备管理 → 信任开发者"
echo "  2. 如果需要开发者模式（iOS 16+）："
echo "     设置 → 隐私与安全性 → 开发者模式 → 开启并重启"
echo "  3. 应用应该已经在你的 iPhone 上了！"
echo ""
