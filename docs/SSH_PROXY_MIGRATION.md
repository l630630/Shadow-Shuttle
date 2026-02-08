# SSH Proxy 迁移指南

## 概述

从 Shadow Shuttle v0.3.0 开始，WebSocket SSH 代理功能已经集成到 shadowd 中。独立的 Node.js `ssh-proxy-server` 已被移除。

## 变更说明

### 旧架构 (v0.2.x)

```
手机 App → ssh-proxy-server (Node.js, 端口 8022) → SSH Server
```

需要运行两个独立的服务：
1. `ssh-proxy-server` (Node.js)
2. SSH Server

### 新架构 (v0.3.0+)

```
手机 App → shadowd (Go, 端口 8022) → shadowd SSH Server (端口 2222)
```

只需运行一个服务：
- `shadowd` (包含 WebSocket 代理 + SSH Server + gRPC)

## 迁移步骤

### 1. 停止旧的代理服务器

如果你之前运行了 `ssh-proxy-server`：

```bash
# 查找并停止 Node.js 代理进程
pkill -f "node.*ssh-proxy-server"

# 或者在 ssh-proxy-server 目录中按 Ctrl+C
```

### 2. 更新 shadowd

确保你使用的是 shadowd v0.3.0 或更高版本：

```bash
cd shadowd
./shadowd -version
```

### 3. 配置 shadowd

编辑 `shadowd/shadowd.yaml`，确保包含 WebSocket 配置：

```yaml
ssh:
  port: 2222
  host_key_path: ./ssh_host_key
  allowed_networks:
    - 0.0.0.0/0

websocket:
  listen_addr: 0.0.0.0:8022

users:
  your_username: "your_password"
```

### 4. 启动 shadowd

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

你应该看到以下日志：

```
INFO SSH server listening on 127.0.0.1:2222
INFO WebSocket SSH proxy listening on 0.0.0.0:8022
INFO gRPC server listening on 127.0.0.1:50052
```

### 5. 验证连接

测试 WebSocket 连接：

```bash
# 使用 wscat 测试
npm install -g wscat
wscat -c ws://localhost:8022

# 发送连接消息
{"type":"connect","username":"your_username","password":"your_password"}
```

### 6. 更新移动应用（如果需要）

移动应用的配置保持不变，仍然连接到端口 8022：

```typescript
// src/services/sshService.ts
private proxyServerUrl = 'ws://10.0.2.2:8022'; // Android 模拟器
// 或
private proxyServerUrl = 'ws://localhost:8022'; // iOS 模拟器
```

## 优势对比

| 特性 | ssh-proxy-server (旧) | shadowd (新) |
|------|----------------------|--------------|
| 语言 | Node.js | Go |
| 性能 | 中等 | 高 |
| 内存占用 | ~50MB | ~10MB |
| 启动时间 | ~2秒 | <1秒 |
| 依赖 | Node.js + npm 包 | 无外部依赖 |
| 部署 | 需要手动启动 | 系统服务 |
| 集成度 | 独立服务 | 集成在 shadowd |
| 维护 | 需要单独维护 | 统一维护 |
| 生产就绪 | ❌ | ✅ |

## 功能对比

两个实现提供相同的功能：

- ✅ WebSocket 到 SSH 协议转换
- ✅ 密码认证
- ✅ 私钥认证
- ✅ 实时命令执行
- ✅ 终端大小调整
- ✅ ANSI 颜色支持
- ✅ 多客户端连接

## 常见问题

### Q: 我需要修改移动应用代码吗？

**A**: 不需要。WebSocket 协议和消息格式完全相同，移动应用无需修改。

### Q: 旧的 ssh-proxy-server 目录可以删除吗？

**A**: 可以。如果你已经迁移到 shadowd v0.3.0+，可以安全删除 `ssh-proxy-server` 目录。

### Q: 如何回退到旧版本？

**A**: 如果需要回退：
1. 从 Git 历史恢复 `ssh-proxy-server` 目录
2. 运行 `cd ssh-proxy-server && npm install && npm start`
3. 停止 shadowd 的 WebSocket 代理

### Q: 性能有提升吗？

**A**: 是的！Go 实现的性能明显优于 Node.js：
- 内存占用减少 80% (~10MB vs ~50MB)
- 启动时间更快 (<1秒 vs ~2秒)
- 更低的 CPU 使用率
- 更好的并发处理能力

### Q: 端口配置有变化吗？

**A**: 没有。WebSocket 代理仍然使用端口 8022，SSH Server 使用端口 2222。

## 故障排除

### 问题：WebSocket 连接失败

**解决方案**：
1. 确认 shadowd 正在运行：`ps aux | grep shadowd`
2. 检查端口 8022 是否监听：`lsof -i :8022`
3. 查看 shadowd 日志：`tail -f shadowd.log`

### 问题：SSH 认证失败

**解决方案**：
1. 检查 `shadowd.yaml` 中的用户名和密码
2. 确认 `allowed_networks` 包含客户端网络
3. 查看 shadowd 日志中的认证错误

### 问题：找不到 shadowd 命令

**解决方案**：
```bash
cd shadowd
go build -o shadowd
./shadowd -config shadowd.yaml
```

## 相关文档

- [shadowd README](../shadowd/README.md)
- [WebSocket SSH 代理指南](../shadowd/WEBSOCKET_SSH_GUIDE.md)
- [部署指南](../DEPLOYMENT.md)
- [快速开始](../QUICK_START.md)

## 支持

如有问题，请：
1. 查看 [shadowd 故障排除](../shadowd/TROUBLESHOOTING.md)
2. 提交 [GitHub Issue](https://github.com/your-org/shadow-shuttle/issues)
3. 查看 [讨论区](https://github.com/your-org/shadow-shuttle/discussions)

---

**更新日期**: 2026-02-08
**版本**: v0.3.0
