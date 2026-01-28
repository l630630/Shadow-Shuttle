# Headscale 项目结构

本文档描述 Headscale 部署项目的文件结构和组织方式。

## 目录结构

```
headscale/
├── config/                      # 配置文件目录
│   ├── config.yaml             # 主配置文件（需要配置）
│   └── acl.yaml.example        # ACL 访问控制示例
├── data/                        # 数据目录（自动创建）
│   ├── db.sqlite               # SQLite 数据库
│   ├── private.key             # 服务器私钥
│   └── noise_private.key       # Noise 协议私钥
├── scripts/                     # 管理脚本
│   ├── deploy.sh               # 部署脚本
│   └── manage.sh               # 管理脚本
├── docker-compose.yml           # Docker Compose 配置
├── Makefile                     # Make 命令定义
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件
├── README.md                    # 完整文档
├── QUICKSTART.md                # 快速开始指南
├── TROUBLESHOOTING.md           # 故障排查指南
├── CHANGELOG.md                 # 版本更新日志
└── PROJECT_STRUCTURE.md         # 本文件
```

## 文件说明

### 配置文件

#### `config/config.yaml`
主配置文件，包含所有 Headscale 服务器设置。

**关键配置项**:
- `server_url`: 服务器公网地址（必须配置）
- `ip_prefixes`: Mesh 网络 IP 范围
- `oidc`: OpenID Connect 认证配置
- `dns_config`: DNS 和 MagicDNS 设置
- `derp`: DERP 中继服务器配置

**配置步骤**:
1. 复制示例配置（如果需要）
2. 修改 `server_url` 为实际地址
3. 根据需要配置 OIDC
4. 调整其他可选设置

#### `config/acl.yaml.example`
访问控制列表示例，定义设备间的访问权限。

**使用方法**:
1. 复制为 `acl.yaml`
2. 根据需求修改规则
3. 在 `config.yaml` 中启用: `acl_policy_path: /etc/headscale/acl.yaml`
4. 重启服务使配置生效

### 数据目录

#### `data/`
存储 Headscale 运行时数据，由 Docker 容器自动创建和管理。

**重要文件**:
- `db.sqlite`: 设备注册信息、命名空间、预授权密钥等
- `private.key`: 服务器 TLS 私钥
- `noise_private.key`: Noise 协议加密密钥

**备份建议**:
- 定期备份整个 `data/` 目录
- 使用 `make backup` 命令
- 保存到异地存储

### 脚本文件

#### `scripts/deploy.sh`
自动化部署脚本。

**功能**:
- 检查 Docker 和 Docker Compose 安装
- 验证配置文件存在
- 创建必要目录
- 拉取 Docker 镜像
- 启动服务
- 验证部署状态

**使用**:
```bash
./scripts/deploy.sh
```

#### `scripts/manage.sh`
日常管理脚本。

**功能**:
- 命名空间管理（创建、列表、删除）
- 预授权密钥管理（创建、列表）
- 节点管理（列表、删除、过期）
- 路由管理（列表、启用）
- 服务管理（状态、日志、重启）

**使用示例**:
```bash
./scripts/manage.sh namespace create default
./scripts/manage.sh nodes list
./scripts/manage.sh logs
```

### Docker 配置

#### `docker-compose.yml`
Docker Compose 服务定义。

**配置内容**:
- Headscale 容器定义
- 卷挂载（config、data）
- 端口映射（8080、9090、50443）
- 重启策略（unless-stopped）
- 网络配置

**修改建议**:
- 端口冲突时修改主机端口
- 生产环境添加资源限制
- 配置日志轮转

### 便捷工具

#### `Makefile`
提供便捷的 make 命令。

**常用命令**:
```bash
make help           # 显示帮助
make deploy         # 部署服务
make status         # 查看状态
make logs           # 查看日志
make backup         # 备份数据
make init           # 初始化（创建命名空间和密钥）
```

**优势**:
- 简化命令输入
- 统一操作接口
- 易于记忆

#### `.env.example`
环境变量模板。

**使用方法**:
1. 复制为 `.env`
2. 填写实际值
3. Docker Compose 自动加载

**注意**: `.env` 文件包含敏感信息，已在 `.gitignore` 中排除。

### 文档文件

#### `README.md`
完整的部署和配置文档。

**内容**:
- 系统要求
- 快速开始
- 配置详解
- 管理操作
- 网络配置
- 监控和维护
- 故障排查
- 安全最佳实践
- 高级配置

**适用对象**: 所有用户，从初学者到高级管理员

