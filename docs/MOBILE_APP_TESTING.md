# Shadow Shuttle 移动端应用测试指南

**版本**: 0.1.0  
**日期**: 2026-01-28

---

## 📱 测试环境准备

### iOS 测试环境

**要求**:
- macOS 12.0+
- Xcode 14.0+
- iOS Simulator 或实体设备 (iOS 13.0+)
- Node.js 18+
- CocoaPods

**安装步骤**:

```bash
# 1. 安装依赖
cd mobile-app
npm install --legacy-peer-deps

# 2. 安装 iOS 依赖
cd ios
pod install
cd ..

# 3. 启动 iOS 模拟器
npm run ios
```

### Android 测试环境

**要求**:
- Android Studio
- Android SDK (API 21+)
- Android Emulator 或实体设备
- Node.js 18+

**安装步骤**:

```bash
# 1. 安装依赖
cd mobile-app
npm install --legacy-peer-deps

# 2. 启动 Android 模拟器
# 在 Android Studio 中启动 AVD

# 3. 运行应用
npm run android
```

---

## 🧪 功能测试清单

### 1. VPN 连接测试

**测试场景**: 连接到 Mesh 网络

**步骤**:
1. 打开应用
2. 点击 "Connect VPN" 按钮
3. 观察连接状态变化
4. 验证 Mesh IP 显示

**预期结果**:
- ✅ 按钮状态从 "Connect" 变为 "Disconnect"
- ✅ 显示 Mesh IP (占位符: 100.64.0.1)
- ✅ 连接状态显示为 "Connected"

**实际结果** (占位符实现):
- ⚠️ 使用模拟连接
- ⚠️ 1秒延迟后显示成功
- ⚠️ 不是真实的 VPN 连接

**截图位置**: `docs/screenshots/vpn-connection.png`

---

### 2. 设备列表测试

**测试场景**: 查看和管理设备列表

**步骤**:
1. 导航到设备列表页面
2. 查看已添加的设备
3. 点击设备查看详情
4. 测试设备搜索功能

**预期结果**:
- ✅ 显示所有已配对设备
- ✅ 显示设备状态 (在线/离线)
- ✅ 显示设备信息 (名称、IP、OS)
- ✅ 搜索功能正常

**测试数据**:
```typescript
{
  id: "test-device-1",
  name: "MacBook Pro",
  hostname: "macbook-pro.local",
  meshIP: "100.64.0.1",
  os: "macOS",
  osVersion: "14.0",
  isOnline: true
}
```

**截图位置**: `docs/screenshots/device-list.png`

---

### 3. QR 码扫描测试

**测试场景**: 通过 QR 码添加新设备

**步骤**:
1. 点击 "+" 按钮
2. 进入 QR 扫描界面
3. 点击 "Test Scan" 按钮 (占位符)
4. 验证设备添加成功

**预期结果**:
- ✅ 相机权限请求 (实际实现)
- ✅ QR 码扫描界面显示
- ✅ 扫描成功后自动添加设备
- ✅ 返回设备列表

**实际结果** (占位符实现):
- ⚠️ 使用测试按钮模拟扫描
- ⚠️ 生成测试设备数据
- ⚠️ 不是真实的 QR 扫描

**测试 QR 码数据**:
```json
{
  "deviceId": "test-device-2",
  "deviceName": "Ubuntu Server",
  "meshIP": "100.64.0.2",
  "publicKey": "test_public_key",
  "timestamp": 1706428800
}
```

**截图位置**: `docs/screenshots/qr-scanner.png`

---

### 4. SSH 终端测试

**测试场景**: 连接到设备并执行命令

**步骤**:
1. 从设备列表选择设备
2. 点击 "Connect" 建立 SSH 连接
3. 等待连接建立
4. 输入测试命令
5. 观察命令输出
6. 测试断开连接

**测试命令**:
```bash
ls
pwd
whoami
echo "Hello Shadow Shuttle"
date
```

**预期结果**:
- ✅ 连接建立成功
- ✅ 显示欢迎信息
- ✅ 命令执行并显示输出
- ✅ 终端滚动正常
- ✅ 断开连接成功

**实际结果** (占位符实现):
- ⚠️ 使用模拟 SSH 连接
- ⚠️ 命令执行使用预定义响应
- ⚠️ 不是真实的 SSH 会话

