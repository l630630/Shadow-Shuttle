# Headscale 协调服务器部署文档

## 概述

Headscale 是影梭 (Shadow Shuttle) 系统的核心协调服务器，负责管理所有设备的注册、认证和 Mesh 网络协调。本文档提供完整的部署、配置和管理指南。

## 系统要求

### 硬件要求
- **CPU**: 1 核心（推荐 2 核心）
- **内存**: 512 MB（推荐 1 GB）
- **存储**: 10 GB 可用空间
- **网络**: 稳定的互联网连接，公网 IP 或域名

### 软件要求
- **操作系统**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+) 或 macOS
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+ 或 docker-compose 1.29+
- **可选**: 反向代理 (Nginx/Caddy) 用于 HTTPS

## 快速开始

### 1. 安装 Docker 和 Docker Compose

**Ubuntu/Debian:**
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install --cask docker
```

### 2. 配置服务器

1. **克隆或下载项目文件**
   ```bash
   cd headscale
   ```

2. **编辑配置文件**
   ```bash
   nano config/config.yaml
   ```

3. **必须修改的配置项**:
   - `server_url`: 替换为你的域名或公网 IP
     ```yaml
     server_url: https://headscale.yourdomain.com
     # 或使用 IP: http://your-public-ip:8080
     ```

4. **可选配置项**:
   - OIDC 认证（生产环境推荐）
   - 自定义 DERP 服务器
   - ACL 访问控制策略

### 3. 部署服务器

```bash
# 使脚本可执行
chmod +x scripts/deploy.sh scripts/manage.sh

# 运行部署脚本
./scripts/deploy.sh
```

部署脚本会自动：
- 检查 Docker 和 Docker Compose 安装
- 创建必要的目录
- 拉取 Headscale 镜像
- 启动服务
- 验证部署状态

### 4. 初始化配置

创建默认命名空间和预授权密钥：

```bash
# 创建命名空间
./scripts/manage.sh namespace create default

# 创建预授权密钥（用于设备注册）
./scripts/manage.sh preauth create default
```

保存生成的预授权密钥，稍后在 Shadowd 配置中使用。

## 配置详解

### 核心配置

#### server_url
服务器的公网访问地址，必须是设备可以访问的 URL。

```yaml
server_url: https://headscale.yourdomain.com
```

**注意事项**:
- 生产环境建议使用 HTTPS
- 如果使用 IP 地址，格式为 `http://1.2.3.4:8080`
- 确保防火墙开放相应端口

#### 监听地址

```yaml
listen_addr: 0.0.0.0:8080        # HTTP API 和 Web UI
metrics_listen_addr: 0.0.0.0:9090 # Prometheus 指标
grpc_listen_addr: 0.0.0.0:50443   # gRPC 接口
```

#### IP 前缀

定义 Mesh 网络的 IP 地址范围：

```yaml
ip_prefixes:
  - 100.64.0.0/10  # CGNAT 地址范围，提供约 400 万个 IP
```

**为什么使用 100.64.0.0/10?**
- RFC 6598 定义的共享地址空间
- 不与常见私有网络冲突
- 足够大的地址空间

#### DNS 配置

```yaml
dns_config:
  nameservers:
    - 1.1.1.1      # Cloudflare DNS
    - 8.8.8.8      # Google DNS
  magic_dns: true
  base_domain: shadowshuttle.local
```

MagicDNS 允许通过设备名称访问，例如 `my-computer.shadowshuttle.local`。

### OIDC 认证配置（可选）

生产环境建议启用 OIDC 进行身份认证：

```yaml
oidc:
  issuer: https://accounts.google.com
  client_id: your-client-id.apps.googleusercontent.com
  client_secret: your-client-secret
  scope:
    - openid
    - profile
    - email
  allowed_domains:
    - yourdomain.com
  strip_email_domain: true
```

**支持的 OIDC 提供商**:
- Google Workspace
- Azure AD / Microsoft Entra ID
- Okta
- Auth0
- Keycloak
- 任何符合 OpenID Connect 标准的提供商

### DERP 服务器配置

DERP (Designated Encrypted Relay for Packets) 用于 NAT 穿透失败时的中继通信。

```yaml
derp:
  server:
    enabled: false  # 使用外部 DERP 服务器
  
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  
  auto_update_enabled: true
  update_frequency: 24h
```

**自建 DERP 服务器**（高级）:
```yaml
derp:
  server:
    enabled: true
    region_id: 999
    region_code: "custom"
    region_name: "Custom DERP"
    stun_listen_addr: "0.0.0.0:3478"
```

