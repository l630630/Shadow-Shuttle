#!/bin/bash

# Shadow Shuttle - GitHub Pages 部署脚本

set -e

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否在 web 目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 web 目录下运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
GITHUB_PAGES=true npm run build

echo "✅ 构建完成！"
echo ""
echo "📝 接下来的步骤："
echo "1. 提交并推送代码到 GitHub"
echo "   git add ."
echo "   git commit -m 'Update website'"
echo "   git push origin main"
echo ""
echo "2. 在 GitHub 仓库设置中启用 GitHub Pages"
echo "   Settings > Pages > Source: GitHub Actions"
echo ""
echo "3. 等待 GitHub Actions 自动部署"
echo "   查看进度：https://github.com/<你的用户名>/Shadow-Shuttle/actions"
echo ""
echo "4. 访问你的网站："
echo "   https://<你的用户名>.github.io/Shadow-Shuttle/"
