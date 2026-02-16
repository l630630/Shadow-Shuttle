# 部署到 GitHub Pages

本指南将帮助你将 Shadow Shuttle 网站部署到 GitHub Pages。

## 前置条件

- GitHub 账号
- 已 fork 或拥有 Shadow-Shuttle 仓库的访问权限

## 部署步骤

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 下拉菜单中选择 **GitHub Actions**

### 2. 触发部署

部署会在以下情况自动触发：

- 推送代码到 `main` 分支且修改了 `web/` 目录下的文件
- 手动触发工作流

#### 手动触发部署

1. 进入仓库的 **Actions** 标签页
2. 在左侧选择 **Deploy to GitHub Pages** 工作流
3. 点击右侧的 **Run workflow** 按钮
4. 选择 `main` 分支
5. 点击 **Run workflow**

### 3. 查看部署状态

1. 在 **Actions** 标签页可以看到工作流运行状态
2. 等待构建和部署完成（通常需要 1-2 分钟）
3. 部署成功后，网站将在以下地址可访问：
   ```
   https://<你的用户名>.github.io/Shadow-Shuttle/
   ```

## 本地测试

在推送到 GitHub 之前，建议先在本地测试构建：

```bash
cd web

# 安装依赖
npm install

# 本地开发预览
npm run dev

# 构建生产版本（模拟 GitHub Pages 环境）
GITHUB_PAGES=true npm run build

# 预览构建结果
npm run preview
```

## 配置说明

### Vite 配置

`web/vite.config.ts` 中的 `base` 配置：

```typescript
base: process.env.GITHUB_PAGES ? '/Shadow-Shuttle/' : './',
```

- 当 `GITHUB_PAGES=true` 时，使用 `/Shadow-Shuttle/` 作为基础路径
- 本地开发时使用 `./` 相对路径

### GitHub Actions 工作流

`.github/workflows/deploy-pages.yml` 配置了自动部署流程：

1. **触发条件**：
   - 推送到 `main` 分支
   - 修改了 `web/` 目录或工作流文件
   - 手动触发

2. **构建步骤**：
   - 检出代码
   - 安装 Node.js 18
   - 安装依赖
   - 构建项目（设置 `GITHUB_PAGES=true`）
   - 上传构建产物

3. **部署步骤**：
   - 部署到 GitHub Pages

## 自定义域名（可选）

如果你想使用自定义域名：

1. 在仓库的 **Settings > Pages** 中配置自定义域名
2. 在 `web/public/` 目录下创建 `CNAME` 文件，内容为你的域名
3. 在域名提供商处配置 DNS 记录

## 故障排除

### 部署失败

1. 检查 Actions 日志查看错误信息
2. 确认 GitHub Pages 已启用且设置为 GitHub Actions
3. 确认仓库有正确的权限设置

### 页面显示 404

1. 确认 `base` 路径配置正确
2. 检查 GitHub Pages 设置中的 URL
3. 等待几分钟让 DNS 生效

### 样式或资源加载失败

1. 检查浏览器控制台的错误信息
2. 确认 `base` 路径与实际部署路径匹配
3. 清除浏览器缓存后重试

## 更新网站

每次修改 `web/` 目录下的文件并推送到 `main` 分支后，GitHub Actions 会自动重新构建和部署网站。

## 注意事项

1. **首次部署**：首次启用 GitHub Pages 可能需要等待几分钟才能访问
2. **缓存**：GitHub Pages 有 CDN 缓存，更新可能需要几分钟才能生效
3. **权限**：确保仓库的 Actions 有写入 Pages 的权限
4. **分支保护**：如果启用了分支保护，确保 Actions 有推送权限

## 相关链接

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
