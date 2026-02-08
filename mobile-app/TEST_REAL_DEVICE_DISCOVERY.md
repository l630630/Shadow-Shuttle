# 🔍 测试真实设备发现

## ✅ SSH 连接已成功

现在我们要测试真实的设备发现功能，不再使用 Mock 数据。

## 📋 工作原理

### 之前（Mock 数据）
```
App → Mock 设备数据 → 显示设备
```

### 现在（真实 API）
```
App → shadowd HTTP API (10.0.2.2:8080) → 获取真实设备信息 → 显示设备
```

如果 API 失败，会自动回退到 Mock 数据（保持 SSH 可用）。

## 🧪 测试步骤

### 1. 确认 shadowd 正在运行

```bash
cd shadowd
ps aux | grep shadowd | grep -v grep
```

应该看到 shadowd 进程。

### 2. 测试 HTTP API

```bash
# 测试设备信息 API
curl http://10.0.2.2:8080/api/device/info

# 应该返回类似：
{
  "id": "630MacBook-Air.local-...",
  "name": "MacBook Air",
  "os": "darwin",
  "meshIP": "127.0.0.1",
  "sshPort": 2222,
  "grpcPort": 50052,
  "isOnline": true,
  ...
}
```

### 3. 清除旧设备并重新发现

在手机 App 中：

1. **打开 App**
2. **长按设备** → 删除（如果有的话）
3. **点击"发现设备"按钮**
4. **等待扫描完成**

### 4. 预期结果

✅ 应该看到：
- 设备名称：`MacBook Air`（来自 shadowd 配置）
- 设备 IP：`10.0.2.2`
- 在线状态：绿色圆点
- SSH 端口：8022（WebSocket 代理）

### 5. 测试连接

1. **点击设备**
2. **输入密码**
3. **应该能连接成功**

## 🔍 调试信息

### 查看 App 日志

```bash
cd mobile-app
npx react-native log-android
```

应该看到：
```
🔍 [deviceStore] Discovering devices via shadowd API
🔍 [deviceStore] Scanning hosts: ["10.0.2.2", "localhost", "127.0.0.1"]
✅ [deviceStore] Discovered 1 devices
✅ [deviceStore] Total devices after discovery: 1
```

### 如果 API 失败

会看到：
```
❌ [deviceStore] Device discovery failed: ...
⚠️ [deviceStore] Falling back to mock device data
✅ [deviceStore] Using fallback device, total: 1
```

这是正常的！即使 API 失败，SSH 连接仍然可用。

## 🐛 常见问题

### Q: 设备发现失败

**检查：**
1. shadowd 是否运行？
   ```bash
   ps aux | grep shadowd
   ```

2. HTTP API 端口是否监听？
   ```bash
   lsof -i :8080
   ```

3. 能否访问 API？
   ```bash
   curl http://10.0.2.2:8080/api/health
   ```

**解决：**
- 重启 shadowd：`cd shadowd && ./restart-and-test.sh`
- 检查防火墙设置
- 确认 Android 模拟器网络配置

### Q: 显示的设备信息不对

**检查：**
1. shadowd 配置文件：
   ```bash
   cat shadowd/shadowd.yaml
   ```

2. 设备名称应该是：
   ```yaml
   device:
     name: MacBook Air
   ```

**解决：**
- 修改 `shadowd.yaml` 中的设备名称
- 重启 shadowd

### Q: 能发现设备但无法连接

**检查：**
1. SSH 端口是否正确（应该是 8022）
2. WebSocket 代理是否运行
   ```bash
   lsof -i :8022
   ```

**解决：**
- 确认 `deviceStore.ts` 中设置了 `device.sshPort = 8022`
- 重启 shadowd

## 📊 成功标志

### App 日志
```
✅ Discovered 1 devices
✅ Device name: MacBook Air
✅ Device IP: 10.0.2.2
✅ SSH port: 8022
✅ Device online: true
```

### 设备列表
```
✅ 显示真实设备名称（来自 shadowd）
✅ 显示在线状态（绿色圆点）
✅ 可以点击连接
✅ SSH 连接成功
```

## 🎯 下一步

设备发现成功后：

1. ✅ 测试多设备发现
2. ✅ 测试设备状态刷新
3. ✅ 测试设备编辑功能
4. 🔄 实现自动发现（后台扫描）
5. 🔄 添加设备分组功能

## 💡 提示

- 如果 HTTP API 有问题，会自动回退到 Mock 数据
- SSH 连接不受影响，始终可用
- 可以手动添加设备（如果自动发现失败）
- 设备信息会保存到本地存储

## 🔄 回退到 Mock 数据

如果需要临时回退到 Mock 数据：

1. 打开 `mobile-app/src/stores/deviceStore.ts`
2. 找到 `discoverDevices` 函数
3. 注释掉真实 API 代码
4. 取消注释 Mock 数据代码

但现在应该不需要了！真实 API 应该可以工作。

---

**现在就试试真实的设备发现！** 🚀