## 管理操作

### 使用管理脚本

管理脚本提供便捷的命令行接口：

```bash
# 查看帮助
./scripts/manage.sh

# 命名空间管理
./scripts/manage.sh namespace create myteam
./scripts/manage.sh namespace list
./scripts/manage.sh namespace destroy myteam

# 预授权密钥管理
./scripts/manage.sh preauth create default
./scripts/manage.sh preauth list default

# 节点管理
./scripts/manage.sh nodes list
./scripts/manage.sh nodes delete 1
./scripts/manage.sh nodes expire 1

# 路由管理
./scripts/manage.sh routes list
./scripts/manage.sh routes enable 1 10.0.0.0/24

# 服务管理
./scripts/manage.sh status
./scripts/manage.sh logs
./scripts/manage.sh restart
./scripts/manage.sh stop
./scripts/manage.sh start
```

### 直接使用 Headscale CLI

```bash
# 进入容器
docker-compose exec headscale sh

# 或直接执行命令
docker-compose exec headscale headscale nodes list
```

### 常用命令

#### 查看已注册设备
```bash
./scripts/manage.sh nodes list
```

输出示例：
```
ID | Name          | Namespace | IP addresses      | Last seen
1  | my-computer   | default   | 100.64.0.1        | 2024-01-15 10:30:00
2  | my-phone      | default   | 100.64.0.2        | 2024-01-15 10:29:45
```

#### 创建预授权密钥
```bash
./scripts/manage.sh preauth create default
```

输出示例：
```
Key: 1234567890abcdef1234567890abcdef
Expiration: 2024-01-16 10:30:00
Reusable: true
```

#### 删除设备
```bash
./scripts/manage.sh nodes delete 1
```

#### 查看服务日志
```bash
./scripts/manage.sh logs
```

## 网络配置

### 端口说明

| 端口  | 协议 | 用途                    | 必须开放 |
|-------|------|-------------------------|----------|
| 8080  | TCP  | HTTP API 和 Web UI      | 是       |
| 9090  | TCP  | Prometheus 指标         | 否       |
| 50443 | TCP  | gRPC 接口               | 是       |
| 3478  | UDP  | STUN (如果启用自建DERP) | 可选     |

### 防火墙配置

**Ubuntu (UFW):**
```bash
sudo ufw allow 8080/tcp
sudo ufw allow 50443/tcp
sudo ufw allow 9090/tcp  # 可选，仅监控需要
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=50443/tcp
sudo firewall-cmd --permanent --add-port=9090/tcp
sudo firewall-cmd --reload
```

### HTTPS 配置（推荐）

使用 Caddy 作为反向代理（自动 HTTPS）：

```bash
# 安装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# 配置 Caddy
sudo nano /etc/caddy/Caddyfile
```

Caddyfile 内容：
```
headscale.yourdomain.com {
    reverse_proxy localhost:8080
}
```

```bash
# 重启 Caddy
sudo systemctl restart caddy
```

## 监控和维护

### 健康检查

```bash
# 检查服务状态
./scripts/manage.sh status

# 检查 API 健康
curl http://localhost:8080/health
```

### 日志管理

```bash
# 实时查看日志
./scripts/manage.sh logs

# 查看最近 100 行日志
docker-compose logs --tail=100 headscale

# 导出日志到文件
docker-compose logs headscale > headscale.log
```

### 备份和恢复

#### 备份

```bash
# 停止服务
./scripts/manage.sh stop

# 备份数据目录
tar -czf headscale-backup-$(date +%Y%m%d).tar.gz data/ config/

# 启动服务
./scripts/manage.sh start
```

#### 恢复

```bash
# 停止服务
./scripts/manage.sh stop

# 恢复数据
tar -xzf headscale-backup-20240115.tar.gz

# 启动服务
./scripts/manage.sh start
```

### 更新 Headscale

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

### Prometheus 监控（可选）

Headscale 在 9090 端口提供 Prometheus 指标：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'headscale'
    static_configs:
      - targets: ['localhost:9090']
