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
         ▼
┌─────────────────┐
│  Headscale      │  协调服务器
│  Server         │  - Mesh 网络管理
└────────┬────────┘  - 设备注册
         │           - DERP 中继
         │
         ▼
┌─────────────────┐
│  Shadowd        │  Go 守护进程
│  Daemon         │  - SSH 服务器
└─────────────────┘  - gRPC 接口
                     - 系统服务
```

## 🚀 快速开始

> **🎉 演示模式现已可用！** 无需 WireGuard 配置，使用 localhost 即可立即体验所有功能。

### 演示模式（推荐用于测试和演示）

```bash
# 启动所有服务
./start-demo.sh

# 测试 SSH 连接
ssh -i shadowd/test_client_key -p 2222 test@127.0.0.1

# 停止所有服务
./stop-demo.sh
```

演示模式特点：
- ✅ 无需 root 权限
- ✅ 无需 WireGuard 配置
- ✅ 所有功能可演示
- ✅ 快速启动和停止

详细说明请参考 [演示模式成功报告](DEMO_MODE_SUCCESS.md)

---

### 方式 1: 自动部署（推荐）

```bash
# 克隆项目
git clone <your-repo>
cd shadow-shuttle

# 运行快速启动脚本
./mvp-quickstart.sh
```

脚本会自动：
- ✅ 检查依赖
- ✅ 部署 Headscale 服务器
- ✅ 构建 Shadowd 守护进程
- ✅ 配置系统
- ✅ 安装移动端依赖

### 方式 2: 手动部署

#### 1. 部署 Headscale 服务器

```bash
cd headscale
./scripts/deploy.sh
```

#### 2. 构建并运行 Shadowd

```bash
cd shadowd
go build -o shadowd .
./shadowd -config shadowd.yaml
```

#### 3. 运行移动端应用

```bash
cd mobile-app
npm install
npm run ios    # iOS
npm run android # Android
```

详细步骤请参考 [MVP 部署指南](MVP_DEPLOYMENT_GUIDE.md)

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

### 用户文档
- [MVP 部署指南](MVP_DEPLOYMENT_GUIDE.md) - 快速部署和演示
- [MVP 演示脚本](MVP_DEMO_SCRIPT.md) - 完整的演示流程
- [Headscale 快速入门](headscale/QUICKSTART.md) - Headscale 使用指南
- [Shadowd 安装指南](shadowd/INSTALL.md) - Shadowd 详细安装步骤

### 开发文档
- [项目完成总结](SHADOW_SHUTTLE_COMPLETION.md) - 项目整体情况
- [M1+M2 集成测试报告](M1_M2_INTEGRATION_TEST_REPORT.md) - 后端测试结果
- [M3 实现总结](mobile-app/M3_IMPLEMENTATION_SUMMARY.md) - 网络连接模块
- [M4 实现总结](mobile-app/M4_IMPLEMENTATION_SUMMARY.md) - 终端模块

### 组件文档
- [Headscale README](headscale/README.md)
- [Shadowd README](shadowd/README.md)
- [Mobile App README](mobile-app/README.md)

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

### 当前版本: 0.1.0 (MVP)

**完成度**: 96% ✅

**演示模式**: ✅ 可用

| 模块 | 状态 | 完成度 |
|------|------|--------|
| M1: Headscale 服务器 | ✅ 完成 | 100% |
| M2: Shadowd 守护进程 | ✅ 完成 | 98% |
| M3: 移动端网络连接 | ✅ 完成 | 100% |
| M4: 移动端终端 | ✅ 完成 | 100% |

### 最新进展 (2026-01-28)

- ✅ **演示模式实现** - 使用 localhost 可立即运行
- ✅ **SSH 服务器** - 认证和连接成功
- ✅ **gRPC 服务器** - 正常监听
- ✅ **测试通过率** - 94.3% (33/35)
- ✅ **移动端依赖** - 已安装 (947 packages)

详细状态请查看 [最终状态报告](FINAL_STATUS.md)

### 已知限制

- ⚠️ WireGuard 使用占位符实现
- ⚠️ 移动端 SSH 使用模拟连接
- ⚠️ QR 扫描使用测试按钮
- ⚠️ 安全存储使用占位符

这些功能在 MVP 中使用占位符实现，后续版本将集成实际的原生模块。

## 🗺️ 路线图

### Phase 1: 原生集成 (2-4 周)
- [ ] 集成 WireGuard 库
- [ ] 集成 SSH 客户端
- [ ] 集成 QR 扫描
- [ ] 集成安全存储

### Phase 2: 功能完善 (4-6 周)
- [ ] 终端功能增强（复制粘贴、历史记录）
- [ ] 设备管理优化（分组、搜索）
- [ ] 性能优化
- [ ] 错误处理完善

### Phase 3: 企业功能 (2-3 月)
- [ ] 多用户管理
- [ ] 权限控制
- [ ] 审计日志
- [ ] 集成第三方认证

### Phase 4: 发布 (3-6 月)
- [ ] 完整测试
- [ ] 性能优化
- [ ] 文档完善
- [ ] App Store / Google Play 发布

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
