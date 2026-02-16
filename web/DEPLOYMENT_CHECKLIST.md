# GitHub Pages 部署检查清单

在部署到 GitHub Pages 之前，请确认以下事项：

## ✅ 部署前检查

### 1. 代码准备
- [ ] 所有更改已提交到 Git
- [ ] 代码已推送到 GitHub 仓库
- [ ] 在 `main` 分支上

### 2. 本地测试
- [ ] 运行 `npm install` 安装依赖
- [ ] 运行 `npm run dev` 测试开发模式
- [ ] 运行 `GITHUB_PAGES=true npm run build` 测试构建
- [ ] 运行 `npm run preview` 预览构建结果
- [ ] 测试所有页面链接是否正常
- [ ] 测试主题切换功能
- [ ] 测试中英文切换功能

### 3. GitHub 设置
- [ ] 仓库已创建或 fork
- [ ] 有仓库的推送权限
- [ ] GitHub Pages 已启用（Settings > Pages）
- [ ] Source 设置为 "GitHub Actions"

### 4. 文件检查
- [ ] `.github/workflows/deploy-pages.yml` 存在
- [ ] `web/public/.nojekyll` 存在
- [ ] `web/vite.config.ts` 中 base 路径配置正确
- [ ] 所有必要的文件都已提交

## 🚀 部署步骤

### 步骤 1: 构建测试
```bash
cd web
GITHUB_PAGES=true npm run build
```

### 步骤 2: 提交代码
```bash
git add .
git commit -m "Deploy website to GitHub Pages"
git push origin main
```

### 步骤 3: 启用 GitHub Pages
1. 访问 https://github.com/<你的用户名>/Shadow-Shuttle/settings/pages
2. 在 "Source" 下选择 "GitHub Actions"
3. 保存设置

### 步骤 4: 触发部署
- 自动触发：推送代码后自动开始
- 手动触发：
  1. 访问 https://github.com/<你的用户名>/Shadow-Shuttle/actions
  2. 选择 "Deploy to GitHub Pages" 工作流
  3. 点击 "Run workflow"

### 步骤 5: 验证部署
1. 等待 Actions 完成（1-2 分钟）
2. 访问 https://<你的用户名>.github.io/Shadow-Shuttle/
3. 测试所有功能

## 🔍 部署后验证

### 功能测试
- [ ] 首页正常显示
- [ ] 中文文档页面正常显示
- [ ] 英文文档页面正常显示
- [ ] Logo 特效正常工作
- [ ] 主题切换正常
- [ ] 所有链接可以正常跳转
- [ ] 图标正常显示
- [ ] 响应式布局正常（测试手机、平板、桌面）

### 性能检查
- [ ] 页面加载速度正常
- [ ] 没有 404 错误
- [ ] 没有控制台错误
- [ ] 图片和资源正常加载

## ❌ 常见问题

### 问题 1: 页面显示 404
**原因**: base 路径配置不正确
**解决**: 
1. 检查 `vite.config.ts` 中的 base 配置
2. 确认仓库名称与配置匹配
3. 重新构建并部署

### 问题 2: 样式丢失
**原因**: 资源路径错误
**解决**:
1. 确认 `GITHUB_PAGES=true` 环境变量已设置
2. 检查浏览器控制台的错误信息
3. 清除浏览器缓存

### 问题 3: Actions 失败
**原因**: 权限或配置问题
**解决**:
1. 检查 Actions 日志
2. 确认 Pages 权限已启用
3. 检查 workflow 文件语法

### 问题 4: 更新不生效
**原因**: CDN 缓存
**解决**:
1. 等待 5-10 分钟
2. 强制刷新浏览器（Ctrl+Shift+R）
3. 清除浏览器缓存

## 📞 获取帮助

如果遇到问题：
1. 查看 [DEPLOY_GITHUB_PAGES.md](./DEPLOY_GITHUB_PAGES.md) 详细文档
2. 检查 GitHub Actions 日志
3. 在仓库提交 Issue
4. 查看 GitHub Pages 官方文档

## 🎉 部署成功！

部署成功后，你的网站将在以下地址可访问：
```
https://<你的用户名>.github.io/Shadow-Shuttle/
```

记得分享给其他人！ 🚀
