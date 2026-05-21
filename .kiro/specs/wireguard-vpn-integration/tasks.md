# WireGuard VPN 集成 - 实现任务

## 概述

本任务列表将 WireGuard VPN 集成设计分解为可执行的开发任务。任务按照模块化原则组织，每个任务专注于一个独立的模块或组件。

**实现语言**:
- TypeScript (React Native 层)
- Swift (iOS 原生层)

**开发顺序**: 从底层到上层，先实现基础模块，再实现依赖这些模块的高层功能。

---

## 任务列表

### Phase 1: 基础设施和工具模块

- [ ] 1. 设置依赖注入容器
  - 创建 TypeScript DI 容器 (`src/core/DIContainer.ts`)
  - 创建 Swift DI 容器 (`ios/Core/DIContainer.swift`)
  - 实现服务注册和解析机制
  - _Requirements: 模块化设计原则_

- [x]* 1.1 编写 DI 容器单元测试
  - 测试服务注册和解析
  - 测试循环依赖检测
  - 测试单例模式

- [ ] 2. 实现 HTTP Client 模块
  - 创建 `IHttpClient` 接口 (`src/services/vpn/interfaces/IHttpClient.ts`)
  - 实现 `FetchHttpClient` (`src/services/vpn/http/FetchHttpClient.ts`)
  - 支持 GET/POST 请求
  - 支持超时和重试
  - _Requirements: 2.2.1_

- [x]* 2.1 编写 HTTP Client 单元测试
  - 测试成功请求
  - 测试网络错误处理
  - 测试超时重试


- [x] 3. 实现 Secure Storage 模块
  - 创建 `ISecureStorage` 接口 (`src/services/vpn/interfaces/ISecureStorage.ts`)
  - 实现 `MMKVStorage` 用于配置存储 (`src/services/vpn/storage/MMKVStorage.ts`)
  - 实现 `KeychainStorage` 用于敏感数据 (`src/services/vpn/storage/KeychainStorage.ts`)
  - 支持加密存储
  - _Requirements: 2.5.1, 2.5.5_

- [x]* 3.1 编写 Secure Storage 属性测试
  - **Property 6: 配置持久化 Round-trip**
  - **Validates: Requirements 2.5.1**
  - 对于任意有效的 VPN 配置，保存后加载应该得到等价的配置

- [x]* 3.2 编写 Secure Storage 单元测试
  - 测试配置清除功能
  - 测试敏感数据隔离
  - **Validates: Requirements 2.5.4, 2.5.5**

### Phase 2: 配置管理模块

- [x] 4. 实现 Config Parser 模块
  - 创建 `IConfigParser` 接口 (`src/services/vpn/interfaces/IConfigParser.ts`)
  - 实现 WireGuard INI 格式解析器 (`src/services/vpn/config/ConfigParser.ts`)
  - 实现配置格式化器（对象 → INI 字符串）
  - 支持 Interface 和 Peer 配置解析
  - _Requirements: 2.2.2_

- [x]* 4.1 编写 Config Parser 单元测试
  - 测试各种配置格式
  - 测试无效配置处理
  - 测试边缘情况（空行、注释）

- [x] 5. 实现 Config Validator 模块
  - 创建 `IConfigValidator` 接口 (`src/services/vpn/interfaces/IConfigValidator.ts`)
  - 实现配置验证器 (`src/services/vpn/config/ConfigValidator.ts`)
  - 验证必需字段存在
  - 验证 URL 格式
  - 验证 IP 地址格式
  - _Requirements: 2.2.2_

- [x]* 5.1 编写 Config Validator 单元测试
  - 测试所有验证方法
  - 测试错误收集
  - 测试边缘情况
  - **Validates: Requirements 2.2.2**

- [x] 6. 实现 Config Manager 模块
  - 创建 `IConfigManager` 接口 (`src/services/vpn/interfaces/IConfigManager.ts`)
  - 实现 `ConfigManager` (`src/services/vpn/config/ConfigManager.ts`)
  - 实现 saveConfig(), loadConfig(), clearConfig()
  - 集成 Secure Storage 和 Config Validator
  - _Requirements: 2.5.1, 2.5.4_

- [x]* 6.1 编写 Config Manager 属性测试
  - **Property 7: 配置清除完整性**
  - **Validates: Requirements 2.5.4**
  - 对于任意存储的配置，清除后应该无法加载

### Phase 3: Headscale 集成模块

