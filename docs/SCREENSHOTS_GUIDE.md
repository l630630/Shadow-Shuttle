# Shadow Shuttle 截图和文档完善指南

**版本**: 0.1.0  
**日期**: 2026-01-28

---

## 📸 截图规划

### 截图列表

#### 后端截图

1. **Headscale 部署**
   - 文件名: `headscale-deployment.png`
   - 内容: Docker Compose 启动过程
   - 尺寸: 1920x1080

2. **Shadowd 启动**
   - 文件名: `shadowd-startup.png`
   - 内容: Shadowd 启动日志
   - 尺寸: 1920x1080

3. **SSH 连接**
   - 文件名: `ssh-connection.png`
   - 内容: SSH 连接成功界面
   - 尺寸: 1920x1080

4. **服务状态**
   - 文件名: `services-status.png`
   - 内容: 所有服务运行状态
   - 尺寸: 1920x1080

#### 移动端截图

5. **启动界面**
   - 文件名: `mobile-splash.png`
   - 内容: 应用启动画面
   - 尺寸: 1170x2532 (iPhone 14 Pro)

6. **VPN 连接**
   - 文件名: `mobile-vpn-connection.png`
   - 内容: VPN 连接界面
   - 尺寸: 1170x2532

7. **设备列表**
   - 文件名: `mobile-device-list.png`
   - 内容: 设备列表界面
   - 尺寸: 1170x2532

8. **QR 扫描**
   - 文件名: `mobile-qr-scanner.png`
   - 内容: QR 码扫描界面
   - 尺寸: 1170x2532

9. **SSH 终端**
   - 文件名: `mobile-terminal.png`
   - 内容: SSH 终端界面
   - 尺寸: 1170x2532

10. **设备详情**
    - 文件名: `mobile-device-detail.png`
    - 内容: 设备详细信息
    - 尺寸: 1170x2532

#### 架构图

11. **系统架构**
    - 文件名: `architecture-diagram.png`
    - 内容: 完整系统架构图
    - 尺寸: 2000x1500

12. **数据流图**
    - 文件名: `data-flow-diagram.png`
    - 内容: 数据流向示意图
    - 尺寸: 2000x1500

---

## 📁 目录结构

```
docs/
├── screenshots/
│   ├── backend/
│   │   ├── headscale-deployment.png
│   │   ├── shadowd-startup.png
│   │   ├── ssh-connection.png
│   │   └── services-status.png
│   ├── mobile/
│   │   ├── mobile-splash.png
│   │   ├── mobile-vpn-connection.png
│   │   ├── mobile-device-list.png
│   │   ├── mobile-qr-scanner.png
│   │   ├── mobile-terminal.png
│   │   └── mobile-device-detail.png
│   └── architecture/
│       ├── architecture-diagram.png
│       └── data-flow-diagram.png
├── MOBILE_APP_TESTING.md
├── DEMO_VIDEO_GUIDE.md
└── SCREENSHOTS_GUIDE.md
```

---

## 🎨 截图规范

### 通用规范

**分辨率**:
- 桌面截图: 1920x1080 (Full HD)
- 移动端截图: 1170x2532 (iPhone 14 Pro)
- 架构图: 2000x1500 或更高

**格式**:
- PNG (无损压缩)
- 质量: 最高
- 背景: 透明或白色

**命名规范**:
- 小写字母
- 使用连字符分隔
- 描述性名称
- 例如: `mobile-vpn-connection.png`

### 桌面截图规范

**终端设置**:
- 字体: Monaco 或 Menlo
- 字号: 14pt
- 主题: 深色或浅色 (统一)
- 窗口大小: 全屏或固定尺寸

**内容要求**:
- 清晰可读
- 突出重点
- 隐藏敏感信息
- 添加必要注释

### 移动端截图规范

**设备选择**:
- iOS: iPhone 14 Pro (推荐)
- Android: Pixel 7 Pro (推荐)

**截图方法**:
- iOS: Command + S (模拟器)
- Android: Volume Down + Power (实体设备)

**内容要求**:
- 显示状态栏
- 完整界面
- 真实数据
- 自然交互状态

---

## 🖼️ 截图工具

### macOS 截图工具

