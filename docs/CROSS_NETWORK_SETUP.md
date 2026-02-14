# 跨网访问部署指南

## 概述

本指南将帮助你配置 Shadow Shuttle 系统，实现手机 App 通过互联网跨网控制电脑。

## 架构说明

```
┌─────────────────┐
│  手机 App       │  4G/5G/WiFi (任何网络)
│  (iOS/Android)  │
└────────┬────────┘
         │ WireGuard VPN
         │ (加密隧道)
         ▼
┌─────────────────┐
│  Headscale      │  公网服务器
│  协调服务器      │  (VPS/云服务器)
└────────┬────────┘
         │ WireGuard VPN
         │ (加密隧道)
         ▼
┌─────────────────┐
│  Shadowd        │  家里/公司的电脑
│  守护进程        │  (任何网络环境)
└─────────────────┘
```

**关键点**：
- 手机和电脑都连接到 Headscale 服务器
- 通过 WireGuard VPN 建立私有 Mesh 网络
- 即使手机和电脑在不同网络，也能直接通信
- 所有流量端到端加密

## 前置条件

### 1. 云服务器（VPS）

你需要一台公网可访问的服务器来运行 Headscale：

**推荐配置**：
- CPU: 1 核心
- 内存: 512 MB
- 存储: 10 GB
- 带宽: 1 Mbps
- 系统: Ubuntu 20.04+ / Debian 11+

**推荐服务商**：
- 阿里云轻量应用服务器（¥24/月起）
- 腾讯云轻量应用服务器（¥25/月起）
- Vultr（$5/月起）
- DigitalOcean（$6/月起）
- Linode（$5/月起）

### 2. 域名（可选但推荐）

- 可以使用免费域名服务（如 Freenom）
- 或购买域名（如阿里云、腾讯云、GoDaddy）
- 将域名解析到你的服务器 IP

### 3. 本地环境

- 电脑已安装 shadowd
- 手机已安装 Shadow Shuttle App

## 部署步骤

### 第一步：部署 Headscale 服务器

#### 1.1 连接到服务器

```bash
ssh root@your-server-ip
```

#### 1.2 安装 Docker 和 Docker Compose

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

#### 1.3 下载项目文件

```bash
# 克隆项目（或手动上传 headscale 目录）
git clone https://github.com/your-repo/Shadow-Shuttle.git
cd Shadow-Shuttle/headscale
```

#### 1.4 配置 Headscale

编辑配置文件：

```bash
nano config/config.yaml
```

**必须修改的配置**：

```yaml
# 使用你的域名或 IP
server_url: https://headscale.yourdomain.com
# 或使用 IP: http://your-server-ip:8080

# 其他配置保持默认即可
listen_addr: 0.0.0.0:8080
grpc_listen_addr: 0.0.0.0:50443

# IP 地址范围
prefixes:
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48

# DNS 配置
dns:
  magic_dns: true
  base_domain: shadowshuttle.local
  nameservers:
    global:
      - 1.1.1.1
      - 8.8.8.8
```

#### 1.5 启动 Headscale

```bash
# 使脚本可执行
chmod +x scripts/deploy.sh scripts/manage.sh

# 部署
./scripts/deploy.sh
```

#### 1.6 初始化配置

```bash
# 创建命名空间
./scripts/manage.sh namespace create default

# 创建预授权密钥（用于设备注册）
./scripts/manage.sh preauth create default
```

**重要**：保存输出的预授权密钥，例如：
```
Key: 1234567890abcdef1234567890abcdef
Expiration: 2024-12-31 23:59:59
Reusable: true
```

#### 1.7 配置防火墙

```bash
# 开放必要端口
ufw allow 8080/tcp    # HTTP API
ufw allow 50443/tcp   # gRPC
ufw allow 22/tcp      # SSH（保持）
ufw enable
```

#### 1.8 配置 HTTPS（推荐）

使用 Caddy 自动配置 HTTPS：

```bash
# 安装 Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# 配置 Caddy
nano /etc/caddy/Caddyfile
```

添加以下内容：

```
headscale.yourdomain.com {
    reverse_proxy localhost:8080
}
```

```bash
# 重启 Caddy
systemctl restart caddy
```

#### 1.9 验证部署

```bash
# 检查服务状态
./scripts/manage.sh status

# 测试 API
curl http://localhost:8080/health

# 查看日志
./scripts/manage.sh logs
```

### 第二步：配置电脑端 (Shadowd)

#### 2.1 编辑 Shadowd 配置

在你的电脑上编辑 `shadowd/shadowd.yaml`：

```yaml
headscale:
  # 使用你的 Headscale 服务器地址
  url: https://headscale.yourdomain.com
  # 或使用 IP: http://your-server-ip:8080
  
  # 使用之前生成的预授权密钥
  preauth_key: 1234567890abcdef1234567890abcdef

ssh:
  port: 2222
  host_key_path: ./ssh_host_key
  allowed_networks:
    - 0.0.0.0/0

websocket:
  listen_addr: 0.0.0.0:8022

grpc:
  listen_addr: 127.0.0.1:50052

device:
  name: "我的电脑"  # 自定义设备名称

users:
  your_username: "your_password"  # SSH 认证
```

