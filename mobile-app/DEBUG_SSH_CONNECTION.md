# SSH 连接调试

## 当前代码逻辑

### 1. TerminalScreen.tsx (第 109-114 行)
```typescript
const config: SSHConnectionConfig = {
  host: device.meshIP,        // 192.168.2.57
  port: device.sshPort,       // 2222
  username: 'a0000',
  password: password,
};
```

### 2. sshService.ts connect() 方法
```typescript
// 动态设置 WebSocket 代理地址
this.proxyServerUrl = `ws://${config.host}:8022`;
// 结果：ws://192.168.2.57:8022 ✅

// 连接到 WebSocket 代理
const ws = new WebSocket(this.proxyServerUrl);

// 发送 SSH 连接请求
ws.send(JSON.stringify({
  type: 'connect',
  host: 'localhost',    // ✅ 正确
  port: 2222,           // ✅ 正确
  username: config.username,
  password: config.password,
}));
```

## 问题分析

代码逻辑看起来是对的：
1. WebSocket 连接到 `ws://192.168.2.57:8022` ✅
2. 通过代理连接到 `localhost:2222` ✅

但错误信息显示：`dial tcp [::1]:2222`

**[::1]** 是 IPv6 的 localhost，说明某个地方在使用 IPv6 而不是 IPv4。

## 可能的原因

### 原因 1：React Native WebSocket 实现问题

React Native 的 WebSocket 可能在解析 `localhost` 时优先使用 IPv6。

### 原因 2：shadowd WebSocket 代理问题

WebSocket 代理在解析 `localhost` 时使用了 IPv6。

## 解决方案

### 方案 1：使用 127.0.0.1 而不是 localhost

修改 `sshService.ts`：

```typescript
ws.send(JSON.stringify({
  type: 'connect',
  host: '127.0.0.1',    // 明确使用 IPv4
  port: 2222,
  username: config.username,
  password: config.password,
}));
```

### 方案 2：修改 shadowd 监听地址

确保 shadowd SSH 服务器监听 `0.0.0.0:2222` 而不是 `[::]:2222`。

## 立即测试

检查 shadowd 配置：

```bash
# 查看 shadowd 日志
# 应该看到：
# INFO Starting SSH server on 0.0.0.0:2222
# 或
# INFO Starting SSH server on 192.168.2.57:2222

# 如果看到 [::]:2222，说明在监听 IPv6
```

检查 SSH 服务器是否在监听：

```bash
# 测试 IPv4
nc -zv 127.0.0.1 2222

# 测试 IPv6
nc -zv ::1 2222
```