1. **系统截图** (Command + Shift + 4)
   - 选择区域截图
   - 自动保存到桌面

2. **CleanShot X** (付费)
   - 专业截图工具
   - 注释和编辑
   - 云端分享

3. **Snagit** (付费)
   - 屏幕录制和截图
   - 丰富的编辑功能
   - 模板和样式

### 移动端截图工具

1. **iOS 模拟器**
   ```bash
   # 截图
   xcrun simctl io booted screenshot screenshot.png
   
   # 录制
   xcrun simctl io booted recordVideo video.mov
   ```

2. **Android 模拟器**
   ```bash
   # 截图
   adb shell screencap -p /sdcard/screenshot.png
   adb pull /sdcard/screenshot.png
   
   # 录制
   adb shell screenrecord /sdcard/video.mp4
   ```

### 图片编辑工具

1. **Preview** (macOS, 免费)
   - 基础编辑
   - 裁剪和调整
   - 添加注释

2. **Figma** (免费)
   - 专业设计工具
   - 矢量编辑
   - 协作功能

3. **Photoshop** (付费)
   - 专业图片编辑
   - 高级特效
   - 批量处理

---

## 📝 文档完善清单

### README.md 更新

- [ ] 添加项目 Logo
- [ ] 添加演示视频链接
- [ ] 添加截图展示
- [ ] 更新项目状态
- [ ] 添加贡献者列表

**截图位置**:
```markdown
## 📸 截图展示

### 后端服务

![Headscale 部署](docs/screenshots/backend/headscale-deployment.png)
![Shadowd 启动](docs/screenshots/backend/shadowd-startup.png)

### 移动端应用

<p align="center">
  <img src="docs/screenshots/mobile/mobile-device-list.png" width="250" />
  <img src="docs/screenshots/mobile/mobile-terminal.png" width="250" />
  <img src="docs/screenshots/mobile/mobile-qr-scanner.png" width="250" />
</p>
```

### 模块文档更新

#### headscale/README.md

- [ ] 添加部署截图
- [ ] 添加配置示例
- [ ] 添加故障排除截图
- [ ] 更新命令示例

#### shadowd/README.md

- [ ] 添加启动截图
- [ ] 添加日志示例
- [ ] 添加测试结果
- [ ] 更新 API 文档

#### mobile-app/README.md

- [ ] 添加界面截图
- [ ] 添加功能演示
- [ ] 添加安装步骤截图
- [ ] 更新依赖列表

### 新增文档

#### CONTRIBUTING.md

```markdown
# 贡献指南

## 如何贡献

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 代码规范

- Go: `gofmt`
- TypeScript: ESLint + Prettier
- 提交信息: Conventional Commits

## 测试要求

- 单元测试覆盖率 > 80%
- 所有测试必须通过
- 添加必要的文档

## 截图要求

- 新功能需要提供截图
- 遵循截图规范
- 更新相关文档
```

#### CHANGELOG.md

```markdown
# 更新日志

## [0.1.0] - 2026-01-28

### 新增
- ✅ Headscale 协调服务器部署
- ✅ Shadowd 守护进程核心功能
- ✅ React Native 移动应用
- ✅ 演示模式支持
- ✅ 完整文档和测试

### 已知限制
- ⚠️ WireGuard 使用占位符实现
- ⚠️ 移动端使用模拟连接
- ⚠️ 需要集成原生模块

### 文档
- 📚 完整的 README
- 📚 部署指南
- 📚 测试报告
- 📚 API 文档
```

#### SECURITY.md

```markdown
# 安全政策

## 支持的版本

| 版本 | 支持状态 |
| --- | --- |
| 0.1.x | ✅ |

## 报告漏洞

如果发现安全漏洞，请通过以下方式报告：

1. **不要**公开披露
2. 发送邮件到: security@shadowshuttle.com
3. 包含详细信息和复现步骤
4. 等待我们的回复

## 安全最佳实践

- 使用强密码
- 定期更新密钥
- 启用双因素认证
- 监控访问日志
```

---

## 🎯 截图拍摄指南

### 后端截图步骤

#### 1. Headscale 部署