- [x] 7. 实现 Headscale Client 模块
  - 创建 `IHeadscaleClient` 接口 (`src/services/vpn/interfaces/IHeadscaleClient.ts`)
  - 实现 `HeadscaleClient` (`src/services/vpn/headscale/HeadscaleClient.ts`)
  - 实现 registerDevice() 方法
  - 实现 getWireGuardConfig() 方法
  - 处理 API 错误和重试
  - _Requirements: 2.2.1, 2.2.2, 2.2.3_

- [x]* 7.1 编写 Headscale Client 属性测试
  - **Property 2: 设备注册幂等性**
  - **Validates: Requirements 2.2.1, 2.2.3**
  - 对于任意有效的参数，多次注册应返回一致结果

- [x]* 7.2 编写 Headscale Client 单元测试
  - 测试注册成功场景
  - 测试注册失败场景
  - 测试网络错误处理
  - **Property 4: 错误信息清晰性**
  - **Validates: Requirements 2.2.4**

### Phase 4: iOS 原生模块

- [x] 8. 创建 iOS Network Extension Target
  - 在 Xcode 中创建 Network Extension Target
  - 配置 App Group (`group.com.shadowshuttle.vpn`)
  - 配置 Entitlements (Network Extension 权限)
  - 添加 WireGuardKit 依赖
  - _Requirements: 3.1.1_

- [x] 9. 实现 iOS Config Parser 模块
  - 创建 `ConfigParserProtocol` (`ios/VPN/Protocols/ConfigParserProtocol.swift`)
  - 实现 `ConfigParser` (`ios/VPN/Config/ConfigParser.swift`)
  - 解析 WireGuard INI 格式
  - 转换为 `TunnelConfiguration` 对象
  - _Requirements: 2.2.2_

- [ ]* 9.1 编写 iOS Config Parser 单元测试
  - 测试各种配置格式
  - 测试无效配置处理

- [x] 10. 实现 iOS Permission Handler 模块
  - 创建 `PermissionHandlerProtocol` (`ios/VPN/Protocols/PermissionHandlerProtocol.swift`)
  - 实现 `PermissionHandler` (`ios/VPN/Permissions/PermissionHandler.swift`)
  - 检查 VPN 权限
  - 请求 VPN 权限
  - _Requirements: 2.1.3_

- [ ]* 10.1 编写 Permission Handler 单元测试
  - 测试权限检查
  - 测试权限请求流程


- [x] 11. 实现 iOS Status Observer 模块
  - 创建 `StatusObserverProtocol` (`ios/VPN/Protocols/StatusObserverProtocol.swift`)
  - 实现 `StatusObserver` (`ios/VPN/Status/StatusObserver.swift`)
  - 监听 VPN 状态变化通知
  - 转换状态为标准格式
  - _Requirements: 2.3.1_

- [ ]* 11.1 编写 Status Observer 单元测试
  - 测试状态变化监听
  - 测试状态转换

- [x] 12. 实现 iOS Tunnel Manager 模块
  - 创建 `TunnelManagerProtocol` (`ios/VPN/Protocols/TunnelManagerProtocol.swift`)
  - 实现 `TunnelManager` (`ios/VPN/Tunnel/TunnelManager.swift`)
  - 实现 connect() 方法
  - 实现 disconnect() 方法
  - 实现 getStatus() 方法
  - 集成 Config Parser 和 Permission Handler
  - _Requirements: 2.1.3, 3.1.1_

- [ ]* 12.1 编写 Tunnel Manager 单元测试
  - 测试连接流程
  - 测试断开流程
  - 测试权限处理
  - Mock NEVPNManager

- [x] 13. 实现 iOS WireGuard Module (React Native Bridge)
  - 创建 `WireGuardModule.swift` (`ios/VPN/Bridge/WireGuardModule.swift`)
  - 实现 connect() 桥接方法
  - 实现 disconnect() 桥接方法
  - 实现 getStatus() 桥接方法
  - 实现事件发射器 (onStatusChange)
  - 注册原生模块到 React Native
  - _Requirements: 3.1.2_

- [ ]* 13.1 编写 WireGuard Module 集成测试
  - 测试桥接方法调用
  - 测试事件发射

- [x] 14. 实现 Network Extension (Packet Tunnel Provider)
  - 创建 `PacketTunnelProvider.swift` (`ios/VPNExtension/PacketTunnelProvider.swift`)
  - 实现 startTunnel() 方法
  - 实现 stopTunnel() 方法
  - 实现 handleAppMessage() 方法
  - 集成 WireGuardKit
  - 配置 App Group 数据共享
  - _Requirements: 3.1.2_

