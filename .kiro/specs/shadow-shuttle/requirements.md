# 需求文档 - 影梭 (Shadow Shuttle)

## 简介

影梭是一个跨平台的远程 SSH 连接系统，使技术用户能够在任何网络环境下通过手机安全、稳定地 SSH 连接到个人电脑。系统基于 Headscale 私有 Mesh 网络，使用 WireGuard 协议建立端到端加密连接，提供专业的终端模拟器体验。

## 术语表

- **System**: 影梭系统整体
- **Headscale_Server**: 基于 Docker 部署的私有 Mesh 网络协调服务器
- **Shadowd**: 运行在用户电脑上的 Go 守护进程
- **Mobile_App**: React Native 开发的移动端应用
- **Mesh_Network**: 基于 WireGuard 的覆盖网络
- **Device**: 加入 Mesh 网络的节点（电脑或手机）
- **SSH_Session**: 手机与电脑之间的 SSH 连接会话
- **OIDC**: OpenID Connect 身份认证协议
- **gRPC_Interface**: Shadowd 提供的 gRPC-Web 接口

## 需求

### 需求 1: Headscale 协调服务器部署

**用户故事:** 作为系统管理员，我希望部署一个私有的 Mesh 网络协调服务器，以便管理所有设备的网络连接和认证。

#### 验收标准

1. WHEN Headscale_Server 通过 Docker 部署完成 THEN THE System SHALL 能够通过 `headscale nodes list` 命令查看和管理已注册设备
2. WHEN 用户访问 Headscale 控制台 THEN THE System SHALL 提供 OIDC 登录功能
3. WHEN 新设备请求加入网络 THEN THE Headscale_Server SHALL 生成唯一的 Mesh IP 地址并分配给该设备
4. WHEN 设备成功注册 THEN THE Headscale_Server SHALL 将设备信息持久化存储
5. THE Headscale_Server SHALL 运行在 Docker 容器中并支持自动重启

### 需求 2: 电脑守护进程 (Shadowd)

**用户故事:** 作为电脑用户，我希望在我的电脑上运行一个守护进程，以便手机能够发现并连接到我的电脑。

#### 验收标准

1. WHEN Shadowd 启动 THEN THE System SHALL 在 Headscale 控制台中显示该设备为在线状态
2. WHEN Shadowd 成功加入 Mesh_Network THEN THE System SHALL 能够通过分配的 Mesh IP 地址接受 SSH 连接
3. WHEN 外部客户端调用 gRPC_Interface THEN THE Shadowd SHALL 通过 gRPC-Web 协议响应请求
4. WHEN Shadowd 启动 THEN THE System SHALL 自动连接到 Headscale_Server 并保持心跳
5. WHEN Shadowd 检测到网络断开 THEN THE System SHALL 自动尝试重新连接
6. THE Shadowd SHALL 提供设备信息查询接口（设备名称、操作系统、IP 地址）
7. THE Shadowd SHALL 在 Windows、macOS 和 Linux 系统上作为系统服务运行

### 需求 3: 移动端网络连接与设备发现

**用户故事:** 作为移动端用户，我希望能够连接到 Mesh 网络并发现我的在线电脑，以便建立 SSH 连接。

#### 验收标准

1. WHEN 用户在 Mobile_App 中点击连接 VPN THEN THE System SHALL 在 5 秒内建立 Mesh_Network 连接
2. WHEN 用户点击断开 VPN THEN THE System SHALL 立即断开 Mesh_Network 连接并清理本地状态
3. WHEN Mobile_App 连接到 Mesh_Network THEN THE System SHALL 显示所有在线的电脑设备列表
4. WHEN 用户扫描电脑上的配对二维码 THEN THE System SHALL 解析二维码中的设备信息并添加到设备列表
5. WHEN 设备列表更新 THEN THE Mobile_App SHALL 实时刷新显示在线状态
6. WHEN VPN 连接失败 THEN THE Mobile_App SHALL 显示具体的错误信息并提供重试选项
7. THE Mobile_App SHALL 持久化保存已配对的设备信息到本地存储

### 需求 4: 移动端专家终端

**用户故事:** 作为移动端用户，我希望通过专业的终端模拟器界面连接到我的电脑，以便执行命令和管理服务。

#### 验收标准

1. WHEN 用户选择一个在线设备并点击连接 THEN THE Mobile_App SHALL 通过 SSH 协议建立到该设备的连接
2. WHEN SSH_Session 建立成功 THEN THE Mobile_App SHALL 显示终端界面并准备接收用户输入
3. WHEN 用户在终端中输入命令并按回车 THEN THE System SHALL 将命令发送到远程电脑并显示执行结果
4. WHEN SSH_Session 意外断开 THEN THE Mobile_App SHALL 检测断线并提供重新连接选项
5. WHEN 用户手动断开 SSH_Session THEN THE System SHALL 清理连接资源并返回设备列表
6. THE Mobile_App SHALL 支持终端基本功能（光标移动、文本选择、复制粘贴）
7. THE Mobile_App SHALL 正确渲染 ANSI 转义序列（颜色、格式）

### 需求 5: 安全性

**用户故事:** 作为系统用户，我希望所有通信都是加密的，以便保护我的数据和隐私。

#### 验收标准

1. THE Mesh_Network SHALL 使用 WireGuard 协议提供端到端加密
2. WHEN SSH_Session 建立 THEN THE System SHALL 使用 SSH 密钥认证而非密码认证
3. THE Shadowd SHALL 仅接受来自 Mesh_Network 内部的连接请求
4. THE Mobile_App SHALL 将 SSH 私钥安全存储在设备的安全存储区域
5. WHEN 用户首次连接到新设备 THEN THE System SHALL 验证设备指纹并要求用户确认

### 需求 6: 跨平台兼容性

**用户故事:** 作为用户，我希望系统能在我的各种设备上运行，以便在不同环境下使用。

#### 验收标准

1. THE Shadowd SHALL 在 Windows 10/11、macOS 12+ 和 Ubuntu 20.04+ 系统上正常运行
2. THE Mobile_App SHALL 在 iOS 15+ 和 Android 10+ 设备上正常运行
3. WHEN Shadowd 在不同操作系统上运行 THEN THE System SHALL 提供一致的功能和接口
4. THE System SHALL 正确处理不同操作系统的路径分隔符和换行符差异

### 需求 7: 性能

**用户故事:** 作为用户，我希望系统响应迅速，以便获得流畅的使用体验。

#### 验收标准

1. WHEN 用户发起 VPN 连接 THEN THE System SHALL 在 5 秒内完成连接
2. WHEN 用户在终端中输入命令 THEN THE System SHALL 在 100 毫秒内将命令发送到远程电脑
3. WHEN 远程电脑返回命令输出 THEN THE Mobile_App SHALL 在 50 毫秒内显示输出内容
4. THE System SHALL 支持至少 10 个并发 SSH 会话而不影响性能

### 需求 8: 可维护性

**用户故事:** 作为开发者，我希望代码结构清晰且有良好的文档，以便后续维护和扩展。

#### 验收标准

1. THE System SHALL 采用清晰的模块划分（M1-M4）
2. WHEN 开发者查看代码 THEN THE System SHALL 提供关键函数和接口的注释说明
3. THE System SHALL 提供详细的部署和配置文档
4. THE System SHALL 使用统一的错误处理和日志记录机制
