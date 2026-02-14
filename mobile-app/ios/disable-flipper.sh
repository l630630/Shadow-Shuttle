#!/bin/bash

# 禁用 Flipper 以修复构建错误

echo "🔧 禁用 Flipper..."

# 设置环境变量
export NO_FLIPPER=1

# 清理并重新安装 pods
echo "📦 清理 Pods..."
rm -rf Pods
rm -rf Podfile.lock

echo "📦 重新安装 Pods（不包含 Flipper）..."
NO_FLIPPER=1 pod install

echo "✅ 完成！Flipper 已禁用"
echo ""
echo "现在可以在 Xcode 中重新构建了"
