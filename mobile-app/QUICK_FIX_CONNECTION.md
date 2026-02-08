# 快速修复连接问题

## 问题

手机 App 显示"设备离线，无法连接"，错误信息：
```
Failed to get device info: TypeError: Network request failed
```

## 原因

1. shadowd 可能没有运行
2. 网络地址配置不正确
3. 防火墙阻止连接

## 解决方案

### 步骤 1：确认 shadowd 正在运行

```bash
# 检查进程
ps aux | grep shadowd

# 检查端口
lsof -i :8080
```

如果没有运行，启动它：
```bash
cd shadowd
./start-dev.sh
```

### 步骤 2：测试 API 连接

```bash
# 测试本地连接
curl http://localhost:8080/api/device/info

# 测试模拟器地址
curl http://10.0.2.2:8080/api/device/info
```

### 步骤 3：检查手机 App 日志

在 React Native 日志中查找：
```
🔍 [deviceStore] Discovering devices via shadowd API
🔍 [deviceStore] Scanning hosts: ["10.0.2.2", "localhost", "127.0.0.1"]
```

### 步骤 4：手动测试连接

在 App 中添加测试代码（临时）：

```typescript
// 在 App.tsx 或任何组件中
import { getShadowdService } from './src/services/shadowdService';

const testConnection = async () => {
  const shadowd = getShadowdService();
  
  try {
    console.log('Testing connection to shadowd...');
    const info = await shadowd.getDeviceInfo();
    console.log('✅ Connection successful:', info);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
};

// 在 useEffect 中调用
useEffect(() => {
  testConnection();
}, []);
```

### 步骤 5：重新加载 App

```bash
# 在 Metro Bundler 中按 'r' 重新加载
# 或者摇晃设备 → Reload
```

## 常见问题

### 问题 1: "Network request failed"

**原因：** 无法连接到 shadowd

**解决：**
1. 确认 shadowd 正在运行
2. 检查地址是否正确（Android 模拟器用 `10.0.2.2`）
3. 检查防火墙设置

### 问题 2: "Connection timeout"

**原因：** 请求超时

**解决：**
增加超时时间或检查网络

### 问题 3: 设备显示离线

**原因：** 健康检查失败

**解决：**
1. 点击"刷新"按钮
2. 重新发现设备
3. 检查 shadowd 日志

## 调试命令

```bash
# 查看 shadowd 日志
tail -f shadowd.log

# 查看 React Native 日志
adb logcat | grep -E "shadowd|deviceStore"

# 测试 API
curl -v http://localhost:8080/api/device/info
curl -v http://localhost:8080/api/health
```

## 成功标准

当一切正常时，你应该看到：

1. **shadowd 日志：**
   ```
   INFO HTTP API server listening address="0.0.0.0:8080"
   ```

2. **App 日志：**
   ```
   ✅ [deviceStore] Discovered 1 devices
   ```

3. **设备列表：**
   - 设备显示为在线（绿色圆点）
   - 可以点击连接

## 下一步

如果仍然无法连接：

1. 检查是否在同一网络
2. 尝试使用真实设备而不是模拟器
3. 检查 React Native 的网络权限配置

## 临时解决方案

如果急需测试，可以暂时使用 Mock 数据：

在 `deviceStore.ts` 中：
```typescript
discoverDevices: async () => {
  // 临时使用 Mock 数据
  const mockDevice = {
    id: 'mock-1',
    name: 'MacBook Air',
    hostname: 'localhost',
    meshIP: '10.0.2.2',
    sshPort: 8022,
    grpcPort: 50052,
    publicKey: 'mock',
    online: true,
    lastSeen: new Date(),
  };
  
  set({ devices: [mockDevice], loading: false });
  await get().saveDevices();
}
```

这样至少可以测试 SSH 连接功能。