- [ ]* 14.1 编写 Network Extension 集成测试
  - 测试隧道启动
  - 测试隧道停止
  - 测试 App 消息处理

### Phase 5: TypeScript 业务逻辑模块

- [x] 15. 实现 WireGuard Bridge 模块
  - 创建 `IWireGuardBridge` 接口 (`src/services/vpn/interfaces/IWireGuardBridge.ts`)
  - 实现 `WireGuardBridge` (`src/services/vpn/bridge/WireGuardBridge.ts`)
  - 封装原生模块调用
  - 提供类型安全的 API
  - 实现事件监听管理
  - _Requirements: 3.1.2_

- [x]* 15.1 编写 WireGuard Bridge 单元测试
  - 测试原生模块调用
  - 测试事件监听
  - Mock 原生模块

- [x] 16. 实现 Connection Manager 模块
  - 创建 `IConnectionManager` 接口 (`src/services/vpn/interfaces/IConnectionManager.ts`)
  - 实现 `ConnectionManager` (`src/services/vpn/connection/ConnectionManager.ts`)
  - 实现 connect() 方法
  - 实现 disconnect() 方法
  - 实现 getStatus() 方法
  - 实现状态监控
  - _Requirements: 2.1.3, 2.3.1_

- [ ]* 16.1 编写 Connection Manager 属性测试
  - **Property 1: VPN 连接状态一致性**
  - **Validates: Requirements 2.1.3, 2.1.4, 2.3.1**
  - 对于任意配置，connect() 后状态应为 connected/connecting，disconnect() 后应为 disconnected

- [x] 17. 实现 Retry Strategy 模块
  - 创建 `IRetryStrategy` 接口 (`src/services/vpn/interfaces/IRetryStrategy.ts`)
  - 实现 `ExponentialBackoffRetry` (`src/services/vpn/retry/ExponentialBackoffRetry.ts`)
  - 实现指数退避算法
  - 添加随机抖动
  - 支持最大重试次数
  - _Requirements: 2.4.1, 2.4.2_

- [x]* 17.1 编写 Retry Strategy 单元测试
  - 测试重试间隔计算
  - 测试最大重试限制
  - 测试抖动效果

- [x] 18. 实现 Network Monitor 模块
  - 创建 `INetworkMonitor` 接口 (`src/services/vpn/interfaces/INetworkMonitor.ts`)
  - 实现 `NetworkMonitor` (`src/services/vpn/network/NetworkMonitor.ts`)
  - 监听网络状态变化
  - 检测网络类型 (WiFi/Cellular)
  - 触发网络变化回调
  - _Requirements: 2.4.1_

- [ ]* 18.1 编写 Network Monitor 单元测试
  - 测试网络变化检测
  - 测试回调触发
  - Mock NetInfo

- [x] 19. 实现 Auto-Reconnect Manager 模块
  - 创建 `IAutoReconnectManager` 接口 (`src/services/vpn/interfaces/IAutoReconnectManager.ts`)
  - 实现 `AutoReconnectManager` (`src/services/vpn/reconnect/AutoReconnectManager.ts`)
  - 实现 enable() 和 disable() 方法
  - 实现 handleNetworkChange() 方法
  - 实现 handleAppStateChange() 方法
  - 集成 Network Monitor 和 Retry Strategy
  - _Requirements: 2.4.1, 2.4.2, 2.4.4_

- [ ]* 19.1 编写 Auto-Reconnect Manager 属性测试
  - **Property 5: 自动重连触发**
  - **Validates: Requirements 2.4.1, 2.4.2**
  - 对于任意启用自动重连的连接，网络变化应触发重连

- [ ]* 19.2 编写 Auto-Reconnect Manager 单元测试
  - 测试网络切换重连
  - 测试应用恢复重连
  - 测试重连失败通知
  - **Validates: Requirements 2.4.3**


- [x] 20. 实现 VPN Service (Facade) 模块
  - 创建 `IVPNService` 接口 (`src/services/vpn/interfaces/IVPNService.ts`)
  - 实现 `VPNService` (`src/services/vpn/VPNService.ts`)
  - 协调所有子模块
  - 实现高层 connect() 方法
  - 实现高层 disconnect() 方法
  - 实现 getStatus() 方法
  - 实现事件处理
  - _Requirements: 2.1.3, 2.2.1, 2.2.2_

- [ ]* 20.1 编写 VPN Service 集成测试
  - 测试完整连接流程
  - 测试完整断开流程
  - Mock 所有依赖模块

