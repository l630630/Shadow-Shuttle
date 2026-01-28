# Shadow Shuttle 演示视频录制指南

**版本**: 0.1.0  
**日期**: 2026-01-28

---

## 🎬 视频规划

### 视频结构

**总时长**: 5-8 分钟

1. **开场介绍** (30秒)
   - 项目名称和 Logo
   - 核心价值主张
   - 使用场景

2. **架构概览** (1分钟)
   - 系统架构图
   - 三层架构说明
   - 技术栈介绍

3. **后端演示** (2分钟)
   - Headscale 部署
   - Shadowd 启动
   - SSH 连接测试

4. **移动端演示** (2分钟)
   - VPN 连接
   - 设备发现
   - SSH 终端

5. **总结展望** (30秒)
   - 项目状态
   - 未来规划
   - 联系方式

---

## 🛠️ 录制工具

### macOS 录制工具

**推荐工具**:

1. **QuickTime Player** (免费)
   - 系统自带
   - 简单易用
   - 支持屏幕录制

2. **OBS Studio** (免费)
   - 专业级录制
   - 多场景切换
   - 实时编辑

3. **ScreenFlow** (付费)
   - 专业视频编辑
   - 动画效果
   - 字幕添加

### iOS 录制

**方法 1: 模拟器录制**
```bash
# 启动模拟器
npm run ios

# 录制模拟器
xcrun simctl io booted recordVideo demo.mov

# 停止录制 (Ctrl+C)
```

**方法 2: 实体设备录制**
- 使用 QuickTime Player
- 连接 iPhone 到 Mac
- 文件 -> 新建影片录制
- 选择 iPhone 作为输入源

### Android 录制

**方法 1: 模拟器录制**
```bash
# 使用 ADB
adb shell screenrecord /sdcard/demo.mp4

# 停止录制 (Ctrl+C)

# 下载视频
adb pull /sdcard/demo.mp4
```

**方法 2: Android Studio**
- 打开 Logcat
- 点击录制按钮
- 停止后保存视频

---

## 📝 录制脚本

### 场景 1: 开场介绍 (30秒)

**画面**:
- Shadow Shuttle Logo
- 项目标语: "让远程访问更安全、更简单"

**旁白**:
> "大家好，这是 Shadow Shuttle（影梭），一个基于私有 Mesh 网络的安全 SSH 访问系统。它让你可以随时随地通过移动设备安全地访问远程服务器，无需复杂配置，一键连接。"

**字幕**:
```
Shadow Shuttle (影梭)
安全的远程 SSH 访问解决方案
```

---

### 场景 2: 架构概览 (1分钟)

**画面**:
- 系统架构图 (README.md 中的图)
- 技术栈列表

**旁白**:
> "Shadow Shuttle 采用三层架构设计。底层是 Headscale 协调服务器，负责 Mesh 网络管理和设备注册。中间层是 Shadowd 守护进程，使用 Go 语言开发，提供 SSH 服务器和 gRPC 接口。顶层是 React Native 移动应用，支持 iOS 和 Android 平台。"

**字幕**:
```
三层架构:
1. Headscale - 协调服务器
2. Shadowd - Go 守护进程
3. Mobile App - React Native
```

**操作**:
- 显示架构图
- 高亮每个组件
- 展示技术栈

---

### 场景 3: 后端演示 (2分钟)

#### 3.1 启动服务 (45秒)

**画面**:
- 终端窗口
- 执行启动脚本

**旁白**:
> "让我们开始演示。首先，我们使用快速启动脚本来启动所有服务。"

**操作**:
```bash
# 显示项目结构
tree -L 2 -I 'node_modules|.git'

# 启动服务
./start-demo.sh
```

**字幕**:
```
启动 Shadow Shuttle 演示模式
✅ Headscale 服务器
✅ Shadowd 守护进程
✅ SSH 服务器 (127.0.0.1:2222)
✅ gRPC 服务器 (127.0.0.1:50052)
```

#### 3.2 验证服务 (30秒)

**画面**:
- 终端窗口
- 服务状态检查

**旁白**:
> "所有服务已成功启动。我们可以看到 Headscale 正在运行，Shadowd 已经注册并获得了 Mesh IP。"

