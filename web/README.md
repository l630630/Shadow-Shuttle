# Shadow Shuttle Landing Page

Shadow Shuttle 的官方网站 - AI 驱动的移动端服务器管理工具。

通过自然语言和语音控制你的服务器，无需记忆复杂命令。

## 🌐 在线访问

- **GitHub Pages**: https://l630630.github.io/Shadow-Shuttle/
- **本地开发**: http://localhost:5173

## ✨ 网站特色

### 核心信息
- **项目定位**: AI 驱动的移动端服务器管理工具
- **核心价值**: 用自然语言和语音控制服务器
- **目标用户**: 需要移动端管理服务器的开发者和运维人员

### 主要功能展示
- 🤖 AI 原生设计 - 5 个 AI 提供商集成
- 📱 移动优先体验 - 专为手机设计
- 🔒 安全可靠 - WebSocket 加密传输
- 🚀 简单易用 - 自动设备发现

## 📁 项目结构

```
web/
├── public/              # 静态资源
│   ├── favicon.svg     # 网站图标
│   └── .nojekyll       # GitHub Pages 配置
├── src/
│   ├── components/     # React 组件
│   │   ├── Logo.tsx    # Logo 组件（带特效）
│   │   └── README.md   # 组件文档
│   ├── App.tsx         # 首页应用入口
│   ├── docs.tsx        # 中文文档入口
│   ├── docs-en.tsx     # 英文文档入口
│   ├── LandingPage.tsx # 首页组件
│   ├── DocsPage.tsx    # 文档页面组件
│   ├── i18n.ts         # 国际化配置
│   ├── theme.ts        # 主题配置
│   └── index.css       # 全局样式
├── index.html          # 首页 HTML
├── docs.html           # 中文文档 HTML
├── docs-en.html        # 英文文档 HTML
├── vite.config.ts      # Vite 配置
├── tailwind.config.js  # Tailwind CSS 配置
└── package.json        # 项目配置
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看网站。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## 📦 部署到 GitHub Pages

### 方法一：使用部署脚本（推荐）

```bash
./deploy.sh
```

然后按照提示操作。

### 方法二：手动部署

1. **启用 GitHub Pages**
   - 进入仓库 Settings > Pages
   - Source 选择 "GitHub Actions"

2. **推送代码**
   ```bash
   git add .
   git commit -m "Update website"
   git push origin main
   ```

3. **等待部署**
   - 查看 Actions 标签页的部署进度
   - 部署完成后访问：https://<你的用户名>.github.io/Shadow-Shuttle/

详细说明请查看 [DEPLOY_GITHUB_PAGES.md](./DEPLOY_GITHUB_PAGES.md)

## 🎨 功能特性

### 首页
- 现代化的 Hero 区域，突出 AI 驱动特性
- 核心亮点展示：
  - 🤖 AI 原生设计
  - 📱 移动优先体验
  - 🔒 安全可靠
  - 🚀 简单易用
- 使用场景展示（日常运维、故障排查、快速操作等）
- 快速开始代码示例
- 响应式设计
- 深色/浅色主题切换

### 文档页面
- 三栏布局（左侧导航、中间内容、右侧目录）
- 滚动自动高亮当前章节
- 中英文双语支持
- 完整的项目文档
- AI 功能详细说明

### Logo 特效
- 双主题支持（黑白两种）
- 外部光晕效果
- 内部渐变
- 旋转环特效
- 悬停动画

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式**: Tailwind CSS 3
- **图标**: Material Symbols
- **部署**: GitHub Pages + GitHub Actions

## 📝 开发指南

### 添加新页面

1. 创建 HTML 文件（如 `new-page.html`）
2. 创建入口文件（如 `src/new-page.tsx`）
3. 更新 `vite.config.ts` 添加新的入口
4. 构建并测试

### 修改主题色

编辑 `tailwind.config.js`：

```javascript
theme: {
  extend: {
    colors: {
      primary: '#10b981', // 修改为你的主题色
    },
  },
},
```

### 添加新语言

1. 在 `src/i18n.ts` 中添加新语言的翻译
2. 更新 `Lang` 类型定义
3. 在组件中使用新语言

## 🐛 故障排除

### 样式不生效
- 清除浏览器缓存
- 检查 Tailwind CSS 配置
- 确认 `index.css` 已正确导入

### 构建失败
- 删除 `node_modules` 和 `package-lock.json`
- 重新运行 `npm install`
- 检查 Node.js 版本（需要 18+）

### GitHub Pages 404
- 确认 `base` 路径配置正确
- 检查 `.nojekyll` 文件是否存在
- 等待 CDN 缓存更新（可能需要几分钟）

## 📄 许可证

MIT License - 详见项目根目录的 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- GitHub: https://github.com/l630630/Shadow-Shuttle
- Issues: https://github.com/l630630/Shadow-Shuttle/issues