```bash
# 1. 清理终端
clear

# 2. 启动部署
cd headscale
./scripts/deploy.sh

# 3. 等待启动完成
# 4. 截图 (Command + Shift + 4)
# 5. 保存为 headscale-deployment.png
```

#### 2. Shadowd 启动

```bash
# 1. 清理终端
clear

# 2. 启动 Shadowd
cd shadowd
./shadowd -config test-run-config.yaml

# 3. 等待启动日志
# 4. 截图启动成功的日志
# 5. 保存为 shadowd-startup.png
```

#### 3. SSH 连接

```bash
# 1. 新建终端窗口
# 2. SSH 连接
ssh -i shadowd/test_client_key -p 2222 test@127.0.0.1

# 3. 显示欢迎信息
# 4. 截图连接成功界面
# 5. 保存为 ssh-connection.png
```

### 移动端截图步骤

#### 1. 启动应用

```bash
# 1. 启动模拟器
npm run ios

# 2. 等待应用加载
# 3. 截图启动界面
xcrun simctl io booted screenshot mobile-splash.png
```

#### 2. VPN 连接

```bash
# 1. 点击 Connect VPN
# 2. 等待连接完成
# 3. 截图连接成功界面
xcrun simctl io booted screenshot mobile-vpn-connection.png
```

#### 3. 设备列表

```bash
# 1. 导航到设备列表
# 2. 确保有测试数据
# 3. 截图设备列表界面
xcrun simctl io booted screenshot mobile-device-list.png
```

#### 4. SSH 终端

```bash
# 1. 选择设备并连接
# 2. 输入几个测试命令
# 3. 截图终端界面
xcrun simctl io booted screenshot mobile-terminal.png
```

---

## 🖌️ 截图后期处理

### 添加注释

使用 Preview 或其他工具添加注释：

1. **箭头**: 指向重要元素
2. **文字**: 说明关键功能
3. **高亮**: 突出重点区域
4. **模糊**: 隐藏敏感信息

### 统一风格

1. **边框**: 添加统一的边框
2. **阴影**: 添加轻微阴影
3. **背景**: 使用统一背景色
4. **水印**: 添加项目 Logo (可选)

### 优化大小

```bash
# 使用 ImageMagick 批量优化
for file in *.png; do
  convert "$file" -quality 85 -resize 1920x1080\> "optimized/$file"
done
```

---

## 📊 文档完善进度

### 核心文档

- [x] README.md - 项目总览
- [x] LICENSE - MIT 许可证
- [x] .gitignore - Git 忽略规则
- [ ] CONTRIBUTING.md - 贡献指南
- [ ] CHANGELOG.md - 更新日志
- [ ] SECURITY.md - 安全政策

### 模块文档

- [x] headscale/README.md
- [x] shadowd/README.md
- [x] mobile-app/README.md
- [ ] 添加截图到各模块文档

### 指南文档

- [x] MVP_DEPLOYMENT_GUIDE.md
- [x] MVP_DEMO_SCRIPT.md
- [x] DEMO_MODE_SUCCESS.md
- [x] docs/MOBILE_APP_TESTING.md
- [x] docs/DEMO_VIDEO_GUIDE.md
- [x] docs/SCREENSHOTS_GUIDE.md

### 测试文档

- [x] COMPREHENSIVE_TEST_REPORT.md
- [x] TEST_FIXES_SUMMARY.md
- [x] LOCAL_TEST_REPORT.md

---

## 🚀 发布前检查

### 文档检查

- [ ] 所有链接有效
- [ ] 截图清晰完整
- [ ] 代码示例正确
- [ ] 拼写和语法检查
- [ ] 格式统一规范

### 截图检查

- [ ] 所有截图已添加
- [ ] 文件名符合规范
- [ ] 尺寸和格式正确
- [ ] 内容清晰可读
- [ ] 已优化文件大小

### 视频检查

- [ ] 演示视频已录制
- [ ] 视频质量符合标准
- [ ] 已上传到平台
- [ ] 链接已添加到文档

---

## 📚 参考资料

- [GitHub 文档最佳实践](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions)
- [README 模板](https://github.com/othneildrew/Best-README-Template)
- [截图工具对比](https://www.techradar.com/best/best-screenshot-tools)

---

**完成截图和文档后，请提交 Pull Request 或直接推送到主分支。**