#### `QUICKSTART.md`
5 分钟快速开始指南。

**内容**:
- 最小化步骤
- 快速部署
- 基本验证
- 常用命令

**适用对象**: 想要快速上手的用户

#### `TROUBLESHOOTING.md`
故障排查指南。

**内容**:
- 常见问题分类
- 诊断步骤
- 解决方案
- 日志分析
- 预防措施

**适用对象**: 遇到问题的用户和管理员

#### `CHANGELOG.md`
版本更新日志。

**内容**:
- 版本历史
- 新增功能
- 修复问题
- 已知问题
- 升级指南

**适用对象**: 需要了解版本变化的用户

#### `PROJECT_STRUCTURE.md`
项目结构说明（本文件）。

**内容**:
- 目录结构
- 文件说明
- 使用指南
- 最佳实践

**适用对象**: 开发者和维护者

### Git 配置

#### `.gitignore`
Git 忽略文件列表。

**忽略内容**:
- `data/`: 运行时数据
- `config/config.yaml`: 可能包含敏感信息
- `config/acl.yaml`: 可能包含敏感信息
- `.env`: 环境变量
- `*.log`: 日志文件
- 备份文件
- 临时文件

**原因**: 保护敏感信息，避免提交大文件

## 工作流程

### 初始部署

1. **准备配置**
   ```bash
   cd headscale
   nano config/config.yaml  # 修改 server_url
   ```

2. **执行部署**
   ```bash
   make deploy
   # 或
   ./scripts/deploy.sh
   ```

3. **初始化**
   ```bash
   make init
   # 或
   ./scripts/manage.sh namespace create default
   ./scripts/manage.sh preauth create default
   ```

4. **验证**
   ```bash
   make status
   make health
   ```

### 日常管理

1. **查看设备**
   ```bash
   make nodes-list
   ```

2. **创建密钥**
   ```bash
   make preauth-create NAMESPACE=default
   ```

3. **查看日志**
   ```bash
   make logs-follow
   ```

4. **重启服务**
   ```bash
   make restart
   ```

### 维护操作

1. **备份**
   ```bash
   make backup
   ```

2. **更新**
   ```bash
   make update
   ```

3. **清理**
   ```bash
   make clean  # 停止并删除容器
   ```

## 最佳实践

### 配置管理

1. **版本控制**
   - 使用 Git 管理配置文件
   - 排除敏感信息（使用 .gitignore）
   - 使用配置模板和环境变量

2. **安全性**
   - 不要提交 `config.yaml` 到公共仓库
   - 使用 `.env` 文件存储敏感信息
   - 定期轮换预授权密钥

3. **文档化**
   - 记录配置变更
   - 更新 CHANGELOG.md
   - 维护部署文档

### 数据管理

1. **备份策略**
   - 每日自动备份
   - 保留多个备份版本
   - 异地存储备份

2. **监控**
   - 监控磁盘使用
   - 监控数据库大小
   - 设置告警阈值

3. **清理**
   - 定期清理过期节点
   - 清理旧的预授权密钥
   - 归档旧日志

### 运维管理

1. **监控**
   - 使用 Prometheus 收集指标
   - 配置 Grafana 仪表板
   - 设置告警规则

2. **日志**
   - 配置日志轮转
   - 集中日志管理
   - 定期审查日志

3. **更新**
   - 订阅安全公告
   - 测试环境先更新
   - 保持定期更新

## 扩展和定制

### 添加新功能

1. 在 `scripts/` 目录添加新脚本
2. 在 `Makefile` 添加新命令
3. 更新相关文档

### 集成其他工具

1. **监控系统**
   - Prometheus + Grafana
   - ELK Stack
   - Datadog

2. **自动化**
   - Ansible playbooks
   - Terraform modules
   - CI/CD 集成

3. **通知**
   - Slack 集成
   - Email 告警
   - PagerDuty

## 贡献指南

### 文件修改

1. 修改相关文件
2. 更新文档
3. 测试变更
4. 更新 CHANGELOG.md

### 提交规范

```
类型(范围): 简短描述

详细描述

相关 Issue: #123
```

**类型**:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

## 许可证

本项目遵循 MIT 许可证。详见 LICENSE 文件。

## 联系方式

- 项目主页: [Shadow Shuttle](https://github.com/your-org/shadow-shuttle)
- 问题反馈: [GitHub Issues](https://github.com/your-org/shadow-shuttle/issues)
- 文档: [在线文档](https://docs.shadow-shuttle.com)

---

最后更新: 2024-01-15
版本: 1.0.0
