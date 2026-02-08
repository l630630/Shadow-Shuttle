# Shadowd - Shadow Shuttle 守护进程

Shadowd 是 Shadow Shuttle 系统的守护进程组件，运行在用户计算机上。它通过私有 Mesh 网络提供 SSH 访问和设备信息的 gRPC 接口。

## 功能特性

- **Mesh 网络集成**: 连接到 Headscale 服务器并加入基于 WireGuard 的 Mesh 网络
- **SSH 服务器**: 通过 Mesh 网络提供安全的 SSH 访问（端口 2222）
- **WebSocket SSH 代理**: 内置 WebSocket 到 SSH 的代理，供移动应用使用（端口 8022）
- **gRPC 接口**: 通过 gRPC-Web 暴露设备信息和配对功能（端口 50052）
- **跨平台**: 可在 Windows、macOS 和 Linux 上作为系统服务运行
- **自动重连**: 如果网络连接丢失，自动重新连接到 Headscale
- **集成架构**: 所有服务集成在一个二进制文件中 - 无需单独的代理服务器

## 系统要求

- Go 1.21 或更高版本
- 系统已安装 WireGuard
- 可访问 Headscale 服务器

## 安装

### 快速安装（推荐）

使用自动化安装脚本将 shadowd 安装为系统服务，详见 [INSTALL.md](INSTALL.md)。

```bash
# Linux
sudo ./scripts/install-linux.sh

# macOS
sudo ./scripts/install-macos.sh

# Windows (以管理员身份运行 PowerShell)
.\scripts\install-windows.ps1
```

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/shadow-shuttle/shadowd.git
cd shadowd

# 构建二进制文件
go build -o shadowd

# 复制示例配置文件
cp config.example.yaml shadowd.yaml

# 编辑配置文件
nano shadowd.yaml
```

## 配置

创建 `shadowd.yaml` 配置文件，结构如下：

```yaml
headscale:
  url: https://your-headscale-server.com
  preauth_key: your-preauth-key

ssh:
  port: 2222
  host_key_path: /etc/shadowd/ssh_host_key
  allowed_networks:
    - 0.0.0.0/0

websocket:
  listen_addr: 0.0.0.0:8022

grpc:
  port: 50051
  tls_enabled: false

device:
  name: MyComputer

users:
  username: "password"
```

### 配置选项说明

- **headscale.url**: Headscale 服务器的 URL
- **headscale.preauth_key**: Headscale 的预认证密钥（使用 `headscale preauthkeys create` 生成）
- **ssh.port**: SSH 服务器端口（默认：2222）
- **ssh.host_key_path**: SSH 主机密钥文件路径
- **ssh.allowed_networks**: 允许连接的网络（开发环境使用 0.0.0.0/0）
- **websocket.listen_addr**: WebSocket SSH 代理监听地址（默认：0.0.0.0:8022）
- **grpc.port**: gRPC 服务器端口（默认：50051）
- **grpc.tls_enabled**: 是否为 gRPC 连接启用 TLS
- **device.name**: 设备名称（在移动应用中显示）
- **users**: SSH 认证的用户名到密码的映射

## 使用方法

### 手动运行

```bash
# 使用默认配置文件 (shadowd.yaml)
./shadowd

# 使用自定义配置文件
./shadowd -config /path/to/config.yaml
```

### 作为系统服务运行

**推荐**：使用自动化安装脚本和服务管理工具。

详见 [INSTALL.md](INSTALL.md) 获取详细说明，或查看 [service/README.md](service/README.md) 了解服务管理文档。

#### 快速服务管理

```bash
# 安装服务
sudo shadowd-service -action install

# 启动服务
sudo shadowd-service -action start

# 查看状态
sudo shadowd-service -action status

# 停止服务
sudo shadowd-service -action stop

# 卸载服务
sudo shadowd-service -action uninstall
```

#### Manual Service Configuration (Advanced)

<details>
<summary>Linux (systemd)</summary>

```bash
# Copy the binary to /usr/local/bin
sudo cp shadowd /usr/local/bin/

