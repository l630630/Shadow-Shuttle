# Shadow Shuttle (影梭)

**安全的远程 SSH 访问解决方案**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.25+-00ADD8.svg)](https://golang.org)
[![React Native](https://img.shields.io/badge/react--native-0.73-61DAFB.svg)](https://reactnative.dev)
[![Status](https://img.shields.io/badge/status-MVP-green.svg)](MVP_DEPLOYMENT_GUIDE.md)

## 🎯 项目简介

Shadow Shuttle 是一个基于私有 Mesh 网络的安全 SSH 访问系统，让你可以随时随地通过移动设备安全地访问远程服务器。

### 核心特性

- 🔒 **安全第一**: 基于 WireGuard 的私有 Mesh 网络，SSH 密钥认证
- 📱 **移动优先**: 专为移动端设计的直观界面和流畅体验
- ⚡ **简单易用**: QR 码配对，一键连接，无需复杂配置
- 🌐 **跨平台**: 支持 Windows/macOS/Linux 和 iOS/Android
- 🎨 **现代化**: 使用 Go 和 React Native 构建，代码清晰易维护

### 使用场景

- 🛠️ 远程运维和故障排查
- 💻 开发环境访问和调试
- 🏠 家庭服务器管理
- 🤖 IoT 设备远程控制
- 👥 小型团队协作

## 🏗️ 系统架构

```
┌─────────────────┐
│  Mobile App     │  React Native + TypeScript
│  (iOS/Android)  │  - VPN 连接管理
└────────┬────────┘  - 设备发现
         │           - SSH 终端
         │
         ▼ WebSocket (8022)
┌─────────────────┐
│  Shadowd        │  Go 守护进程
│  Daemon         │  - SSH 服务器 (2222)
│                 │  - WebSocket SSH 代理 (8022)
│                 │  - gRPC 接口 (50052)
└────────┬────────┘  - 系统服务
         │
         ▼
┌─────────────────┐
│  Headscale      │  协调服务器
│  Server         │  - Mesh 网络管理
└─────────────────┘  - 设备注册
                     - DERP 中继
```

## 🚀 快速开始

### 1. 启动 Shadowd 守护进程

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

Shadowd 将启动以下服务：
- SSH Server (端口 2222)
- WebSocket SSH 代理 (端口 8022)
- gRPC Server (端口 50052)

### 2. 运行移动应用

```bash
cd mobile-app
npm install

# Android
npm run android

# iOS
npm run ios
```

详细步骤请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

## 📱 移动端使用

### 连接 VPN
1. 打开应用
2. 点击 "Connect VPN" 按钮
3. 等待连接成功

### 添加设备
1. 在目标设备上运行: `shadowd generate-qr`
2. 在应用中点击 "+" 按钮
3. 扫描二维码
4. 设备自动添加

### 访问终端
1. 从设备列表选择设备
2. 自动建立 SSH 连接
3. 输入命令并执行
4. 完成后点击 "Disconnect"

## 📚 文档

- [部署指南](DEPLOYMENT.md) - 快速部署和配置
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发
- [Headscale 文档](headscale/README.md) - Headscale 服务器配置
- [Shadowd 文档](shadowd/README.md) - Shadowd 守护进程说明
- [移动端文档](mobile-app/README.md) - 移动应用开发指南

## 🔒 安全特性

### 网络安全
- ✅ 私有 Mesh 网络 (100.64.0.0/10)
- ✅ WireGuard 端到端加密
- ✅ 零信任网络架构
- ✅ 网络隔离和访问控制

### 认证安全
- ✅ SSH 密钥认证（禁用密码）
- ✅ 设备指纹验证
- ✅ 配对码时间戳验证（防重放）
- ✅ 平台安全存储（Keychain/KeyStore）

### 通信安全
- ✅ 所有流量加密传输
- ✅ 仅 Mesh 网络内可访问
- ✅ 自动密钥轮换（规划中）
- ✅ 审计日志（规划中）

## 🛠️ 技术栈

### 后端
- **语言**: Go 1.25+
- **网络**: WireGuard, gRPC
- **服务**: systemd, launchd, Windows Service
- **测试**: Go testing, testify

### 前端
- **框架**: React Native 0.73
- **语言**: TypeScript 5.0
- **状态管理**: Zustand 4.4
- **导航**: React Navigation 6.x
- **存储**: AsyncStorage

### 基础设施
- **协调**: Headscale (Docker)
- **容器**: Docker Compose
- **配置**: YAML

## 📊 项目状态

### 当前版本: 0.2.0

| 模块 | 状态 | 完成度 |
|------|------|--------|
| Shadowd WebSocket 代理 | ✅ 完成 | 100% |
| 移动端 SSH 终端 | ✅ 完成 | 100% |
| WebSocket 连接 | ✅ 完成 | 100% |
| 密码认证 | ✅ 完成 | 100% |
| 设备管理 | 🚧 开发中 | 80% |
| VPN 集成 | 📋 计划中 | 0% |

## 🗺️ 路线图

### Phase 1: 核心功能 ✅
- [x] Shadowd WebSocket SSH 代理
- [x] 移动端终端界面
- [x] 密码认证
- [x] 实时命令执行

### Phase 2: 功能增强 (进行中)
- [ ] SSH 密钥认证
- [ ] 设备分组管理
- [ ] 命令历史记录
- [ ] 文件传输 (SFTP)

### Phase 3: VPN 集成 (计划中)
- [ ] WireGuard 集成
- [ ] Headscale 服务器集成
- [ ] Mesh 网络支持
- [ ] 设备自动发现

### Phase 4: 企业功能 (未来)
- [ ] 多用户管理
- [ ] 权限控制
- [ ] 审计日志
- [ ] 第三方认证集成

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)（待创建）了解详情。

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

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Headscale](https://github.com/juanfont/headscale) - 开源的 Tailscale 控制服务器
- [WireGuard](https://www.wireguard.com/) - 现代化的 VPN 协议
- [React Native](https://reactnative.dev/) - 跨平台移动应用框架

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- **功能建议**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **邮箱**: your-email@example.com

## 🌟 Star History

如果这个项目对你有帮助，请给我们一个 Star ⭐

---

**Made with ❤️ by Shadow Shuttle Team**

**影梭 - 让远程访问更安全、更简单**
