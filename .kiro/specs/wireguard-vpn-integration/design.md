# WireGuard VPN 集成 - 设计文档

## 1. 概述

### 1.1 设计目标

本设计文档描述了在 Shadow Shuttle 移动应用中集成 WireGuard VPN 功能的技术实现方案。主要目标包括：

- 在 React Native 应用中集成原生 WireGuard 功能
- 实现与 Headscale 协调服务器的自动设备注册
- 提供无缝的跨网络远程访问体验
- 确保 VPN 连接的稳定性和安全性
- 最小化对现有架构的影响

### 1.2 设计原则

1. **平台原生优先**：使用各平台的原生 WireGuard 实现，确保最佳性能和稳定性
2. **最小权限原则**：只请求必要的系统权限
3. **渐进式增强**：VPN 功能作为可选增强，不影响现有 SSH 功能
4. **错误容忍**：网络切换和连接失败时自动恢复
5. **用户透明**：自动化配置流程，减少用户操作步骤

### 1.3 技术栈

- **iOS**: WireGuardKit (Swift), Network Extension
- **React Native**: 0.73.0
- **TypeScript**: 5.0.4
- **状态管理**: Zustand
- **持久化存储**: AsyncStorage + MMKV (敏感数据)
- **网络库**: Fetch API

### 1.4 模块化设计原则

本设计遵循严格的模块化和组件化原则，确保代码的可维护性和可扩展性：

1. **单一职责原则**: 每个模块只负责一个明确的功能
2. **依赖倒置**: 高层模块不依赖低层模块，都依赖抽象接口
3. **接口隔离**: 使用小而专注的接口，而不是大而全的接口
4. **开闭原则**: 对扩展开放，对修改关闭
5. **模块独立性**: 每个模块可以独立测试和替换

---

## 2. 架构设计

### 2.1 整体架构（模块化设计）

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer (UI)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  VPN Screen  │  │ Device List  │  │   Settings   │      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   State Management Layer                     │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │              VPN Store (Zustand)                    │     │
│  │  • State: config, status, error                     │     │
│  │  • Actions: connect, disconnect, updateConfig       │     │
│  └─────────────────────────┬──────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │           VPN Service (Core Module)                 │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  Headscale Client Module                     │  │     │
│  │  │  • registerDevice()                          │  │     │
│  │  │  • getWireGuardConfig()                      │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  Config Manager Module                       │  │     │
│  │  │  • saveConfig()                              │  │     │
│  │  │  • loadConfig()                              │  │     │
│  │  │  • validateConfig()                          │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  Connection Manager Module                   │  │     │
│  │  │  • connect()                                 │  │     │
│  │  │  • disconnect()                              │  │     │
│  │  │  • getStatus()                               │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  Auto-Reconnect Module                       │  │     │
│  │  │  • enableAutoReconnect()                     │  │     │
│  │  │  • handleNetworkChange()                     │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  └─────────────────────────┬──────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Platform Bridge Layer                     │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │         WireGuard Bridge Module (TypeScript)        │     │
│  │  • Abstracts native module interface               │     │
│  │  • Handles event listeners                         │     │
│  │  • Provides type-safe API                          │     │
│  └─────────────────────────┬──────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    iOS Native Layer                          │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │         WireGuardModule (Swift)                     │     │
│  │  • React Native Bridge                              │     │
│  │  • Tunnel Manager                                   │     │
│  │  • Status Observer                                  │     │
│  └─────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │         Network Extension (Packet Tunnel)           │     │
│  │  • WireGuardKit Integration                         │     │
│  │  • Tunnel Lifecycle Management                      │     │
│  │  • App Group Communication                          │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**模块职责说明**：

1. **Presentation Layer**: 纯 UI 组件，不包含业务逻辑
2. **State Management Layer**: 集中管理应用状态
3. **Business Logic Layer**: 核心业务逻辑，分为独立的子模块
4. **Platform Bridge Layer**: 抽象平台差异，提供统一接口
5. **iOS Native Layer**: 平台特定实现


### 2.2 数据流

#### 2.2.1 VPN 连接流程

```
User Action → VPN Screen → VPN Store → VPN Service
                                           │
                                           ├─→ Headscale API (Register Device)
                                           │   └─→ Get WireGuard Config
                                           │
                                           └─→ Native Module
                                               └─→ Start VPN Tunnel
                                                   └─→ Update Status
```

#### 2.2.2 自动重连流程

```
Network Change Event → Network Monitor → VPN Service
                                            │
                                            ├─→ Check VPN Status
                                            │
                                            └─→ If Disconnected
                                                └─→ Retry Connection
                                                    └─→ Update Status
```

#### 2.2.3 设备发现流程

```
VPN Connected → Device Store → Check Mesh Network
                                   │
                                   ├─→ Scan Mesh IPs
                                   │
                                   └─→ Update Device List
                                       └─→ Prefer Mesh IP
```

---

## 3. 组件设计（模块化）

### 3.1 模块依赖图

```
┌─────────────────────────────────────────────────────────┐
│                    Module Dependencies                   │
│                                                          │
│  UI Components                                           │
│       ↓                                                  │
│  VPN Store ──────→ VPN Service (Facade)                 │
│                         ↓                                │
│              ┌──────────┼──────────┐                     │
│              ↓          ↓          ↓                     │
│      Headscale    Config      Connection                │
│       Client      Manager      Manager                   │
│              ↓          ↓          ↓                     │
│              └──────────┼──────────┘                     │
│                         ↓                                │
│                  WireGuard Bridge                        │
│                         ↓                                │
│                  Native Module (iOS)                     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 React Native 层模块

#### 3.2.1 VPN Store (State Management Module)

**职责**: 集中管理 VPN 相关状态

**接口**:
```typescript
interface VPNState {
  // State
  config: VPNConfig | null;
  status: VPNStatus;
  connecting: boolean;
  error: string | null;
  autoReconnect: boolean;
  
  // Actions
  connect: (config: VPNConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  updateConfig: (config: Partial<VPNConfig>) => Promise<void>;
  getStatus: () => Promise<VPNStatus>;
  setAutoReconnect: (enabled: boolean) => void;
  clearError: () => void;
}
```

**依赖**: VPN Service

**测试策略**: 单元测试所有 actions，mock VPN Service

#### 3.2.2 VPN Service (Facade Module)

**职责**: 提供统一的 VPN 功能入口，协调各子模块

**接口**:
```typescript
interface IVPNService {
  // High-level operations
  connect(config: VPNConfig): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<VPNStatus>;
  
  // Event handling
  onStatusChange(callback: StatusChangeCallback): void;
  removeStatusListener(callback: StatusChangeCallback): void;
}

class VPNService implements IVPNService {
  constructor(
    private headscaleClient: IHeadscaleClient,
    private configManager: IConfigManager,
    private connectionManager: IConnectionManager,
    private autoReconnectManager: IAutoReconnectManager
  ) {}
  
  async connect(config: VPNConfig): Promise<void> {
    // Orchestrate connection flow
    const savedConfig = await this.configManager.loadConfig();
    const wgConfig = await this.headscaleClient.getWireGuardConfig(
      config.headscaleUrl,
      config.nodeKey
    );
    await this.connectionManager.connect(wgConfig);
    await this.configManager.saveConfig(config);
  }
  
  // ... other methods
}
```

**依赖**: Headscale Client, Config Manager, Connection Manager, Auto-Reconnect Manager

**测试策略**: 集成测试，mock 所有依赖模块

#### 3.2.3 Headscale Client Module

**职责**: 与 Headscale API 通信

**接口**:
```typescript
interface IHeadscaleClient {
  registerDevice(
    url: string,
    preauthKey: string,
    deviceName: string
  ): Promise<RegistrationResult>;
  
