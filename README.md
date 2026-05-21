<div align="center">
  <img src="https://l630630.github.io/Shadow-Shuttle/favicon.svg" alt="Shadow Shuttle Logo" width="120" height="120">

  <h1>Shadow Shuttle (影梭)</h1>

  <p><strong>AI 驱动的移动端服务器管理工具</strong></p>
  <p>用自然语言和语音控制你的服务器，无需记忆复杂命令</p>

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Go Version](https://img.shields.io/badge/go-1.21+-00ADD8.svg)](https://golang.org)
  [![React Native](https://img.shields.io/badge/react--native-0.73-61DAFB.svg)](https://reactnative.dev)
  [![Status](https://img.shields.io/badge/status-v0.2.0-green.svg)]()

  [English](README.md) | [官方网站](https://l630630.github.io/Shadow-Shuttle/)

  **💻 本地预览网站**: `cd web && npm install && npm run dev`

</div>

---

## 项目简介

Shadow Shuttle（影梭）是一个 **AI 驱动的移动端服务器管理工具**，让你可以通过自然语言和语音在手机上轻松控制和管理远程服务器，无需记忆复杂的命令。

### 💡 核心亮点

**🤖 AI 原生设计**
- 用自然语言描述需求，AI 自动生成并执行命令
- 支持语音输入，解放双手
- 集成 5 个主流 AI 提供商（Claude/Gemini/OpenAI/DeepSeek/SiliconFlow）
- AI 可分析终端输出，提供智能建议和故障排查

**📱 移动优先体验**
- 专为手机设计的直观界面
- 一键连接，无需复杂配置
- 命令历史和收藏，快速重用
- 支持 iOS 和 Android

**🔒 安全可靠**
- WebSocket 加密传输
- 本地设备发现（mDNS）
- 敏感信息自动过滤
- 私有 Mesh 网络架构（开发中）

**🚀 简单易用**
- 手动添加或 QR 码扫描配对
- 自动发现局域网设备
- 完整的依赖注入架构，易于扩展

### 🎯 使用场景

- **日常运维**: "帮我查看服务器负载" → AI 执行 `top` 并解读结果
- **故障排查**: "为什么 Nginx 启动失败？" → AI 检查日志并给出解决方案
- **快速操作**: "重启 Docker 容器" → AI 生成并执行相应命令
- **学习工具**: 不懂命令？用自然语言描述，AI 教你正确的命令
- **家庭服务器**: 语音控制家里的 NAS、树莓派等设备
- **开发调试**: 快速访问开发环境，查看日志、重启服务

## 系统架构

Shadow Shuttle 采用客户端-服务端架构，AI 作为核心交互层：

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (移动端)                   │
│                 React Native + TypeScript                │
├─────────────────────────────────────────────────────────┤
│  🎤 语音输入  →  🤖 AI 对话  →  📱 终端执行  →  📊 结果分析 │
│                                                          │
│  • 5 个 AI 提供商集成 (Claude/Gemini/OpenAI/...)        │
│  • 自然语言转命令 (NL Controller)                        │
│  • 设备管理（手动添加/QR扫码/自动发现）                   │
│  • SSH 终端 (WebSocket)                                  │
│  • 命令历史和收藏                                         │
│  • VPN 架构 (开发中)                                     │
└────────────────┬────────────────────────────────────────┘
                 │ WebSocket (8022)
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Shadowd Daemon (服务端守护进程)              │
│                      Go 语言实现                          │
├─────────────────────────────────────────────────────────┤
│  • SSH 服务器 (2222)                                     │
│  • WebSocket SSH 代理 (8022)                             │
│  • gRPC 接口 (50052)                                     │
│  • mDNS 设备发现                                         │
│  • HTTP 设备 API                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         Headscale Server (协调服务器 - 规划中)           │
│  • Mesh 网络管理                                         │
│  • 设备注册                                              │
│  • DERP 中继                                             │
└─────────────────────────────────────────────────────────┘
```

**工作流程**:
1. 用户通过语音或文字向 AI 描述需求
2. AI 理解意图，生成对应的 Shell 命令
3. 命令通过 WebSocket 发送到 Shadowd
4. Shadowd 在目标服务器上执行命令
5. 执行结果返回给 AI 进行分析和解读
6. 用户收到易懂的结果说明

## 快速开始

### 三步开始使用

#### 第一步：启动服务端

在你的服务器或电脑上运行 Shadowd：

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

服务启动后会自动：
- 开启 SSH 服务 (端口 2222)
- 启动 WebSocket 代理 (端口 8022)
- 开始 mDNS 广播（局域网自动发现）

#### 第二步：安装移动应用

```bash
cd mobile-app
npm install

# iOS
npm run ios

# Android
npm run android
```

#### 第三步：配置 AI 并开始使用

1. **添加设备**
   - 方式一：应用会自动发现局域网设备
   - 方式二：手动输入 IP 地址和密码
   - 方式三：扫描 QR 码快速配对

2. **配置 AI**（可选，但强烈推荐）
   - 进入「个人中心」→「AI 提供商配置」
   - 选择一个 AI 提供商（推荐 Claude 或 Gemini）
   - 填入 API Key

3. **开始使用**
   - 进入「AI 聊天」页面
   - 说出或输入你的需求，例如：
     - "查看系统负载"
     - "重启 Nginx"
     - "找出占用内存最多的进程"
   - AI 会自动生成并执行命令，给你易懂的结果

### 本地网络使用（推荐）

这是目前最稳定的使用方式，适合：
- 家庭网络内管理 NAS、树莓派
- 办公室内访问开发服务器
- 同一局域网的设备管理

**优势**：
- 无需配置 VPN
- 自动设备发现
- 低延迟，响应快

### 跨网访问（开发中）

⚠️ **注意**: WireGuard VPN 功能目前处于开发阶段（架构完成 70%，核心协议集成待完成）。

**临时解决方案**：
1. 使用 Tailscale 或 ZeroTier 建立 Mesh 网络
2. 或使用传统 VPN + 端口转发
3. 配合本项目的 AI 终端功能使用

**已完成的 VPN 模块**：
- ✅ VPN 服务架构设计
- ✅ 配置管理和 Headscale 集成
- ✅ 自动重连和网络监控
- ✅ iOS 原生桥接框架
- ⏳ WireGuardKit 协议集成（待完成）

## 移动端使用

### 添加设备

**方式一：手动添加（推荐）**

1. 在应用中点击右下角 "+" 按钮
2. 填写设备信息：
   - IP 地址（局域网 IP 或公网 IP）
   - SSH 端口（默认 2222）
   - 用户名
   - 密码
3. 点击「添加设备」完成添加

**方式二：扫码配对**

1. 在目标设备上运行: `shadowd-generate-qr`（或 macOS 使用一键部署应用）
2. 在应用中点击 "+" → 选择「扫描二维码」
3. 扫描二维码后设备自动添加

**方式三：自动发现（局域网）**

1. 确保设备和手机在同一局域网
2. Shadowd 会通过 mDNS 自动广播
3. 应用会自动发现并显示可用设备

### 访问终端

1. 从设备列表选择设备
2. 进入 SSH 终端，自动建立 WebSocket 连接
3. 输入命令并执行
4. 可在「命令历史」页查看历史记录，或在「命令收藏」中管理常用命令

### AI 聊天

Shadow Shuttle 的核心功能 - 通过 AI 对话来管理服务器，无需记忆复杂命令。

**支持的 AI 提供商**:
- **Claude** (Anthropic) - 推理能力强，适合复杂问题分析
- **Gemini** (Google) - 多模态支持，响应快速
- **OpenAI** (GPT-4/3.5) - 通用性好，命令生成准确
- **DeepSeek** - 国内可用，性价比高
- **SiliconFlow** - 高性价比，多模型选择

**核心功能**:
- 🎤 **语音输入**: 说出需求，AI 自动理解并执行
- 🤖 **智能命令生成**: 自然语言转换为精确的 Shell 命令
- 📊 **输出分析**: AI 解读终端输出，提供人类可读的解释
- 🔍 **故障诊断**: 描述问题，AI 帮你排查和解决
- 💡 **学习助手**: 不懂命令？AI 教你正确用法
- 🔒 **隐私保护**: 敏感信息自动过滤，不会泄露到 AI 服务
- 📝 **对话历史**: 保存对话记录，方便回顾

**使用示例**:

```
你: "帮我查看服务器 CPU 和内存使用情况"
AI: 执行 top 命令，并解读：
    "当前 CPU 使用率 23%，内存使用 4.2GB/16GB (26%)，
     系统运行正常，负载较低。"

你: "为什么 Nginx 启动失败？"
AI: 1. 检查 systemctl status nginx
    2. 查看错误日志
    3. 发现端口 80 被占用
    4. 建议：先停止占用端口的进程，或修改 Nginx 端口

你: 🎤 "重启 Docker 容器"
AI: 执行 docker restart <container_name>
    "容器已成功重启"
```

**配置方法**:
1. 进入「个人中心」→「AI 提供商配置」
2. 选择一个或多个 AI 提供商
3. 填入对应的 API Key
4. 开始使用 AI 聊天功能

**最佳实践**:
- 描述需求时尽量具体，AI 会给出更准确的命令
- 可以让 AI 解释命令的作用，学习 Linux 知识
- 对于复杂任务，可以分步骤与 AI 对话
- 使用语音输入时，在安静环境下效果更好

## 项目结构

```
shadow-shuttle/
├── shadowd/           # Go 守护进程（服务端）
│   ├── ssh/           # SSH 服务器
│   ├── websocket/     # WebSocket SSH 代理
│   ├── grpc/          # gRPC 接口
│   ├── network/       # mDNS 设备发现
│   ├── service/       # 系统服务管理 (macOS/Linux/Windows)
│   ├── cmd/           # CLI 工具 (QR码生成、服务安装等)
│   └── http/          # HTTP 设备 API
├── mobile-app/        # React Native 移动应用
│   ├── src/
│   │   ├── screens/   # 11 个页面 (设备列表/终端/AI聊天/历史/收藏/个人中心等)
│   │   ├── components/# UI 组件 (聊天气泡/设备卡片/终端/历史记录等)
│   │   ├── services/  # 业务服务层
│   │   │   ├── ai/    # AI 服务 (5个提供商)
│   │   │   ├── vpn/   # VPN 服务架构 (开发中)
│   │   │   ├── skills/# AI 技能系统
│   │   │   └── ...    # SSH/发现/错误恢复等
│   │   ├── hooks/     # React Hooks (AI/SSH/语音/主题等)
│   │   ├── stores/    # Zustand 状态管理
│   │   ├── core/      # 依赖注入容器
│   │   └── types/     # TypeScript 类型定义
│   ├── ios/           # iOS 原生代码
│   │   ├── VPN/       # VPN 原生模块 (开发中)
│   │   └── Core/      # DI 容器
│   ├── android/       # Android 原生代码
│   └── docs/          # 开发文档
├── web/               # 介绍网站 (Vite + React + Tailwind)
├── headscale/         # Headscale 协调服务器配置 (规划中)
├── scripts/           # 跨平台安装脚本
├── mac-automation/    # macOS 自动化脚本
└── .agents/           # AI Agent 技能库
    └── skills/        # Vercel 最佳实践等
```

## 文档

- [介绍网站](web/README.md) - 项目介绍单页（`cd web && npm run dev` 本地预览）
- [移动端文档](mobile-app/docs/README.md) - 移动应用开发指南
  - [前端技术栈与优化](mobile-app/docs/前端技术栈与优化.md)
  - [如何新增 AI 提供商](mobile-app/docs/如何新增AI提供商.md)
  - [AI Service 架构图](mobile-app/docs/AI-Service-架构图.md)
- [Shadowd 文档](shadowd/README.md) - Shadowd 守护进程说明
- [VPN 服务文档](mobile-app/src/services/vpn/README.md) - VPN 模块架构（开发中）
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发

## 安全特性

### 当前实现

- **SSH 密码认证**: 支持密码登录（密钥认证规划中）
- **WebSocket 加密**: 所有 SSH 流量通过 WebSocket 加密传输
- **设备指纹验证**: 配对码时间戳验证（防重放）
- **平台安全存储**: 使用 Keychain (iOS) / KeyStore (Android) 存储敏感数据
- **AI 隐私保护**: 自动过滤敏感信息，避免泄露到 AI 服务

### 规划中

- **私有 Mesh 网络**: 基于 WireGuard 的端到端加密（架构已完成，协议集成中）
- **SSH 密钥认证**: 替代密码认证，提高安全性
- **零信任架构**: 网络隔离和访问控制
- **审计日志**: 完整的操作记录和审计追踪
- **自动密钥轮换**: 定期更新加密密钥

## 技术栈

### 后端

- **语言**: Go 1.21
- **网络**: WireGuard, gRPC
- **服务**: systemd, launchd, Windows Service
- **测试**: Go testing, testify

### 前端

- **框架**: React Native 0.73
- **语言**: TypeScript 5.0
- **状态管理**: Zustand 5.x
- **导航**: React Navigation 6.x
- **存储**: MMKV + AsyncStorage
- **语音**: @react-native-voice/voice, expo-speech

### Web

- **框架**: Vite 5 + React 18
- **样式**: Tailwind CSS 3.4

### AI 集成

- **Claude** (Anthropic) - 推理能力强
- **Gemini** (Google) - 多模态支持
- **OpenAI** (GPT-4/3.5) - 通用性好
- **DeepSeek** - 国内可用
- **SiliconFlow** - 高性价比

### 基础设施

- **协调**: Headscale (Docker)
- **容器**: Docker Compose
- **配置**: YAML

## 项目状态

### 当前版本: 0.2.0

#### ✅ 已完成功能

| 模块                        | 状态      | 说明 |
| --------------------------- | --------- | ------ |
| Shadowd WebSocket 代理      | ✅ 完成   | SSH over WebSocket，稳定可用 |
| 移动端 SSH 终端             | ✅ 完成   | 完整的终端模拟器 |
| WebSocket 连接              | ✅ 完成   | 自动重连、心跳检测 |
| 密码认证                    | ✅ 完成   | SSH 密码登录 |
| 设备管理                    | ✅ 完成   | 添加/删除/编辑设备 |
| 设备发现                    | ✅ 完成   | mDNS 自动发现 + HTTP API |
| 命令历史                    | ✅ 完成   | 历史记录、搜索、过滤 |
| 命令收藏                    | ✅ 完成   | 收藏常用命令 |
| AI 聊天                     | ✅ 完成   | 5 个 AI 提供商集成 |
| 语音输入                    | ✅ 完成   | 语音转文字 |
| 用户登录                    | ✅ 完成   | 本地认证 |
| 个人中心                    | ✅ 完成   | AI 配置、隐私设置 |
| 依赖注入架构                | ✅ 完成   | 完整的 DI 容器 |

#### 🚧 开发中

| 模块                        | 进度      | 说明 |
| --------------------------- | --------- | ------ |
| VPN 集成（WireGuard）       | 70%       | 架构完成，待集成 WireGuardKit |
| - VPN 服务架构              | ✅ 完成   | 配置管理、连接管理、自动重连 |
| - Headscale 集成            | ✅ 完成   | 设备注册、配置获取 |
| - iOS 原生桥接              | ✅ 完成   | React Native 桥接框架 |
| - WireGuard 协议            | ⏳ 待完成 | 需集成 WireGuardKit |
| - Android 支持              | ⏳ 待完成 | Android VPN 实现 |

#### 📋 规划中

| 模块                        | 优先级    | 说明 |
| --------------------------- | --------- | ------ |
| SSH 密钥认证                | 高        | 替代密码认证 |
| 文件传输 (SFTP)             | 中        | 文件上传下载 |
| 端口转发                    | 中        | 本地/远程端口转发 |
| 多用户支持                  | 低        | 团队协作功能 |
| 审计日志                    | 低        | 操作记录和审计 |

### VPN 功能详细说明

VPN 模块采用模块化架构设计，目前已完成大部分基础设施：

**已完成模块** (约 70%):
- ✅ 依赖注入容器和服务注册
- ✅ HTTP 客户端（支持重试、超时）
- ✅ 安全存储（MMKV + Keychain）
- ✅ WireGuard 配置解析和验证
- ✅ Headscale API 客户端
- ✅ 连接管理器
- ✅ 自动重连机制
- ✅ 网络监控
- ✅ 错误恢复管理
- ✅ 日志和性能监控
- ✅ iOS 原生桥接框架
- ✅ 11 个单元测试文件

**待完成关键部分** (约 30%):
- ⏳ WireGuardKit 协议集成（iOS）
- ⏳ Android VPN 服务实现
- ⏳ VPN Extension 完整配置
- ⏳ 端到端集成测试
- ⏳ 真实设备测试验证

**临时解决方案**:
在 VPN 功能完全就绪前，建议使用以下方案实现跨网访问：
1. 使用 Tailscale 或 ZeroTier 建立 Mesh 网络
2. 配合本项目的 SSH 终端功能使用
3. 或使用传统 VPN + 端口转发方案

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 开发环境设置

```bash
# 后端开发
cd shadowd
go mod download
go test ./...

# 前端开发
cd mobile-app
npm install
npm run ios
```

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [Headscale](https://github.com/juanfont/headscale) - 开源的 Tailscale 控制服务器
- [WireGuard](https://www.wireguard.com/) - 现代化的 VPN 协议
- [React Native](https://reactnative.dev/) - 跨平台移动应用框架

## 联系方式

- **邮箱**: 3241292694@qq.com

---

<div align="center">

**影梭 Shadow Shuttle**

*用 AI 的方式管理服务器，让运维变得简单*

🎤 说出需求 → 🤖 AI 理解 → ⚡ 自动执行 → 📊 智能分析

</div>
