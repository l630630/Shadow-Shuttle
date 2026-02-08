# Phase 3: 完整 shadowd 集成实施计划

## 目标
1. 修复 HTTP API 访问
2. 实现真实 WireGuard VPN
3. 配置 Mesh 网络
4. 实现设备间通信

## 阶段 1：修复 HTTP API 访问 ✅ 进行中

### 方案 A：使用真实 Mac IP（最简单）

**实现步骤：**
1. ✅ 获取 Mac 局域网 IP：`192.168.2.57`
2. 🔄 在移动应用中添加 IP 配置
3. 🔄 使用 QR 码传递真实 IP

**优点：**
- 实现简单
- 立即可用
- 不需要额外依赖

**缺点：**
- IP 可能变化
- 需要手动配置
- 只能在同一局域网使用

### 方案 B：使用 mDNS/Bonjour 发现（推荐）

**实现步骤：**
1. shadowd 注册 mDNS 服务（`_shadowd._tcp.local`）
2. 移动应用使用 React Native mDNS 库发现服务
3. 自动获取 IP 和端口

**优点：**
- 自动发现，无需配置
- IP 变化时自动更新
- 标准协议，可靠性高

**缺点：**
- 需要添加依赖
- 实现稍复杂
- 可能需要网络权限

**所需库：**
- Go: `github.com/grandcat/zeroconf`
- React Native: `react-native-zeroconf`

### 方案 C：使用 gRPC 代替 HTTP（备选）

**实现步骤：**
1. 移动应用添加 gRPC 客户端
2. 使用 gRPC 调用设备信息
3. 复用现有 gRPC 服务器

**优点：**
- 性能更好
- 类型安全
- 双向流支持

**缺点：**
- 需要 protobuf 编译
- 移动端集成复杂
- 仍需解决 IP 发现问题

## 阶段 2：实现 mDNS/Bonjour 发现

### 2.1 shadowd 端实现

```go
// shadowd/network/mdns.go
package network

import (
    "context"
    "github.com/grandcat/zeroconf"
)

type MDNSService struct {
    server *zeroconf.Server
}

func NewMDNSService(port int, deviceName string) (*MDNSService, error) {
    server, err := zeroconf.Register(
        deviceName,           // Instance name
        "_shadowd._tcp",      // Service type
        "local.",             // Domain
        port,                 // Port
        []string{"version=0.1.0"}, // TXT records
        nil,                  // Network interfaces (nil = all)
    )
    if err != nil {
        return nil, err
    }
    
    return &MDNSService{server: server}, nil
}

func (m *MDNSService) Stop() {
    if m.server != nil {
        m.server.Shutdown()
    }
}
```

### 2.2 移动应用端实现

```bash
# 安装依赖
npm install react-native-zeroconf
cd ios && pod install
```

```typescript
// mobile-app/src/services/mdnsService.ts
import Zeroconf from 'react-native-zeroconf';

export class MDNSService {
  private zeroconf: Zeroconf;
  
  constructor() {
    this.zeroconf = new Zeroconf();
  }
  
  async discoverShadowdDevices(): Promise<Device[]> {
    return new Promise((resolve) => {
      const devices: Device[] = [];
      
      this.zeroconf.on('resolved', (service) => {
        if (service.name && service.addresses && service.addresses.length > 0) {
          devices.push({
            id: service.name,
            name: service.name,
            hostname: service.host,
            meshIP: service.addresses[0],
            sshPort: 8022,
            grpcPort: 50052,
            publicKey: '',
            online: true,
            lastSeen: new Date(),
          });
        }
      });
      
      this.zeroconf.on('stop', () => {
        resolve(devices);
      });
      
      // Scan for 5 seconds
      this.zeroconf.scan('shadowd', 'tcp', 'local.');
      setTimeout(() => {
        this.zeroconf.stop();
      }, 5000);
    });
  }
}
```

## 阶段 3：实现真实 WireGuard VPN

### 3.1 安装 WireGuard

**macOS:**
```bash
brew install wireguard-tools
```

**Linux:**
```bash
sudo apt install wireguard
```

### 3.2 shadowd WireGuard 集成