  getWireGuardConfig(
    url: string,
    nodeKey: string
  ): Promise<WireGuardConfig>;
}

class HeadscaleClient implements IHeadscaleClient {
  constructor(
    private httpClient: IHttpClient,
    private configParser: IConfigParser
  ) {}
  
  async registerDevice(
    url: string,
    preauthKey: string,
    deviceName: string
  ): Promise<RegistrationResult> {
    const response = await this.httpClient.post(
      `${url}/api/v1/machine/register`,
      { key: preauthKey, name: deviceName }
    );
    return this.configParser.parseRegistrationResponse(response);
  }
  
  // ... other methods
}
```

**依赖**: HTTP Client (可替换), Config Parser

**测试策略**: 单元测试，mock HTTP Client

#### 3.2.4 Config Manager Module

**职责**: 管理 VPN 配置的持久化

**接口**:
```typescript
interface IConfigManager {
  saveConfig(config: VPNConfig): Promise<void>;
  loadConfig(): Promise<VPNConfig | null>;
  clearConfig(): Promise<void>;
  validateConfig(config: VPNConfig): boolean;
}

class ConfigManager implements IConfigManager {
  constructor(
    private storage: ISecureStorage,
    private validator: IConfigValidator
  ) {}
  
  async saveConfig(config: VPNConfig): Promise<void> {
    if (!this.validator.validate(config)) {
      throw new Error('Invalid config');
    }
    await this.storage.setItem('vpn_config', JSON.stringify(config));
  }
  
  // ... other methods
}
```

**依赖**: Secure Storage (可替换), Config Validator

**测试策略**: 单元测试，mock Storage

#### 3.2.5 Connection Manager Module

**职责**: 管理 VPN 连接生命周期

**接口**:
```typescript
interface IConnectionManager {
  connect(config: WireGuardConfig): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<VPNStatus>;
  onStatusChange(callback: StatusChangeCallback): void;
}

class ConnectionManager implements IConnectionManager {
  constructor(
    private wireguardBridge: IWireGuardBridge,
    private statusMonitor: IStatusMonitor
  ) {}
  
  async connect(config: WireGuardConfig): Promise<void> {
    const configString = this.formatConfig(config);
    await this.wireguardBridge.connect(configString);
    this.statusMonitor.startMonitoring();
  }
  
  // ... other methods
}
```

**依赖**: WireGuard Bridge, Status Monitor

**测试策略**: 单元测试，mock WireGuard Bridge

#### 3.2.6 Auto-Reconnect Manager Module

**职责**: 处理自动重连逻辑

**接口**:
```typescript
interface IAutoReconnectManager {
  enable(): void;
  disable(): void;
  handleNetworkChange(networkType: string): Promise<void>;
  handleAppStateChange(state: string): Promise<void>;
}

class AutoReconnectManager implements IAutoReconnectManager {
  constructor(
    private connectionManager: IConnectionManager,
    private retryStrategy: IRetryStrategy,
    private networkMonitor: INetworkMonitor
  ) {}
  
  enable(): void {
    this.networkMonitor.startMonitoring();
    this.networkMonitor.onNetworkChange(this.handleNetworkChange.bind(this));
  }
  
  async handleNetworkChange(networkType: string): Promise<void> {
    const status = await this.connectionManager.getStatus();
    if (!status.connected) {
      await this.retryStrategy.retry(() => 
        this.connectionManager.connect(/* cached config */)
      );
    }
  }
  
  // ... other methods
}
```

**依赖**: Connection Manager, Retry Strategy, Network Monitor

**测试策略**: 单元测试，mock 所有依赖

#### 3.2.7 WireGuard Bridge Module

**职责**: 抽象原生模块接口，提供类型安全的 API

**接口**:
```typescript
interface IWireGuardBridge {
  connect(configString: string): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<VPNStatus>;
  addListener(eventName: string, callback: Function): void;
  removeListener(eventName: string, callback: Function): void;
}

class WireGuardBridge implements IWireGuardBridge {
  private nativeModule: any;
  
  constructor() {
    const { WireGuardModule } = NativeModules;
    if (!WireGuardModule) {
      throw new Error('WireGuardModule not available');
    }
    this.nativeModule = WireGuardModule;
  }
  
  async connect(configString: string): Promise<void> {
    return this.nativeModule.connect(configString);
  }
  
  // ... other methods
}
```

**依赖**: React Native NativeModules

**测试策略**: 集成测试，使用真实的原生模块（或 mock）


#### 3.1.2 VPN Service (TypeScript)

```typescript
class VPNService {
  // Headscale Integration
  async registerDevice(
    headscaleUrl: string,
    preauthKey: string,
    deviceName: string
  ): Promise<RegistrationResult>;
  
  async getWireGuardConfig(
    headscaleUrl: string,
    nodeKey: string
  ): Promise<WireGuardConfig>;
  
  // Connection Management
  async connect(config: WireGuardConfig): Promise<void>;
  async disconnect(): Promise<void>;
  async getStatus(): Promise<VPNStatus>;
  
  // Event Handling
  onStatusChange(callback: (status: VPNStatus) => void): void;
  removeStatusListener(callback: (status: VPNStatus) => void): void;
  
  // Auto-reconnect
  enableAutoReconnect(): void;
  disableAutoReconnect(): void;
}

interface RegistrationResult {
  nodeKey: string;
  machineKey: string;
  meshIP: string;
}

interface WireGuardConfig {
  privateKey: string;
  address: string;
  dns: string[];
  peers: WireGuardPeer[];
}

interface WireGuardPeer {
  publicKey: string;
  endpoint: string;
  allowedIPs: string[];
  persistentKeepalive?: number;
}
```

**职责**：
- 与 Headscale API 通信
- 管理 WireGuard 配置
- 调用原生模块
- 实现自动重连逻辑
- 处理错误和重试

#### 3.1.3 UI 组件

**VPNSettingsScreen**
```typescript
interface VPNSettingsScreenProps {
  navigation: NavigationProp;
}

// Features:
// - Headscale URL input
// - Preauth key input
// - Device name input
// - Connect/Disconnect button
// - Status display
// - Mesh IP display
// - Auto-reconnect toggle
```

**VPNStatusIndicator**
```typescript
interface VPNStatusIndicatorProps {
  status: VPNStatus;
  onPress?: () => void;
}

// Features:
// - Connection status icon
// - Mesh IP display
// - Tap to navigate to VPN settings
```


### 3.2 iOS 原生层

#### 3.2.1 WireGuardModule (Swift)

```swift
@objc(WireGuardModule)
class WireGuardModule: RCTEventEmitter {
  // React Native Bridge Methods
  @objc func connect(_ configString: String,
                     resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock)
  
  @objc func disconnect(_ resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock)
  
  @objc func getStatus(_ resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock)
  
  // Event Emitters
  override func supportedEvents() -> [String]! {
    return ["onStatusChange"]
  }
  
  // Internal Methods
  private func startTunnel(config: TunnelConfiguration)
  private func stopTunnel()
  private func observeTunnelStatus()
}
```

**依赖**：
- WireGuardKit (~> 1.0)
- NetworkExtension.framework

**配置要求**：
- Network Extension Target
- App Group (共享数据)
- VPN 权限 (Capabilities)

#### 3.2.2 Network Extension

```swift
class PacketTunnelProvider: NEPacketTunnelProvider {
  override func startTunnel(
    options: [String : NSObject]?,
    completionHandler: @escaping (Error?) -> Void
  )
  
  override func stopTunnel(
    with reason: NEProviderStopReason,
    completionHandler: @escaping () -> Void
  )
  
