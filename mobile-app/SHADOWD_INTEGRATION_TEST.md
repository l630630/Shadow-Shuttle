# Shadowd 集成测试指南

## 概述

手机 App 现在可以通过 HTTP API 与 shadowd 通信，获取真实的设备信息。

## 架构

```
手机 App
    ↓ HTTP/JSON
shadowd HTTP API (端口 8080)
    ↓
shadowd gRPC 内部服务
    ↓
设备信息、健康状态等
```

## 前置条件

### 1. 启动 shadowd

```bash
cd shadowd
./start-dev.sh
```

确保看到以下日志：
```
INFO HTTP API server listening address="0.0.0.0:8080"
INFO WebSocket SSH proxy listening address="0.0.0.0:8022"
INFO SSH server listening address="127.0.0.1:2222"
INFO gRPC server listening address="127.0.0.1:50052"
```

### 2. 测试 HTTP API

```bash
# 测试设备信息
curl http://localhost:8080/api/device/info

# 测试健康检查
curl http://localhost:8080/api/health

# 测试配对码
curl http://localhost:8080/api/device/pairing-code
```

## 手机端测试

### 方法 1：在代码中测试

在 `mobile-app/src/screens/HomeScreen.tsx` 或其他地方添加：

```typescript
import { getShadowdService } from '../services/shadowdService';

// 测试获取设备信息
const testShadowd = async () => {
  try {
    const shadowd = getShadowdService();
    
    // 获取设备信息
    const deviceInfo = await shadowd.getDeviceInfo();
    console.log('Device Info:', deviceInfo);
    
    // 健康检查
    const health = await shadowd.healthCheck();
    console.log('Health:', health);
    
    // 生成配对码
    const pairingCode = await shadowd.generatePairingCode();
    console.log('Pairing Code:', pairingCode);
  } catch (error) {
    console.error('Shadowd test failed:', error);
  }
};

// 在组件中调用
useEffect(() => {
  testShadowd();
}, []);
```

### 方法 2：使用 React Native Debugger

1. 打开 React Native Debugger
2. 在 Console 中运行：

```javascript
const { getShadowdService } = require('./src/services/shadowdService');
const shadowd = getShadowdService();

// 测试
shadowd.getDeviceInfo().then(console.log);
shadowd.healthCheck().then(console.log);
```

## API 端点

### GET /api/device/info

获取设备信息

**响应示例：**
```json
{
  "id": "630MacBook-Air.local-1770202867",
  "name": "630MacBook-Air.local",
  "os": "darwin",
  "osVersion": "macOS",
  "meshIP": "127.0.0.1",
  "publicKey": "",
  "isOnline": true,
  "lastSeen": 1770202867,
  "sshPort": 2222,
  "grpcPort": 50052
}
```

### GET /api/health

健康检查

**响应示例：**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "connected": true,
  "lastCheck": 1770202867
}
```

### GET /api/device/pairing-code

生成配对二维码

**响应示例：**
```json
{
  "deviceId": "630MacBook-Air.local-1770202867",
  "deviceName": "630MacBook-Air.local",
  "meshIp": "127.0.0.1",
  "publicKey": "",
  "timestamp": 1770202867,
  "qrCode": "device-id|device-name|mesh-ip|public-key"
}
```

## 连接地址配置

### Android 模拟器
```typescript
const shadowd = new ShadowdService('10.0.2.2', 8080);
```

### iOS 模拟器
```typescript
const shadowd = new ShadowdService('localhost', 8080);
```

### 真实设备（同一 Wi-Fi）
```typescript
// 使用你的 Mac 的 IP 地址
const shadowd = new ShadowdService('192.168.1.100', 8080);
```

## 故障排除

### 问题 1: 连接超时

**检查 shadowd 是否运行：**
```bash
lsof -i :8080
```

**检查防火墙：**
```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

### 问题 2: CORS 错误

shadowd HTTP API 已经配置了 CORS，允许所有来源。如果仍有问题，检查日志：

```bash
# 查看 shadowd 日志
tail -f shadowd.log
```

### 问题 3: 网络不可达

**确保手机和电脑在同一网络：**
- Android 模拟器：自动使用 `10.0.2.2`
- iOS 模拟器：使用 `localhost`
- 真实设备：需要在同一 Wi-Fi，使用电脑的 IP

**查找电脑 IP：**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## 下一步

1. ✅ 测试 HTTP API 连接
2. 🔄 集成到设备发现流程
3. 🔄 替换 Mock 数据
4. 📅 添加设备列表刷新
5. 📅 实现自动发现

## 相关文件

- `mobile-app/src/services/shadowdService.ts` - Shadowd HTTP API 客户端
- `shadowd/http/server.go` - HTTP API 服务器实现
- `shadowd/grpc/server.go` - gRPC 服务实现

## 成功标准

- [ ] 可以从手机获取设备信息
- [ ] 健康检查返回正确状态
- [ ] 配对码生成成功
- [ ] 设备发现功能正常
- [ ] 错误处理正确

完成这些测试后，Phase 2 就完成了！
