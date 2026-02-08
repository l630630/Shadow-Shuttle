# Shadow Shuttle 客户使用指南

## 📱 客户端安装

### iOS 用户
1. 在 App Store 搜索 "Shadow Shuttle" 或 "影梭"
2. 点击下载并安装
3. 打开应用，注册账号

### Android 用户
1. 在 Google Play 搜索 "Shadow Shuttle" 或 "影梭"
2. 点击安装
3. 打开应用，注册账号

---

## 🖥️ 服务端安装（客户需要在自己的服务器上安装）

### 一键安装脚本

#### Linux / macOS
```bash
curl -fsSL https://shadowshuttle.io/install.sh | bash
```

#### Windows (PowerShell 管理员模式)
```powershell
irm https://shadowshuttle.io/install.ps1 | iex
```

### 手动安装

#### 1. 下载 shadowd 守护进程

**Linux (x64)**
```bash
wget https://github.com/your-org/shadow-shuttle/releases/latest/download/shadowd-linux-amd64
chmod +x shadowd-linux-amd64
sudo mv shadowd-linux-amd64 /usr/local/bin/shadowd
```

**macOS (Intel)**
```bash
curl -L https://github.com/your-org/shadow-shuttle/releases/latest/download/shadowd-darwin-amd64 -o shadowd
chmod +x shadowd
sudo mv shadowd /usr/local/bin/shadowd
```

**macOS (Apple Silicon)**
```bash
curl -L https://github.com/your-org/shadow-shuttle/releases/latest/download/shadowd-darwin-arm64 -o shadowd
chmod +x shadowd
sudo mv shadowd /usr/local/bin/shadowd
```

**Windows**
```powershell
# 下载到 C:\Program Files\ShadowShuttle\
Invoke-WebRequest -Uri "https://github.com/your-org/shadow-shuttle/releases/latest/download/shadowd-windows-amd64.exe" -OutFile "C:\Program Files\ShadowShuttle\shadowd.exe"
```

#### 2. 配置 shadowd

```bash
# 创建配置文件
sudo shadowd init

# 编辑配置（可选）
sudo nano /etc/shadowd/config.yaml
```

#### 3. 安装为系统服务

**Linux (systemd)**
```bash
sudo shadowd install
sudo systemctl enable shadowd
sudo systemctl start shadowd
```

**macOS (launchd)**
```bash
sudo shadowd install
sudo launchctl load /Library/LaunchDaemons/io.shadowshuttle.shadowd.plist
```

**Windows (Service)**
```powershell
shadowd.exe install
Start-Service shadowd
```

#### 4. 验证安装

```bash
# 检查服务状态
sudo shadowd status

# 查看日志
sudo shadowd logs
```

---

## 🔗 连接设备

### 方式 1: 扫描二维码（推荐）

1. 在服务器上生成配对二维码：
   ```bash
   shadowd generate-qr
   ```

2. 在手机 App 中：
   - 点击右上角 "+" 按钮
   - 选择 "扫描二维码"
   - 扫描服务器显示的二维码
   - 设备自动添加并连接

### 方式 2: 手动输入

1. 在服务器上获取配对信息：
   ```bash
   shadowd get-pairing-info
   ```

2. 在手机 App 中：
   - 点击 "+" → "手动添加"
   - 输入设备名称、IP 地址、端口
   - 点击 "连接"

---

## 🎯 开始使用

### 1. 连接 VPN
- 打开 App
- 点击 "Connect VPN" 按钮
- 等待连接成功（3-4 秒）

### 2. 管理设备
- 查看所有已添加的设备
- 点击设备查看详情
- 长按删除设备

### 3. AI 智能控制
- 选择设备后点击 "AI Chat"
- 用自然语言描述需求，例如：
  - "查看磁盘使用情况"
  - "重启 nginx 服务"
  - "查找最大的 10 个文件"
- AI 自动生成命令并执行

### 4. SSH 终端
- 选择设备后点击 "Terminal"
- 直接输入 Shell 命令
- 支持完整的终端功能

---

## 🔒 安全最佳实践

### 服务器端
1. **使用 SSH 密钥认证**（禁用密码登录）
   ```bash
   shadowd keygen
   ```

2. **配置防火墙**
   ```bash
   # 只允许 Mesh 网络访问
   sudo ufw allow from 100.64.0.0/10 to any port 22
   sudo ufw enable
   ```

3. **定期更新**
   ```bash
   sudo shadowd update
   ```

### 客户端
1. 启用生物识别认证（指纹/Face ID）
2. 设置 API 密钥（用于 AI 功能）
3. 定期检查设备列表，删除不用的设备

---

## 💰 定价方案

### 免费版
- ✅ 最多 3 台设备
- ✅ 基础 SSH 终端
- ✅ 每月 100 次 AI 命令

### 专业版 ($9.99/月)
- ✅ 无限设备
- ✅ 完整 AI 功能
- ✅ 语音输入
- ✅ 命令历史和收藏
- ✅ 优先支持

### 企业版 (联系销售)
- ✅ 专业版所有功能
- ✅ 多用户管理
- ✅ 审计日志
- ✅ SSO 集成
- ✅ 专属支持

---

## 🆘 故障排除

### 无法连接 VPN
1. 检查网络连接
2. 确认 Headscale 服务器状态
3. 重新生成配对码

### 设备无法添加
1. 确认 shadowd 服务正在运行：`sudo shadowd status`
2. 检查防火墙设置
3. 验证配对码是否过期（5 分钟有效期）

### AI 功能不可用
1. 检查 API 密钥是否配置
2. 验证网络连接
3. 查看余额是否充足

### 命令执行失败
1. 检查 SSH 连接状态
2. 验证用户权限
3. 查看命令历史中的错误信息

---

## 📞 技术支持

- **文档**: https://docs.shadowshuttle.io
- **社区**: https://community.shadowshuttle.io
- **邮箱**: support@shadowshuttle.io
- **工单**: https://support.shadowshuttle.io

---

## 🔄 更新日志

### v0.2.0 (当前版本)
- ✅ AI 智能助手
- ✅ 语音输入
- ✅ 隐私保护
- ✅ 命令历史

### 即将推出
- 🚧 文件传输 (SFTP)
- 🚧 多用户管理
- 🚧 审计日志导出

---

**影梭 - 让远程服务器管理更安全、更智能、更简单**