  override func handleAppMessage(
    _ messageData: Data,
    completionHandler: ((Data?) -> Void)?
  )
}
```

**职责**：
- 管理 VPN 隧道生命周期
- 处理网络数据包
- 与主应用通信（通过 App Group）


---

## 4. 数据模型

### 4.1 持久化存储

#### 4.1.1 VPN 配置 (MMKV - 加密)

```typescript
// Stored in MMKV with encryption
interface StoredVPNConfig {
  headscaleUrl: string;
  deviceName: string;
  nodeKey: string;
  meshIP: string;
  lastConnected: string; // ISO date string
  autoReconnect: boolean;
}

// Sensitive data stored separately
interface SensitiveVPNData {
  preauthKey: string;      // Only needed during registration
  privateKey: string;      // WireGuard private key
}
```

**存储策略**：
- 使用 MMKV 加密存储敏感数据
- 预授权密钥仅在注册时使用，注册后可选择性删除
- 私钥永不离开设备
- 配置数据使用 AsyncStorage 存储（非敏感部分）

#### 4.1.2 WireGuard 配置格式

```ini
[Interface]
PrivateKey = <base64_private_key>
Address = 100.64.0.2/32
DNS = 100.100.100.100

[Peer]
PublicKey = <base64_public_key>
Endpoint = headscale.example.com:51820
AllowedIPs = 100.64.0.0/10
PersistentKeepalive = 25
```

### 4.2 运行时状态

#### 4.2.1 VPN 状态机

```
┌─────────────┐
│ Disconnected│
└──────┬──────┘
       │ connect()
       ▼
┌─────────────┐
│ Connecting  │
└──────┬──────┘
       │ success
       ▼
┌─────────────┐     network change
│  Connected  │◄────────────────────┐
└──────┬──────┘                     │
       │ disconnect()               │
       │ or error                   │
       ▼                            │
┌─────────────┐                     │
│Disconnecting│                     │
└──────┬──────┘                     │
       │                            │
       ▼                            │
┌─────────────┐    auto-reconnect   │
│ Disconnected├─────────────────────┘
└─────────────┘
```

**状态转换规则**：
- `Disconnected → Connecting`: 用户调用 connect() 或自动重连触发
- `Connecting → Connected`: VPN 隧道建立成功
- `Connecting → Disconnected`: 连接失败或超时
- `Connected → Disconnecting`: 用户调用 disconnect() 或发生错误
- `Disconnecting → Disconnected`: 隧道关闭完成
- `Disconnected → Connecting`: 自动重连（如果启用）


---

## 5. 接口设计

### 5.1 Headscale API 集成

#### 5.1.1 设备注册

```typescript
async function registerDevice(
  headscaleUrl: string,
  preauthKey: string,
  deviceName: string
): Promise<RegistrationResult> {
  const response = await fetch(`${headscaleUrl}/api/v1/machine/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: preauthKey,
      name: deviceName,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Registration failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    nodeKey: data.nodeKey,
    machineKey: data.machineKey,
    meshIP: data.ipAddresses[0], // Primary IP
  };
}
```

#### 5.1.2 获取 WireGuard 配置

```typescript
async function getWireGuardConfig(
  headscaleUrl: string,
  nodeKey: string
): Promise<WireGuardConfig> {
  const response = await fetch(
    `${headscaleUrl}/api/v1/machine/${nodeKey}/wireguard`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get config: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### 5.2 原生模块接口

#### 5.2.1 TypeScript 接口定义

```typescript
interface WireGuardNativeModule {
  // Connection Management
  connect(configString: string): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<VPNStatus>;
  
  // Event Listeners
  addListener(eventName: 'onStatusChange'): void;
  removeListeners(count: number): void;
}

// React Native Event Emitter
interface WireGuardEvents {
  onStatusChange: (status: VPNStatus) => void;
}
```

#### 5.2.2 配置字符串格式

WireGuard 配置以 INI 格式字符串传递给原生模块：

```typescript
function formatWireGuardConfig(config: WireGuardConfig): string {
  let configStr = '[Interface]\n';
  configStr += `PrivateKey = ${config.privateKey}\n`;
  configStr += `Address = ${config.address}\n`;
  
  if (config.dns.length > 0) {
    configStr += `DNS = ${config.dns.join(', ')}\n`;
  }
  
  config.peers.forEach(peer => {
    configStr += '\n[Peer]\n';
    configStr += `PublicKey = ${peer.publicKey}\n`;
    configStr += `Endpoint = ${peer.endpoint}\n`;
    configStr += `AllowedIPs = ${peer.allowedIPs.join(', ')}\n`;
    
    if (peer.persistentKeepalive) {
      configStr += `PersistentKeepalive = ${peer.persistentKeepalive}\n`;
    }
  });
  
  return configStr;
}
```


---

## 6. 安全设计

### 6.1 密钥管理

#### 6.1.1 私钥生成和存储

```typescript
// iOS: Use Keychain
async function storePrivateKey(privateKey: string): Promise<void> {
  // iOS: Use Keychain
  await Keychain.setGenericPassword(
    'wireguard_private_key',
    privateKey,
    {
      service: 'com.shadowshuttle.vpn',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    }
  );
}

async function getPrivateKey(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: 'com.shadowshuttle.vpn',
  });
  return credentials ? credentials.password : null;
}
```

**安全要求**：
- 私钥使用平台安全存储（Keychain/KeyStore）
- 私钥永不通过网络传输
- 私钥仅在设备本地生成
- 使用硬件支持的加密（如果可用）

#### 6.1.2 预授权密钥处理

```typescript
// Preauth key is only needed during registration
// After successful registration, it can be deleted
async function registerAndCleanup(
  headscaleUrl: string,
  preauthKey: string,
  deviceName: string
): Promise<RegistrationResult> {
  try {
    const result = await registerDevice(headscaleUrl, preauthKey, deviceName);
    
    // Delete preauth key after successful registration
    await deleteSecureItem('preauth_key');
    
    return result;
  } catch (error) {
    // Keep preauth key if registration failed
    throw error;
  }
}
```

### 6.2 网络安全

#### 6.2.1 TLS/SSL 验证

```typescript
// Always use HTTPS for Headscale API
function validateHeadscaleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Certificate pinning (optional, for production)
const certificatePinning = {
  'headscale.example.com': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ],
};
```

#### 6.2.2 WireGuard 加密

WireGuard 提供内置的端到端加密：
- 使用 Noise 协议框架
- ChaCha20 用于对称加密
- Poly1305 用于认证
- Curve25519 用于密钥交换
- BLAKE2s 用于哈希

**无需额外配置**，WireGuard 自动处理所有加密。

### 6.3 权限管理

#### 6.3.1 iOS 权限

```xml
<!-- Info.plist -->
<key>NSNetworkExtensionUsageDescription</key>
<string>Shadow Shuttle needs VPN permission to enable secure cross-network access to your devices.</string>
```

#### 6.3.2 Android 权限

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**权限请求流程**：
1. 用户点击"连接 VPN"
2. 检查 VPN 权限
3. 如果未授权，显示系统权限对话框
4. 用户授权后，继续连接流程
5. 如果拒绝，显示友好的错误信息和引导


---

## 7. 性能优化

### 7.1 连接优化

#### 7.1.1 快速连接

```typescript
// Parallel operations during connection
async function connectVPN(config: VPNConfig): Promise<void> {
  const [wgConfig, status] = await Promise.all([
    // Fetch WireGuard config from Headscale
    getWireGuardConfig(config.headscaleUrl, config.nodeKey),
    // Check current VPN status
    WireGuardModule.getStatus(),
  ]);
  
  // If already connected, disconnect first
  if (status.connected) {
    await WireGuardModule.disconnect();
  }
  
  // Start VPN tunnel
  const configString = formatWireGuardConfig(wgConfig);
  await WireGuardModule.connect(configString);
}
```

**优化策略**：
- 并行执行独立操作
- 缓存 WireGuard 配置（有效期内）
- 使用连接池复用 HTTP 连接
- 预加载必要的资源

#### 7.1.2 自动重连优化

```typescript
class AutoReconnectManager {
  private retryCount = 0;
  private maxRetries = 5;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  
  async reconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Max retry attempts reached');
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retryCount) + Math.random() * 1000,
      this.maxDelay
    );
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
      this.retryCount = 0; // Reset on success
    } catch (error) {
      this.retryCount++;
      throw error;
    }
  }
}
```

**重连策略**：
- 指数退避算法（Exponential Backoff）
- 添加随机抖动（Jitter）避免雷鸣群效应
- 最大重试次数限制
- 成功后重置计数器

### 7.2 内存优化

#### 7.2.1 配置缓存

```typescript
class ConfigCache {
  private cache = new Map<string, CachedConfig>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  
  set(key: string, config: WireGuardConfig): void {
    this.cache.set(key, {
      config,
      timestamp: Date.now(),
    });
  }
  