```

关键指标：
- `headscale_nodes_total`: 注册节点总数
- `headscale_nodes_online`: 在线节点数
- `headscale_api_requests_total`: API 请求总数

## 故障排查

### 服务无法启动

**检查日志**:
```bash
docker-compose logs headscale
```

**常见问题**:
1. **端口被占用**: 修改 `docker-compose.yml` 中的端口映射
2. **配置文件错误**: 验证 YAML 语法
3. **权限问题**: 确保 data 目录可写

### 设备无法注册

**检查清单**:
1. 确认 `server_url` 配置正确
2. 确认防火墙开放端口
3. 确认预授权密钥有效且未过期
4. 检查设备网络连接

**验证连接**:
```bash
# 从设备测试连接
curl http://your-server:8080/health
```

### 设备无法互相通信

**检查步骤**:
1. 确认设备都已注册并在线
   ```bash
   ./scripts/manage.sh nodes list
   ```

2. 检查路由配置
   ```bash
   ./scripts/manage.sh routes list
   ```

3. 验证 IP 地址分配
   - 每个设备应该有唯一的 Mesh IP

4. 测试连通性
   ```bash
   # 在一个设备上 ping 另一个设备的 Mesh IP
   ping 100.64.0.2
   ```

### OIDC 认证失败

**检查清单**:
1. 确认 OIDC 提供商配置正确
2. 验证 client_id 和 client_secret
3. 确认回调 URL 已在 OIDC 提供商注册
4. 检查 allowed_domains 配置

### 性能问题

**优化建议**:
1. 增加容器资源限制
   ```yaml
   # docker-compose.yml
   services:
     headscale:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

2. 使用 PostgreSQL 替代 SQLite（大规模部署）
   ```yaml
   # config.yaml
   db_type: postgres
   db_host: postgres
   db_port: 5432
   db_name: headscale
   db_user: headscale
   db_pass: your-password
   ```

3. 启用数据库连接池
4. 配置适当的 node_update_check_interval

## 安全最佳实践

### 1. 使用 HTTPS
- 生产环境必须使用 HTTPS
- 使用 Let's Encrypt 免费证书
- 配置反向代理（Nginx/Caddy）

### 2. 限制访问
- 使用防火墙限制管理端口访问
- 仅开放必要的端口
- 考虑使用 VPN 访问管理界面

### 3. 启用 OIDC 认证
- 使用企业级身份提供商
- 配置 allowed_domains 限制用户
- 定期审查访问权限

### 4. 定期备份
- 自动化备份脚本
- 异地备份存储
- 定期测试恢复流程

### 5. 监控和审计
- 启用日志记录
- 监控异常活动
- 定期审查注册设备

### 6. 更新和补丁
- 订阅 Headscale 安全公告
- 定期更新到最新版本
- 测试更新后的功能

## 高级配置

### ACL 访问控制

创建 `config/acl.yaml`:

```yaml
# 定义用户组
groups:
  group:admins:
    - user1@example.com
    - user2@example.com
  
  group:developers:
    - dev1@example.com
    - dev2@example.com

# 定义访问规则
acls:
  # 管理员可以访问所有设备
  - action: accept
    src:
      - group:admins
    dst:
      - "*:*"
  
  # 开发者只能访问开发环境
  - action: accept
    src:
      - group:developers
    dst:
      - tag:dev:*
  
  # 拒绝其他所有访问
  - action: deny
    src:
      - "*"
    dst:
      - "*:*"
```

在 `config.yaml` 中启用：
```yaml
acl_policy_path: /etc/headscale/acl.yaml
```

### 自定义 DNS

```yaml
dns_config:
  nameservers:
    - 1.1.1.1
  
  # 覆盖特定域名的 DNS
  restricted_nameservers:
    example.com:
      - 10.0.0.1
  
  # 通过 Headscale 路由的域名
  domains:
    - internal.company.com
  
  magic_dns: true
  base_domain: shadowshuttle.local
```

### 多命名空间管理

```bash
# 为不同团队创建命名空间
./scripts/manage.sh namespace create team-a
./scripts/manage.sh namespace create team-b

# 为每个命名空间创建预授权密钥
./scripts/manage.sh preauth create team-a
./scripts/manage.sh preauth create team-b
```

## 参考资料

- [Headscale 官方文档](https://headscale.net/)
- [Headscale GitHub](https://github.com/juanfont/headscale)
- [WireGuard 协议](https://www.wireguard.com/)
- [Tailscale 文档](https://tailscale.com/kb/)

## 支持

如遇到问题，请：
1. 查看本文档的故障排查部分
2. 检查 Headscale 日志
3. 访问 Headscale GitHub Issues
4. 联系系统管理员

## 版本历史

- **v1.0.0** (2024-01-15): 初始版本
  - Docker Compose 部署配置
  - 基础管理脚本
  - 完整文档

## 许可证

本项目遵循 MIT 许可证。
