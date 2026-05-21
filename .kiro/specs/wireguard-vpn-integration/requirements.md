# WireGuard VPN 集成 - 需求文档

## 1. 概述

### 1.1 功能描述
在 Shadow Shuttle 移动应用中集成 WireGuard VPN 功能，实现跨网络远程访问设备。用户无需安装额外的 VPN 应用，可以在 Shadow Shuttle 内直接管理 VPN 连接，通过 Headscale 协调服务器建立私有 Mesh 网络。

### 1.2 目标用户
- 需要跨网络（4G/5G/不同 WiFi）访问家里或公司电脑的用户
- 希望在一个应用内完成所有操作的用户
- 重视隐私和数据安全的用户

### 1.3 业务价值
- 提升用户体验：一个应用完成所有操作
- 增强产品竞争力：完整的跨网访问解决方案
- 扩大使用场景：不受网络环境限制

---

## 2. 用户故事

### 2.1 VPN 连接管理

**作为**用户  
**我想要**在 Shadow Shuttle 中直接连接 VPN  
**以便**无需切换到其他应用

**验收标准**：
- 用户可以在应用内输入 Headscale 服务器地址
- 用户可以输入预授权密钥进行设备注册
- 用户可以一键连接/断开 VPN
- 连接状态清晰可见（已连接/未连接/连接中）
- 显示 Mesh IP 地址

### 2.2 自动设备注册

**作为**用户  
**我想要**应用自动向 Headscale 注册设备  
**以便**无需手动配置复杂的 WireGuard 参数

**验收标准**：
- 输入 Headscale URL 和预授权密钥后自动注册
- 自动获取 WireGuard 配置（私钥、公钥、Peer 信息）
- 自动获取 Mesh IP 地址
- 注册失败时显示清晰的错误信息

### 2.3 VPN 状态监控

**作为**用户  
**我想要**实时查看 VPN 连接状态  
**以便**了解网络连接情况

**验收标准**：
- 显示连接状态（已连接/未连接/连接中/错误）
- 显示 Mesh IP 地址
- 显示连接时长
- 显示流量统计（可选）
- 在设备列表页面显示 VPN 状态指示器

### 2.4 自动重连

**作为**用户  
**我想要**VPN 在网络切换时自动重连  
**以便**保持连接稳定性

**验收标准**：
- 网络切换（WiFi ↔ 4G）时自动重连
- 应用从后台恢复时检查并重连
- 重连失败时显示通知
- 可以在设置中开启/关闭自动重连

### 2.5 VPN 配置管理

**作为**用户  
**我想要**保存和管理 VPN 配置  
**以便**下次使用时无需重新输入

**验收标准**：
- VPN 配置持久化存储
- 可以编辑 Headscale 服务器地址
- 可以重新生成预授权密钥
- 可以清除 VPN 配置
- 配置存储在安全存储中（Keychain/KeyStore）

### 2.6 设备使用 Mesh IP

**作为**用户  
**我想要**添加设备时自动使用 Mesh IP  
**以便**实现跨网访问

**验收标准**：
- VPN 连接后，添加设备时提示使用 Mesh IP
- 可以手动输入 Mesh IP 或局域网 IP
- 自动检测设备是否在 Mesh 网络中
- 显示设备的连接方式（局域网/Mesh 网络）

---

## 3. 功能需求

### 3.1 iOS 原生模块

#### 3.1.1 WireGuard 集成
- 集成 WireGuardKit 库
- 实现 VPN 隧道管理
- 处理 VPN 权限请求
- 实现 Network Extension

#### 3.1.2 React Native 桥接
- 创建 WireGuardModule 原生模块
- 实现 connect() 方法
- 实现 disconnect() 方法
- 实现 getStatus() 方法
- 实现事件监听（连接状态变化）

### 3.2 Android 原生模块

#### 3.2.1 WireGuard 集成
- 集成 WireGuard Android 库
- 实现 VPN Service
- 处理 VPN 权限请求
- 实现后台服务

#### 3.2.2 React Native 桥接
- 创建 WireGuardModule 原生模块
- 实现 connect() 方法
- 实现 disconnect() 方法
- 实现 getStatus() 方法
- 实现事件监听（连接状态变化）

### 3.3 VPN Service（TypeScript）

#### 3.3.1 Headscale 集成
- 实现设备注册 API 调用
- 实现 WireGuard 配置获取
- 处理预授权密钥验证
- 实现配置解析和格式化

#### 3.3.2 连接管理
- 实现连接/断开逻辑
- 实现状态管理
- 实现自动重连机制
- 实现错误处理和重试

#### 3.3.3 配置管理
- 实现配置持久化
- 实现配置加密存储
- 实现配置导入/导出
- 实现配置验证

### 3.4 用户界面