  get(key: string): WireGuardConfig | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.config;
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

#### 7.2.2 事件监听器管理

```typescript
class VPNEventManager {
  private listeners = new Set<(status: VPNStatus) => void>();
  
  addListener(callback: (status: VPNStatus) => void): void {
    this.listeners.add(callback);
    
    // Only start native listener if this is the first listener
    if (this.listeners.size === 1) {
      WireGuardModule.addListener('onStatusChange');
    }
  }
  
  removeListener(callback: (status: VPNStatus) => void): void {
    this.listeners.delete(callback);
    
    // Stop native listener if no more listeners
    if (this.listeners.size === 0) {
      WireGuardModule.removeListeners(1);
    }
  }
  
  notifyListeners(status: VPNStatus): void {
    this.listeners.forEach(callback => callback(status));
  }
}
```

### 7.3 电池优化

#### 7.3.1 智能保活

```typescript
// Adjust keepalive based on network type
function getOptimalKeepalive(networkType: string): number {
  switch (networkType) {
    case 'wifi':
      return 25; // Standard keepalive for WiFi
    case 'cellular':
      return 60; // Longer keepalive for cellular to save battery
    default:
      return 25;
  }
}

// Update keepalive when network changes
async function onNetworkChange(networkType: string): Promise<void> {
  const keepalive = getOptimalKeepalive(networkType);
  await updateWireGuardKeepalive(keepalive);
}
```

#### 7.3.2 后台优化

```typescript
// iOS: Use background task
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background') {
    // Reduce update frequency
    setStatusUpdateInterval(60000); // 1 minute
  } else if (nextAppState === 'active') {
    // Restore normal frequency
    setStatusUpdateInterval(5000); // 5 seconds
  }
});

// Android: Handle doze mode
// VPN Service is exempt from doze mode restrictions
// But we should still optimize battery usage
```


---

## 8. 错误处理

### 8.1 错误分类

#### 8.1.1 网络错误

```typescript
enum NetworkErrorType {
  NO_INTERNET = 'NO_INTERNET',
  TIMEOUT = 'TIMEOUT',
  DNS_FAILURE = 'DNS_FAILURE',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
}

class NetworkError extends Error {
  constructor(
    public type: NetworkErrorType,
    message: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**处理策略**：
- `NO_INTERNET`: 等待网络恢复，显示离线提示
- `TIMEOUT`: 自动重试，增加超时时间
- `DNS_FAILURE`: 检查 DNS 配置，提示用户
- `CONNECTION_REFUSED`: 检查防火墙，提示用户

#### 8.1.2 认证错误

```typescript
enum AuthErrorType {
  INVALID_PREAUTH_KEY = 'INVALID_PREAUTH_KEY',
  DEVICE_ALREADY_REGISTERED = 'DEVICE_ALREADY_REGISTERED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

**处理策略**：
- `INVALID_PREAUTH_KEY`: 提示用户重新输入密钥
- `DEVICE_ALREADY_REGISTERED`: 使用现有配置或重新注册
- `UNAUTHORIZED`: 清除配置，要求重新认证

#### 8.1.3 VPN 错误

```typescript
enum VPNErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TUNNEL_FAILED = 'TUNNEL_FAILED',
  ALREADY_CONNECTED = 'ALREADY_CONNECTED',
}

class VPNError extends Error {
  constructor(
    public type: VPNErrorType,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'VPNError';
  }
}
```

**处理策略**：
- `PERMISSION_DENIED`: 引导用户到设置页面授权
- `INVALID_CONFIG`: 重新获取配置
- `TUNNEL_FAILED`: 检查网络，自动重试
- `ALREADY_CONNECTED`: 先断开再连接

### 8.2 错误恢复

#### 8.2.1 自动恢复流程

```typescript
class ErrorRecoveryManager {
  async handleError(error: Error): Promise<void> {
    if (error instanceof NetworkError && error.retryable) {
      await this.retryWithBackoff();
    } else if (error instanceof AuthError) {
      await this.handleAuthError(error);
    } else if (error instanceof VPNError && error.recoverable) {
      await this.recoverVPN(error);
    } else {
      // Unrecoverable error
      this.notifyUser(error);
    }
  }
  
  private async retryWithBackoff(): Promise<void> {
    // Exponential backoff retry
  }
  
  private async handleAuthError(error: AuthError): Promise<void> {
    // Clear invalid credentials, prompt user
  }
  
  private async recoverVPN(error: VPNError): Promise<void> {
    // Attempt to recover VPN connection
  }
}
```

#### 8.2.2 用户通知

```typescript
interface ErrorNotification {
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

function getErrorNotification(error: Error): ErrorNotification {
  if (error instanceof VPNError) {
    switch (error.type) {
      case VPNErrorType.PERMISSION_DENIED:
        return {
          title: 'VPN 权限被拒绝',
          message: '请在设置中允许 Shadow Shuttle 使用 VPN',
          action: {
            label: '打开设置',
            onPress: () => Linking.openSettings(),
          },
        };
      // ... other cases
    }
  }
  
  // Default notification
  return {
    title: '连接失败',
    message: error.message,
  };
}
```

### 8.3 日志和监控

#### 8.3.1 日志记录

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class VPNLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };
    
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output in development
    if (__DEV__) {
      console.log(`[VPN ${level}]`, message, data);
    }
  }
  
  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

#### 8.3.2 性能监控

```typescript
class VPNMetrics {
  private metrics = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    reconnectCount: 0,
  };
  
  recordConnectionAttempt(): void {
    this.metrics.connectionAttempts++;
  }
  
  recordConnectionSuccess(duration: number): void {
    this.metrics.successfulConnections++;
    this.updateAverageConnectionTime(duration);
  }
  
  recordConnectionFailure(): void {
    this.metrics.failedConnections++;
  }
  
  getSuccessRate(): number {
    if (this.metrics.connectionAttempts === 0) return 0;
    return this.metrics.successfulConnections / this.metrics.connectionAttempts;
  }
}
```


---

## 9. Correctness Properties

### 9.1 什么是 Correctness Properties

属性（Property）是一个应该在所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。

在本设计中，我们使用基于属性的测试（Property-Based Testing）来验证 VPN 集成的正确性。每个属性都是一个通用量化的陈述，应该对所有有效输入成立。

### 9.2 核心属性

#### Property 1: VPN 连接状态一致性
*对于任意* VPN 配置和连接操作，调用 connect() 后，getStatus() 应该返回 connected=true 或 connecting=true，调用 disconnect() 后应该返回 connected=false。

**验证**: Requirements 2.1.3, 2.1.4, 2.3.1

