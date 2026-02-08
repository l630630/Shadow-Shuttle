#!/bin/bash

# Voice Module Warning 快速修复脚本
# 修复 NativeEventEmitter 警告

set -e

echo "🔧 开始修复 Voice Module 警告..."
echo ""

# 进入 Android 目录
cd "$(dirname "$0")/android"

echo "📦 步骤 1/3: 清理构建缓存..."
./gradlew clean

echo ""
echo "🔨 步骤 2/3: 重新构建应用..."
./gradlew assembleDebug

echo ""
echo "📱 步骤 3/3: 安装到设备..."
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ 修复完成！"
echo ""
echo "请重新启动应用并检查警告是否消失。"
echo ""
echo "如果问题仍然存在，请查看 VOICE_MODULE_FIX.md 了解更多解决方案。"
