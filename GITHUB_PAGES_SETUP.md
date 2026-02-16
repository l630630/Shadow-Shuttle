# GitHub Pages 设置指南

## 问题：访问网站显示 404

如果你访问 https://l630630.github.io/Shadow-Shuttle/ 看到 404 页面，请按照以下步骤操作：

## 🔧 解决步骤

### 步骤 1: 启用 GitHub Pages

1. 访问仓库设置页面：
   ```
   https://github.com/l630630/Shadow-Shuttle/settings/pages
   ```

2. 在 **Build and deployment** 部分：
   - **Source**: 选择 `GitHub Actions`
   - 点击保存

### 步骤 2: 手动触发部署

1. 访问 Actions 页面：
   ```
   https://github.com/l630630/Shadow-Shuttle/actions
   ```

2. 选择左侧的 `Deploy to GitHub Pages` 工作流

3. 点击右上角的 `Run workflow` 按钮

4. 选择 `main` 分支

5. 点击绿色的 `Run workflow` 按钮

### 步骤 3: 等待部署完成

- 部署通常需要 1-2 分钟
- 在 Actions 页面可以看到实时进度
- 绿色勾号 ✅ 表示部署成功

### 步骤 4: 访问网站

部署成功后，访问：
```
https://l630630.github.io/Shadow-Shuttle/
```

## 🔍 验证部署

运行检查脚本：
```bash
cd web
./check-deployment.sh
```

## 📋 常见问题

### Q1: 为什么显示 404？

**可能原因：**
1. GitHub Pages 未启用
2. Source 设置不正确（应该是 GitHub Actions）
3. 部署还在进行中
4. DNS 缓存问题

**解决方法：**
1. 确认 Settings > Pages > Source 设置为 `GitHub Actions`
2. 手动触发一次部署
3. 等待 5-10 分钟
4. 清除浏览器缓存（Ctrl+Shift+R）

### Q2: Actions 显示成功但网站还是 404

**解决方法：**
1. 检查 Actions 日志，确认 `deploy` 步骤成功
2. 在 Settings > Pages 中查看部署状态
3. 尝试访问 `https://l630630.github.io/Shadow-Shuttle/index.html`（带文件名）

### Q3: 如何查看部署日志？

1. 访问 https://github.com/l630630/Shadow-Shuttle/actions
2. 点击最新的 "Deploy to GitHub Pages" 运行
3. 查看 `build` 和 `deploy` 步骤的详细日志

## 🎯 快速检查清单

- [ ] GitHub Pages 已启用（Settings > Pages）
- [ ] Source 设置为 "GitHub Actions"
- [ ] 最新的 Actions 运行成功（绿色勾号）
- [ ] 等待了至少 2 分钟
- [ ] 清除了浏览器缓存

## 📞 仍然有问题？

如果按照上述步骤操作后仍然无法访问：

1. **检查仓库可见性**
   - 确保仓库是 Public（公开）
   - Private 仓库需要 GitHub Pro 才能使用 Pages

2. **检查分支**
   - 确认代码在 `main` 分支
   - 工作流配置正确

3. **查看详细日志**
   ```bash
   # 查看最新的 Actions 运行
   gh run list --limit 1
   
   # 查看详细日志
   gh run view --log
   ```

4. **联系支持**
   - 在仓库提交 Issue
   - 附上 Actions 日志截图

## 🔗 相关链接

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [项目 Actions](https://github.com/l630630/Shadow-Shuttle/actions)
- [项目 Settings](https://github.com/l630630/Shadow-Shuttle/settings/pages)

## ✅ 成功标志

当一切正常时，你应该能看到：
- ✅ Actions 显示绿色勾号
- ✅ Settings > Pages 显示 "Your site is live at..."
- ✅ 访问网站看到 Shadow Shuttle 首页
- ✅ Logo 和所有样式正常显示