**测试策略**: 生成随机的 VPN 配置，执行连接/断开操作，验证状态转换的正确性。

#### Property 2: 设备注册幂等性
*对于任意* 有效的 Headscale URL 和预授权密钥，多次调用 registerDevice() 应该返回相同的 nodeKey 和 meshIP（如果设备已注册）或成功注册新设备。

**验证**: Requirements 2.2.1, 2.2.3

**测试策略**: 使用相同的参数多次调用注册 API，验证返回结果的一致性。

#### Property 3: WireGuard 配置完整性
*对于任意* 成功的设备注册，获取的 WireGuard 配置应该包含所有必需字段：privateKey, address, peers（至少一个），且每个 peer 应该包含 publicKey, endpoint, allowedIPs。

**验证**: Requirements 2.2.2

**测试策略**: 注册设备后获取配置，验证所有必需字段都存在且格式正确。

#### Property 4: 错误信息清晰性
*对于任意* 失败的操作（注册失败、连接失败、重连失败），错误信息应该是非空字符串，且包含错误类型标识符。

**验证**: Requirements 2.2.4, 2.4.3

**测试策略**: 触发各种错误场景（无效密钥、网络错误等），验证错误信息的存在和格式。

#### Property 5: 自动重连触发
*对于任意* 启用了自动重连的 VPN 连接，当检测到网络变化事件或应用从后台恢复时，应该触发重连尝试（如果当前未连接）。

**验证**: Requirements 2.4.1, 2.4.2

**测试策略**: 模拟网络变化和应用状态变化事件，验证重连逻辑是否被触发。

#### Property 6: 配置持久化 Round-trip
*对于任意* 有效的 VPN 配置，保存到存储后再加载，应该得到等价的配置对象（所有字段值相同）。

**验证**: Requirements 2.5.1

**测试策略**: 生成随机配置，保存后加载，验证 round-trip 一致性。这是一个标准的序列化/反序列化测试。

#### Property 7: 配置清除完整性
*对于任意* 存储的 VPN 配置，调用清除操作后，尝试加载配置应该返回 null 或空配置，且不应该有任何残留的敏感数据。

**验证**: Requirements 2.5.4

**测试策略**: 保存配置后清除，验证所有存储位置（AsyncStorage, MMKV, Keychain）都已清空。

#### Property 8: 安全存储隔离
*对于任意* 敏感数据（私钥、预授权密钥），存储后应该只能通过安全存储 API 访问，不应该出现在普通存储（AsyncStorage）或日志中。

**验证**: Requirements 2.5.5

**测试策略**: 保存敏感数据后，检查 AsyncStorage 和日志输出，确保敏感数据不泄露。

#### Property 9: Mesh 网络检测准确性
*对于任意* 设备 IP 地址，如果该 IP 在 Mesh 网络的 IP 范围内（如 100.64.0.0/10），检测函数应该返回 true，否则返回 false。

**验证**: Requirements 2.6.3

**测试策略**: 生成各种 IP 地址（Mesh IP、局域网 IP、公网 IP），验证检测函数的准确性。


### 9.3 边缘情况和示例测试

以下是需要通过单元测试验证的具体示例和边缘情况：

#### Example 1: 空配置处理
验证当用户首次打开 VPN 设置页面时，应该显示空的输入框和"未配置"状态。

**验证**: Requirements 2.1.1, 2.1.2

#### Example 2: Mesh IP 显示
验证当 VPN 连接成功后，UI 应该显示分配的 Mesh IP 地址（如 "100.64.0.2"）。

**验证**: Requirements 2.1.5, 2.3.2

#### Example 3: 连接时长显示
验证当 VPN 连接后，应该显示连接时长（如 "已连接 5 分钟"），且时长应该随时间增加。

**验证**: Requirements 2.3.3

#### Example 4: 流量统计显示（可选）
验证当启用流量统计时，应该显示接收和发送的字节数（如 "↓ 1.2 MB ↑ 0.5 MB"）。

**验证**: Requirements 2.3.4

#### Example 5: VPN 状态指示器
验证在设备列表页面顶部应该显示 VPN 状态指示器，包括连接状态图标和 Mesh IP。

**验证**: Requirements 2.3.5

#### Example 6: 自动重连设置
验证用户可以在设置页面找到"自动重连"开关，且开关状态应该被持久化。

**验证**: Requirements 2.4.4

#### Example 7: 编辑服务器地址
验证用户可以点击编辑按钮修改 Headscale 服务器地址，修改后应该保存到配置中。

**验证**: Requirements 2.5.2

#### Example 8: 重新生成密钥
验证用户可以点击"重新生成"按钮获取新的预授权密钥（这通常需要在 Headscale 管理界面操作）。

**验证**: Requirements 2.5.3

#### Example 9: Mesh IP 提示
验证当 VPN 连接后，在添加设备流程中应该显示提示："建议使用 Mesh IP 以支持跨网络访问"。

**验证**: Requirements 2.6.1

#### Example 10: IP 类型选择
验证在添加设备时，用户可以选择"使用 Mesh IP"或"使用局域网 IP"，且选择应该影响设备的连接方式。

**验证**: Requirements 2.6.2

#### Example 11: 连接方式显示
验证在设备列表中，每个设备应该显示连接方式标签（"局域网"或"Mesh 网络"）。

**验证**: Requirements 2.6.4

### 9.4 性能属性

#### Property 10: 连接时间上限
*对于任意* 有效的 VPN 配置和正常的网络环境，VPN 连接建立时间应该 < 5 秒。

**验证**: Non-functional Requirements 4.1

**测试策略**: 在各种网络环境下测试连接时间，确保 95% 的连接在 5 秒内完成。

#### Property 11: 重连时间上限
*对于任意* 网络切换事件，自动重连时间应该 < 10 秒。

**验证**: Non-functional Requirements 4.1

**测试策略**: 模拟网络切换，测量从检测到切换到重连成功的时间。

#### Property 12: 内存占用限制
*对于任意* VPN 连接状态（连接或断开），应用的内存占用增加应该 < 50MB。

**验证**: Non-functional Requirements 4.1

**测试策略**: 在连接前后测量应用内存占用，验证增量在限制内。

---

## 10. 测试策略

### 10.1 测试方法

本项目采用双重测试方法：

1. **单元测试（Unit Tests）**: 验证具体示例、边缘情况和错误条件
2. **基于属性的测试（Property-Based Tests）**: 验证通用属性在所有输入下成立

两种测试方法是互补的，都是实现全面覆盖所必需的：
- 单元测试捕获具体的 bug 和已知的边缘情况
- 属性测试通过随机化验证通用正确性

### 10.2 测试工具

#### 10.2.1 JavaScript/TypeScript 测试

- **测试框架**: Jest
- **属性测试库**: fast-check
- **Mock 库**: jest.mock()
- **覆盖率工具**: Jest Coverage

#### 10.2.2 iOS 原生测试

- **测试框架**: XCTest
- **UI 测试**: XCUITest
- **Mock 库**: OCMock 或 Swift Mock

### 10.3 测试配置

#### 10.3.1 属性测试配置

每个属性测试必须运行至少 100 次迭代（由于随机化）：

```typescript
import fc from 'fast-check';

describe('VPN Service Properties', () => {
  it('Property 1: VPN 连接状态一致性', () => {
    fc.assert(
      fc.property(
        fc.record({
          headscaleUrl: fc.webUrl(),
          preauthKey: fc.hexaString({ minLength: 32, maxLength: 64 }),
          deviceName: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (config) => {
          const vpnService = new VPNService();
          
          // Test connect
          await vpnService.connect(config);
          const statusAfterConnect = await vpnService.getStatus();
          expect(
            statusAfterConnect.connected || statusAfterConnect.connecting
          ).toBe(true);
          
          // Test disconnect
          await vpnService.disconnect();
          const statusAfterDisconnect = await vpnService.getStatus();
          expect(statusAfterDisconnect.connected).toBe(false);
        }
      ),
      { numRuns: 100 } // Minimum 100 iterations
    );
  });
});
```

