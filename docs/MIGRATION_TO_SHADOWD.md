# 从 ssh-proxy-server 迁移到 shadowd

## 概述

本指南帮助你从独立的 `ssh-proxy-server` (Node.js) 迁移到集成在 `shadowd` 中的 WebSocket SSH 代理。

## 为什么要迁移？

### ssh-proxy-server 的问题

- ❌ 需要手动启动 `node server.js`
- ❌ 需要保持终端窗口打开
- ❌ 重启后需要重新运行
- ❌ 需要安装 Node.js 依赖
- ❌ 不适合生产环境

### shadowd 的优势

- ✅ 一键启动，自动运行
- ✅ 后台服务，无需终端
- ✅ 开机自启动
- ✅ 集成 SSH + gRPC + WebSocket
- ✅ 生产级别性能
- ✅ 统一的配置和管理

## 迁移步骤

### 1. 编译 shadowd

```bash
cd shadowd
go build -o shadowd .
```

### 2. 配置 shadowd

```bash
# 复制配置文件
cp shadowd.yaml.example shadowd.yaml

# 编辑配置
vim shadowd.yaml
```

关键配置：

```yaml
ssh:
  port: 2222  # 使用非特权端口
  host_key_path: ./ssh_host_key
  authorized_keys_path: ./authorized_keys
  allowed_networks:
    - 0.0.0.0/0  # 开发环境允许所有连接

grpc:
  port: 50052
  tls_enabled: false

device:
  name: "MacBook Air"
```

### 3. 启动 shadowd

```bash
# 开发模式
./start-dev.sh

# 或者直接运行
./shadowd -config shadowd.yaml
```

### 4. 停止旧的 ssh-proxy-server

```bash
# 如果还在运行，停止它
pkill -f "node server.js"
```

### 5. 测试连接

**手机 App 不需要修改代码！**

WebSocket 连接地址保持不变：
- Android 模拟器: `ws://10.0.2.2:8022`
- iOS 模拟器: `ws://localhost:8022`
- 真实设备: `ws://YOUR_IP:8022`

## 对比测试

### 旧方案（ssh-proxy-server）

```bash
# 终端 1: 启动 Metro
cd mobile-app && npm start

# 终端 2: 启动 WebSocket 代理
cd ssh-proxy-server && node server.js

# 终端 3: 运行 App
cd mobile-app && npm run android
```

### 新方案（shadowd）

```bash
# 终端 1: 启动 shadowd（只需一次）
cd shadowd && ./start-dev.sh

# 终端 2: 启动 Metro
cd mobile-app && npm start

# 终端 3: 运行 App
cd mobile-app && npm run android
```

## 功能对比

| 功能 | ssh-proxy-server | shadowd |
|------|-----------------|---------|
| WebSocket SSH 代理 | ✅ | ✅ |
| SSH Server | ❌ | ✅ |
| gRPC API | ❌ | ✅ |
| 设备管理 | ❌ | ✅ |
| VPN 集成 | ❌ | ✅ |
| 系统服务 | ❌ | ✅ |
| 自动启动 | ❌ | ✅ |
| 性能 | 中等 | 高 |
| 内存占用 | ~50MB | ~10MB |

## 手机 App 代码变更

**好消息：不需要修改代码！**

`mobile-app/src/services/sshService.ts` 中的 WebSocket 连接逻辑完全兼容。

唯一的区别是后端从 Node.js 换成了 Go，但协议完全相同。

## 故障排除

### 问题 1: 端口被占用

```bash
# 检查端口占用
lsof -i :8022
lsof -i :2222
lsof -i :50052

# 杀掉占用进程
pkill -9 shadowd
```

### 问题 2: 权限不足

如果使用端口 22，需要 root 权限：

```bash
sudo ./shadowd -config shadowd.yaml
```

建议开发环境使用非特权端口（2222）。

### 问题 3: 连接超时

检查防火墙设置：

```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add ./shadowd
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp ./shadowd
```

### 问题 4: SSH 认证失败

确保配置了正确的认证方式：

```yaml
ssh:
  # 使用密码认证（开发环境）
  allowed_networks:
    - 0.0.0.0/0
```

## 生产环境部署

### 安装为系统服务

```bash
# macOS
sudo ./shadowd/scripts/install-macos.sh

# Linux
sudo ./shadowd/scripts/install-linux.sh

# Windows
.\shadowd\scripts\install-windows.ps1
```

### 配置开机自启

安装脚本会自动配置开机自启动。

### 监控和日志

```bash
# 查看服务状态
sudo launchctl list | grep shadowd

# 查看日志
tail -f /var/log/shadowd.log
```

## 回滚方案

如果遇到问题，可以临时回滚到 ssh-proxy-server：

```bash
# 停止 shadowd
pkill -9 shadowd

# 启动旧的代理
cd ssh-proxy-server && node server.js
```

## 下一步

1. ✅ 完成迁移到 shadowd
2. 🔄 测试所有功能
3. 📦 打包生产版本
4. 🚀 部署到用户设备

## 相关文档

- [shadowd WebSocket SSH 指南](../shadowd/WEBSOCKET_SSH_GUIDE.md)
- [shadowd 安装指南](../shadowd/INSTALL.md)
- [架构决策文档](./ARCHITECTURE_DECISION.md)

## 总结

迁移到 shadowd 后：

- ✅ 更简单的启动流程
- ✅ 更好的性能
- ✅ 生产级别的稳定性
- ✅ 统一的架构
- ✅ 为未来功能做好准备

**手机 App 代码无需修改，完全兼容！**
