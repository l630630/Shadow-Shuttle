# Logo Component

Shadow Shuttle 的 Logo 组件，支持黑白两种主题，带有多重视觉特效。

## 特性

### 🎨 双主题支持

- **暗黑模式**：深色背景 + 绿色图标 + 强烈发光效果
- **浅色模式**：白色背景 + 深绿图标 + 柔和阴影效果

### ✨ 视觉特效

1. **外部光晕（Glow Effect）**
   - 暗黑模式：绿色发光 + 脉冲动画
   - 浅色模式：柔和的绿色光晕

2. **内部渐变（Inner Glow）**
   - 从主题色到透明的渐变效果
   - 增强立体感

3. **旋转环（Rotating Ring）**
   - 虚线边框
   - 8秒缓慢旋转
   - 营造科技感

4. **阴影效果（Shadow）**
   - 暗黑模式：绿色阴影
   - 浅色模式：灰色阴影

### 🎯 使用方法

```tsx
import { Logo } from './components/Logo';

// 基础使用
<Logo theme={theme} />

// 自定义大小
<Logo theme={theme} size={48} />

// 关闭特效
<Logo theme={theme} showGlow={false} />

// 添加自定义类名
<Logo theme={theme} className="my-custom-class" />
```

### 📐 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'dark' \| 'light'` | 必填 | 主题模式 |
| `size` | `number` | `32` | Logo 尺寸（像素） |
| `showGlow` | `boolean` | `true` | 是否显示特效 |
| `className` | `string` | `''` | 自定义类名 |

### 🎬 动画效果

- **脉冲动画**：2秒循环，使用 cubic-bezier 缓动
- **旋转动画**：8秒线性循环
- **悬停缩放**：在文档页面悬停时放大 110%

### 🎨 颜色方案

**暗黑模式：**
- 背景：`slate-800`
- 边框：`white/10`
- 图标：`primary` (emerald-500)
- 光晕：`primary/20` + 阴影

**浅色模式：**
- 背景：`white`
- 边框：`slate-200`
- 图标：`emerald-600`
- 光晕：`emerald-500/10` + 阴影

### 🔧 技术实现

- 使用 Material Symbols 的 `webhook` 图标
- Tailwind CSS 实现样式和动画
- React + TypeScript
- 响应式设计，自动适配主题