```go
// shadowd/network/wireguard.go
package network

import (
    "fmt"
    "os/exec"
    "golang.zx2c4.com/wireguard/wgctrl"
)

type WireGuardManager struct {
    interfaceName string
    privateKey    string
    publicKey     string
    listenPort    int
    client        *wgctrl.Client
}

func NewWireGuardManager(interfaceName string, listenPort int) (*WireGuardManager, error) {
    // Generate key pair
    privateKey, publicKey, err := generateKeyPair()
    if err != nil {
        return nil, err
    }
    
    client, err := wgctrl.New()
    if err != nil {
        return nil, err
    }
    
    return &WireGuardManager{
        interfaceName: interfaceName,
        privateKey:    privateKey,
        publicKey:     publicKey,
        listenPort:    listenPort,
        client:        client,
    }, nil
}

func (w *WireGuardManager) CreateInterface() error {
    // Create WireGuard interface
    cmd := exec.Command("sudo", "ip", "link", "add", "dev", w.interfaceName, "type", "wireguard")
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to create interface: %w", err)
    }
    
    // Set private key
    cmd = exec.Command("sudo", "wg", "set", w.interfaceName, "private-key", "/dev/stdin")
    cmd.Stdin = strings.NewReader(w.privateKey)
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to set private key: %w", err)
    }
    
    // Set listen port
    cmd = exec.Command("sudo", "wg", "set", w.interfaceName, "listen-port", fmt.Sprintf("%d", w.listenPort))
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to set listen port: %w", err)
    }
    
    // Bring interface up
    cmd = exec.Command("sudo", "ip", "link", "set", "up", "dev", w.interfaceName)
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to bring interface up: %w", err)
    }
    
    return nil
}

func (w *WireGuardManager) AddPeer(publicKey string, allowedIPs []string, endpoint string) error {
    // Add peer configuration
    cmd := exec.Command("sudo", "wg", "set", w.interfaceName,
        "peer", publicKey,
        "allowed-ips", strings.Join(allowedIPs, ","),
        "endpoint", endpoint,
    )
    
    return cmd.Run()
}
```

### 3.3 移动应用 WireGuard 集成

**Android:**
```bash
# 添加 WireGuard 依赖
# android/app/build.gradle
implementation 'com.wireguard.android:tunnel:1.0.20230706'
```

**iOS:**
```bash
# 使用 Network Extension
# 需要配置 VPN 权限
```

## 阶段 4：配置 Mesh 网络

### 4.1 Headscale 部署（可选）

如果需要跨网络连接，部署 Headscale 服务器：

```bash
# 使用 Docker 部署
cd headscale
docker-compose up -d
```

### 4.2 设备注册流程

1. shadowd 启动时向 Headscale 注册
2. 获取 Mesh IP（100.64.0.0/10 范围）
3. 配置 WireGuard peer
4. 建立 P2P 连接

### 4.3 设备间通信

```
Device A (Mac)          Headscale Server          Device B (Phone)
    |                         |                          |
    |--- Register ----------->|                          |
    |<-- Mesh IP: 100.64.0.1 -|                          |
    |                         |<-------- Register -------|
    |                         |-- Mesh IP: 100.64.0.2 -->|
    |                         |                          |
    |<------- Peer Info ------|---------- Peer Info ---->|
    |                         |                          |
    |<=============== Direct P2P Connection ============>|
```

## 实施优先级

### 立即实施（本次）
1. ✅ 使用真实 Mac IP（通过 QR 码配对）
2. 🔄 添加 IP 配置界面

### 短期实施（1-2 天）
1. 实现 mDNS/Bonjour 自动发现
2. 测试局域网设备发现

### 中期实施（1 周）
1. 集成 WireGuard
2. 实现基本 VPN 功能
3. 配置 Mesh 网络

### 长期实施（2-4 周）
1. 部署 Headscale 服务器
2. 实现跨网络连接
3. 添加设备间文件传输
4. 实现端口转发

## 当前行动

让我先实现最简单的方案：**通过 QR 码传递真实 Mac IP**

这样用户扫描 QR 码时，会自动获取正确的 IP 地址，无需手动配置。
