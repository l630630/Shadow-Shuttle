#!/bin/bash

echo "🧹 完全清理并重建应用"
echo "======================="

# 1. 停止 Metro bundler
echo "1️⃣ 停止 Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# 2. 清理 React Native 缓存
echo "2️⃣ 清理 React Native 缓存..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# 3. 清理 Android 构建
echo "3️⃣ 清理 Android 构建..."
cd android
./gradlew clean
rm -rf .gradle
rm -rf build
rm -rf app/build
cd ..

# 4. 重新安装依赖
echo "4️⃣ 重新安装依赖..."
npm install

# 5. 启动 Metro bundler（后台）
echo "5️⃣ 启动 Metro bundler..."
npm start -- --reset-cache &
METRO_PID=$!

# 等待 Metro 启动
echo "⏳ 等待 Metro 启动..."
sleep 10

# 6. 构建并安装应用
echo "6️⃣ 构建并安装应用..."
cd android
./run-with-correct-node.sh assembleDebug
cd ..

# 7. 设置 ADB 端口转发
echo "7️⃣ 设置 ADB 端口转发..."
adb reverse tcp:8081 tcp:8081

echo ""
echo "✅ 完成！应用已重新构建并安装"
echo ""
echo "📱 现在可以在模拟器中打开应用了"
echo ""
echo "如需停止 Metro bundler，运行："
echo "  kill $METRO_PID"