#### 10.3.2 测试标签

每个属性测试必须使用注释标签引用设计文档中的属性：

```typescript
/**
 * Feature: wireguard-vpn-integration
 * Property 6: 配置持久化 Round-trip
 * 
 * For any valid VPN config, saving and loading should return equivalent config.
 */
it('Property 6: 配置持久化 Round-trip', async () => {
  // Test implementation
});
```

### 10.4 测试覆盖目标

- **代码覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **属性测试覆盖**: 所有核心属性（Property 1-12）
- **单元测试覆盖**: 所有示例和边缘情况（Example 1-11）

### 10.5 集成测试

#### 10.5.1 端到端测试场景

1. **完整注册和连接流程**
   - 输入 Headscale URL 和密钥
   - 注册设备
   - 连接 VPN
   - 验证 Mesh IP
   - 添加设备使用 Mesh IP
   - 建立 SSH 连接

2. **网络切换测试**
   - 连接 VPN
   - 模拟 WiFi → 4G 切换
   - 验证自动重连
   - 验证 SSH 连接保持

3. **后台恢复测试**
   - 连接 VPN
   - 应用进入后台
   - 等待 5 分钟
   - 应用恢复前台
   - 验证 VPN 状态和重连

#### 10.5.2 性能测试

1. **连接性能测试**
   - 测量 VPN 连接建立时间
   - 测量网络切换重连时间
   - 测量应用启动时 VPN 状态检查时间

2. **资源使用测试**
   - 测量内存占用
   - 测量 CPU 使用率
   - 测量电池消耗
   - 测量网络流量开销

3. **稳定性测试**
   - 长时间连接测试（24 小时）
   - 频繁网络切换测试（100 次）
   - 并发操作测试

### 10.6 测试环境

#### 10.6.1 开发环境

- **Headscale 服务器**: 本地 Docker 容器
- **测试设备**: iOS 模拟器
- **网络模拟**: Charles Proxy 或 Network Link Conditioner

#### 10.6.2 CI/CD 环境

- **CI 平台**: GitHub Actions
- **自动化测试**: 每次 PR 触发
- **测试报告**: 自动生成覆盖率报告
- **性能基准**: 与基线对比

---

## 11. 部署和配置

### 11.1 iOS 部署

#### 11.1.1 Xcode 配置

1. **添加 Network Extension Target**
```bash
# In Xcode:
# File → New → Target → Network Extension
# Choose "Packet Tunnel Provider"
```

2. **配置 App Group**
```xml
<!-- Capabilities → App Groups -->
group.com.shadowshuttle.vpn
```

3. **配置 Entitlements**
```xml
<!-- ShadowShuttle.entitlements -->
<key>com.apple.developer.networking.networkextension</key>
<array>
  <string>packet-tunnel-provider</string>
</array>
<key>com.apple.security.application-groups</key>
<array>
  <string>group.com.shadowshuttle.vpn</string>
</array>
```

4. **添加依赖**
```ruby
# Podfile
target 'ShadowShuttle' do
  pod 'WireGuardKit', '~> 1.0'
end

target 'ShadowShuttleVPN' do
  pod 'WireGuardKit', '~> 1.0'
end
```

#### 11.1.2 Info.plist 配置

```xml
<key>NSNetworkExtensionUsageDescription</key>
<string>Shadow Shuttle 需要 VPN 权限以实现跨网络安全访问您的设备</string>
```

### 11.2 React Native 配置

#### 11.3.1 Package.json 依赖

```json
{
  "dependencies": {
    "react-native-mmkv": "^2.12.2",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "react-native-keychain": "^8.1.2"
  }
}
```

#### 11.3.2 原生模块注册

```typescript
// index.js
import { NativeModules } from 'react-native';

const { WireGuardModule } = NativeModules;

if (!WireGuardModule) {
  console.error('WireGuardModule is not available');
}

export default WireGuardModule;
```

### 11.3 Headscale 服务器配置

#### 11.4.1 基本配置

```yaml
# config.yaml
server_url: https://headscale.example.com
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 127.0.0.1:9090

# WireGuard settings
wireguard:
  private_key_path: /var/lib/headscale/private.key
  listen_port: 51820

# IP allocation
ip_prefixes:
  - 100.64.0.0/10

# DNS
dns_config:
  nameservers:
    - 1.1.1.1
    - 8.8.8.8
  magic_dns: true
  base_domain: headscale.local
```

#### 11.4.2 预授权密钥生成

```bash
# Generate preauth key
headscale preauthkeys create --user default --reusable --expiration 24h

# List preauth keys
headscale preauthkeys list

# Expire preauth key
headscale preauthkeys expire --key <key>
```

---

## 12. 风险和缓解措施

### 12.1 技术风险

#### 12.1.1 iOS Network Extension 复杂性

**风险**: iOS Network Extension 配置复杂，容易出错

**影响**: 高 - 可能导致 VPN 功能无法使用

**缓解措施**:
- 提前研究和测试 Network Extension
- 参考 WireGuard iOS 官方实现
- 创建详细的配置文档
- 在多个 iOS 版本上测试

#### 12.1.2 WireGuard 库兼容性

**风险**: WireGuard 库可能与某些设备或系统版本不兼容

**影响**: 中 - 可能导致部分用户无法使用

**缓解措施**:
- 在多种设备上测试
- 提供降级方案（使用系统 VPN）
- 收集兼容性数据
- 及时更新库版本

### 12.2 网络风险

#### 12.2.1 防火墙阻止 UDP 流量

**风险**: 某些网络环境可能阻止 UDP 51820 端口

**影响**: 高 - 可能导致 VPN 无法连接

**缓解措施**:
- 提供端口配置选项
- 支持多个备用端口
- 提供 TCP 隧道选项（未来）
- 显示清晰的错误信息和解决方案

#### 12.2.2 NAT 穿透问题

**风险**: 某些 NAT 类型可能导致连接失败

**影响**: 中 - 可能影响部分用户

**缓解措施**:
- 使用 DERP 中继服务器
- 配置合理的 keepalive 间隔
- 提供连接诊断工具
- 文档说明网络要求

### 12.3 安全风险

#### 12.3.1 私钥泄露

**风险**: 私钥可能通过日志或不安全存储泄露

**影响**: 高 - 可能导致未授权访问

**缓解措施**:
- 使用平台安全存储
- 禁止在日志中输出私钥
- 定期审计代码
- 实施密钥轮换机制

#### 12.3.2 中间人攻击

**风险**: Headscale API 通信可能被拦截

**影响**: 高 - 可能导致配置被篡改

**缓解措施**:
- 强制使用 HTTPS
- 实施证书固定（Certificate Pinning）
- 验证服务器证书
- 使用 API 签名

### 12.4 用户体验风险

#### 12.4.1 配置复杂度

**风险**: 用户可能不理解如何配置 VPN

**影响**: 中 - 可能导致用户放弃使用

**缓解措施**:
- 提供详细的设置向导
- 使用清晰的 UI 和提示
- 提供视频教程
- 实施一键配置（QR 码）

#### 12.4.2 性能影响

**风险**: VPN 可能影响应用性能和电池寿命

**影响**: 中 - 可能影响用户满意度

**缓解措施**:
- 优化 VPN 实现
- 提供性能监控
- 允许用户禁用 VPN
- 实施智能 keepalive

---

## 13. 未来扩展

