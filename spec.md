### **“影梭”项目第一阶段：专家连接核心 - 技术规格说明书 (Specification)**

**版本：** 1.0  
**目标读者：** AI 助手 (VibeCoding)、项目开发团队、技术负责人  
**目标阶段：** 第一阶段 - 基石搭建 (预计 3-4 个月)  
**核心目标：** 交付一个面向技术用户的 MVP，实现在任何网络环境下，通过手机安全、稳定地 SSH 连接到个人电脑。

---

#### **一、目标与范围 (Goal & Scope)**

**1.1 核心用户价值 (Core Value Proposition)**
- **作为技术极客或开发者**，我希望在任何地方（家、公司、咖啡馆），都能像在本地一样，安全、便捷地通过手机终端（SSH）访问和控制我的主力电脑，以执行命令、管理服务或处理紧急任务，而无需关心复杂的网络配置（公网IP、端口转发等）。

**1.2 第一阶段功能范围 (In-Scope for Phase 1)**
1.  **基础设施**：部署并运行私有的 Headscale 协调服务器。
2.  **电脑端**：一个常驻的守护进程，能自动加入私有 Mesh 网络，并暴露 SSH 和基础控制接口。
3.  **手机端 (React Native App)**：
    - **连接**：一键连接/断开至私有 Mesh 网络。
    - **发现**：自动发现并列出已在线的电脑设备。
    - **配对**：通过扫码与电脑设备建立信任关系。
    - **控制**：通过集成的终端界面，SSH 连接到已配对的电脑并执行命令。
4.  **安全**：设备间双向认证，所有通信加密。

**1.3 明确排除范围 (Out-of-Scope)**
- 图形化桌面流传输（屏幕透视）。
- 自然语言或语音控制。
- 自动化技能市场。
- 除 SSH 和基础信息查询外的其他复杂自动化操作。
- 企业级多用户管理面板。

---

#### **二、架构与核心决策 (Architecture & Key Decisions)**

**2.1 技术栈 (Tech Stack)**
| 组件 | 技术选型 | 理由 |
| :--- | :--- | :--- |
| **协调服务器** | Headscale (自建) | 开源、可控，奠定私有化基础，避免供应商锁定。 |
| **覆盖网络** | WireGuard (通过 Tailscale/Headscale 管理) | 现代、高性能、内核级 VPN，建立点对点安全隧道。 |
| **电脑守护进程** | Go | 高效、静态编译、部署简单，与 Headscale 生态契合。 |
| **移动端框架** | React Native (TypeScript) | 支持跨平台快速开发，平衡开发效率与性能需求。 |
| **RN 状态管理** | Zustand | 轻量、简单、高效，足以应对第一阶段的复杂度。 |
| **通信协议** | **SSH (主)** + **gRPC-Web (辅)** | SSH 提供立即可用的强大终端；gRPC-Web 为未来结构化指令预留通道。 |

**2.2 系统架构图 (Phase 1)**
```
[用户手机]
     | (React Native App)
     |-- 连接管理模块 -> Native Module -> Tailscale Mobile SDK -> [WireGuard Mesh Network]
     |-- 设备发现模块 -> 查询 Headscale API
     |-- 终端模拟器模块 -> 建立 SSH over Mesh Network 连接
     |
[WireGuard Mesh Network] (100.x.x.x)
     |
[用户电脑]
     | (Go 守护进程)
     |-- Tailscale Client -> 接入 Mesh Network
     |-- SSH Server (在 Mesh IP 上监听)
     |-- gRPC-Web Server (在本地端口监听，供未来扩展)
     |
[云端服务器]
     | (Docker)
     |-- Headscale 协调服务
```

---

#### **三、模块详细规格 (Module Specifications)**

**3.1 模块 M1：Headscale 协调服务器**
- **输入**：无直接用户输入，由 DevOps 部署。
- **处理**：
    1.  在云服务器（如 Vultr, AWS Lightsail）使用 Docker 部署 Headscale。
    2.  配置 OIDC 提供者（例如，使用 GitHub OAuth App）用于用户注册/登录。
    3.  配置基础的 ACL 策略，允许同一用户下的节点互相通信。
- **输出**：一个可访问的 `headscale.example.com` 服务，提供注册、控制台和管理 API。
- **验收标准 (AC)**：
    - AC1.1：可通过 `headscale nodes list` 命令管理设备。
    - AC1.2：用户可通过 OIDC 登录控制台。

**3.2 模块 M2：电脑守护进程 (`shadowd`)**
- **输入**：系统启动事件、来自 Mesh 网络或本地 gRPC 的请求。
- **处理**：
    1.  **初始化与网络接入**：启动时读取配置文件，调用 Tailscale API 注册到指定的 Headscale 服务器，并以无交互模式（`--authkey`）加入网络。
    2.  **服务暴露**：
        - 启动一个 SSH 服务器，**监听在 Tailscale 获取的 Mesh IP**（如 `100.101.102.103:22`），而非 `0.0.0.0`，以增强安全性。
        - 启动一个 gRPC-Web 服务器，监听 `localhost:8080`，提供 `GetSystemInfo()`, `ExecuteSimpleCommand()` 等基础 RPC。
    3.  **状态维护**：定期向手机端（通过 gRPC）发送心跳或状态更新（可选）。
- **输出**：一个常驻系统服务，提供 SSH 和 gRPC 访问点。
- **接口定义 (gRPC Proto 示例)**:
    ```protobuf
    service ShadowService {
        rpc GetSystemInfo (Empty) returns (SystemInfo) {}
        rpc ExecuteSimpleCommand (SimpleCommandRequest) returns (CommandResponse) {}
    }
    message SystemInfo { string hostname = 1; string os = 2; }
    message SimpleCommandRequest { string command = 1; } // e.g., "lock", "sleep"
    ```