#### 2.2 启动 Shadowd

```bash
cd shadowd

# 开发模式
./start-dev.sh

# 或安装为系统服务（推荐）
sudo ./scripts/install-macos.sh    # macOS
sudo ./scripts/install-linux.sh    # Linux
.\scripts\install-windows.ps1      # Windows
```

#### 2.3 验证注册

在 Headscale 服务器上检查设备是否注册成功：

```bash
./scripts/manage.sh nodes list
```

应该看到你的电脑设备，例如：

```
ID | Name      | Namespace | IP addresses  | Last seen
1  | 我的电脑   | default   | 100.64.0.1    | 2024-01-15 10:30:00
```

**记下 Mesh IP 地址**（如 `100.64.0.1`），稍后在手机 App 中使用。

### 第三步：配置手机 App

#### 3.1 安装 App

- Android: 运行 `npm run android`
- iOS: 运行 `npm run ios`

#### 3.2 配置 VPN 连接

在 App 中：

1. 打开 **设置** 或 **Profile** 页面
2. 找到 **VPN 配置** 部分
3. 输入以下信息：

```
Headscale URL: https://headscale.yourdomain.com
预授权密钥: 1234567890abcdef1234567890abcdef
设备名称: 我的手机
```

4. 点击 **连接 VPN**

#### 3.3 添加设备

1. 在 App 中点击 **添加设备** 或 **+** 按钮
2. 输入设备信息：

```
设备名称: 我的电脑
IP 地址: 100.64.0.1  (Mesh IP，不是公网 IP)
SSH 端口: 2222
用户名: your_username
密码: your_password
```

3. 点击 **保存**

#### 3.4 测试连接

1. 在设备列表中选择 **我的电脑**
2. 点击 **连接**
3. 应该能看到终端界面
4. 输入命令测试，例如：`ls`, `pwd`, `whoami`

## 工作原理

### 1. VPN 连接建立

```
手机 App → Headscale → 获取 Mesh IP (100.64.0.2)
电脑 Shadowd → Headscale → 获取 Mesh IP (100.64.0.1)
```

### 2. 设备发现

```
手机 App → 通过 Headscale 发现电脑的 Mesh IP
```

### 3. SSH 连接

```
手机 App (100.64.0.2) → VPN 隧道 → 电脑 Shadowd (100.64.0.1:2222)
```

### 4. 命令执行

```
手机 App → WebSocket (通过 VPN) → Shadowd WebSocket 代理 → SSH Server → Shell
```

## 网络穿透说明

### NAT 穿透

WireGuard 和 Headscale 会自动处理 NAT 穿透：

1. **直连优先**：如果可能，设备会尝试直接连接
2. **DERP 中继**：如果直连失败，使用 DERP 服务器中继
3. **自动切换**：网络变化时自动重新协商最佳路径

### 防火墙配置

**电脑端**：
- 不需要开放任何入站端口
- Shadowd 主动连接到 Headscale
- 所有流量通过 VPN 隧道

**服务器端**：
- 开放 8080 (HTTP API)
- 开放 50443 (gRPC)

## 安全性

### 1. 端到端加密

- 所有流量通过 WireGuard 加密
- 使用现代加密算法（ChaCha20-Poly1305）
- 密钥自动轮换

### 2. 认证机制

- 预授权密钥控制设备注册
- SSH 密钥或密码认证
- 可选：启用 OIDC 单点登录

### 3. 网络隔离

- 私有 Mesh 网络（100.64.0.0/10）
- 不与公网直接通信
- 仅 Mesh 内设备可互访

### 4. 最佳实践

- ✅ 使用 HTTPS（Let's Encrypt）
- ✅ 定期更新预授权密钥
- ✅ 使用强密码或 SSH 密钥
- ✅ 启用防火墙
- ✅ 定期备份配置

## 故障排除

### 问题 1: 手机无法连接 VPN

**检查清单**：
- [ ] Headscale 服务器是否运行
- [ ] 防火墙是否开放端口
- [ ] 预授权密钥是否有效
- [ ] 网络连接是否正常

**测试连接**：
```bash
# 在手机上测试（使用浏览器或 curl）
curl http://your-server-ip:8080/health
```

### 问题 2: 设备无法互相通信

**检查步骤**：

1. 确认设备都已注册：
```bash
# 在服务器上
./scripts/manage.sh nodes list
```

2. 检查 Mesh IP 分配：
```bash
# 应该看到两个设备，各有唯一 IP
ID | Name      | IP addresses
1  | 我的电脑   | 100.64.0.1
2  | 我的手机   | 100.64.0.2
```

