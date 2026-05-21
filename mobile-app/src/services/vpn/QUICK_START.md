# WireGuard VPN 集成 - 快速开始指南

## 📋 前置要求

### 开发环境
- Node.js 16+
- React Native 0.70+
- Xcode 14+ (iOS 开发)
- CocoaPods

### Apple Developer
- 付费的 Apple Developer Account
- Network Extension 权限
- App Group 配置

---

## 🚀 快速开始

### Step 1: 安装依赖

```bash
cd mobile-app

# 安装 npm 依赖
npm install

# 安装 iOS 依赖
cd ios
pod install
cd ..
```

### Step 2: 配置 Xcode 项目

按照 `ios/VPN/SETUP_GUIDE.md` 完成以下配置：

1. 创建 Network Extension Target
2. 配置 App Group (`group.com.shadowshuttle.vpn`)
3. 添加 Network Extension Capability
4. 配置 Entitlements
5. 安装 WireGuardKit

### Step 3: 注册 VPN 服务

在应用启动时注册 VPN 服务：

```typescript
// App.tsx 或 index.js
import { registerVPNServices } from './src/services/vpn/registerVPNServices';

// 在应用启动时调用
registerVPNServices();
```

### Step 4: 初始化 VPN Store

在根组件中初始化 VPN Store：

```typescript
import { useVPNStore } from './src/stores/vpnStore';

function App() {
  const { initialize } = useVPNStore();

  useEffect(() => {
    initialize();
  }, []);

  return <YourApp />;
}
```

### Step 5: 添加导航路由

在 React Navigation 中添加 VPN Settings Screen：

```typescript
import { VPNSettingsScreen } from './src/screens/VPNSettingsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* 其他路由 */}
      <Stack.Screen 
        name="VPNSettings" 
        component={VPNSettingsScreen}
        options={{ title: 'VPN 设置' }}
      />
    </Stack.Navigator>
  );
}
```

### Step 6: 添加 VPN 状态指示器

在设备列表或主屏幕添加 VPN 状态指示器：

```typescript
import { VPNStatusIndicator } from './src/components/VPNStatusIndicator';

function DeviceListScreen() {
  return (
    <View>
      <VPNStatusIndicator />
      {/* 其他内容 */}
    </View>
  );
}
```

---

## 💡 基本使用

### 1. 注册设备

```typescript
import { useVPNStore } from './stores/vpnStore';

function RegisterScreen() {
  const { register } = useVPNStore();

  const handleRegister = async () => {
    try {
      await register({
        headscaleUrl: 'https://headscale.example.com',
        deviceName: 'my-iphone',
        preAuthKey: 'your-pre-auth-key',
      });
      Alert.alert('成功', '设备注册成功！');
    } catch (error) {
      Alert.alert('失败', error.message);
    }
  };

  return (
    <Button title="注册设备" onPress={handleRegister} />
  );
}
```

### 2. 连接 VPN

```typescript
function ConnectButton() {
  const { isConnected, connect, disconnect } = useVPNStore();

  const handlePress = async () => {
    try {
      if (isConnected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <Button 
      title={isConnected ? '断开' : '连接'} 
      onPress={handlePress} 
    />
  );
}
```

### 3. 启用自动重连

```typescript
function AutoReconnectToggle() {
  const { isAutoReconnectEnabled, setAutoReconnect } = useVPNStore();

  return (
    <Switch
      value={isAutoReconnectEnabled}
      onValueChange={setAutoReconnect}
    />
  );
}
```

### 4. 显示连接信息

```typescript
function ConnectionInfo() {
  const { status, connectionInfo } = useVPNStore();

  return (
    <View>
      <Text>状态: {status}</Text>
      {connectionInfo?.meshIP && (
        <Text>Mesh IP: {connectionInfo.meshIP}</Text>
      )}
    </View>
  );
}
```

---

## 🧪 测试

### 在模拟器中测试（有限）

```bash
# 启动 Metro
npm start

# 在另一个终端运行 iOS
npm run ios
```

**注意**: Network Extension 无法在模拟器中运行，只能测试 UI。

### 在真机上测试

1. 连接 iPhone 到 Mac
2. 在 Xcode 中选择你的设备
3. 配置 Signing & Capabilities
4. 运行应用

```bash
# 或使用命令行
npm run ios -- --device "Your iPhone Name"
```

### 测试流程

1. ✅ 打开应用
2. ✅ 进入 VPN 设置
3. ✅ 输入 Headscale 信息并注册
4. ✅ 点击连接按钮
5. ✅ 允许 VPN 权限（首次）
6. ✅ 查看连接状态
7. ✅ 测试网络切换（WiFi ↔ Cellular）
8. ✅ 测试应用后台恢复
9. ✅ 断开连接

---

## 🐛 常见问题

### Q1: 编译错误 "No such module 'WireGuardKit'"

**解决方案**:
```bash
cd ios
pod deintegrate
pod install
```

### Q2: VPN 权限被拒绝

**解决方案**:
1. 检查 Provisioning Profile 是否包含 Network Extension
2. 在设置 → VPN 中删除旧配置
3. 重新运行应用

### Q3: 无法连接到 Headscale

**解决方案**:
1. 检查 Headscale URL 是否正确
2. 检查预授权密钥是否有效
3. 检查网络连接
4. 查看 Headscale 服务器日志

### Q4: 自动重连不工作

**解决方案**:
1. 确保已启用自动重连
2. 检查网络监控权限
3. 查看应用日志

### Q5: Mesh IP 不显示

**解决方案**:
1. 确保 VPN 已连接
2. 检查配置是否正确
3. 重新注册设备

---

## 📚 更多文档

- [完整 API 文档](./README.md)
- [iOS 配置指南](../../ios/VPN/SETUP_GUIDE.md)
- [使用示例](./example-complete.ts)
- [架构设计](./FINAL_SUMMARY.md)

---

## 🔧 调试技巧

### 查看日志

```typescript
// 启用详细日志
console.log('VPN Status:', status);
console.log('Connection Info:', connectionInfo);
```

### 使用 React Native Debugger

```bash
# 安装
brew install --cask react-native-debugger

# 启动
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### 查看 iOS 日志

```bash
# 使用 Console.app
# 过滤: process:ShadowShuttleTemp
```

---

## 🎯 下一步

1. 阅读完整文档了解高级功能
2. 自定义 UI 样式
3. 添加更多错误处理
4. 实现 Mesh 网络检测
5. 添加性能监控

---

## 💬 获取帮助

如有问题：
1. 查看 [FINAL_SUMMARY.md](./FINAL_SUMMARY.md)
2. 查看 [SETUP_GUIDE.md](../../ios/VPN/SETUP_GUIDE.md)
3. 查看示例代码 [example-complete.ts](./example-complete.ts)

---

**祝你使用愉快！** 🎉
