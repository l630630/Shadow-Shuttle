# 测试 Shadowd 设备发现

## 前置条件

### 1. 启动 shadowd

```bash
cd shadowd
./start-dev.sh
```

确保看到：
```
INFO HTTP API server listening address="0.0.0.0:8080"
INFO WebSocket SSH proxy listening address="0.0.0.0:8022"
```

### 2. 测试 HTTP API

```bash
curl http://localhost:8080/api/device/info
```

应该返回设备信息。

## 测试步骤

### 步骤 1：启动 Metro Bundler

```bash
cd mobile-app
npm start
```

### 步骤 2：运行 App

```bash
# Android
npm run android

# iOS
npm run ios
```

### 步骤 3：测试设备发现

1. **打开 App**
2. **点击"发现设备"按钮**（在首页）
3. **查看日志输出**

预期日志：
```
🔍 [App] Discovering devices via shadowd API...
🔍 [deviceStore] Discovering devices via shadowd API
🔍 [deviceStore] Scanning hosts: ["10.0.2.2", "localhost", "127.0.0.1"]
✅ [deviceStore] Discovered 1 devices
✅ [deviceStore] Total devices after discovery: 1
✅ 已发现 1 个设备 (1 在线, 0 离线)
```

### 步骤 4：查看设备列表

1. **点击底部导航的"设备"图标**
2. **应该看到发现的设备**
   - 设备名称
   - IP 地址
   - 在线状态（绿色圆点）

### 步骤 5：测试设备连接

1. **点击设备卡片**
2. **进入终端界面**
3. **测试 SSH 连接**

## 预期结果

### 成功标准

- ✅ 可以发现 shadowd 设备
- ✅ 设备信息正确显示
- ✅ 在线状态正确
- ✅ 可以连接到设备
- ✅ SSH 终端正常工作

### 设备信息示例

```json
{
  "id": "630MacBook-Air.local-1770202867",
  "name": "630MacBook-Air.local",
  "hostname": "630MacBook-Air.local",
  "meshIP": "127.0.0.1",
  "sshPort": 2222,
  "grpcPort": 50052,
  "publicKey": "",
  "online": true,
  "lastSeen": "2026-02-04T11:01:07.000Z"
}
```

## 故障排除

### 问题 1: 未发现设备

**检查 shadowd 是否运行：**
```bash
lsof -i :8080
```

**检查网络连接：**
- Android 模拟器：使用 `10.0.2.2`
- iOS 模拟器：使用 `localhost`
- 真实设备：使用电脑的 IP 地址

### 问题 2: 连接超时

**增加超时时间：**

编辑 `mobile-app/src/services/shadowdService.ts`:

```typescript
const response = await fetch(`${this.baseUrl}/device/info`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});
```

### 问题 3: CORS 错误

shadowd 已经配置了 CORS，但如果仍有问题：

**检查 shadowd 日志：**
```bash
# 查看 shadowd 输出
```

**确认 CORS 头：**
```bash
curl -v http://localhost:8080/api/device/info
```

应该看到：
```
Access-Control-Allow-Origin: *
```

## 调试技巧

### 1. 查看 React Native 日志

```bash
# Android
adb logcat | grep -E "deviceStore|shadowd|App"

# iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "ShadowShuttle"'
```

### 2. 使用 React Native Debugger

1. 打开 Chrome DevTools
2. 查看 Console 输出
3. 查看 Network 请求

### 3. 测试 API 直接调用

在 React Native Debugger Console 中：

```javascript
fetch('http://10.0.2.2:8080/api/device/info')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 下一步

完成测试后：

1. ✅ 设备发现功能正常
2. 🔄 集成到 AI 助手
3. 🔄 添加设备刷新功能
4. 🔄 实现自动发现
5. 📅 添加设备编辑功能

## 相关文件

- `mobile-app/src/stores/deviceStore.ts` - 设备状态管理
- `mobile-app/src/services/shadowdService.ts` - Shadowd API 客户端
- `mobile-app/App.tsx` - 主应用组件
- `shadowd/http/server.go` - HTTP API 服务器

## 成功案例

如果一切正常，你应该看到：

1. **首页显示**：
   ```
   ✅ 已发现 1 个设备 (1 在线, 0 离线)
   💡 点击"设备列表"查看并连接设备
   ```

2. **设备列表显示**：
   - 设备卡片
   - 绿色在线指示器
   - 设备名称和 IP

3. **终端连接成功**：
   - SSH 连接建立
   - 可以执行命令
   - 输出正常显示

恭喜！Phase 2 完成！🎉
