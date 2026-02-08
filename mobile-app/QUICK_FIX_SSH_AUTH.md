# 快速修复 SSH 认证问题

## 问题描述

SSH 握手失败，错误信息：
```
ssh: handshake failed: EOF
```

## 根本原因

1. **SSH 服务器配置**：只接受公钥认证，但没有配置 authorized_keys
2. **密码认证被禁用**：`passwordHandler` 总是返回 false

## 解决方案

### 1. 启用密码认证（开发模式）

已修改 `shadowd/ssh/server.go`：

```go
// 开发模式：接受任何非空密码
func (s *Server) passwordHandler(ctx ssh.Context, password string) bool {
    if password != "" {
        s.log.WithFields(logrus.Fields{
            "user": ctx.User(),
        }).Info("Password authentication successful (dev mode)")
        return true
    }
    return false
}
```

### 2. 更新配置文件

已修改 `shadowd/shadowd.yaml`：

```yaml
ssh:
  port: 2222
  host_key_path: ./ssh_host_key
  authorized_keys_path: ./authorized_keys
  password_auth_enabled: true  # 新增：启用密码认证
  allowed_networks:
    - 0.0.0.0/0
```

### 3. 重新编译 shadowd

```bash
cd shadowd
make build
```

### 4. 重启 shadowd

```bash
./start-dev.sh
```

## 测试步骤

### 1. 测试本地 SSH（验证密码认证）

```bash
# 使用任意密码测试
ssh -p 2222 a0000@localhost
# 输入任意密码，应该能连接成功
```

### 2. 测试 WebSocket 代理

```bash
# 使用 wscat 测试
npm install -g wscat
wscat -c ws://localhost:8022

# 发送连接请求
{"type":"connect","host":"localhost","port":2222,"username":"a0000","password":"test123"}

# 应该收到：
{"type":"connected","message":"SSH connection established"}
```

### 3. 测试手机 App

1. 确保 shadowd 正在运行
2. 启动 App
3. 点击设备
4. 输入任意密码（例如：test123）
5. 应该能成功连接

## 预期结果

✅ SSH 服务器接受密码认证
✅ WebSocket 代理正常转发
✅ 手机 App 可以连接
✅ 终端显示 shell 提示符

## 调试日志

### Shadowd 日志

```bash
# 查看 shadowd 日志
tail -f shadowd.log

# 应该看到：
INFO Password authentication successful (dev mode) user=a0000
INFO SSH session started user=a0000 remote_ip=127.0.0.1
```

### App 日志

```bash
# 查看 React Native 日志
npx react-native log-android

# 应该看到：
WebSocket connected to proxy server
SSH connection established via proxy
```

## 常见问题

### Q1: 仍然显示 "handshake failed"

**检查：**
1. shadowd 是否重新编译？
2. shadowd 是否重启？
3. 是否使用了正确的端口（2222）？

**解决：**
```bash
cd shadowd
make clean
make build
./start-dev.sh
```

### Q2: WebSocket 连接失败

**检查：**
1. WebSocket 端口是否正确（8022）？
2. Android 模拟器是否使用 10.0.2.2？

**解决：**
```bash
# 测试 WebSocket 是否可访问
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://10.0.2.2:8022/
```

### Q3: 密码认证不工作

**检查：**
1. 密码是否为空？
2. 用户名是否正确？

**解决：**
- 使用任意非空密码
- 用户名使用 "a0000"（或任意用户名）

## 生产环境配置

⚠️ **注意：** 当前配置仅用于开发！

生产环境应该：

1. **禁用密码认证**
2. **使用公钥认证**
3. **配置 authorized_keys**
4. **限制允许的网络**

```yaml
ssh:
  port: 22
  password_auth_enabled: false  # 禁用密码
  authorized_keys_path: /etc/shadowd/authorized_keys
  allowed_networks:
    - 100.64.0.0/10  # 仅 Mesh 网络
```

## 下一步

修复完成后：

1. ✅ 测试 SSH 连接
2. ✅ 测试终端命令
3. ✅ 测试 AI 助手
4. 🔄 修复 HTTP API 连接
5. 🔄 实现真实设备发现

## 相关文件

- `shadowd/ssh/server.go` - SSH 服务器（已修改）
- `shadowd/shadowd.yaml` - 配置文件（已修改）
- `mobile-app/src/services/sshService.ts` - SSH 客户端
- `mobile-app/src/screens/TerminalScreen.tsx` - 终端界面
