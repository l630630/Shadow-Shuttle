# Shadow Shuttle Logo

Shadow Shuttle 项目的官方 Logo 资源。

## 📁 文件说明

- `logo.svg` - 标准版 Logo（适用于浅色背景）
- `logo-dark.svg` - 深色版 Logo（适用于深色背景，带增强发光效果）

## 🎨 设计说明

### Logo 元素

1. **Webhook 图标**
   - 象征网络连接和数据传输
   - 使用 Material Symbols 风格
   - 代表 Mesh 网络的节点互联

2. **颜色方案**
   - 主色：翠绿色 (#10b981) - 代表安全和活力
   - 渐变：从翠绿到深绿 - 增加层次感
   - 背景：深色容器 - 现代科技感

3. **特效**
   - 外部光晕：营造发光效果
   - 旋转环：表示持续运行和动态连接
   - 脉冲动画：展现活跃状态
   - 连接节点：象征 Mesh 网络的多点连接

### 设计理念

- **安全性**：深色背景和加密连接的视觉隐喻
- **现代化**：渐变色和动画效果展现现代技术
- **连接性**：Webhook 图标和节点表示网络互联
- **简洁性**：清晰的图标设计，易于识别

## 📐 尺寸规格

- 标准尺寸：120x120 像素
- 最小尺寸：48x48 像素（保持清晰度）
- 推荐尺寸：
  - 网站 Header：64x64 或 80x80
  - README：120x120
  - 应用图标：512x512（需要导出为 PNG）

## 🎯 使用场景

### 浅色背景
使用 `logo.svg`：
```markdown
![Shadow Shuttle](assets/logo.svg)
```

### 深色背景
使用 `logo-dark.svg`（增强发光效果）：
```markdown
![Shadow Shuttle](assets/logo-dark.svg)
```

### HTML
```html
<img src="assets/logo.svg" alt="Shadow Shuttle" width="120" height="120">
```

## 🔄 导出其他格式

### 导出为 PNG（高分辨率）

使用 Inkscape 或在线工具：
```bash
# 使用 Inkscape 命令行
inkscape logo.svg --export-type=png --export-width=512 --export-filename=logo.png

# 或使用在线工具
# https://cloudconvert.com/svg-to-png
```

### 导出为 ICO（Windows 图标）
```bash
# 先导出为 PNG，然后转换
convert logo.png -define icon:auto-resize=256,128,64,48,32,16 logo.ico
```

## 🎨 颜色代码

| 颜色名称 | 十六进制 | RGB | 用途 |
|---------|---------|-----|------|
| 翠绿色 | #10b981 | rgb(16, 185, 129) | 主色调、图标 |
| 深绿色 | #059669 | rgb(5, 150, 105) | 渐变终点 |
| 浅绿色 | #34d399 | rgb(52, 211, 153) | 高光、节点 |
| 深蓝灰 | #1e293b | rgb(30, 41, 59) | 容器背景 |
| 极深蓝 | #0f172a | rgb(15, 23, 42) | 深色版背景 |

## 📝 使用规范

### ✅ 推荐做法

- 保持 Logo 的完整性，不要裁剪或变形
- 在浅色背景使用标准版，深色背景使用深色版
- 保持足够的留白空间（至少 Logo 宽度的 10%）
- 使用 SVG 格式以保证清晰度

### ❌ 避免做法

- 不要改变 Logo 的颜色方案
- 不要添加阴影或其他效果（Logo 已内置）
- 不要拉伸或压缩 Logo
- 不要在低对比度背景上使用

## 🔗 相关资源

- [官方网站](https://l630630.github.io/Shadow-Shuttle/)
- [项目仓库](https://github.com/l630630/Shadow-Shuttle)
- [设计系统](../web/src/components/Logo.tsx)

## 📄 许可证

Logo 设计遵循项目的 MIT 许可证。