#### 3.4.1 VPN 设置页面
- Headscale URL 输入
- 预授权密钥输入
- 设备名称输入
- 连接/断开按钮
- 连接状态显示
- Mesh IP 显示

#### 3.4.2 VPN 状态指示器
- 在设备列表顶部显示 VPN 状态
- 显示连接状态图标
- 显示 Mesh IP
- 点击可快速跳转到 VPN 设置

#### 3.4.3 设置集成
- 在设置页面添加 VPN 配置入口
- 显示当前 VPN 状态
- 提供快速连接/断开开关
- 显示高级设置选项

---

## 4. 非功能需求

### 4.1 性能
- VPN 连接建立时间 < 5 秒
- 网络切换重连时间 < 10 秒
- 应用启动时 VPN 状态检查 < 1 秒
- 内存占用增加 < 50MB

### 4.2 安全性
- VPN 配置加密存储
- 使用平台安全存储（Keychain/KeyStore）
- 私钥不离开设备
- 所有流量端到端加密（WireGuard）

### 4.3 稳定性
- VPN 连接成功率 > 95%
- 自动重连成功率 > 90%
- 应用崩溃率 < 0.1%
- 网络切换不影响 SSH 连接

### 4.4 兼容性
- iOS 13.0+
- Android 8.0+ (API 26+)
- 支持 IPv4 和 IPv6
- 支持各种网络环境（WiFi/4G/5G）

### 4.5 用户体验
- 界面响应时间 < 100ms
- 错误信息清晰易懂
- 提供详细的帮助文档
- 支持中英文

---

## 5. 技术约束

### 5.1 依赖库
- iOS: WireGuardKit (~> 1.0)
- Android: com.wireguard.android:tunnel (1.0.20230706)
- React Native: 0.73.0

### 5.2 权限要求
- iOS: Network Extension 权限
- Android: BIND_VPN_SERVICE 权限
- Android: INTERNET 权限
- Android: ACCESS_NETWORK_STATE 权限

### 5.3 平台限制
- iOS: 需要配置 Network Extension Target
- iOS: 需要 App Group 共享数据
- Android: 需要 VPN Service 在后台运行
- Android: 需要处理电池优化

---

## 6. 数据模型

### 6.1 VPN 配置
```typescript
interface VPNConfig {
  headscaleUrl: string;        // Headscale 服务器地址
  preauthKey: string;          // 预授权密钥
  deviceName: string;          // 设备名称
  nodeKey?: string;            // 设备节点密钥（注册后获取）
  meshIP?: string;             // Mesh IP 地址
  lastConnected?: Date;        // 最后连接时间
}
```

### 6.2 WireGuard 配置
```typescript
interface WireGuardConfig {
  privateKey: string;          // 私钥
  address: string;             // IP 地址
  dns: string[];               // DNS 服务器
  peers: Array<{
    publicKey: string;         // 对端公钥
    endpoint: string;          // 对端地址
    allowedIPs: string[];      // 允许的 IP 范围
    persistentKeepalive?: number; // 保活间隔
  }>;
}
```

### 6.3 VPN 状态
```typescript
interface VPNStatus {
  connected: boolean;          // 是否已连接
  connecting: boolean;         // 是否正在连接
  meshIP: string | null;       // Mesh IP
  connectedAt: Date | null;    // 连接时间
  bytesReceived: number;       // 接收字节数
  bytesSent: number;           // 发送字节数
  lastError: string | null;    // 最后错误
}
```

---

## 7. API 接口

### 7.1 Headscale API

#### 7.1.1 设备注册
```
POST /api/v1/machine/register
Body: {
  key: string,      // 预授权密钥
  name: string      // 设备名称
}
Response: {
  nodeKey: string,
  machineKey: string
}
```

#### 7.1.2 获取 WireGuard 配置
```
GET /api/v1/machine/{nodeKey}/wireguard
Response: WireGuardConfig
```

### 7.2 原生模块 API

#### 7.2.1 连接 VPN
```typescript
WireGuardModule.connect(config: string): Promise<void>
```

#### 7.2.2 断开 VPN
```typescript
WireGuardModule.disconnect(): Promise<void>
```

#### 7.2.3 获取状态
```typescript
WireGuardModule.getStatus(): Promise<VPNStatus>
```

#### 7.2.4 事件监听
```typescript
WireGuardModule.addListener('statusChanged', (status: VPNStatus) => void)
```

---

## 8. 用户流程

### 8.1 首次配置流程
```
1. 用户打开 Shadow Shuttle
2. 点击"VPN 设置"
3. 输入 Headscale URL
4. 输入预授权密钥
5. 输入设备名称（可选，默认"我的手机"）
6. 点击"连接 VPN"
7. 系统请求 VPN 权限
8. 用户授权
9. 应用向 Headscale 注册设备
10. 获取 WireGuard 配置
11. 启动 VPN 连接
12. 显示连接成功和 Mesh IP
```

