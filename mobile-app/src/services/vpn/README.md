# VPN Service Module

WireGuard VPN 集成模块，提供完整的 VPN 连接管理功能。

## 架构概览

```
vpn/
├── interfaces/          # 接口定义（依赖注入契约）
├── types/              # 类型定义
├── http/               # HTTP 客户端
├── storage/            # 安全存储
├── config/             # 配置管理
├── headscale/          # Headscale 集成
├── bridge/             # React Native 桥接（待实现）
├── connection/         # 连接管理（待实现）
├── retry/              # 重试策略（待实现）
├── network/            # 网络监控（待实现）
└── reconnect/          # 自动重连（待实现）
```

## 已完成模块 (Phase 1-3)

### ✅ Phase 1: 基础设施和工具模块

#### 1. DI Container
- **位置**: `src/core/DIContainer.ts`
- **功能**: 依赖注入容器，管理所有服务的生命周期
- **特性**: 单例模式、循环依赖检测、类型安全

#### 2. HTTP Client
- **位置**: `src/services/vpn/http/FetchHttpClient.ts`
- **功能**: HTTP 请求封装
- **特性**: 超时控制、自动重试、错误处理

#### 3. Secure Storage
- **位置**: `src/services/vpn/storage/`
- **实现**:
  - `MMKVStorage`: 快速键值存储（配置数据）
  - `KeychainStorage`: 安全存储（敏感数据）
- **特性**: 加密存储、数据隔离

### ✅ Phase 2: 配置管理模块

#### 4. Config Parser
- **位置**: `src/services/vpn/config/ConfigParser.ts`
- **功能**: WireGuard INI 格式解析和格式化
- **特性**: 支持 Interface 和 Peer 配置、注释处理

#### 5. Config Validator
- **位置**: `src/services/vpn/config/ConfigValidator.ts`
- **功能**: 配置验证
- **特性**: 必需字段检查、格式验证、错误收集

#### 6. Config Manager
- **位置**: `src/services/vpn/config/ConfigManager.ts`
- **功能**: 配置生命周期管理
- **特性**: 保存、加载、清除、验证集成

### ✅ Phase 3: Headscale 集成模块

#### 7. Headscale Client
- **位置**: `src/services/vpn/headscale/HeadscaleClient.ts`
- **功能**: Headscale API 客户端
- **特性**: 设备注册、配置获取、错误处理

## 使用示例

### 基本使用

```typescript
import { DIContainer } from '../../core/DIContainer';
import { IHeadscaleClient } from './interfaces/IHeadscaleClient';
import { IConfigManager } from './interfaces/IConfigManager';

// 获取服务
const headscaleClient = DIContainer.resolve<IHeadscaleClient>('IHeadscaleClient');
const configManager = DIContainer.resolve<IConfigManager>('IConfigManager');

// 注册设备
const result = await headscaleClient.registerDevice({
  baseUrl: 'https://headscale.example.com',
  deviceName: 'my-phone',
  preAuthKey: 'your-key',
});

// 获取配置
const config = await headscaleClient.getWireGuardConfig(
  'https://headscale.example.com',
  result.nodeId
);

// 保存配置
await configManager.saveConfig(config);
```

### 完整流程

参见 `headscale/example.ts` 中的完整示例。

## 测试

所有模块都有完整的单元测试和属性测试：

```bash
# 运行所有 VPN 模块测试
npm test -- src/services/vpn

# 运行特定模块测试
npm test -- src/services/vpn/config
npm test -- src/services/vpn/headscale
```

### 测试覆盖率

- DI Container: 100%
- HTTP Client: 100%
- Secure Storage: 100%
- Config Parser: 100%
- Config Validator: 100%
- Config Manager: 100%
- Headscale Client: 100%

## 依赖关系

```
HeadscaleClient
  ├── IHttpClient (FetchHttpClient)
  └── IConfigParser (ConfigParser)

ConfigManager
  ├── ISecureStorage (MMKVStorage)
  └── IConfigValidator (ConfigValidator)

ConfigValidator
  └── (无依赖)

ConfigParser
  └── (无依赖)

FetchHttpClient
  └── (无依赖)

MMKVStorage / KeychainStorage
  └── (无依赖)
```

## 接口定义

所有模块都通过接口定义契约，便于测试和替换实现：

- `IHttpClient`: HTTP 请求
- `ISecureStorage`: 安全存储
- `IConfigParser`: 配置解析
- `IConfigValidator`: 配置验证
- `IConfigManager`: 配置管理
- `IHeadscaleClient`: Headscale 集成

## 下一步 (Phase 4-9)

### Phase 4: iOS 原生模块
- [ ] Network Extension Target
- [ ] iOS Config Parser
- [ ] Permission Handler
- [ ] Status Observer
- [ ] Tunnel Manager
- [ ] WireGuard Module Bridge
- [ ] Packet Tunnel Provider

### Phase 5: TypeScript 业务逻辑
- [ ] WireGuard Bridge
- [ ] Connection Manager
- [ ] Retry Strategy
- [ ] Network Monitor
- [ ] Auto-Reconnect Manager
- [ ] VPN Service (Facade)

### Phase 6: 状态管理和 UI
- [ ] VPN Store (Zustand)
- [ ] VPN Settings Screen
- [ ] VPN Status Indicator
- [ ] Device List Integration

### Phase 7: 错误处理和日志
- [ ] Error Handling
- [ ] Logging
- [ ] Performance Monitoring

### Phase 8-9: 集成测试和文档
- [ ] End-to-End Tests
- [ ] Performance Tests
- [ ] User Documentation
- [ ] Developer Documentation

## 设计原则

1. **模块化**: 每个模块职责单一，可独立测试
2. **依赖注入**: 通过接口解耦，便于测试和替换
3. **错误处理**: 清晰的错误消息，用户友好
4. **类型安全**: 完整的 TypeScript 类型定义
5. **测试驱动**: 100% 测试覆盖率
6. **安全优先**: 敏感数据加密存储

## 需求验证

### 已验证需求

- ✅ 2.2.1: 设备注册到 Headscale
- ✅ 2.2.2: 获取和解析 WireGuard 配置
- ✅ 2.2.3: 注册幂等性
- ✅ 2.2.4: 清晰的错误消息
- ✅ 2.5.1: 配置持久化
- ✅ 2.5.4: 配置清除
- ✅ 2.5.5: 敏感数据隔离

### 待验证需求

- ⏳ 2.1.x: VPN 连接管理（Phase 4-5）
- ⏳ 2.3.x: 状态监控（Phase 4-5）
- ⏳ 2.4.x: 自动重连（Phase 5）
- ⏳ 2.6.x: Mesh 网络集成（Phase 6）

## 贡献指南

添加新模块时：

1. 在 `interfaces/` 中定义接口
2. 在对应目录实现接口
3. 在 `__tests__/` 中添加测试
4. 在 `registerServices.ts` 中注册服务
5. 更新本 README

## 许可证

MIT
