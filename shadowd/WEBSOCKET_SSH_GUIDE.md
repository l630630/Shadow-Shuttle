# WebSocket SSH 代理使用指南

## 概述

shadowd 现在内置了 WebSocket SSH 代理功能，可以让 React Native 应用通过 WebSocket 连接到 SSH 服务器。

## 架构

```
手机 App (React Native)
    ↓ WebSocket (ws://host:8022)
shadowd WebSocket 代理
    ↓ SSH 协议
shadowd SSH Server (localhost:2222)
    ↓
真实的 Shell
```

## 启动 shadowd

### 开发模式

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

### 服务将监听以下端口：

- **WebSocket SSH 代理**: `0.0.0.0:8022`
- **SSH Server**: `127.0.0.1:2222`
- **gRPC Server**: `127.0.0.1:50052`

## 手机 App 连接方式

### Android 模拟器

```typescript
const proxyUrl = 'ws://10.0.2.2:8022';
```

### iOS 模拟器

```typescript
const proxyUrl = 'ws://localhost:8022';
```

### 真实设备（同一 Wi-Fi）

```typescript
// 使用你的 Mac 的 IP 地址
const proxyUrl = 'ws://192.168.1.100:8022';
```

## WebSocket 消息协议

### 1. 连接到 SSH

```json
{
  "type": "connect",
  "host": "localhost",
  "port": 2222,
  "username": "your-username",
  "password": "your-password"
}
```

### 2. 发送命令

```json
{
  "type": "data",
  "data": "ls -la\n"
}
```

### 3. 调整终端大小

```json
{
  "type": "resize",
  "rows": 40,
  "cols": 80
}
```

### 4. 断开连接

```json
{
  "type": "disconnect"
}
```

## 服务器响应消息

### 连接成功

```json
{
  "type": "connected",
  "message": "SSH connection established"
}
```

### 输出数据

```json
{
  "type": "data",
  "data": "command output..."
}
```

### 错误消息

```json
{
  "type": "error",
  "message": "error description"
}
```

### 连接关闭

```json
{
  "type": "closed"
}
```

## 配置

编辑 `shadowd.yaml`:

```yaml
ssh:
  # SSH server port
  port: 2222
  
  # Host key path
  host_key_path: ./ssh_host_key
  
  # Authorized keys
  authorized_keys_path: ./authorized_keys
  
  # Allowed networks (0.0.0.0/0 for development)
  allowed_networks:
    - 0.0.0.0/0
```

## 测试连接

### 使用 wscat 测试

```bash
# 安装 wscat
npm install -g wscat

# 连接到 WebSocket 代理
wscat -c ws://localhost:8022

# 发送连接消息
{"type":"connect","host":"localhost","port":2222,"username":"your-username","password":"your-password"}

# 发送命令
{"type":"data","data":"ls\n"}
```

### 使用 curl 测试 SSH 服务器

```bash
# 测试 SSH 服务器是否运行
ssh -p 2222 your-username@localhost
```

## 故障排除

### 1. WebSocket 连接失败

**检查 shadowd 是否运行：**
```bash
ps aux | grep shadowd
```

**检查端口是否监听：**
```bash
lsof -i :8022
```

### 2. SSH 连接失败

**检查 SSH 服务器：**
```bash
lsof -i :2222
```

**查看日志：**
```bash
# shadowd 会输出详细日志
tail -f /var/log/shadowd.log
```

### 3. 权限问题

如果使用端口 22，需要 root 权限：
```bash
sudo ./shadowd -config shadowd.yaml
```

开发环境建议使用非特权端口（如 2222）。

## 与旧的 ssh-proxy-server 对比

| 特性 | ssh-proxy-server (Node.js) | shadowd WebSocket |
|------|---------------------------|-------------------|
| 语言 | Node.js | Go |
| 性能 | 中等 | 高 |
| 内存占用 | ~50MB | ~10MB |
| 启动方式 | 手动运行 | 系统服务 |
| 集成度 | 独立服务 | 集成在 shadowd |
| 生产就绪 | ❌ | ✅ |

## 下一步

1. **测试连接**: 在手机 App 中测试 WebSocket 连接
2. **添加认证**: 实现更安全的认证机制
3. **TLS 支持**: 添加 WSS (WebSocket Secure) 支持
4. **监控**: 添加连接监控和日志

## 相关文件

- `shadowd/websocket/ssh_proxy.go` - WebSocket 代理实现
- `shadowd/main.go` - 主程序入口
- `shadowd/ssh/server.go` - SSH 服务器实现
- `mobile-app/src/services/sshService.ts` - 手机端 SSH 服务

## 支持

如有问题，请查看：
- [shadowd README](./README.md)
- [故障排除指南](./TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/your-org/shadow-shuttle/issues)