# Create systemd service file
sudo nano /etc/systemd/system/shadowd.service
```

Add the following content:

```ini
[Unit]
Description=Shadow Shuttle Daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/shadowd -config /etc/shadowd/shadowd.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable shadowd
sudo systemctl start shadowd
sudo systemctl status shadowd
```

</details>

<details>
<summary>macOS (launchd)</summary>

```bash
# Copy the binary to /usr/local/bin
sudo cp shadowd /usr/local/bin/

# Create launchd plist file
sudo nano /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
```

Add the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shadowshuttle.shadowd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/shadowd</string>
        <string>-config</string>
        <string>/etc/shadowd/shadowd.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load and start the service:

```bash
sudo launchctl load /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
sudo launchctl start com.shadowshuttle.shadowd
```

</details>

<details>
<summary>Windows (Service)</summary>

Use the automated installation script or service manager tool (see [INSTALL.md](INSTALL.md)).

```powershell
# Using service manager
shadowd-service.exe -action install
shadowd-service.exe -action start

# Or using sc.exe
sc.exe create shadowd binPath= "C:\path\to\shadowd.exe -config C:\path\to\shadowd.yaml"
sc.exe start shadowd
```

</details>

## 开发

### 项目结构

```
shadowd/
├── config/          # 配置管理
├── ssh/             # SSH 服务器实现
├── websocket/       # WebSocket SSH 代理
├── grpc/            # gRPC 服务器
├── network/         # 网络工具（WireGuard、mDNS）
├── service/         # 系统服务管理
├── types/           # 核心数据结构
├── main.go          # 入口文件
├── go.mod           # Go 模块定义
└── README.md        # 本文件
```

### 运行测试

```bash
# 运行所有测试
go test ./...

# 运行测试并显示覆盖率
go test -cover ./...

# 运行测试并显示详细输出
go test -v ./...
```

### 构建

```bash
# 为当前平台构建
go build -o shadowd

# 为 Linux 构建
GOOS=linux GOARCH=amd64 go build -o shadowd-linux

# 为 macOS 构建
GOOS=darwin GOARCH=amd64 go build -o shadowd-macos

# 为 Windows 构建
GOOS=windows GOARCH=amd64 go build -o shadowd.exe
```

## 服务说明

Shadowd 提供以下服务：

### SSH 服务器（端口 2222）
- 安全的 Shell 访问
- 密码认证
- 支持交互式会话的 PTY
- 仅接受来自允许网络的连接

### WebSocket SSH 代理（端口 8022）
- WebSocket 到 SSH 协议转换
- 实时双向通信
- 支持密码和私钥认证
- 终端大小调整支持
- 详见 [WEBSOCKET_SSH_GUIDE.md](WEBSOCKET_SSH_GUIDE.md)

### gRPC API（端口 50052）

#### DeviceService

- **GetDeviceInfo**: 返回此设备的信息
- **GeneratePairingCode**: 生成用于与移动应用配对的 QR 码
- **HealthCheck**: 返回守护进程的健康状态

详细的 API 规范请参见设计文档。

## 安全性

- SSH 连接仅使用基于密钥的认证（密码认证已禁用）
- 仅接受来自 Mesh 网络内的连接
- 所有通信使用 WireGuard 加密
- 配置文件应具有受限权限（0600）

## 故障排除

### 守护进程无法启动

1. 检查配置文件是否为有效的 YAML 格式
2. 验证 Headscale URL 是否可访问
3. 检查预认证密钥是否有效
4. 查看日志中的错误消息

### 无法连接到 SSH

1. 验证守护进程是否正在运行
2. 检查设备是否已在 Headscale 中注册（`headscale nodes list`）
3. 验证 Mesh IP 地址是否正确
4. 检查防火墙规则是否允许 SSH 连接

### 无法通过 WebSocket 连接

1. 验证 WebSocket 代理是否在端口 8022 上监听
2. 检查防火墙规则是否允许连接到端口 8022
3. 验证客户端使用的 WebSocket URL 是否正确
4. 查看 shadowd 日志中的 WebSocket 错误

### SSH 认证失败

1. 验证 shadowd.yaml 中的用户名和密码
2. 检查 shadowd 输出中的 SSH 服务器日志
3. 确保 allowed_networks 包含客户端的网络

## 许可证

MIT

## 贡献

欢迎贡献！请查看贡献指南了解详情。
