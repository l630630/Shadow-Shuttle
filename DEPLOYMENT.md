# Shadow Shuttle 部署指南

## 快速开始

### 1. 启动 Shadowd 守护进程

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

Shadowd 将启动以下服务：
- **SSH Server**: 端口 2222
- **WebSocket SSH 代理**: 端口 8022
- **gRPC Server**: 端口 50052

### 2. 运行移动应用

#### Android

```bash
cd mobile-app
npm install
npm run android
```

#### iOS

```bash
cd mobile-app
npm install
cd ios && pod install && cd ..
npm run ios
```

## 系统要求

- Go 1.25+ (用于 shadowd)
- Node.js >= 18
- React Native 开发环境
- Android Studio (Android) 或 Xcode (iOS)

## 架构

```
Mobile App → WebSocket (8022) → Shadowd → SSH Server (2222) → Shell
```

**说明**：
- Shadowd 内置了 WebSocket SSH 代理，无需单独的 Node.js 代理服务器
- 所有服务集成在一个 Go 二进制文件中
- 性能更好，内存占用更低（~10MB vs ~50MB）

## 配置

### Shadowd

配置文件 `shadowd/shadowd.yaml`：

```yaml
ssh:
  port: 2222
  host_key_path: ./ssh_host_key
  allowed_networks:
    - 0.0.0.0/0

websocket:
  listen_addr: 0.0.0.0:8022

grpc:
  listen_addr: 127.0.0.1:50052

users:
  a0000: "your_password_here"
  admin: "admin_password"
```

### 移动应用

配置在 `mobile-app/src/services/sshService.ts`：
- Android 模拟器: `ws://10.0.2.2:8022`
- iOS 模拟器: `ws://localhost:8022`
- 真实设备: `ws://<your-ip>:8022`

## 功能

- ✅ WebSocket SSH 连接（内置在 shadowd）
- ✅ 密码认证
- ✅ 实时终端
- ✅ ANSI 颜色支持
- ✅ 设备管理
- ✅ AI 自然语言控制

## 开发

### 启动开发服务器

```bash
# 1. 启动 shadowd
cd shadowd
./shadowd -config shadowd.yaml

# 2. 启动移动应用
cd mobile-app
npm start
```

### 重新加载应用

- Android: 按两次 R 键
- iOS: Cmd + R

## 故障排除

### SSH 连接失败

1. 确保 shadowd 正在运行: `ps aux | grep shadowd`
2. 检查端口是否监听: `lsof -i :8022`
3. 验证 WebSocket URL 配置
4. 查看 shadowd 日志: `tail -f shadowd.log`

### WebSocket 连接错误

- **Android 模拟器**: 使用 `ws://10.0.2.2:8022`
- **iOS 模拟器**: 使用 `ws://localhost:8022`
- **真实设备**: 更新为你的电脑 IP 地址

### Metro 连接失败

```bash
# Android
adb reverse tcp:8081 tcp:8081

# iOS
# 确保设备和电脑在同一网络
```

## 生产部署

1. 配置 WSS (WebSocket Secure)
2. 使用 SSH 密钥认证
3. 添加速率限制
4. 配置防火墙规则
5. 启用日志监控
6. 将 shadowd 安装为系统服务（参考 [shadowd/INSTALL.md](shadowd/INSTALL.md)）

## 与旧架构的对比

| 特性 | 旧架构 (ssh-proxy-server) | 新架构 (shadowd) |
|------|---------------------------|------------------|
| 语言 | Node.js | Go |
| 性能 | 中等 | 高 |
| 内存占用 | ~50MB | ~10MB |
| 启动方式 | 手动运行 | 系统服务 |
| 集成度 | 独立服务 | 集成在 shadowd |
| 生产就绪 | ❌ | ✅ |

## 更多文档

- [Shadowd 使用指南](shadowd/README.md)
- [WebSocket SSH 代理指南](shadowd/WEBSOCKET_SSH_GUIDE.md)
- [移动应用开发指南](mobile-app/README.md)
- [快速开始](QUICK_START.md)