### 8.2 日常使用流程
```
1. 用户打开 Shadow Shuttle
2. 应用自动检查 VPN 状态
3. 如果未连接且开启自动连接，自动连接
4. 用户在设备列表中看到 VPN 状态指示器
5. 用户添加设备时使用 Mesh IP
6. 用户正常使用 SSH 终端
```

### 8.3 网络切换流程
```
1. 用户从 WiFi 切换到 4G
2. 应用检测到网络变化
3. VPN 连接断开
4. 应用自动尝试重连
5. 重连成功，恢复 SSH 连接
6. 用户无感知继续使用
```

---

## 9. 错误处理

### 9.1 常见错误

| 错误类型 | 错误信息 | 处理方式 |
|---------|---------|---------|
| 网络错误 | 无法连接到 Headscale 服务器 | 检查网络连接，重试 |
| 认证错误 | 预授权密钥无效 | 提示用户检查密钥 |
| 权限错误 | VPN 权限被拒绝 | 引导用户到设置页面授权 |
| 配置错误 | WireGuard 配置无效 | 重新注册设备 |
| 连接错误 | VPN 连接失败 | 检查防火墙，重试 |

### 9.2 错误恢复策略
- 网络错误：自动重试 3 次，间隔 5 秒
- 认证错误：提示用户重新输入
- 权限错误：引导用户授权
- 配置错误：清除配置，重新注册
- 连接错误：尝试重连，失败后提示用户

---

## 10. 测试需求

### 10.1 单元测试
- VPN Service 各方法测试
- 配置解析和格式化测试
- 状态管理测试
- 错误处理测试

### 10.2 集成测试
- Headscale API 集成测试
- 原生模块集成测试
- VPN 连接流程测试
- 自动重连测试

### 10.3 端到端测试
- 完整的用户流程测试
- 跨网络访问测试
- 网络切换测试
- 长时间连接稳定性测试

### 10.4 性能测试
- 连接建立时间测试
- 内存占用测试
- 电池消耗测试
- 网络延迟测试

---

## 11. 文档需求

### 11.1 用户文档
- VPN 设置指南
- 常见问题解答
- 故障排除指南
- 隐私和安全说明

### 11.2 开发文档
- 原生模块开发指南
- API 接口文档
- 架构设计文档
- 部署指南

---

## 12. 里程碑

### 12.1 Phase 1: 原生模块开发（2 周）
- iOS WireGuard 原生模块
- Android WireGuard 原生模块
- React Native 桥接

### 12.2 Phase 2: VPN Service 实现（1 周）
- Headscale 集成
- 连接管理
- 配置管理

### 12.3 Phase 3: 用户界面（1 周）
- VPN 设置页面
- VPN 状态指示器
- 设置集成

### 12.4 Phase 4: 测试和优化（1 周）
- 单元测试
- 集成测试
- 性能优化
- Bug 修复

### 12.5 Phase 5: 文档和发布（3 天）
- 用户文档
- 开发文档
- 发布准备

**总计：约 5-6 周**

---

## 13. 风险和挑战

### 13.1 技术风险
- iOS Network Extension 配置复杂
- Android VPN Service 后台限制
- WireGuard 库兼容性问题
- 不同设备的网络环境差异

### 13.2 缓解措施
- 提前研究和测试原生模块
- 参考 WireGuard 官方实现
- 在多种设备上测试
- 提供详细的错误日志

---

## 14. 成功指标

### 14.1 功能指标
- VPN 连接成功率 > 95%
- 自动重连成功率 > 90%
- 跨网访问成功率 > 95%

### 14.2 性能指标
- 连接建立时间 < 5 秒
- 应用启动时间增加 < 1 秒
- 内存占用增加 < 50MB
- 电池消耗增加 < 5%

### 14.3 用户体验指标
- 用户满意度 > 4.5/5
- 功能使用率 > 60%
- 错误报告 < 5%

---

## 15. 依赖和前置条件

### 15.1 前置条件
- Headscale 服务器已部署
- Shadowd 已配置并连接到 Headscale
- 移动应用基础功能完成

### 15.2 外部依赖
- Headscale 服务器稳定运行
- WireGuard 库可用
- 网络环境支持 UDP 流量

---

## 16. 未来扩展

### 16.1 短期（3-6 月）
- 多 Headscale 服务器支持
- VPN 流量统计
- 连接质量监控
- 高级网络设置

### 16.2 长期（6-12 月）
- 自建 DERP 服务器
- P2P 直连优化
- 智能路由选择
- 企业级功能（ACL、审计日志）
