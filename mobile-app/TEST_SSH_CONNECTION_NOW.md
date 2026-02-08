# 🧪 立即测试 SSH 连接

## ✅ 已修复的问题

1. **SSH 密码认证** - 现在接受任何非空密码
2. **WebSocket 代理** - 修复了 nil pointer 错误
3. **连接流程** - 正确转发到本地 SSH 服务器

## 🚀 测试步骤

### 1. 确认 shadowd 正在运行

```bash
cd shadowd
ps aux | grep shadowd | grep -v grep
```

如果没有运行，启动它：

```bash
./restart-and-test.sh
```

### 2. 在手机 App 中测试

1. **打开 App**
2. **点击设备** "630MacBook-Air.local"
3. **输入密码** - 任意密码都可以（例如：`123456`）
4. **点击连接**

### 3. 预期结果

✅ 应该看到：
- 连接成功
- 显示 shell 提示符：`$ `
- 可以输入命令

### 4. 测试命令

连接成功后，尝试这些命令：

```bash
whoami
pwd
ls
echo "Hello from SSH!"
```

## 🐛 如果还是失败

### 检查 shadowd 日志

```bash
cd shadowd
tail -f shadowd.log
```

应该看到：
```
INFO WebSocket client connected
INFO Processing SSH connection request
INFO Using password authentication
INFO Connecting to SSH server address=localhost:2222
INFO Password authentication successful (dev mode)
INFO SSH session started
INFO SSH session established
```

### 检查手机 App 日志

在 React Native 终端中查看日志：

```bash
# 在 mobile-app 目录
npx react-native log-android
```

应该看到：
```
Connecting to WebSocket proxy at ws://10.0.2.2:8022...
WebSocket connected to proxy server
SSH connection established via proxy
```

### 常见问题

**Q: 还是显示 "handshake failed"**

A: 检查：
1. shadowd 是否使用最新编译的版本？
   ```bash
   cd shadowd
   pkill shadowd
   ./restart-and-test.sh
   ```

2. WebSocket 端口是否正确？
   ```bash
   lsof -i :8022
   ```

**Q: 连接超时**

A: 检查：
1. Android 模拟器是否使用 `10.0.2.2`？
2. 防火墙是否阻止了端口 8022？

**Q: 密码认证失败**

A: 任何非空密码都应该工作。检查：
1. 密码是否为空？
2. shadowd 日志中是否显示 "Password authentication successful"？

## 📊 成功标志

当一切正常时，你会看到：

### Shadowd 日志
```
✅ WebSocket client connected
✅ Processing SSH connection request
✅ Using password authentication
✅ Connecting to SSH server
✅ Password authentication successful (dev mode)
✅ SSH session started
✅ SSH session established
```

### 手机 App
```
✅ 设备显示为在线（绿色圆点）
✅ 点击连接后显示密码输入框
✅ 输入密码后连接成功
✅ 显示终端界面
✅ 显示 shell 提示符
✅ 可以输入和执行命令
```

## 🎉 下一步

连接成功后：

1. ✅ 测试各种 Linux 命令
2. ✅ 测试 AI 助手功能
3. ✅ 测试命令历史
4. 🔄 修复 HTTP API 连接
5. 🔄 实现真实设备发现

## 💡 提示

- 开发模式下，任何密码都可以连接
- 生产环境必须使用公钥认证
- WebSocket 连接比 HTTP API 更稳定
- 所有 SSH 流量都经过加密

## 📞 需要帮助？

如果还有问题，提供以下信息：

1. shadowd 日志（最后 50 行）
2. 手机 App 日志
3. 错误截图
4. 使用的密码（确认不是空的）

---

**现在就试试吧！** 🚀