### Phase 6: 状态管理和 UI

- [x] 21. 实现 VPN Store (Zustand)
  - 创建 VPN Store (`src/stores/vpnStore.ts`)
  - 定义状态接口 (VPNState)
  - 实现 connect action
  - 实现 disconnect action
  - 实现 updateConfig action
  - 实现 getStatus action
  - 实现 setAutoReconnect action
  - 集成 VPN Service
  - _Requirements: 2.1.3, 2.4.4_

- [ ]* 21.1 编写 VPN Store 单元测试
  - 测试所有 actions
  - 测试状态更新
  - Mock VPN Service

- [x] 22. 实现 VPN Settings Screen
  - 创建 VPNSettingsScreen 组件 (`src/screens/VPNSettingsScreen.tsx`)
  - 实现 Headscale URL 输入框
  - 实现预授权密钥输入框
  - 实现设备名称输入框
  - 实现连接/断开按钮
  - 实现状态显示
  - 实现 Mesh IP 显示
  - 实现自动重连开关
  - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.4.4_

- [ ]* 22.1 编写 VPN Settings Screen 单元测试
  - 测试输入框渲染
  - 测试按钮交互
  - 测试状态显示
  - **Example 1, 2, 6, 7, 8**

- [x] 23. 实现 VPN Status Indicator 组件
  - 创建 VPNStatusIndicator 组件 (`src/components/VPNStatusIndicator.tsx`)
  - 显示连接状态图标
  - 显示 Mesh IP
  - 实现点击跳转到 VPN 设置
  - _Requirements: 2.3.5_

- [ ]* 23.1 编写 VPN Status Indicator 单元测试
  - 测试状态图标显示
  - 测试 IP 显示
  - 测试点击事件
  - **Example 5**

- [x] 24. 集成 VPN 状态到设备列表
  - 在 DeviceListScreen 顶部添加 VPN Status Indicator
  - 显示设备连接方式（局域网/Mesh 网络）
  - 实现 Mesh 网络检测
  - _Requirements: 2.3.5, 2.6.3, 2.6.4_

- [x]* 24.1 编写 Mesh 网络检测属性测试
  - **Property 9: Mesh 网络检测准确性**
  - **Validates: Requirements 2.6.3**
  - 对于任意 IP，Mesh IP 范围内应返回 true

- [x]* 24.2 编写设备列表集成测试
  - 测试 VPN 状态显示
  - 测试连接方式标签
  - **Example 11**

- [x] 25. 实现添加设备时的 Mesh IP 提示
  - 在 AddDeviceModal 中检测 VPN 状态
  - VPN 连接时显示 Mesh IP 提示
  - 提供 Mesh IP / 局域网 IP 选择
  - _Requirements: 2.6.1, 2.6.2_

- [ ]* 25.1 编写添加设备流程单元测试
  - 测试 Mesh IP 提示显示
  - 测试 IP 类型选择
  - **Example 9, 10**

### Phase 7: 错误处理和日志

- [x] 26. 实现错误处理模块
  - 创建错误类型定义 (`src/services/vpn/errors/VPNErrors.ts`)
  - 实现 NetworkError, AuthError, VPNError 类
  - 实现 ErrorRecoveryManager (`src/services/vpn/errors/ErrorRecoveryManager.ts`)
  - 实现错误恢复策略
  - 实现用户通知生成
  - _Requirements: 2.2.4, 2.4.3_

- [x]* 26.1 编写错误处理属性测试
  - **Property 4: 错误信息清晰性**
  - **Validates: Requirements 2.2.4, 2.4.3**
  - 对于任意失败操作，错误信息应为非空字符串

- [x] 27. 实现日志模块
  - 创建 VPNLogger (`src/services/vpn/logging/VPNLogger.ts`)
  - 实现日志级别 (DEBUG, INFO, WARN, ERROR)
  - 实现日志存储和导出
  - 实现敏感信息过滤
  - _Requirements: 安全设计_

- [x]* 27.1 编写日志模块单元测试
  - 测试日志记录
  - 测试敏感信息过滤
  - 测试日志导出

- [x] 28. 实现性能监控模块
  - 创建 VPNMetrics (`src/services/vpn/metrics/VPNMetrics.ts`)
  - 记录连接尝试和成功率
  - 记录连接时间
  - 记录重连次数
  - 计算性能指标
  - _Requirements: 性能优化_

- [x]* 28.1 编写性能监控单元测试
  - 测试指标记录
  - 测试成功率计算