### 13.1 短期扩展（3-6 个月）

#### 13.1.1 多服务器支持

允许用户配置多个 Headscale 服务器，并在它们之间切换。

**技术要点**:
- 扩展配置数据模型支持多个服务器
- 实现服务器选择 UI
- 支持不同服务器的独立配置

#### 13.1.2 流量统计

显示详细的 VPN 流量统计和历史记录。

**技术要点**:
- 从 WireGuard 获取流量数据
- 实现数据聚合和存储
- 创建可视化图表

#### 13.1.3 连接质量监控

实时监控 VPN 连接质量（延迟、丢包率等）。

**技术要点**:
- 实现 ping 测试
- 收集连接指标
- 显示连接质量评分

### 13.2 长期扩展（6-12 个月）

#### 13.2.1 自建 DERP 服务器

支持用户部署自己的 DERP 中继服务器。

**技术要点**:
- 集成 DERP 服务器
- 实现 DERP 配置
- 优化中继性能

#### 13.2.2 P2P 直连优化

优化 NAT 穿透，提高 P2P 直连成功率。

**技术要点**:
- 实现 STUN/TURN
- 优化 NAT 类型检测
- 实施智能路由选择

#### 13.2.3 企业级功能

添加企业用户需要的高级功能。

**技术要点**:
- ACL（访问控制列表）
- 审计日志
- 集中管理
- SSO 集成

---

## 14. 总结

本设计文档描述了在 Shadow Shuttle 移动应用中集成 WireGuard VPN 功能的完整技术方案。主要设计决策包括：

1. **平台原生实现**: 使用 iOS WireGuardKit 和 Android WireGuard 库，确保最佳性能
2. **React Native 桥接**: 通过原生模块暴露 VPN 功能给 JavaScript 层
3. **Headscale 集成**: 自动化设备注册和配置获取流程
4. **安全优先**: 使用平台安全存储，端到端加密
5. **用户友好**: 简化配置流程，提供清晰的状态反馈
6. **健壮性**: 实现自动重连和错误恢复机制

通过遵循本设计文档，我们将实现一个安全、稳定、易用的 VPN 集成方案，为用户提供无缝的跨网络远程访问体验。



#### 3.3.1 WireGuardModule (Swift - Bridge Module)

**职责**: React Native 桥接，连接 JS 和原生代码

**接口**:
```swift
@objc(WireGuardModule)
class WireGuardModule: RCTEventEmitter {
  private let tunnelManager: TunnelManager
  private let statusObserver: StatusObserver
  
  override init() {
    self.tunnelManager = TunnelManager()
    self.statusObserver = StatusObserver()
    super.init()
    
    // Setup status observer
    self.statusObserver.onStatusChange = { [weak self] status in
      self?.sendEvent(withName: "onStatusChange", body: status.toDictionary())
    }
  }
  
  @objc func connect(_ configString: String,
                     resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock) {
    tunnelManager.connect(configString: configString) { result in
      switch result {
      case .success:
        resolver(nil)
      case .failure(let error):
        rejecter("VPN_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc func disconnect(_ resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
    tunnelManager.disconnect { result in
      switch result {
      case .success:
        resolver(nil)
      case .failure(let error):
        rejecter("VPN_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc func getStatus(_ resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock) {
    let status = tunnelManager.getStatus()
    resolver(status.toDictionary())
  }
  
  override func supportedEvents() -> [String]! {
    return ["onStatusChange"]
  }
}
```

**依赖**: Tunnel Manager, Status Observer

**测试策略**: 集成测试，验证桥接功能

#### 3.3.2 Tunnel Manager Module

**职责**: 管理 VPN 隧道生命周期

**接口**:
```swift
protocol TunnelManagerProtocol {
  func connect(configString: String, completion: @escaping (Result<Void, Error>) -> Void)
  func disconnect(completion: @escaping (Result<Void, Error>) -> Void)
  func getStatus() -> TunnelStatus
}

class TunnelManager: TunnelManagerProtocol {
  private let tunnelProvider: NEVPNManager
  private let configParser: ConfigParser
  private let permissionHandler: PermissionHandler
  
  init(
    tunnelProvider: NEVPNManager = NEVPNManager.shared(),
    configParser: ConfigParser = ConfigParser(),
    permissionHandler: PermissionHandler = PermissionHandler()
  ) {
    self.tunnelProvider = tunnelProvider
    self.configParser = configParser
    self.permissionHandler = permissionHandler
  }
  
  func connect(configString: String, completion: @escaping (Result<Void, Error>) -> Void) {
    // 1. Check permissions
    guard permissionHandler.hasVPNPermission() else {
      permissionHandler.requestVPNPermission { granted in
        if granted {
          self.performConnect(configString: configString, completion: completion)
        } else {
          completion(.failure(VPNError.permissionDenied))
        }
      }
      return
    }
    
    // 2. Perform connection
    performConnect(configString: configString, completion: completion)
  }
  
  private func performConnect(configString: String, completion: @escaping (Result<Void, Error>) -> Void) {
    do {
      // Parse config
      let config = try configParser.parse(configString)
      
      // Load tunnel configuration
      tunnelProvider.loadFromPreferences { error in
        if let error = error {
          completion(.failure(error))
          return
        }
        
        // Configure tunnel
        self.configureTunnel(with: config)
        
        // Start tunnel
        self.tunnelProvider.saveToPreferences { error in
          if let error = error {
            completion(.failure(error))
            return
          }
          
          do {
            try self.tunnelProvider.connection.startVPNTunnel()
            completion(.success(()))
          } catch {
            completion(.failure(error))
          }
        }
      }
    } catch {
      completion(.failure(error))
    }
  }
  
  func disconnect(completion: @escaping (Result<Void, Error>) -> Void) {
    tunnelProvider.connection.stopVPNTunnel()
    completion(.success(()))
  }
  
  func getStatus() -> TunnelStatus {
    let connection = tunnelProvider.connection
    return TunnelStatus(
      connected: connection.status == .connected,
      connecting: connection.status == .connecting,
      connectedAt: connection.connectedDate
    )
  }
  
  private func configureTunnel(with config: TunnelConfiguration) {
    let protocolConfig = NETunnelProviderProtocol()
    protocolConfig.providerBundleIdentifier = "com.shadowshuttle.vpn.extension"
    protocolConfig.serverAddress = config.peers.first?.endpoint ?? ""
    protocolConfig.providerConfiguration = config.toDictionary()
    
    tunnelProvider.protocolConfiguration = protocolConfig
    tunnelProvider.localizedDescription = "Shadow Shuttle VPN"
    tunnelProvider.isEnabled = true
  }
}
```

**依赖**: NEVPNManager, Config Parser, Permission Handler

**测试策略**: 单元测试，mock NEVPNManager

#### 3.3.3 Config Parser Module

**职责**: 解析 WireGuard 配置字符串