**操作**:
```bash
# 检查 Headscale
docker compose -f headscale/docker-compose.yml ps

# 检查端口
nc -zv 127.0.0.1 2222
nc -zv 127.0.0.1 50052
```

**字幕**:
```
服务状态:
✅ Headscale: Up
✅ SSH: Port 2222
✅ gRPC: Port 50052
```

#### 3.3 SSH 连接测试 (45秒)

**画面**:
- 终端窗口
- SSH 连接过程

**旁白**:
> "现在让我们测试 SSH 连接。使用预先配置的密钥，我们可以成功连接到 SSH 服务器。"

**操作**:
```bash
# SSH 连接
ssh -i shadowd/test_client_key -p 2222 test@127.0.0.1

# 显示欢迎信息
# 尝试命令 (虽然是占位符)
```

**字幕**:
```
SSH 连接成功!
✅ 密钥认证
✅ 连接建立
⚠️ 命令执行 (占位符)
```

---

### 场景 4: 移动端演示 (2分钟)

#### 4.1 应用启动 (30秒)

**画面**:
- iOS 模拟器或实体设备
- 应用启动动画

**旁白**:
> "接下来是移动端演示。这是我们的 React Native 应用，支持 iOS 和 Android 平台。"

**操作**:
- 启动应用
- 显示主界面

**字幕**:
```
Shadow Shuttle Mobile
React Native 0.73
TypeScript 5.0
```

#### 4.2 VPN 连接 (30秒)

**画面**:
- VPN 连接界面
- 连接状态变化

**旁白**:
> "首先，我们连接到 VPN。点击连接按钮后，应用会建立到 Mesh 网络的连接。"

**操作**:
- 点击 "Connect VPN"
- 显示连接过程
- 显示 Mesh IP

**字幕**:
```
VPN 连接
✅ 连接成功
Mesh IP: 100.64.0.1
⚠️ 演示模式 (占位符)
```

#### 4.3 设备列表 (30秒)

**画面**:
- 设备列表界面
- 设备详情

**旁白**:
> "在设备列表中，我们可以看到所有已配对的设备。每个设备显示名称、IP 地址和在线状态。"

**操作**:
- 浏览设备列表
- 点击设备查看详情
- 显示设备信息

**字幕**:
```
设备列表
📱 MacBook Pro (在线)
🖥️ Ubuntu Server (离线)
```

#### 4.4 SSH 终端 (30秒)

**画面**:
- 终端界面
- 命令执行

**旁白**:
> "选择一个设备后，我们可以打开 SSH 终端。虽然这是占位符实现，但界面和交互流程都已完成。"

**操作**:
- 连接到设备
- 输入命令
- 显示输出

**字幕**:
```
SSH 终端
✅ 连接建立
✅ 命令输入
⚠️ 模拟执行
```

---

### 场景 5: 总结展望 (30秒)

**画面**:
- 项目统计数据
- GitHub 仓库链接

**旁白**:
> "Shadow Shuttle 目前已完成 96% 的开发工作，测试通过率达到 94.3%。演示模式已经可以使用，生产环境需要集成实际的 WireGuard 库。项目已开源在 GitHub，欢迎大家关注和贡献。"

**字幕**:
```
项目状态:
✅ 完成度: 96%
✅ 测试通过率: 94.3%
✅ 演示就绪
🔗 github.com/l630630/Shadow-Shuttle
```

---

## 🎨 视频制作

### 后期编辑

**推荐工具**:
- **iMovie** (macOS, 免费)
- **DaVinci Resolve** (跨平台, 免费)
- **Final Cut Pro** (macOS, 付费)

**编辑步骤**:

1. **导入素材**
   - 屏幕录制视频
   - 移动端录制视频
   - 架构图和截图

2. **剪辑**
   - 删除多余部分
   - 调整播放速度
   - 添加转场效果

3. **添加字幕**
   - 中英文双语字幕
   - 关键信息高亮
   - 代码片段展示

4. **添加音频**
   - 背景音乐 (轻柔、专业)
   - 旁白录制
   - 音效 (可选)

