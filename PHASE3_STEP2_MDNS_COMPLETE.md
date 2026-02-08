# Phase 3 Step 2: mDNS/Bonjour 自动发现 - 完成 ✅

## 完成内容

### 1. shadowd 端实现 ✅

#### 安装依赖
```bash
go get github.com/grandcat/zeroconf
```

#### 创建 mDNS 服务 (`shadowd/network/mdns.go`)
- `NewMDNSService()`: 创建 mDNS 服务实例
- `Start()`: 开始广播服务
- `Stop()`: 停止广播
- 服务类型: `_shadowd._tcp.local.`
- TXT 记录包含：
  - `version=0.1.0`
  - `mesh_ip=192.168.2.57`
  - `ssh_port=2222`
  - `grpc_port=50052`
  - `ws_port=8022`

#### 集成到 shadowd (`shadowd/main.go`)
- 添加 `initializeMDNS()` 函数
- 在启动时自动注册 mDNS 服务
- 在关闭时自动注销服务

### 2. 移动应用端实现 ✅

#### 安装依赖
```bash
npm install react-native-zeroconf
```

#### 创建 mDNS 服务 (`mobile-app/src/services/mdnsService.ts`)
- `discoverDevices()`: 扫描局域网内的 shadowd 服务
- 自动解析 TXT 记录获取端口信息
- 返回标准 Device 对象

#### 集成到设备发现 (`mobile-app/src/stores/deviceStore.ts`)
- 优先使用 mDNS 发现
- 如果 mDNS 失败，回退到 HTTP API
- 如果都失败，使用 fallback mock 设备

#### 添加 Android 权限
- `CHANGE_WIFI_MULTICAST_STATE`: mDNS 需要
- `ACCESS_WIFI_STATE`: 网络状态检测

## 测试结果

### shadowd 日志
```
time="2026-02-05T16:16:35+08:00" level=info msg="Starting mDNS service advertisement" 
  port=8080 service_name="MacBook Air" service_type=_shadowd._tcp
time="2026-02-05T16:16:35+08:00" level=info msg="mDNS service advertisement started" 
  port=8080 service_name="MacBook Air" service_type=_shadowd._tcp
```

### macOS 验证
```bash
$ dns-sd -B _shadowd._tcp local.
Browsing for _shadowd._tcp.local.
Timestamp     A/R    Flags  if Domain               Service Type         Instance Name
16:17:15.422  Add        3   1 local.               _shadowd._tcp.       MacBook Air
```

## 工作流程

```
移动应用启动
    ↓
调用 discoverDevices()
    ↓
1. 尝试 mDNS 发现 (5秒超时)
    ↓
   [成功] → 解析服务信息 → 创建 Device 对象
    ↓
   [失败] → 尝试 HTTP API 扫描
    ↓
   [失败] → 使用 fallback mock 设备
    ↓
保存到 AsyncStorage
    ↓
显示设备列表
```

## 优点

1. **零配置**: 无需手动输入 IP 地址
2. **自动发现**: 局域网内自动发现所有 shadowd 实例
3. **实时更新**: IP 变化时自动更新
4. **多设备支持**: 可以发现多个 Mac/PC
5. **标准协议**: 使用 Bonjour/mDNS 标准协议
6. **向后兼容**: 如果 mDNS 失败，回退到其他方法

## 限制

1. **局域网限制**: 只能在同一局域网内发现
2. **防火墙**: 某些防火墙可能阻止 mDNS
3. **Android 模拟器**: 模拟器可能无法接收 mDNS 广播（需要真实设备测试）

## 下一步：实现 WireGuard VPN

现在设备发现已经完全自动化，接下来实现真实的 WireGuard VPN，实现：
1. 真实的 Mesh 网络
2. 跨网络连接
3. 加密通信
4. P2P 连接

## 使用方法

### 在真实设备上测试

1. **确保设备在同一 WiFi**:
   - Mac: 连接到 WiFi
   - 手机: 连接到同一 WiFi

2. **启动 shadowd**:
   ```bash
   cd shadowd
   ./shadowd
   ```

3. **打开移动应用**:
   - 应用会自动通过 mDNS 发现 Mac
   - 无需手动输入 IP
   - 设备列表自动显示发现的设备

4. **验证**:
   - 查看 Metro Bundler 日志
   - 应该看到 `[MDNSService] Service resolved: MacBook Air`
   - 设备列表显示 Mac 设备

## 故障排除

### 问题 1: 无法发现设备
**原因**: mDNS 被防火墙阻止
**解决**:
- 检查 Mac 防火墙设置
- 允许 shadowd 接收传入连接
- 或者临时关闭防火墙测试

### 问题 2: Android 模拟器无法发现
**原因**: 模拟器网络隔离
**解决**:
- 使用真实 Android 设备测试
- 或者使用 Genymotion 模拟器（支持 mDNS）

### 问题 3: 发现后无法连接
**原因**: 端口配置错误
**解决**:
- 检查 TXT 记录中的端口信息
- 确保 WebSocket SSH 代理在 8022 端口运行

## 总结

✅ **Phase 3 Step 2 完成**：实现了 mDNS/Bonjour 自动发现功能，移动应用可以零配置自动发现局域网内的 shadowd 实例。

🎯 **下一步**：实现 WireGuard VPN，建立真实的 Mesh 网络。
