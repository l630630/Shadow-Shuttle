# 网络请求调试指南

## 当前问题
应用显示 "Failed to get device info: TypeError: Network request failed"

## 已完成的修复
1. ✅ 添加 `android:usesCleartextTraffic="true"`
2. ✅ 创建 `network_security_config.xml`
3. ✅ 配置 CORS 允许所有来源
4. ✅ shadowd 正在运行并监听 `0.0.0.0:8080`
5. ✅ 添加详细的 fallback 日志

## 调试步骤

### 1. 查看 Metro Bundler 日志
在运行 `npm run android` 的终端中查看日志，应该看到：
```
🔍 [deviceStore] Discovering devices via shadowd API
❌ [deviceStore] Device discovery failed: [error details]
⚠️ [deviceStore] Falling back to mock device data
⚠️ [deviceStore] Creating fallback device...
✅ [deviceStore] Using fallback device, total: 1
```

### 2. 检查 React Native Debugger
1. 在模拟器中按 `Cmd+M` (macOS) 或 `Ctrl+M` (Windows/Linux)
2. 选择 "Debug"
3. 在 Chrome DevTools Console 中执行：
```javascript
// 查看当前设备
AsyncStorage.getItem('@shadow_shuttle_devices').then(data => {
  console.log('Stored devices:', JSON.parse(data));
});

// 查看 store 状态
useDeviceStore.getState().devices
```

### 3. 手动测试网络连接
在应用中添加测试按钮（临时）：
```typescript
<TouchableOpacity onPress={async () => {
  try {
    const response = await fetch('http://10.0.2.2:8080/api/health');
    const data = await response.json();
    Alert.alert('Success', JSON.stringify(data));
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}}>
  <Text>Test Network</Text>
</TouchableOpacity>
```

### 4. 检查模拟器网络
```bash
# 从宿主机测试
curl http://localhost:8080/api/health

# 检查 shadowd 监听地址
lsof -i :8080

# 检查防火墙（macOS）
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### 5. 尝试其他地址
修改 `shadowdService.ts` 中的默认地址：
```typescript
const defaultHosts = hosts || [
  '10.0.2.2',      // Android 模拟器
  '10.0.3.2',      // Genymotion 模拟器
  'localhost',
  '127.0.0.1',
  '192.168.1.x',   // 你的 Mac 的局域网 IP
];
```

## 临时解决方案

### 方案 1：使用 Mock 设备（推荐）
fallback 逻辑应该自动创建 mock 设备。如果没有，手动添加：

1. 点击右下角 "+" 按钮
2. 填写：
   - 设备名称：`630MacBook-Air.local`
   - Mesh IP：`10.0.2.2`
   - SSH 端口：`8022`
3. 点击"添加设备"

### 方案 2：禁用 API 发现
暂时注释掉自动发现逻辑，直接使用 mock 设备：

```typescript
// App.tsx
useEffect(() => {
  const autoDiscover = async () => {
    // 暂时禁用自动发现
    // if (storedDevices.length === 0 && !authLoading) {
    //   await discoverDevices();
    // }
    
    // 直接添加 mock 设备
    if (storedDevices.length === 0) {
      await addDeviceToStore({
        id: '630MacBook-Air.local-mock',
        name: '630MacBook-Air.local',
        hostname: '630MacBook-Air.local',
        meshIP: '10.0.2.2',
        sshPort: 8022,
        grpcPort: 50052,
        publicKey: 'mock_public_key',
        online: true,
        lastSeen: new Date(),
      });
    }
  };
  autoDiscover();
}, [storedDevices.length, authLoading]);
```

### 方案 3：使用真实 IP
获取 Mac 的局域网 IP：
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

然后在应用中使用这个 IP 而不是 `10.0.2.2`。

## 下一步
1. 打开应用查看 Metro Bundler 日志
2. 确认 fallback 逻辑是否执行
3. 如果还是没有设备，使用方案 1 手动添加
