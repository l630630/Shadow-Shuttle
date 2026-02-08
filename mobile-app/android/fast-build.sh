#!/bin/bash

# 快速构建脚本 - 仅构建当前架构

echo "🚀 快速构建模式"
echo "================"
echo ""

# 检查模拟器架构
ARCH=$(adb shell getprop ro.product.cpu.abi | tr -d '\r')
echo "📱 模拟器架构: $ARCH"

# 根据架构设置构建参数
if [[ "$ARCH" == "x86_64" ]]; then
    BUILD_ARCH="x86_64"
elif [[ "$ARCH" == "x86" ]]; then
    BUILD_ARCH="x86"
elif [[ "$ARCH" == "arm64-v8a" ]]; then
    BUILD_ARCH="arm64-v8a"
else
    BUILD_ARCH="armeabi-v7a"
fi

echo "🔨 仅构建架构: $BUILD_ARCH"
echo ""

# 执行快速构建
./gradlew assembleDebug \
    -PreactNativeArchitectures=$BUILD_ARCH \
    --parallel \
    --build-cache \
    --configuration-cache \
    --daemon

echo ""
echo "✅ 构建完成！"