5. **调色和特效**
   - 统一色调
   - 添加 Logo 水印
   - 片头片尾动画

### 字幕模板

**SRT 格式**:
```srt
1
00:00:00,000 --> 00:00:05,000
Shadow Shuttle (影梭)
安全的远程 SSH 访问解决方案

2
00:00:05,000 --> 00:00:10,000
让你可以随时随地通过移动设备
安全地访问远程服务器
```

### 背景音乐推荐

**免费音乐库**:
- YouTube Audio Library
- Free Music Archive
- Incompetech

**风格建议**:
- 科技感
- 专业
- 不抢戏

---

## 📤 视频发布

### 视频格式

**推荐设置**:
- 分辨率: 1920x1080 (1080p)
- 帧率: 30fps 或 60fps
- 编码: H.264
- 音频: AAC, 128kbps

### 发布平台

1. **YouTube**
   - 标题: "Shadow Shuttle - 安全的远程 SSH 访问系统演示"
   - 描述: 包含项目链接和功能介绍
   - 标签: ssh, vpn, wireguard, react-native, golang

2. **Bilibili** (中文)
   - 标题: "影梭 Shadow Shuttle - 基于 Mesh 网络的安全 SSH 访问系统"
   - 分区: 科技 -> 软件应用
   - 标签: 开源, SSH, VPN, 移动开发

3. **GitHub**
   - 添加到 README.md
   - 创建 Release 时附带视频链接

### 视频描述模板

```markdown
# Shadow Shuttle (影梭) - 演示视频

## 项目简介
Shadow Shuttle 是一个基于私有 Mesh 网络的安全 SSH 访问系统，让你可以随时随地通过移动设备安全地访问远程服务器。

## 核心特性
- 🔒 基于 WireGuard 的私有 Mesh 网络
- 📱 移动优先的直观界面
- ⚡ QR 码配对，一键连接
- 🌐 跨平台支持 (iOS/Android/Windows/macOS/Linux)

## 技术栈
- 后端: Go 1.25+, WireGuard, gRPC
- 前端: React Native 0.73, TypeScript 5.0
- 基础设施: Headscale, Docker

## 项目状态
- 完成度: 96%
- 测试通过率: 94.3%
- 演示模式: ✅ 可用
- 生产模式: 需要 WireGuard 集成

## 链接
- GitHub: https://github.com/l630630/Shadow-Shuttle
- 文档: https://github.com/l630630/Shadow-Shuttle/tree/main/docs
- Issues: https://github.com/l630630/Shadow-Shuttle/issues

## 时间轴
00:00 - 开场介绍
00:30 - 架构概览
01:30 - 后端演示
03:30 - 移动端演示
05:30 - 总结展望

## 许可证
MIT License

#SSH #VPN #WireGuard #ReactNative #Golang #OpenSource
```

---

## 📊 录制检查清单

### 录制前

- [ ] 清理桌面和终端
- [ ] 准备演示数据
- [ ] 测试所有功能
- [ ] 准备旁白脚本
- [ ] 检查录制设备

### 录制中

- [ ] 保持流畅操作
- [ ] 避免长时间等待
- [ ] 突出关键功能
- [ ] 控制录制时长
- [ ] 记录问题和重录点

### 录制后

- [ ] 检查视频质量
- [ ] 检查音频清晰度
- [ ] 剪辑多余部分
- [ ] 添加字幕和特效
- [ ] 导出最终版本

---

## 🎯 质量标准

### 视频质量
- 清晰度: 1080p 最低
- 流畅度: 无卡顿
- 色彩: 自然真实

### 音频质量
- 清晰度: 无杂音
- 音量: 适中均衡
- 背景音乐: 不抢戏

### 内容质量
- 逻辑清晰
- 重点突出
- 时长适中
- 信息准确

---

## 📚 参考资料

- [YouTube 创作者学院](https://creatoracademy.youtube.com/)
- [视频制作最佳实践](https://support.google.com/youtube/answer/1722171)
- [屏幕录制技巧](https://www.techsmith.com/blog/screen-recording-tips/)

---

**录制完成后，请将视频链接更新到 README.md 和项目文档中。**