### Phase 8: 集成和测试

- [ ] 29. 注册所有模块到 DI 容器
  - 在应用启动时注册所有服务
  - 配置依赖关系
  - 验证依赖注入正确性
  - _Requirements: 模块化设计_

- [ ] 30. 端到端测试 - 完整连接流程
  - 测试从输入配置到 VPN 连接的完整流程
  - 验证 Mesh IP 获取
  - 验证设备添加使用 Mesh IP
  - 验证 SSH 连接通过 Mesh 网络
  - _Requirements: 所有功能需求_

- [ ] 31. 端到端测试 - 网络切换
  - 模拟 WiFi → Cellular 切换
  - 验证自动重连
  - 验证 SSH 连接保持
  - _Requirements: 2.4.1_

- [ ] 32. 端到端测试 - 后台恢复
  - 应用进入后台
  - 等待一段时间
  - 应用恢复前台
  - 验证 VPN 状态和重连
  - _Requirements: 2.4.2_

- [ ] 33. 性能测试
  - 测量 VPN 连接建立时间
  - 测量网络切换重连时间
  - 测量内存占用
  - 验证性能指标符合要求
  - _Requirements: 4.1 (非功能需求)_

- [ ]* 33.1 编写性能属性测试
  - **Property 10: 连接时间上限**
  - **Property 11: 重连时间上限**
  - **Property 12: 内存占用限制**
  - **Validates: Non-functional Requirements 4.1**

### Phase 9: 文档和发布准备

- [ ] 34. 编写用户文档
  - VPN 设置指南
  - 常见问题解答
  - 故障排除指南
  - 隐私和安全说明
  - _Requirements: 11.1 (文档需求)_

- [ ] 35. 编写开发文档
  - 模块架构文档
  - API 接口文档
  - 依赖注入使用指南
  - 测试指南
  - _Requirements: 11.2 (文档需求)_

- [ ] 36. 代码审查和优化
  - 审查所有模块代码
  - 优化性能瓶颈
  - 确保代码风格一致
  - 添加必要的注释

- [ ] 37. 最终集成测试
  - 在真实设备上测试
  - 测试各种网络环境
  - 测试长时间连接稳定性
  - 修复发现的 bug

---

## 检查点

### Checkpoint 1: 基础模块完成
在完成 Phase 1-3 后，确保：
- 所有基础工具模块可以独立工作
- 配置管理功能正常
- Headscale 集成测试通过
- 所有单元测试通过

### Checkpoint 2: iOS 原生模块完成
在完成 Phase 4 后，确保：
- iOS 原生模块可以独立编译
- Network Extension 可以启动
- VPN 隧道可以建立
- 原生模块测试通过

### Checkpoint 3: 业务逻辑完成
在完成 Phase 5 后，确保：
- 所有 TypeScript 业务模块可以工作
- 模块间依赖正确
- 自动重连功能正常
- 集成测试通过

### Checkpoint 4: UI 完成
在完成 Phase 6 后，确保：
- 所有 UI 组件正常渲染
- 用户可以完成完整的配置和连接流程
- VPN 状态正确显示
- UI 测试通过

### Checkpoint 5: 发布准备
在完成 Phase 7-9 后，确保：
- 所有测试通过（单元、集成、端到端、性能）
- 文档完整
- 代码质量达标
- 在真实设备上验证通过

---

## 注意事项

1. **模块化开发**: 每个任务应该专注于一个独立的模块，确保模块可以独立测试和替换
2. **测试驱动**: 标记为 `*` 的测试任务是可选的，但强烈建议实现以确保代码质量
3. **依赖管理**: 使用依赖注入容器管理模块依赖，避免硬编码依赖
4. **错误处理**: 每个模块都应该有清晰的错误处理和恢复机制
5. **性能优化**: 在实现过程中注意性能，特别是连接时间和内存占用
6. **安全性**: 敏感数据（私钥、密码）必须使用安全存储，不能出现在日志中

---

## 估算时间

- Phase 1: 基础设施和工具模块 - 3 天
- Phase 2: 配置管理模块 - 2 天
- Phase 3: Headscale 集成模块 - 2 天
- Phase 4: iOS 原生模块 - 5 天
- Phase 5: TypeScript 业务逻辑模块 - 4 天
- Phase 6: 状态管理和 UI - 3 天
- Phase 7: 错误处理和日志 - 2 天
- Phase 8: 集成和测试 - 3 天
- Phase 9: 文档和发布准备 - 2 天

**总计**: 约 26 个工作日（5-6 周）

