# SSH 连接问题修复

## 🔍 问题分析

错误信息：`SSH connection failed: dial tcp [::1]:2222: connect: connection refused`

**根本原因**：应用使用了旧的设备信息，连接到错误的地址。

## ✅ 快速修复步骤

### 方法 1：删除并重新发现设备（推荐）⭐

1. **在应用中删除现有设备**
   - 打开设备列表
   - 长按设备
   - 选择"删除"

2. **重新发现设备**
   - 点击"发现设备"按钮
   - 等待设备出现

3. **验证设备信息**
   - 设备应该显示：`192.168.2.57:8022`
   - 如果还是显示 `:2222`，继续下一步

4. **连接设备**
   - 点击设备
   - 输入密码：`a0000`
   - 点击连接

### 方法 2：清除应用数据

如果方法 1 不行：

```bash
# 清除应用数据
adb shell pm clear com.shadowshuttle

# 重新启动应用
adb shell am start -n com.shadowshuttle/.MainActivity
```

### 方法 3：完全重建（最后手段）

如果以上都不行：

```bash
cd mobile-app
./clean-rebuild.sh
```

## 🧪 验证修复

### 1. 检查 shadowd 状态

```bash
# shadowd 应该正在运行
curl http://192.168.2.57:8080/api/health
# 应该返回：{"status":"healthy",...}

# WebSocket 代理应该正在运行
curl http://192.168.2.57:8022
# 应该返回：Bad Request（这是正常的）
```

### 2. 检查设备信息

在应用的设备列表中，设备应该显示：
- **名称**：630MacBook-Air.local
- **IP**：192.168.2.57
- **端口**：8022 ⬅️ 重要！

如果端口是 2222，说明设备信息没有更新。

### 3. 查看连接日志

```bash
# 实时查看日志
adb logcat | grep -i "websocket\|ssh"

# 成功连接时应该看到：
# Connecting to WebSocket proxy at ws://192.168.2.57:8022...
# WebSocket connected to proxy server
# SSH connection established via proxy
```

## 🎯 预期行为

### 连接流程

```
手机应用
    ↓
WebSocket 连接到 192.168.2.57:8022
    ↓
WebSocket SSH 代理
    ↓
转发到 localhost:2222
    ↓
shadowd SSH 服务器
    ↓
本地 Shell
```

### 成功标志

- ✅ 设备列表显示 `192.168.2.57:8022`
- ✅ 连接时没有 "connection refused" 错误
- ✅ 看到终端提示符
- ✅ 可以执行命令

## 🐛 常见问题

### Q: 为什么连接 [::1]:2222？

A: 这是旧的设备信息。需要删除设备并重新发现。

### Q: 为什么要连接 8022 而不是 2222？

A: 
- 2222 是 SSH 服务器端口（只能在 Mac 本地访问）
- 8022 是 WebSocket SSH 代理端口（可以从手机访问）
- 代理会将请求转发到 2222

### Q: shadowd 正在运行，为什么还是连接失败？

A: 检查：
1. Mac 和手机在同一 WiFi
2. 防火墙没有阻止 8022 端口
3. 设备信息是最新的（删除并重新发现）

## 📝 总结

**最简单的修复方法**：
1. 删除设备
2. 重新发现
3. 连接

如果还是不行，说明代码没有更新，需要完全重建应用。