**接口**:
```swift
protocol ConfigParserProtocol {
  func parse(_ configString: String) throws -> TunnelConfiguration
}

class ConfigParser: ConfigParserProtocol {
  func parse(_ configString: String) throws -> TunnelConfiguration {
    // Parse INI format config
    let lines = configString.components(separatedBy: .newlines)
    var interface: InterfaceConfiguration?
    var peers: [PeerConfiguration] = []
    
    var currentSection: String?
    var currentPeer: PeerConfiguration?
    
    for line in lines {
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      
      // Skip empty lines and comments
      if trimmed.isEmpty || trimmed.hasPrefix("#") {
        continue
      }
      
      // Section headers
      if trimmed.hasPrefix("[") && trimmed.hasSuffix("]") {
        let section = String(trimmed.dropFirst().dropLast())
        currentSection = section
        
        if section == "Peer" {
          if let peer = currentPeer {
            peers.append(peer)
          }
          currentPeer = PeerConfiguration()
        }
        continue
      }
      
      // Key-value pairs
      let components = trimmed.components(separatedBy: "=")
      guard components.count == 2 else { continue }
      
      let key = components[0].trimmingCharacters(in: .whitespaces)
      let value = components[1].trimmingCharacters(in: .whitespaces)
      
      // Parse based on current section
      if currentSection == "Interface" {
        if interface == nil {
          interface = InterfaceConfiguration()
        }
        try interface?.setValue(key: key, value: value)
      } else if currentSection == "Peer" {
        try currentPeer?.setValue(key: key, value: value)
      }
    }
    
    // Add last peer
    if let peer = currentPeer {
      peers.append(peer)
    }
    
    guard let finalInterface = interface else {
      throw ConfigError.missingInterface
    }
    
    return TunnelConfiguration(interface: finalInterface, peers: peers)
  }
}
```

**依赖**: 无

**测试策略**: 单元测试，测试各种配置格式

#### 3.3.4 Status Observer Module

**职责**: 监听 VPN 状态变化

**接口**:
```swift
protocol StatusObserverProtocol {
  var onStatusChange: ((TunnelStatus) -> Void)? { get set }
  func startObserving()
  func stopObserving()
}

class StatusObserver: StatusObserverProtocol {
  var onStatusChange: ((TunnelStatus) -> Void)?
  private var statusObserver: NSObjectProtocol?
  
  func startObserving() {
    statusObserver = NotificationCenter.default.addObserver(
      forName: .NEVPNStatusDidChange,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      guard let connection = notification.object as? NEVPNConnection else {
        return
      }
      
      let status = TunnelStatus(
        connected: connection.status == .connected,
        connecting: connection.status == .connecting,
        connectedAt: connection.connectedDate
      )
      
      self?.onStatusChange?(status)
    }
  }
  
  func stopObserving() {
    if let observer = statusObserver {
      NotificationCenter.default.removeObserver(observer)
      statusObserver = nil
    }
  }
  
  deinit {
    stopObserving()
  }
}
```

**依赖**: NotificationCenter

**测试策略**: 单元测试，mock NotificationCenter

#### 3.3.5 Permission Handler Module

**职责**: 处理 VPN 权限请求

**接口**:
```swift
protocol PermissionHandlerProtocol {
  func hasVPNPermission() -> Bool
  func requestVPNPermission(completion: @escaping (Bool) -> Void)
}

class PermissionHandler: PermissionHandlerProtocol {
  func hasVPNPermission() -> Bool {
    // Check if VPN configuration exists and is enabled
    let manager = NEVPNManager.shared()
    return manager.isEnabled
  }
  
  func requestVPNPermission(completion: @escaping (Bool) -> Void) {
    // iOS will automatically show permission dialog when
    // saveToPreferences is called for the first time
    // We just need to handle the result
    completion(true)
  }
}
```

**依赖**: NEVPNManager

**测试策略**: 单元测试，mock NEVPNManager

#### 3.3.6 Network Extension (Packet Tunnel Provider)

**职责**: 实际的 VPN 隧道实现

**接口**:
```swift
class PacketTunnelProvider: NEPacketTunnelProvider {
  private var wireguardAdapter: WireGuardAdapter?
  
  override func startTunnel(
    options: [String : NSObject]?,
    completionHandler: @escaping (Error?) -> Void
  ) {
    // 1. Get configuration from provider configuration
    guard let providerConfig = protocolConfiguration as? NETunnelProviderProtocol,
          let config = providerConfig.providerConfiguration else {
      completionHandler(TunnelError.invalidConfiguration)
      return
    }
    
    // 2. Parse WireGuard configuration
    guard let configString = config["config"] as? String else {
      completionHandler(TunnelError.missingConfiguration)
      return
    }
    
    // 3. Create WireGuard adapter
    let adapter = WireGuardAdapter(with: self) { logLevel, message in
      wg_log(logLevel.osLogLevel, message: message)
    }
    
    // 4. Start tunnel
    adapter.start(tunnelConfiguration: parseConfig(configString)) { error in
      if let error = error {
        completionHandler(error)
      } else {
        self.wireguardAdapter = adapter
        completionHandler(nil)
      }
    }
  }
  
  override func stopTunnel(
    with reason: NEProviderStopReason,
    completionHandler: @escaping () -> Void
  ) {
    wireguardAdapter?.stop { error in
      if let error = error {
        wg_log(.error, message: "Failed to stop tunnel: \(error)")
      }
      self.wireguardAdapter = nil
      completionHandler()
    }
  }
  
  override func handleAppMessage(
    _ messageData: Data,
    completionHandler: ((Data?) -> Void)?
  ) {
    // Handle messages from main app (e.g., get statistics)
    guard let message = try? JSONDecoder().decode(AppMessage.self, from: messageData) else {
      completionHandler?(nil)
      return
    }
    
    switch message.type {
    case .getStatistics:
      if let stats = wireguardAdapter?.getStatistics() {
        let response = try? JSONEncoder().encode(stats)
        completionHandler?(response)
      } else {
        completionHandler?(nil)
      }
    default:
      completionHandler?(nil)
    }
  }
  
  private func parseConfig(_ configString: String) -> TunnelConfiguration {
    // Parse configuration (reuse ConfigParser logic)
    // ...
  }
}
```

**依赖**: WireGuardKit

**测试策略**: 集成测试，使用真实的 Network Extension 环境

### 3.4 模块依赖注入

为了实现真正的模块化和可测试性，使用依赖注入模式：

```typescript
// TypeScript - Dependency Injection Container
class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();
  
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }
  
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not registered`);
    }
    return factory();
  }
}

// Register services
const container = DIContainer.getInstance();

container.register('IHttpClient', () => new FetchHttpClient());
container.register('IConfigParser', () => new ConfigParser());
container.register('IHeadscaleClient', () => 
  new HeadscaleClient(
    container.resolve('IHttpClient'),
    container.resolve('IConfigParser')
  )
);
container.register('ISecureStorage', () => new MMKVStorage());
container.register('IConfigValidator', () => new ConfigValidator());
container.register('IConfigManager', () =>
  new ConfigManager(
    container.resolve('ISecureStorage'),
    container.resolve('IConfigValidator')
  )
);
// ... register other services

// Usage
const vpnService = container.resolve<IVPNService>('IVPNService');
```

```swift
// Swift - Dependency Injection
protocol DIContainer {
  func resolve<T>() -> T
}

class DefaultDIContainer: DIContainer {
  private var factories: [String: Any] = [:]
  
  func register<T>(_ type: T.Type, factory: @escaping () -> T) {
    let key = String(describing: type)
    factories[key] = factory
  }
  
  func resolve<T>() -> T {
    let key = String(describing: T.self)
    guard let factory = factories[key] as? () -> T else {
      fatalError("Service \(key) not registered")
    }
    return factory()
  }
}

// Register services
let container = DefaultDIContainer()

container.register(ConfigParserProtocol.self) { ConfigParser() }
container.register(PermissionHandlerProtocol.self) { PermissionHandler() }
container.register(TunnelManagerProtocol.self) {
  TunnelManager(
    configParser: container.resolve(),
    permissionHandler: container.resolve()
  )
}

// Usage
let tunnelManager: TunnelManagerProtocol = container.resolve()
```

**模块化优势**:
1. **可测试性**: 每个模块可以独立测试，依赖可以轻松 mock
2. **可维护性**: 模块职责清晰，修改一个模块不影响其他模块
3. **可扩展性**: 新功能可以作为新模块添加，不需要修改现有代码
4. **可替换性**: 任何模块都可以替换实现，只要遵循接口契约

