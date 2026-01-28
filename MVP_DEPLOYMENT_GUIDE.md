# Shadow Shuttle MVP 部署指南

**版本**: 0.1.0 (MVP)  
**日期**: 2026-01-28  
**状态**: 准备部署

## 🎯 MVP 目标

创建一个可演示的最小可行产品，展示 Shadow Shuttle 的核心功能：
1. 私有 Mesh 网络建立
2. 安全 SSH 访问
3. 移动端设备管理
4. 交互式终端

## 📋 前置要求

### 服务器端
- Linux 服务器 (Ubuntu 20.04+ 推荐)
- Docker 和 Docker Compose
- 公网 IP 或域名
- 端口: 8080 (Headscale), 3478 (DERP)

### 客户端设备
- Linux/macOS/Windows 设备
- Go 1.25+ (用于构建 Shadowd)
- 网络连接

### 移动端 (可选)
- iOS 设备 + Xcode (iOS 开发)
- Android 设备 + Android Studio (Android 开发)
- Node.js 18+

## 🚀 快速部署 (30 分钟)

### 步骤 1: 部署 Headscale 服务器 (10 分钟)

```bash
# 1. 克隆项目
git clone <your-repo>
cd shadow-shuttle/headscale

# 2. 配置服务器
# 编辑 config/config.yaml，设置你的域名
vim config/config.yaml
# 修改 server_url 为你的域名或 IP

# 3. 启动 Headscale
./scripts/deploy.sh

# 4. 验证服务
docker compose ps
docker compose logs headscale

# 5. 创建命名空间
./scripts/manage.sh namespace create default
```

### 步骤 2: 部署 Shadowd 守护进程 (10 分钟)

```bash
# 在要被访问的设备上执行

# 1. 构建 Shadowd
cd shadow-shuttle/shadowd
go build -o shadowd .

# 2. 创建配置文件
cp shadowd.yaml.example shadowd.yaml
vim shadowd.yaml
# 修改 headscale.url 为你的 Headscale 服务器地址

# 3. 生成预授权密钥
# 在 Headscale 服务器上执行:
docker compose exec headscale headscale preauthkeys create --namespace default --expiration 24h

# 4. 将预授权密钥填入 shadowd.yaml
vim shadowd.yaml
# 设置 headscale.preauth_key

# 5. 启动 Shadowd (开发模式)
./shadowd -config shadowd.yaml

# 6. (可选) 安装为系统服务
# macOS:
sudo ./scripts/install-macos.sh

# Linux:
sudo ./scripts/install-linux.sh
```

### 步骤 3: 验证连接 (5 分钟)

```bash
# 在 Headscale 服务器上查看节点
docker compose exec headscale headscale nodes list

# 应该看到你的设备已注册
# 记录设备的 Mesh IP (例如: 100.64.0.1)

# 测试 SSH 连接 (从另一台设备)
# 首先需要将公钥添加到 authorized_keys
ssh user@100.64.0.1 -p 22
```

### 步骤 4: 移动端应用 (可选，5 分钟)

```bash
# 1. 安装依赖
cd shadow-shuttle/mobile-app
npm install

# 2. iOS 开发
cd ios && pod install && cd ..
npm run ios

# 3. Android 开发
npm run android

# 4. 测试功能
# - 点击 "Connect VPN" (模拟连接)
# - 点击 "+" 添加设备 (使用测试按钮)
# - 点击设备进入终端
# - 输入命令测试
```

## 🎬 MVP 演示流程

### 场景 1: 基础连接演示 (5 分钟)

1. **展示 Headscale 管理界面**
   ```bash
   docker compose exec headscale headscale nodes list
   ```

2. **展示 Shadowd 运行状态**
   ```bash
   # 查看日志
   tail -f /var/log/shadowd.log
   ```

3. **展示 SSH 连接**
   ```bash
   ssh user@100.64.0.1
   ls
   pwd
   whoami
   ```

### 场景 2: 移动端演示 (5 分钟)

1. **打开移动应用**
   - 展示设备列表界面

2. **连接 VPN**
   - 点击 "Connect VPN" 按钮
   - 展示连接状态变化

3. **添加设备**
   - 点击 "+" 按钮
   - 使用测试按钮添加模拟设备
   - 展示设备卡片

4. **打开终端**
   - 点击设备卡片
   - 展示终端界面
   - 输入命令: `ls`, `pwd`, `echo "Hello Shadow Shuttle"`
   - 展示命令输出

5. **断开连接**
   - 点击 "Disconnect" 按钮
   - 确认对话框
   - 返回设备列表

### 场景 3: 安全特性演示 (3 分钟)

1. **展示密钥认证**
   ```bash
   # 尝试密码登录 (应该失败)
   ssh -o PreferredAuthentications=password user@100.64.0.1
   ```

