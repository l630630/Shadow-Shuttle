# 快速修复：设备列表为空

## 问题
应用显示"还没有配对的设备"

## 原因
1. shadowd 没有运行
2. AsyncStorage 被清空
3. 自动发现失败

## 解决方案

### 方案 1：启动 shadowd（推荐）
```bash
cd shadowd
./shadowd &

# 验证 shadowd 运行
curl http://localhost:8080/api/health
```

### 方案 2：手动添加设备
1. 打开应用
2. 点击右下角蓝色 "+" 按钮
3. 填写设备信息：
   - 设备名称：`630MacBook-Air.local`
   - Mesh IP：`10.0.2.2`
   - SSH 端口：`8022`
   - 公钥：留空或填写 `mock_public_key`
4. 点击"添加设备"

### 方案 3：清除应用数据并重启
1. 在模拟器中长按应用图标
2. 选择"应用信息"
3. 点击"存储"
4. 点击"清除数据"
5. 重新打开应用

### 方案 4：使用 React Native Debugger
```bash
# 在应用中摇晃设备（Cmd+M）
# 选择 "Debug"
# 在 Chrome DevTools Console 中执行：

// 查看当前设备
AsyncStorage.getItem('@shadow_shuttle_devices').then(console.log)

// 手动添加设备
const device = {
  id: '630MacBook-Air.local-mock',
  name: '630MacBook-Air.local',
  hostname: '630MacBook-Air.local',
  meshIP: '10.0.2.2',
  sshPort: 8022,
  grpcPort: 50052,
  publicKey: 'mock_public_key',
  online: true,
  lastSeen: new Date().toISOString()
};
AsyncStorage.setItem('@shadow_shuttle_devices', JSON.stringify([device]))
```

## 验证修复

### 1. 检查 shadowd 状态
```bash
curl http://localhost:8080/api/device/info
```

应该返回：
```json
{
  "id": "630MacBook-Air.local",
  "name": "630MacBook-Air.local",
  "meshIP": "100.64.0.1",
  "isOnline": true,
  ...
}
```

### 2. 检查应用日志
在 Metro Bundler 终端中查看日志：
```
🔵 [App] Loading persisted devices from store...
🔵 [deviceStore] loadDevices called
🔍 [deviceStore] Discovering devices via shadowd API
✅ [deviceStore] Discovered 1 devices
✅ [deviceStore] Total devices after discovery: 1
```

### 3. 检查设备列表
应用应该显示：
- Mesh 设备标题
- 一个设备卡片：`630MacBook-Air.local`
- 绿色在线状态指示器

## 当前状态
- ✅ shadowd 已启动并运行
- ✅ 应用已重新构建
- ⏳ 等待应用加载设备

## 下一步
1. 打开应用查看设备列表
2. 如果还是空的，点击右下角 "+" 手动添加
3. 或者使用方案 3 清除应用数据重试
