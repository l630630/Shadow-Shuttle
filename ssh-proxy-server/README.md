# SSH Proxy Server

WebSocket SSH 代理服务器，为 Shadow Shuttle 移动应用提供 SSH 连接功能。

## 功能特性

- ✅ WebSocket 到 SSH 的协议转换
- ✅ 支持密码和密钥认证
- ✅ 实时命令执行和输出
- ✅ 终端大小调整支持
- ✅ 多客户端连接支持
- ✅ 完整的错误处理

## 快速开始

### 方式一：使用启动脚本（推荐）

**macOS/Linux:**
```bash
cd ssh-proxy-server
./start.sh
```

**Windows:**
```cmd
cd ssh-proxy-server
start.bat
```

### 方式二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start

# 或使用开发模式（自动重启）
npm run dev
```

## 服务器配置

### 默认配置
- **端口**: 8022
- **协议**: WebSocket (ws://)

### 连接地址

根据你的运行环境，使用不同的地址：

| 环境 | 地址 | 说明 |
|------|------|------|
| Android 模拟器 | `ws://10.0.2.2:8022` | 模拟器访问宿主机 |
| iOS 模拟器 | `ws://localhost:8022` | 直接访问本地 |
| 真实设备 | `ws://192.168.x.x:8022` | 使用电脑 IP |

### 查找电脑 IP 地址

**macOS:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```cmd
ipconfig
# 查找 IPv4 地址
```

## 移动应用配置

在 `mobile-app/src/services/sshService.ts` 中配置 WebSocket 地址：

```typescript
// Android 模拟器
private proxyServerUrl = 'ws://10.0.2.2:8022';

// iOS 模拟器
private proxyServerUrl = 'ws://localhost:8022';

// 真实设备（替换为你的 IP）
private proxyServerUrl = 'ws://192.168.1.100:8022';
```

确保启用真实 SSH：
```typescript
private useRealSSH = true;
```

## 工作原理

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │         │              │         │             │
│  Mobile App │◄───────►│ Proxy Server │◄───────►│ SSH Server  │
│             │         │              │         │             │
│  WebSocket  │         │  WebSocket   │         │    SSH      │
│             │         │  ↕ SSH2      │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

## 测试连接

### 使用 wscat 测试

```bash
# 安装 wscat
npm install -g wscat

# 连接到服务器
wscat -c ws://localhost:8022

# 发送连接请求
{"type":"connect","host":"localhost","port":22,"username":"your_user","password":"your_password"}
```

## 故障排除

### 问题：服务器无法启动

**检查端口占用：**
```bash
# macOS/Linux
lsof -i :8022

# Windows
netstat -ano | findstr :8022
```

### 问题：移动应用连接失败

**检查清单：**
- [ ] 服务器正在运行
- [ ] WebSocket 地址配置正确
- [ ] 防火墙未阻止端口 8022
- [ ] 设备和电脑在同一网络（真实设备）

## 依赖项

- **ws** (^8.16.0) - WebSocket 服务器
- **ssh2** (^1.15.0) - SSH2 客户端
- **nodemon** (^3.0.3) - 开发模式自动重启

## 许可证

MIT