**截图位置**: `docs/screenshots/terminal.png`

---

### 5. 指纹验证测试

**测试场景**: 使用生物识别验证身份

**步骤**:
1. 触发需要验证的操作
2. 系统提示指纹验证
3. 使用指纹或 Face ID
4. 验证成功后继续操作

**预期结果**:
- ✅ 生物识别提示显示
- ✅ 验证成功后继续
- ✅ 验证失败后重试
- ✅ 取消后返回

**实际结果** (占位符实现):
- ⚠️ 使用模拟验证
- ⚠️ 自动成功
- ⚠️ 不是真实的生物识别

**截图位置**: `docs/screenshots/fingerprint.png`

---

## 🎨 UI/UX 测试

### 界面一致性

**检查项目**:
- [ ] 颜色主题一致
- [ ] 字体大小合适
- [ ] 图标清晰可见
- [ ] 按钮大小适中
- [ ] 间距统一

### 响应式设计

**测试设备**:
- iPhone SE (小屏幕)
- iPhone 14 Pro (标准)
- iPhone 14 Pro Max (大屏幕)
- iPad (平板)

**检查项目**:
- [ ] 布局适配不同屏幕
- [ ] 文字不被截断
- [ ] 按钮可点击
- [ ] 滚动流畅

### 交互反馈

**检查项目**:
- [ ] 按钮点击有反馈
- [ ] 加载状态显示
- [ ] 错误提示清晰
- [ ] 成功提示友好

---

## 🐛 已知问题

### 占位符实现

1. **VPN 连接**
   - 使用模拟连接
   - 需要集成 WireGuard 原生模块

2. **SSH 连接**
   - 使用预定义命令响应
   - 需要集成 SSH 客户端库

3. **QR 扫描**
   - 使用测试按钮
   - 需要集成相机和 QR 解析库

4. **生物识别**
   - 使用模拟验证
   - 需要集成平台生物识别 API

### TypeScript 配置

- `customConditions` 配置警告
- 不影响运行，可以忽略

---

## 📊 性能测试

### 启动时间

**测试方法**:
```bash
# 使用 React Native 性能工具
npm run ios -- --configuration Release
```

**目标**:
- 冷启动 < 3 秒
- 热启动 < 1 秒

### 内存使用

**测试工具**:
- Xcode Instruments (iOS)
- Android Profiler (Android)

**目标**:
- 空闲内存 < 50 MB
- 运行内存 < 100 MB

### 电池消耗

**测试场景**:
- 保持 VPN 连接 1 小时
- 保持 SSH 会话 30 分钟

**目标**:
- 电池消耗 < 5% / 小时

---

## 🔒 安全测试

### 密钥存储

**测试项目**:
- [ ] 私钥存储在安全区域
- [ ] 密钥不可导出
- [ ] 应用卸载后密钥删除

### 网络安全

**测试项目**:
- [ ] 所有连接使用加密
- [ ] 证书验证正确
- [ ] 不接受自签名证书 (生产环境)

---

## 📝 测试报告模板

### 测试信息

- **测试日期**: YYYY-MM-DD
- **测试人员**: 姓名
- **测试设备**: 设备型号
- **系统版本**: iOS/Android 版本
- **应用版本**: 0.1.0

### 测试结果

| 功能 | 状态 | 备注 |
|------|------|------|
| VPN 连接 | ✅/❌ | |
| 设备列表 | ✅/❌ | |
| QR 扫描 | ✅/❌ | |
| SSH 终端 | ✅/❌ | |
| 指纹验证 | ✅/❌ | |

### 发现的问题

1. **问题描述**
   - 严重程度: 高/中/低
   - 复现步骤: ...
   - 预期结果: ...
   - 实际结果: ...
   - 截图: ...

### 建议

- 改进建议 1
- 改进建议 2
- 改进建议 3

---

## 🚀 自动化测试 (未来)

### 单元测试

```bash
npm test
```

### E2E 测试

使用 Detox 或 Appium:

```bash
# 安装 Detox
npm install -g detox-cli

# 运行 E2E 测试
detox test
```

### 截图测试

使用 jest-image-snapshot:

```bash
npm run test:screenshots
```

---

## 📚 参考资料

- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Detox E2E Testing](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

**测试完成后，请将截图保存到 `docs/screenshots/` 目录，并更新本文档。**
