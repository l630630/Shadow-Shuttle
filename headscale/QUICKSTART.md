# Headscale 快速开始指南

## 5 分钟快速部署

### 前置条件
- 一台 Linux 服务器（Ubuntu/Debian/CentOS）或 macOS
- 已安装 Docker 和 Docker Compose
- 公网 IP 或域名（可选，本地测试不需要）

### 步骤 1: 准备配置文件

```bash
cd headscale
```

编辑 `config/config.yaml`，修改 `server_url`:

```yaml
# 如果有域名
server_url: https://headscale.yourdomain.com

# 或使用公网 IP
server_url: http://YOUR_PUBLIC_IP:8080

# 本地测试
server_url: http://localhost:8080
```

### 步骤 2: 部署服务

```bash
# 使脚本可执行
chmod +x scripts/deploy.sh scripts/manage.sh

# 运行部署
./scripts/deploy.sh
```

### 步骤 3: 初始化

```bash
# 创建默认命名空间
./scripts/manage.sh namespace create default

# 创建预授权密钥
./scripts/manage.sh preauth create default
```

**保存输出的预授权密钥！** 例如：
```
Key: 1234567890abcdef1234567890abcdef
```

### 步骤 4: 验证部署

```bash
# 检查服务状态
./scripts/manage.sh status

# 查看日志
./scripts/manage.sh logs

# 测试 API
curl http://localhost:8080/health
```

### 步骤 5: 配置设备

现在可以使用预授权密钥在 Shadowd 守护进程中配置设备连接。

在 Shadowd 的配置文件中：
```yaml
headscale:
  url: http://YOUR_SERVER:8080
  preauth_key: 1234567890abcdef1234567890abcdef
```

## 常用命令

```bash
# 查看已注册设备
./scripts/manage.sh nodes list

# 创建新的预授权密钥
./scripts/manage.sh preauth create default

# 查看日志
./scripts/manage.sh logs

# 重启服务
./scripts/manage.sh restart

# 停止服务
./scripts/manage.sh stop

# 启动服务
./scripts/manage.sh start
```

## 下一步

- 阅读完整的 [README.md](README.md) 了解详细配置
- 配置 HTTPS（生产环境推荐）
- 启用 OIDC 认证
- 设置监控和备份

## 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs headscale

# 检查配置文件
cat config/config.yaml
```

### 端口被占用
修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8081:8080"  # 改为其他端口
```

### 设备无法连接
1. 确认防火墙开放端口 8080 和 50443
2. 确认 server_url 配置正确
3. 确认预授权密钥有效

## 获取帮助

- 查看 [README.md](README.md) 完整文档
- 检查 [Headscale 官方文档](https://headscale.net/)
- 查看服务日志: `./scripts/manage.sh logs`
