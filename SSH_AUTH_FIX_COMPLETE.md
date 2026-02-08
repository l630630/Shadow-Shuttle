# SSH 连接修复完成

## 问题根因

SSH 连接失败的根本原因是：
- **SSH 服务器监听地址错误**：SSH 服务器监听在 `192.168.2.57:2222`（LAN IP）
- **WebSocket 代理连接地址**：WebSocket 代理尝试连接 `127.0.0.1:2222`（localhost）
- **结果**：连接失败，因为 SSH 服务器没有监听在 localhost 上

之前的修复尝试将 `localhost` 改为 `127.0.0.1` 是正确的方向，但没有解决根本问题。

## 解决方案

### 1. 修改 SSH 服务器监听地址

**文件**: `shadowd/main.go`

```go
// initializeSSH initializes and starts the SSH server
func initializeSSH(cfg *config.Config, meshIP string, log *logrus.Logger) *ssh.Server {
	// Add localhost to allowed networks for WebSocket proxy
	allowedNetworks := append(cfg.SSH.AllowedNetworks, "127.0.0.1/32")
	
	sshConfig := ssh.Config{
		MeshIP:             "127.0.0.1", // ✅ 监听 localhost 而不是 Mesh IP
		Port:               cfg.SSH.Port,
		HostKeyPath:        cfg.SSH.HostKeyPath,
		AuthorizedKeysPath: cfg.SSH.AuthorizedKeysPath,
		AllowedNetworks:    allowedNetworks, // ✅ 允许 localhost 连接
		Users:              cfg.SSH.Users,
	}
	// ...
}
```

**关键变更**:
1. SSH 服务器现在监听 `127.0.0.1:2222` 而不是 `192.168.2.57:2222`
2. 添加 `127.0.0.1/32` 到允许的网络列表，允许 localhost 连接

### 2. WebSocket 代理配置

**文件**: `shadowd/main.go`

```go
func initializeWebSocket(cfg *config.Config, log *logrus.Logger) *websocket.Server {
	wsConfig := websocket.Config{
		ListenAddr: "0.0.0.0:8022", // 监听所有接口
		SSHHost:    "127.0.0.1",    // ✅ 使用 IPv4 localhost
		SSHPort:    cfg.SSH.Port,   // 连接到 shadowd SSH 服务器
	}
	// ...
}
```

**关键变更**:
- `SSHHost` 使用 `"127.0.0.1"` 而不是 `"localhost"`，避免 IPv6 解析问题

## 验证

### 1. 检查 SSH 服务器监听地址

```bash
lsof -i :2222 | grep LISTEN
# 输出: shadowd ... TCP localhost:rockwell-csp2 (LISTEN)
```

✅ **结果**: SSH 服务器现在监听在 `localhost:2222`

### 2. 测试 localhost 连接

```bash
nc -zv 127.0.0.1 2222
# 输出: Connection to 127.0.0.1 port 2222 [tcp/rockwell-csp2] succeeded!
```

✅ **结果**: 可以从 localhost 连接到 SSH 服务器

### 3. 检查 shadowd 日志

```bash
tail -f shadowd/shadowd.log
```

应该看到：
```
level=info msg="SSH server listening" address="127.0.0.1:2222"
level=info msg="WebSocket SSH proxy listening" address="0.0.0.0:8022"
```

## 测试步骤

### 在移动应用中测试 SSH 连接

1. **打开影梭应用**
2. **等待设备发现**（通过 mDNS 或 HTTP API）
3. **点击设备卡片**进入终端界面
4. **输入用户名和密码**：
   - 用户名: `a0000`
   - 密码: `Aa123456`（配置文件中的密码）
5. **点击"连接"按钮**

### 预期结果

✅ **成功连接**:
```
✓ 已连接到 MacBook Air
MacBook-Air:~$
```

❌ **如果仍然失败**，检查 shadowd 日志：
```bash
tail -f shadowd/shadowd.log
```

查找以下信息：
- `WebSocket client connected` - WebSocket 连接成功
- `Processing SSH connection request` - 收到 SSH 连接请求
- `Using password authentication` - 使用密码认证
- `Connecting to SSH server` - 连接到 SSH 服务器
- `SSH session established` - SSH 会话建立成功

## 架构说明

```
┌─────────────────┐
│  移动应用        │
│  (Android)      │
└────────┬────────┘
         │ WebSocket
         │ ws://192.168.2.57:8022
         ↓
┌─────────────────────────────────┐
│  Mac (192.168.2.57)             │
│                                 │
│  ┌──────────────────────────┐  │
│  │ WebSocket SSH Proxy      │  │
│  │ 监听: 0.0.0.0:8022       │  │
│  └──────────┬───────────────┘  │
│             │ TCP               │
│             │ 127.0.0.1:2222    │
│             ↓                   │
│  ┌──────────────────────────┐  │
│  │ SSH Server               │  │
│  │ 监听: 127.0.0.1:2222     │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

**关键点**:
1. WebSocket 代理监听在 `0.0.0.0:8022`（所有接口），可以从 LAN 访问
2. SSH 服务器监听在 `127.0.0.1:2222`（localhost），只能从本地访问
3. WebSocket 代理和 SSH 服务器在同一台机器上，通过 localhost 通信

## 状态

- ✅ shadowd 已重新编译
- ✅ shadowd 已重启
- ✅ SSH 服务器监听在 `127.0.0.1:2222`
- ✅ WebSocket 代理监听在 `0.0.0.0:8022`
- ✅ 移动应用已重新安装
- ⏳ **等待用户测试 SSH 连接**

## 下一步

请在移动应用中测试 SSH 连接，并告诉我结果！
