# 🚀 快速测试 SSH 连接

## 已修复！现在可以测试了

刚刚修复了两个关键问题：
1. ✅ SSH 密码认证（接受任何密码）
2. ✅ WebSocket 代理崩溃问题

## 测试步骤

### 1. 重启 shadowd

```bash
cd shadowd
./restart-and-test.sh
```

看到这些就说明成功了：
```
✅ 编译成功
✅ shadowd 启动成功
✅ SSH connection established!
```

### 2. 测试手机 App

1. 打开 App
2. 点击 "630MacBook-Air.local" 设备
3. 输入任意密码（例如：`123456`）
4. 点击连接

### 3. 应该看到

✅ 连接成功
✅ 显示终端界面
✅ 显示提示符：`$ `
✅ 可以输入命令

### 4. 试试这些命令

```bash
whoami
pwd
ls
echo "测试成功！"
```

## 如果还是失败

### 查看 shadowd 日志

```bash
cd shadowd
tail -f shadowd.log
```

应该看到：
- `INFO WebSocket client connected`
- `INFO Password authentication successful`
- `INFO SSH session established`

### 查看手机日志

```bash
cd mobile-app
npx react-native log-android
```

应该看到：
- `WebSocket connected to proxy server`
- `SSH connection established via proxy`

## 常见问题

**Q: 还是握手失败？**

确保 shadowd 已重启：
```bash
cd shadowd
pkill shadowd
./restart-and-test.sh
```

**Q: 连接超时？**

检查端口：
```bash
lsof -i :8022
```

应该看到 shadowd 在监听。

**Q: 密码不对？**

开发模式下任何密码都可以！只要不是空的就行。

## 成功的标志

### Shadowd 日志
```
✅ WebSocket client connected
✅ Password authentication successful (dev mode)
✅ SSH session established
```

### 手机 App
```
✅ 连接成功
✅ 显示终端
✅ 可以执行命令
```

## 下一步

连接成功后：
1. 测试各种命令
2. 测试 AI 助手
3. 测试命令历史

---

**现在就试试！应该可以了！** 🎉