- **验收标准 (AC)**：
    - AC2.1：进程启动后，在 Headscale 控制台可见其在线。
    - AC2.2：能从同一网络下的另一台电脑，通过其 Mesh IP 成功 SSH 登录。
    - AC2.3：能通过 `curl` 本地调用 `localhost:8080` 的 gRPC-Web 接口并获取系统信息。

**3.3 模块 M3：RN - 网络连接与设备发现**
- **屏幕 S1：启动与连接页**
    - **UI/UX**：应用启动后首先进入此页。一个大按钮显示“连接至我的网络”。下方显示连接状态（“未连接”、“正在连接”、“已连接，IP: 100.x.x.x”）。
    - **逻辑**：
        1.  点击按钮触发 `NativeTailscaleModule.connect()`。
        2.  原生模块调用 Tailscale Mobile SDK，引导用户授予 VPN 权限，并使用预设的 `--authkey` 连接至 Headscale 服务器。
        3.  连接成功后，从 SDK 获取本机 Mesh IP 并更新 UI。
- **屏幕 S2：设备列表页**
    - **UI/UX**：一个列表，展示所有在线且已配对的电脑设备（设备名、主机名、最后在线时间）。一个“扫码配对”按钮。
    - **逻辑**：
        1.  进入页面时，调用 JS 层的 `deviceManager.discover()`。
        2.  `deviceManager` 通过已建立的 VPN 通道，向 Headscale 的管理 API (`/api/v1/machine`) 发起认证请求，获取属于该用户的设备列表，并过滤出“在线”状态的电脑设备。
        3.  点击设备项，导航至终端控制页（S3）。
- **交互 I1：扫码配对流程**
    1.  用户在电脑上运行 `shadowd --generate-qr`，终端显示一个二维码（内容为 `shadow://pair?token=<one-time_token>&hostname=<pc_hostname>`）。
    2.  用户在 RN App 点击“扫码配对”，调用 `react-native-camera` 扫描二维码。
    3.  App 解析二维码，提取 `token` 和 `hostname`，然后通过 VPN 向电脑守护进程的 gRPC 接口发送一个配对验证请求（包含 token）。
    4.  电脑守护进程验证 token 有效后，将此手机设备 ID 加入信任列表，并返回成功。
    5.  RN App 将此电脑设备信息持久化存储（AsyncStorage）。
- **验收标准 (AC)**：
    - AC3.1：用户能在 S1 页成功连接和断开 VPN。
    - AC3.2：连接后，在 S2 页能正确显示在线的电脑设备。
    - AC3.3：通过扫码流程，能将一台新电脑添加到信任列表并显示。

**3.4 模块 M4：RN - 专家终端**
- **屏幕 S3：终端控制页**
    - **UI/UX**：顶部栏显示设备名和连接状态。主体是一个全屏的终端模拟器界面（黑底绿字），底部有一个简单的命令行输入框。
    - **逻辑**：
        1.  进入页面时，从路由参数获取目标电脑的 Mesh IP。
        2.  初始化 `react-native-ssh-sftp` 客户端，使用该 IP、默认端口 22 以及预先配置好的 SSH 密钥（在配对流程中交换或生成）建立连接。
        3.  将终端组件与 SSH 客户端的输入输出流绑定。
        4.  用户在输入框输入命令，通过 SSH 通道发送，并将返回的 stdout/stderr 渲染到终端模拟器。
- **验收标准 (AC)**：
    - AC4.1：从 S2 页点击设备后，能成功进入 S3 页并建立 SSH 连接。
    - AC4.2：在输入框执行 `ls -la` 等基础命令，能正确返回结果并显示。
    - AC4.3：能保持 SSH 会话，并处理断线重连（基础）。

---

#### **四、非功能需求 (Non-Functional Requirements)**
- **性能**：从 App 点击连接到 VPN 就绪时间 < 5秒。SSH 命令响应延迟感知上与局域网内 SSH 无异。
- **安全性**：所有 WireGuard 流量端到端加密。SSH 使用密钥认证。Headscale API 调用需使用 API 密钥。RN App 中不硬编码敏感密钥，使用安全存储。
- **兼容性**：电脑守护进程支持 Windows 10/11, macOS 12+, Ubuntu 20.04+。RN App 支持 iOS 15+, Android 10+。
- **可维护性**：代码有清晰的模块划分和注释。关键操作（连接、配对）有日志记录。

---

#### **五、验收与交付 (Acceptance & Delivery)**

**5.1 第一阶段最小可交付产品 (MVP Deliverables)**
1.  **一个可运行的 Headscale 服务器实例**。
2.  **电脑端守护进程 (`shadowd`) 的安装包/脚本**（支持上述三大操作系统）。
3.  **一个可上架 TestFlight/内测分发渠道的 React Native App**，包含上述 S1, S2, S3 三个核心屏幕及完整交互流程。

**5.2 成功指标 (Success Metrics)**
- **核心功能完成度**：100% 完成上述所有 AC。
- **端到端测试**：一名新用户能在 15 分钟内，完成从部署 `shadowd` 到用手机 SSH 操作电脑的全流程。
- **稳定性**：持续连接 24 小时，SSH 会话不异常中断，VPN 连接稳定。

**5.3 向第二阶段的过渡条件**
- 第一阶段所有 AC 通过。
- 核心的 Mesh 网络连接和 SSH 基础功能，在内部测试中表现出足够的稳定性（无致命崩溃，重连逻辑有效）。
- 产品决策者确认“连接”这个核心价值已得到有效验证。

---
**此 Spec 文件旨在为 AI (VibeCoding) 和开发团队提供清晰、无歧义的第一阶段构建蓝图。所有决策均围绕“验证核心连接价值”这一目标，力求精简、可行。**