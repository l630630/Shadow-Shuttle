# Headscale 故障排查指南

本文档提供常见问题的诊断和解决方案。

## 目录

1. [部署问题](#部署问题)
2. [连接问题](#连接问题)
3. [认证问题](#认证问题)
4. [性能问题](#性能问题)
5. [网络问题](#网络问题)
6. [数据库问题](#数据库问题)

## 部署问题

### 问题: Docker 容器无法启动

**症状:**
```bash
./scripts/deploy.sh
Error: Headscale container failed to start
```

**诊断步骤:**

1. 查看容器日志
```bash
docker-compose logs headscale
```

2. 检查端口占用
```bash
# Linux
sudo netstat -tulpn | grep -E '8080|9090|50443'

# macOS
lsof -i :8080
lsof -i :9090
lsof -i :50443
```

3. 检查配置文件语法
```bash
# 验证 YAML 语法
docker run --rm -v $(pwd)/config:/config alpine/yamllint /config/config.yaml
```

**解决方案:**

- **端口冲突**: 修改 `docker-compose.yml` 中的端口映射
  ```yaml
  ports:
    - "8081:8080"  # 使用不同的主机端口
  ```

- **配置错误**: 检查并修复 `config/config.yaml` 中的语法错误

- **权限问题**: 确保数据目录可写
  ```bash
  chmod -R 755 data/
  ```

### 问题: 配置文件找不到

**症状:**
```
Error: config/config.yaml not found
```

**解决方案:**
```bash
# 确保在正确的目录
cd headscale

# 检查文件是否存在
ls -la config/config.yaml

# 如果不存在，从示例创建
cp config/config.yaml.example config/config.yaml
```

## 连接问题

### 问题: 设备无法连接到 Headscale

**症状:**
- Shadowd 报告连接失败
- 设备未出现在 `nodes list` 中

**诊断步骤:**

1. 验证 Headscale 可访问
```bash
# 从设备测试连接
curl http://YOUR_SERVER:8080/health

# 应该返回: {"status":"ok"}
```

2. 检查防火墙
```bash
# 测试端口是否开放
telnet YOUR_SERVER 8080
telnet YOUR_SERVER 50443
```

3. 检查 server_url 配置
```bash
docker-compose exec headscale headscale config show | grep server_url
```

**解决方案:**

- **防火墙阻止**: 开放必要端口
  ```bash
  # Ubuntu/Debian
  sudo ufw allow 8080/tcp
  sudo ufw allow 50443/tcp
  
  # CentOS/RHEL
  sudo firewall-cmd --permanent --add-port=8080/tcp
  sudo firewall-cmd --permanent --add-port=50443/tcp
  sudo firewall-cmd --reload
  ```

- **server_url 错误**: 更新配置文件
  ```yaml
  server_url: http://YOUR_ACTUAL_IP:8080
  ```
  然后重启: `docker-compose restart`

- **DNS 问题**: 使用 IP 地址而不是域名进行测试

### 问题: 设备注册后立即离线

**症状:**
- 设备成功注册但显示为离线
- `nodes list` 显示 "Last seen" 时间很久以前

**诊断步骤:**

1. 检查设备上的 WireGuard 状态
```bash
# 在设备上
sudo wg show
```

2. 检查 Headscale 日志
```bash
docker-compose logs --tail=100 headscale | grep -i error
```

3. 验证网络连通性
```bash
# 从设备 ping Headscale 服务器
ping YOUR_SERVER
```

**解决方案:**

- **WireGuard 未运行**: 在设备上启动 WireGuard
- **网络不稳定**: 检查网络连接质量
- **心跳超时**: 调整 `node_update_check_interval` 配置

## 认证问题

### 问题: 预授权密钥无效

**症状:**
```
Error: invalid preauth key
```

**诊断步骤:**

1. 检查密钥是否过期
```bash
./scripts/manage.sh preauth list default
```

2. 验证密钥格式
```bash
# 密钥应该是 32 个字符的十六进制字符串
echo "YOUR_KEY" | wc -c
```

**解决方案:**

- **密钥过期**: 创建新的预授权密钥
  ```bash
  ./scripts/manage.sh preauth create default
  ```

- **密钥已使用**: 创建可重用的密钥
  ```bash
  docker-compose exec headscale headscale preauthkeys create \
    --namespace default \
    --expiration 720h \
    --reusable
  ```

### 问题: OIDC 认证失败

**症状:**
- 无法通过 OIDC 登录
- 重定向到错误页面

**诊断步骤:**

1. 检查 OIDC 配置
```bash
docker-compose exec headscale headscale config show | grep -A 10 oidc
```

2. 验证回调 URL
- 应该是: `https://YOUR_DOMAIN/oidc/callback`

3. 检查日志中的 OIDC 错误
```bash
docker-compose logs headscale | grep -i oidc
```

**解决方案:**

- **client_id/secret 错误**: 验证 OIDC 提供商的凭证
- **回调 URL 未注册**: 在 OIDC 提供商添加回调 URL
- **域名不匹配**: 确保 `server_url` 与 OIDC 配置一致

## 性能问题

### 问题: 响应缓慢

**症状:**
- API 请求响应时间长
- 设备列表加载慢
- 节点注册耗时

**诊断步骤:**

1. 检查资源使用
```bash
docker stats headscale
```

2. 检查数据库大小
```bash
ls -lh data/db.sqlite
```

3. 查看活跃连接数
```bash
./scripts/manage.sh nodes list | wc -l
```

**解决方案:**

- **资源不足**: 增加容器资源限制
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

- **数据库过大**: 清理过期节点
  ```bash
  # 删除离线超过 30 天的节点
  ./scripts/manage.sh nodes list | grep "30 days ago" | awk '{print $1}' | xargs -I {} ./scripts/manage.sh nodes delete {}
  ```

- **使用 PostgreSQL**: 对于大规模部署，迁移到 PostgreSQL

### 问题: 内存使用持续增长

**症状:**
- 容器内存使用不断增加
- 最终导致 OOM (Out of Memory)

**诊断步骤:**

1. 监控内存使用
```bash
watch -n 5 'docker stats headscale --no-stream'
```

2. 检查日志大小
```bash
docker-compose logs headscale | wc -l
```

**解决方案:**

- **限制日志大小**: 配置日志轮转
  ```yaml
  # docker-compose.yml
  services:
    headscale:
      logging:
        driver: "json-file"
        options:
          max-size: "10m"
          max-file: "3"
  ```

- **重启服务**: 定期重启以释放内存
  ```bash
  # 添加到 crontab
  0 3 * * * cd /path/to/headscale && docker-compose restart headscale
  ```

## 网络问题

### 问题: 设备之间无法通信

**症状:**
- 设备都在线但无法 ping 通
- SSH 连接失败

**诊断步骤:**

1. 验证 IP 分配
```bash
./scripts/manage.sh nodes list
# 确保每个设备有唯一的 IP
```

2. 检查路由
```bash
./scripts/manage.sh routes list
```

3. 在设备上测试连通性
```bash
# 在设备 A 上
ping 100.64.0.2  # 设备 B 的 IP

# 检查 WireGuard 状态
sudo wg show
```

**解决方案:**

- **路由未启用**: 启用必要的路由
  ```bash
  ./scripts/manage.sh routes enable NODE_ID ROUTE
  ```

- **防火墙阻止**: 检查设备本地防火墙
  ```bash
  # 允许 Mesh 网络流量
  sudo ufw allow from 100.64.0.0/10
  ```

- **WireGuard 配置错误**: 重新注册设备

### 问题: NAT 穿透失败

**症状:**
- 设备通过 DERP 中继通信（延迟高）
- 无法建立直接连接

**诊断步骤:**

1. 检查 DERP 使用情况
```bash
docker-compose logs headscale | grep -i derp
```

2. 测试 UDP 连通性
```bash
# 在设备上测试 UDP
nc -u YOUR_SERVER 3478
```

**解决方案:**

- **启用 UPnP**: 在路由器上启用 UPnP
- **配置端口转发**: 手动配置 WireGuard 端口转发
- **使用自建 DERP**: 部署自己的 DERP 服务器

## 数据库问题

### 问题: 数据库损坏

**症状:**
```
Error: database disk image is malformed
```

**诊断步骤:**

1. 检查数据库完整性
```bash
docker-compose exec headscale sqlite3 /var/lib/headscale/db.sqlite "PRAGMA integrity_check;"
```

**解决方案:**

- **从备份恢复**:
  ```bash
  ./scripts/manage.sh stop
  rm data/db.sqlite
  tar -xzf headscale-backup-YYYYMMDD.tar.gz
  ./scripts/manage.sh start
  ```

- **修复数据库**:
  ```bash
  docker-compose exec headscale sqlite3 /var/lib/headscale/db.sqlite "VACUUM;"
  ```

### 问题: 数据库锁定

**症状:**
```
Error: database is locked
```

**解决方案:**

1. 重启服务
```bash
./scripts/manage.sh restart
```

2. 如果问题持续，检查是否有多个进程访问数据库
```bash
docker-compose ps
# 应该只有一个 headscale 容器运行
```

## 日志分析

### 启用调试日志

编辑 `config/config.yaml`:
```yaml
log:
  level: debug  # 改为 debug
```

重启服务:
```bash
docker-compose restart
```

### 常见错误消息

| 错误消息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `connection refused` | 服务未运行或端口错误 | 检查服务状态和端口配置 |
| `invalid preauth key` | 密钥过期或无效 | 创建新的预授权密钥 |
| `namespace not found` | 命名空间不存在 | 创建命名空间 |
| `database locked` | 并发访问冲突 | 重启服务 |
| `TLS handshake failed` | 证书问题 | 检查 TLS 配置 |

## 获取帮助

如果以上方法都无法解决问题：

1. **收集诊断信息**:
```bash
# 创建诊断报告
cat > diagnostic-report.txt <<EOF
=== System Info ===
$(uname -a)
$(docker --version)
$(docker-compose --version)

=== Container Status ===
$(docker-compose ps)

=== Recent Logs ===
$(docker-compose logs --tail=100 headscale)

=== Configuration ===
$(cat config/config.yaml | grep -v "secret")

=== Nodes ===
$(./scripts/manage.sh nodes list)
EOF
```

2. **查看官方文档**: https://headscale.net/

3. **搜索 GitHub Issues**: https://github.com/juanfont/headscale/issues

4. **提交新 Issue**: 包含诊断报告和详细的问题描述

## 预防措施

### 定期维护

```bash
# 每周备份
0 2 * * 0 cd /path/to/headscale && make backup

# 每月清理过期节点
0 3 1 * * cd /path/to/headscale && ./scripts/cleanup-expired-nodes.sh

# 每天检查健康状态
0 */6 * * * curl -f http://localhost:8080/health || echo "Headscale health check failed" | mail -s "Alert" admin@example.com
```

### 监控建议

1. **设置 Prometheus 监控**
2. **配置告警规则**
3. **监控关键指标**:
   - 在线节点数
   - API 响应时间
   - 数据库大小
   - 内存使用

### 安全检查清单

- [ ] 使用 HTTPS
- [ ] 启用 OIDC 认证
- [ ] 配置防火墙规则
- [ ] 定期更新 Headscale
- [ ] 定期备份数据
- [ ] 审查访问日志
- [ ] 限制管理端口访问
- [ ] 使用强密码/密钥

## 版本兼容性

| Headscale 版本 | 支持的 WireGuard 版本 | 注意事项 |
|---------------|---------------------|---------|
| 0.22.x        | 1.0.x               | 稳定版本 |
| 0.23.x        | 1.0.x               | 最新功能 |

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新和已知问题。
