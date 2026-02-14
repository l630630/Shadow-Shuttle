#!/bin/bash

# 禁用自动签名脚本
# 这样就不需要登录 Apple ID 了

echo "🔧 正在配置手动签名..."

# 修改项目配置，禁用自动签名
# 使用 PlistBuddy 或 sed 修改 project.pbxproj

PROJECT_FILE="ShadowShuttleTemp.xcodeproj/project.pbxproj"

if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ 找不到项目文件"
    exit 1
fi

# 备份原文件
cp "$PROJECT_FILE" "$PROJECT_FILE.backup"

# 修改配置
# 将 ProvisioningStyle = Automatic 改为 Manual
sed -i '' 's/ProvisioningStyle = Automatic;/ProvisioningStyle = Manual;/g' "$PROJECT_FILE"

# 添加 CODE_SIGN_IDENTITY
sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = org.reactjs.native.example.\$(PRODUCT_NAME:rfc1034identifier);/PRODUCT_BUNDLE_IDENTIFIER = com.test.shadowshuttle;\
				CODE_SIGN_IDENTITY = "Apple Development";\
				CODE_SIGN_STYLE = Manual;\
				DEVELOPMENT_TEAM = "";/g' "$PROJECT_FILE"

echo "✅ 配置完成！"
echo ""
echo "现在可以在 Xcode 中："
echo "1. 不需要登录 Apple ID"
echo "2. Team 选择 'None'"
echo "3. 直接运行应用"
