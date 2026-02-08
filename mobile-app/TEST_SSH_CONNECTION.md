# SSH 连接测试

## 当前问题

应用尝试连接 `[::1]:2222`（IPv6 localhost），但应该连接 `192.168.2.57:8022`（WebSocket 代理）。

## 已修改的代码

### 1. `src/services/sshService.ts`

```typescript
// 动态设置 WebSocket 代理地址
this.proxyServerUrl = `ws://${config.host}:8022`;

// 连接到 localhost:2222（通过代理）
ws.send(JSON.stringify({
  type: 'connect',
  host: 'localhost',
  port: 2222,
  username: config.username,
  password: config.password,
}));
```

## 测试步骤

1. **确保 shadowd 正在运行**
   ```bash
   cd shadowd
   ./shadowd
   ```

2. **确保 Metro bundler 正在运行**
   ```bash
   cd mobile-app
   npm start -- --reset-cache
   ```

3. **在模拟器中重新加载应用**
   - 按 R 键两次
   - 或点击 "RELOAD (R, R)" 按钮

4. **查看日志**
   在终端运行：
   ```bash
   adb logcat | grep -i "ssh\|websocket"
   ```

## 预期行为

连接时应该看到：
```
Connecting to WebSocket proxy at ws://192.168.2.57:8022...
WebSocket connected to proxy server
SSH connection established via proxy
```

## 如果还是失败

检查设备信息：
```bash
# 在应用的设备列表中，设备应该显示：
# IP: 192.168.2.57
# 端口: 8022
```

如果端口还是 2222，说明设备信息没有更新，需要：
1. 删除设备
2. 重新发现设备
3. 再次连接