2. **展示网络隔离**
   ```bash
   # 从外部网络尝试连接 (应该失败)
   ssh user@100.64.0.1 -p 22
   # 只能从 Mesh 网络连接
   ```

3. **展示设备指纹验证**
   - 在移动端首次连接时展示指纹确认对话框

## 📊 MVP 功能清单

### ✅ 已实现功能

#### 核心功能
- [x] Headscale 协调服务器
- [x] WireGuard Mesh 网络 (占位符)
- [x] SSH 服务器 (密钥认证)
- [x] gRPC 设备管理接口
- [x] 移动端 VPN 连接管理
- [x] 移动端设备发现
- [x] 移动端交互式终端
- [x] QR 码配对
- [x] 设备持久化

#### 安全功能
- [x] SSH 密钥认证
- [x] Mesh 网络隔离
- [x] 设备指纹验证
- [x] 配对码时间戳验证
- [x] 安全密钥存储 (准备)

#### 用户体验
- [x] 设备列表界面
- [x] 终端界面
- [x] QR 扫描界面
- [x] 连接状态指示
- [x] 错误提示

### ⚠️ 占位符功能 (需要后续集成)

- [ ] 实际 WireGuard 连接
- [ ] 实际 SSH 连接 (移动端)
- [ ] 实际 gRPC 通信
- [ ] 实际 QR 扫描
- [ ] 平台安全存储

## 🎨 MVP 演示技巧

### 准备工作
1. 提前部署好 Headscale 服务器
2. 在至少一台设备上运行 Shadowd
3. 准备好移动端应用 (模拟器或真机)
4. 准备演示脚本

### 演示要点
1. **强调安全性**
   - 私有网络
   - 密钥认证
   - 网络隔离

2. **强调便捷性**
   - QR 码配对
   - 自动发现
   - 一键连接

3. **强调跨平台**
   - Windows/macOS/Linux 支持
   - iOS/Android 支持

### 常见问题准备
Q: 为什么不能直接连接？  
A: 需要通过 Mesh 网络，更安全。

Q: 如何添加新设备？  
A: 扫描 QR 码即可自动配对。

Q: 性能如何？  
A: 基于 WireGuard，性能接近原生。

## 🐛 已知限制

### 技术限制
1. **WireGuard 占位符**
   - 当前使用模拟实现
   - 需要集成实际库

2. **移动端原生模块**
   - SSH 连接使用模拟
   - QR 扫描使用测试按钮
   - 安全存储使用占位符

3. **性能未优化**
   - 未进行性能测试
   - 未实现输出缓冲优化

### 功能限制
1. **终端功能**
   - 不支持复制粘贴
   - 不支持命令历史
   - 不支持 Tab 补全

2. **设备管理**
   - 不支持设备分组
   - 不支持批量操作
   - 不支持设备搜索

## 🔧 故障排除

### Headscale 无法启动
```bash
# 检查端口占用
sudo lsof -i :8080

# 查看日志
docker compose logs headscale

# 重启服务
docker compose restart
```

### Shadowd 连接失败
```bash
# 检查配置
cat shadowd.yaml

# 检查网络
ping <headscale-server>

# 查看日志
./shadowd -config shadowd.yaml
```

### 移动端无法连接
```bash
# 检查 VPN 状态
# 在应用中查看连接状态

# 检查设备列表
# 确保设备已添加

# 重启应用
```

## 📈 下一步计划

### Phase 1: 原生集成 (2-4 周)
- [ ] 集成 WireGuard 库
- [ ] 集成 SSH 客户端
- [ ] 集成 QR 扫描
- [ ] 集成安全存储

### Phase 2: 功能完善 (4-6 周)
- [ ] 终端功能增强
- [ ] 设备管理优化
- [ ] 性能优化
- [ ] 错误处理完善

### Phase 3: 测试和发布 (4-8 周)
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] Beta 测试
- [ ] 应用商店发布

## 📞 支持

### 文档
- [Headscale README](headscale/README.md)
- [Shadowd README](shadowd/README.md)
- [Mobile App README](mobile-app/README.md)

### 问题反馈
- GitHub Issues
- 技术支持邮箱

## 🎉 MVP 成功标准

MVP 被认为成功如果：
- ✅ Headscale 服务器稳定运行
- ✅ Shadowd 可以注册到 Headscale
- ✅ SSH 连接可以建立
- ✅ 移动端应用可以启动
- ✅ 基本功能可以演示
- ✅ 用户可以理解核心价值

---

**准备好了吗？让我们开始 MVP 部署！** 🚀

按照上述步骤，你可以在 30 分钟内完成 Shadow Shuttle MVP 的部署和演示。
