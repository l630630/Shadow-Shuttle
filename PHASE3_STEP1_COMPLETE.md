# Phase 3 Step 1: 使用真实 Mac IP - 完成 ✅

## 完成内容

### 1. 创建 IP 获取工具 ✅
- **文件**: `shadowd/network/ip.go`
- **功能**: 
  - `GetLocalIP()`: 获取非回环本地 IP
  - `GetPreferredLocalIP()`: 优先返回私有网络 IP (192.168.x.x, 10.x.x.x)
  - `isPrivateIP()`: 检查 IP 是否在私有网络范围

### 2. 修改 shadowd 使用真实 IP ✅
- **文件**: `shadowd/network/wg.go`
- **修改**: `registerWithHeadscale()` 函数
- **变更**: 
  - 从硬编码 `127.0.0.1` 改为调用 `GetPreferredLocalIP()`
  - 开发模式下使用真实局域网 IP: `192.168.2.57`

### 3. 更新移动应用配置 ✅
- **文件**: `mobile-app/src/stores/deviceStore.ts`
- **修改**:
  - 设备发现默认主机列表添加 `192.168.2.57`
  - Fallback mock 设备使用真实 IP `192.168.2.57`

## 测试结果

### shadowd 启动日志
```
time="2026-02-05T14:00:28+08:00" level=info msg="Using local network IP as Mesh IP (dev mode)" local_ip=192.168.2.57
time="2026-02-05T14:00:28+08:00" level=info msg="Successfully registered with Headscale (dev mode)" mesh_ip=192.168.2.57
time="2026-02-05T14:00:28+08:00" level=info msg="WireGuard manager started successfully" mesh_ip=192.168.2.57
```

### HTTP API 验证
```bash
$ curl http://192.168.2.57:8080/api/device/info
{
  "id": "630MacBook-Air.local-1770271228",
  "name": "630MacBook-Air.local",
  "meshIP": "192.168.2.57",  # ✅ 真实 IP
  "isOnline": true,
  ...
}

$ curl http://192.168.2.57:8080/api/device/pairing-code
{
  "deviceId": "630MacBook-Air.local-1770271228",
  "deviceName": "630MacBook-Air.local",
  "meshIp": "192.168.2.57",  # ✅ 真实 IP
  "qrCode": "630MacBook-Air.local-1770271228|630MacBook-Air.local|192.168.2.57|"
}
```

## 当前架构

```
移动应用 (Android)
    ↓
HTTP API (http://192.168.2.57:8080)  ← 现在可以访问！
    ↓
shadowd HTTP 服务器
    ↓
设备信息 (真实 IP: 192.168.2.57)

移动应用 (Android)
    ↓
WebSocket SSH (ws://192.168.2.57:8022)  ← 现在可以访问！
    ↓
shadowd WebSocket 代理
    ↓
shadowd SSH 服务器 (192.168.2.57:2222)
    ↓
本地 Shell
```

## 优点

1. **立即可用**: 无需额外配置或依赖
2. **真实连接**: 移动应用可以通过局域网访问 Mac
3. **自动检测**: shadowd 自动检测并使用最佳本地 IP
4. **向后兼容**: 如果检测失败，回退到 `127.0.0.1`

## 限制

1. **局域网限制**: 只能在同一局域网内使用
2. **IP 变化**: 如果 Mac IP 变化，需要重启 shadowd
3. **手动配置**: 移动应用中硬编码了 IP（临时方案）

## 下一步

### 短期改进
1. **QR 码配对**: 扫描 QR 码自动获取真实 IP
2. **IP 配置界面**: 允许用户手动输入或修改 IP

### 中期改进
1. **mDNS/Bonjour 发现**: 自动发现局域网内的 shadowd 实例
2. **动态 IP 更新**: 检测 IP 变化并自动更新

### 长期改进
1. **WireGuard VPN**: 实现真实的 Mesh 网络
2. **Headscale 集成**: 支持跨网络连接
3. **P2P 连接**: 设备间直接通信

## 使用方法

### 在真实设备上测试

1. **确保设备在同一局域网**:
   - Mac: 连接到 WiFi `192.168.2.x`
   - 手机: 连接到同一 WiFi

2. **启动 shadowd**:
   ```bash
   cd shadowd
   ./shadowd
   ```

3. **打开移动应用**:
   - 应用会自动尝试连接 `192.168.2.57`
   - 如果成功，设备列表会显示 Mac
   - 点击设备即可连接 SSH

4. **验证连接**:
   ```bash
   # 在手机上执行命令
   $ pwd
   /Users/a0000
   
   $ ls
   Desktop  Documents  Downloads  ...
   ```

## 故障排除

### 问题 1: 无法连接到 192.168.2.57
**原因**: 设备不在同一局域网
**解决**: 
- 确保 Mac 和手机连接到同一 WiFi
- 检查防火墙设置
- 尝试 ping `192.168.2.57`

### 问题 2: IP 地址变化
**原因**: Mac 的 DHCP 租约更新
**解决**:
- 重启 shadowd
- 或者在路由器中设置静态 IP

### 问题 3: 仍然显示 127.0.0.1
**原因**: shadowd 未重新编译
**解决**:
```bash
cd shadowd
go build -o shadowd
pkill shadowd
./shadowd
```

## 总结

✅ **Phase 3 Step 1 完成**：shadowd 现在使用真实的局域网 IP (`192.168.2.57`)，移动应用可以通过局域网访问 HTTP API 和 SSH 服务。

🎯 **下一步**：实现 mDNS/Bonjour 自动发现，无需硬编码 IP 地址。
