#!/bin/bash

echo "🔍 检查 GitHub Pages 部署状态..."
echo ""

REPO="l630630/Shadow-Shuttle"
PAGES_URL="https://l630630.github.io/Shadow-Shuttle/"

echo "📦 仓库: $REPO"
echo "🌐 预期 URL: $PAGES_URL"
echo ""

# 检查 GitHub Actions 状态
echo "1️⃣ 检查 GitHub Actions 工作流..."
curl -s "https://api.github.com/repos/$REPO/actions/runs?per_page=1" | \
  grep -E '"status"|"conclusion"|"name"' | head -6

echo ""
echo ""

# 检查 Pages 是否可访问
echo "2️⃣ 检查网站是否可访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 网站可访问 (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 网站返回 404 - GitHub Pages 可能未启用"
    echo ""
    echo "📝 解决步骤："
    echo "   1. 访问: https://github.com/$REPO/settings/pages"
    echo "   2. 在 'Source' 下选择 'GitHub Actions'"
    echo "   3. 保存设置"
    echo "   4. 等待 1-2 分钟后重试"
else
    echo "⚠️  网站返回 HTTP $HTTP_CODE"
fi

echo ""
echo ""

# 检查构建产物
echo "3️⃣ 检查本地构建..."
if [ -d "dist" ]; then
    echo "✅ dist 目录存在"
    echo "📁 文件列表:"
    ls -lh dist/ | grep -E "\.html$"
else
    echo "❌ dist 目录不存在，需要先构建"
    echo "   运行: npm run build"
fi

echo ""
echo ""
echo "🔗 有用的链接："
echo "   - Actions: https://github.com/$REPO/actions"
echo "   - Settings: https://github.com/$REPO/settings/pages"
echo "   - Website: $PAGES_URL"