3. 测试连通性：
```bash
# 在电脑上 ping 手机的 Mesh IP
ping 100.64.0.2

# 在手机上 ping 电脑的 Mesh IP（需要终端 App）
ping 100.64.0.1
```

### 问题 3: SSH 连接失败

**检查清单**：
- [ ] Shadowd 是否运行
- [ ] SSH 端口配置正确（2222）
- [ ] 用户名和密码正确
- [ ] VPN 连接已建立

**查看日志**：
```bash
# 电脑端
tail -f shadowd.log

# 服务器端
./scripts/manage.sh logs
```

### 问题 4: 连接速度慢

**优化建议**：

1. **选择更近的服务器**：
   - 选择地理位置更近的 VPS
   - 延迟越低越好

2. **使用自建 DERP 服务器**：
   - 在 Headscale 配置中启用自建 DERP
   - 减少中继跳数

3. **检查网络质量**：
   ```bash
   # 测试延迟
   ping your-server-ip
   
   # 测试带宽
   speedtest-cli
   ```

## 成本估算

### 最低成本方案（约 ¥30/月）

- **VPS**: 阿里云轻量服务器 ¥24/月
- **域名**: Freenom 免费域名
- **总计**: ¥24/月

### 推荐方案（约 ¥60/月）

- **VPS**: 腾讯云 2核2G ¥50/月
- **域名**: 阿里云 .com 域名 ¥55/年
- **总计**: ¥55/月

### 企业方案（约 ¥200/月）

- **VPS**: 阿里云 ECS 2核4G ¥150/月
- **域名**: 企业域名 + SSL 证书
- **备份**: 对象存储 ¥20/月
- **监控**: 云监控服务 ¥30/月
- **总计**: ¥200/月

## 性能优化

### 1. 服务器优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化网络参数
cat >> /etc/sysctl.conf <<EOF
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
EOF

sysctl -p
```

### 2. Headscale 优化

```yaml
# config.yaml
node_update_check_interval: 30s  # 增加检查间隔
ephemeral_node_inactivity_timeout: 1h  # 增加超时时间
```

### 3. 使用 CDN（可选）

如果有大量设备，可以使用 CDN 加速 Headscale API 访问。

## 监控和维护

### 1. 设置监控

```bash
# 安装监控工具
apt install prometheus grafana

# 配置 Prometheus 抓取 Headscale 指标
# Headscale 在 9090 端口提供指标
```

### 2. 定期备份

```bash
# 创建备份脚本
cat > /root/backup-headscale.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
cd /root/Shadow-Shuttle/headscale
tar -czf /root/backups/headscale-$DATE.tar.gz data/ config/
# 保留最近 7 天的备份
find /root/backups -name "headscale-*.tar.gz" -mtime +7 -delete
EOF

chmod +x /root/backup-headscale.sh

# 添加到 crontab（每天凌晨 2 点备份）
echo "0 2 * * * /root/backup-headscale.sh" | crontab -
```

### 3. 日志轮转

```bash
# 配置日志轮转
cat > /etc/logrotate.d/headscale <<EOF
/var/log/headscale/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

## 高级配置

### 1. 多用户管理

```bash
# 为不同用户创建命名空间
./scripts/manage.sh namespace create team-a
./scripts/manage.sh namespace create team-b

# 为每个命名空间创建预授权密钥
./scripts/manage.sh preauth create team-a
./scripts/manage.sh preauth create team-b
```

### 2. ACL 访问控制

创建 `config/acl.yaml`：

```yaml
groups:
  group:admins:
    - admin@example.com
  
  group:users:
    - user1@example.com
    - user2@example.com

acls:
  # 管理员可以访问所有设备
  - action: accept
    src:
      - group:admins
    dst:
      - "*:*"
  
  # 普通用户只能访问自己的设备
  - action: accept
    src:
      - group:users
    dst:
      - tag:user:*
```

### 3. 自定义 DERP 服务器

如果需要更好的性能，可以自建 DERP 服务器：

```yaml
# config.yaml
derp:
  server:
    enabled: true
    region_id: 999
    region_code: "custom"
    region_name: "自定义 DERP"
    stun_listen_addr: "0.0.0.0:3478"
```

## 下一步

1. ✅ 完成跨网部署
2. 🔒 配置 HTTPS 和安全策略
3. 📊 设置监控和告警
4. 📱 邀请更多用户使用
5. 🚀 探索高级功能

## 相关文档

- [Headscale 完整文档](../headscale/README.md)
- [Headscale 快速开始](../headscale/QUICKSTART.md)
- [Shadowd 安装指南](../shadowd/INSTALL.md)
- [WebSocket SSH 指南](../shadowd/WEBSOCKET_SSH_GUIDE.md)

## 获取帮助

如遇到问题：
1. 查看本文档的故障排除部分
2. 检查服务日志
3. 访问 [GitHub Issues](https://github.com/your-repo/Shadow-Shuttle/issues)
4. 加入社区讨论

---

**恭喜！** 你现在可以在任何地方使用手机控制你的电脑了！🎉
