export type Lang = 'zh' | 'en';

export const content = {
  zh: {
    nav: {
      docs: '文档',
      github: 'GitHub',
      getStarted: '开始使用',
    },
    hero: {
      badge: 'v0.2.0 基于 Mesh 的远程 SSH 方案',
      title: '随时随地',
      titleHighlight: '安全访问你的服务器',
      desc: 'Shadow Shuttle（影梭）是一个基于私有 Mesh 网络的安全 SSH 访问系统。通过手机即可安全访问远程服务器，无需公网 IP，支持局域网和跨网部署。',
      cta: '立即开始',
      viewCode: 'Get Started',
    },
    features: [
      {
        icon: 'smartphone',
        title: '移动优先设计',
        desc: '专为移动端打造的直观界面，支持 iOS 和 Android。完整的 SSH 终端体验，命令历史记录，设备管理一应俱全。',
      },
      {
        icon: 'hub',
        title: 'Mesh 网格网络',
        desc: '基于 WireGuard 的私有 Mesh 网络，无需公网 IP 或端口转发。通过 Headscale 协调，实现点对点安全连接。',
      },
      {
        icon: 'shield_lock',
        title: '企业级安全',
        desc: 'SSH 密钥认证、端到端加密、设备指纹验证、零信任网络架构。支持 QR 码快速配对和手动添加设备。',
      },
      {
        icon: 'speed',
        title: '快速部署',
        desc: '5 分钟即可完成部署。提供一键安装脚本，支持 systemd/launchd 服务管理，开箱即用。',
      },
      {
        icon: 'devices',
        title: '跨平台支持',
        desc: '服务端支持 Linux、macOS、Windows。客户端支持 iOS、Android。一套系统，全平台覆盖。',
      },
      {
        icon: 'psychology',
        title: 'AI 智能助手',
        desc: '内置自然语言控制，支持语音输入。通过 AI 将自然语言转换为命令，让服务器管理更智能。',
      },
    ],
    quickStart: {
      title: '快速开始',
      desc: '三步即可开始使用 Shadow Shuttle，无需复杂配置。',
      check1: '开源免费 · MIT 协议',
      check2: '全平台支持 · 5 分钟部署',
      code: `# 1. 克隆项目
git clone https://github.com/l630630/Shadow-Shuttle.git
cd Shadow-Shuttle

# 2. 启动服务端
cd shadowd
make build
./shadowd -config shadowd.yaml

# 3. 运行移动应用
cd ../mobile-app
npm install
npm run ios   # 或 npm run android`,
    },
    useCases: {
      title: '使用场景',
      items: [
        {
          icon: 'home',
          title: '家庭服务器管理',
          desc: '随时随地管理家中的 NAS、树莓派等设备，无需配置路由器端口转发。',
        },
        {
          icon: 'business',
          title: '企业运维',
          desc: '安全访问公司服务器，支持多设备管理，完整的操作审计日志。',
        },
        {
          icon: 'cloud',
          title: '云服务器运维',
          desc: '通过手机快速处理服务器告警，执行紧急运维操作。',
        },
        {
          icon: 'developer_mode',
          title: '开发调试',
          desc: '移动端访问开发环境，查看日志，重启服务，随时随地解决问题。',
        },
      ],
    },
    docs: {
      title: '完整文档',
      intro: {
        title: '项目简介',
        body: 'Shadow Shuttle（影梭）是一个现代化的远程 SSH 访问解决方案，专为移动时代设计。\n\n核心优势：\n• 安全第一：基于 WireGuard 和 SSH 的双重加密\n• 移动优先：原生 iOS/Android 应用，流畅体验\n• 简单易用：QR 码配对，一键连接\n• 零配置：无需公网 IP 或端口转发\n• 跨平台：支持所有主流操作系统',
      },
      localSetup: {
        title: '本地部署（同一局域网）',
        steps: '适用场景：在家庭或办公室局域网内使用\n\n步骤：\n1. 在服务器上启动 Shadowd 守护进程\n2. 确保手机和服务器在同一网络\n3. 在移动应用中添加设备（自动发现或手动输入）\n4. 连接并开始使用 SSH 终端\n\n详细说明请查看：QUICK_START.md',
      },
      remoteSetup: {
        title: '跨网部署（互联网访问）',
        steps: '适用场景：从任何地方访问家中或公司的服务器\n\n步骤：\n1. 部署 Headscale 协调服务器（需要公网 IP）\n2. 在服务器上配置 Shadowd 连接到 Headscale\n3. 在移动应用中配置 VPN 连接\n4. 通过 Mesh 网络安全访问服务器\n\n详细说明请查看：CROSS_NETWORK_SETUP.md',
      },
      features: {
        title: '核心功能',
        list: '• SSH 终端：完整的终端模拟，支持颜色和特殊字符\n• 设备管理：支持多设备，快速切换\n• 命令历史：记录所有执行的命令，支持收藏\n• QR 码配对：扫码即可添加设备，无需手动输入\n• 指纹验证：生物识别保护敏感操作\n• AI 助手：自然语言转命令，语音输入支持\n• 离线模式：本地缓存，网络恢复后自动同步',
      },
      security: {
        title: '安全特性',
        list: '• WireGuard VPN：现代化的 VPN 协议，性能优异\n• SSH 密钥认证：支持 RSA/ED25519 密钥\n• 端到端加密：所有通信都经过加密\n• 设备指纹：防止中间人攻击\n• 零信任架构：默认拒绝，显式授权\n• 审计日志：完整的操作记录',
      },
      arch: {
        title: '系统架构',
        body: '架构组成：\n\n移动应用 (React Native)\n  ↓ WebSocket (8022)\nShadowd 守护进程\n  ├─ SSH 服务器 (2222)\n  ├─ gRPC 服务 (50052)\n  ├─ HTTP API (8080)\n  └─ mDNS 设备发现\n  ↓ WireGuard\nHeadscale 协调服务器\n\n技术栈：\n• 后端：Go + WireGuard + SSH\n• 前端：React Native + TypeScript\n• 协调：Headscale (Tailscale 开源实现)',
      },
    },
    footer: {
      docs: '文档',
      github: 'GitHub',
      feedback: '反馈',
      copy: '© 2025 Shadow Shuttle (影梭). All rights reserved.',
      tech: 'Built with Go + React Native · Powered by WireGuard & Headscale',
    },
  },
  en: {
    nav: {
      docs: 'Documentation',
      github: 'GitHub',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'v0.2.0 Mesh-Based Remote SSH Solution',
      title: 'Securely Access',
      titleHighlight: 'Your Servers Anywhere',
      desc: 'Shadow Shuttle is a secure SSH access system built on a private Mesh network. Access remote servers from your mobile device without requiring a public IP address, supporting both LAN and cross-network deployments.',
      cta: 'Get Started',
      viewCode: 'View Documentation',
    },
    features: [
      {
        icon: 'smartphone',
        title: 'Mobile-First Design',
        desc: 'Intuitive interface crafted for mobile devices. Complete SSH terminal experience with command history and device management on iOS and Android.',
      },
      {
        icon: 'hub',
        title: 'Mesh Network',
        desc: 'Private mesh network powered by WireGuard. No public IP or port forwarding required. Peer-to-peer secure connections coordinated via Headscale.',
      },
      {
        icon: 'shield_lock',
        title: 'Enterprise-Grade Security',
        desc: 'SSH key authentication, end-to-end encryption, device fingerprinting, and zero-trust architecture. Supports QR code pairing and manual device addition.',
      },
      {
        icon: 'speed',
        title: 'Rapid Deployment',
        desc: 'Deploy in 5 minutes. One-click installation scripts with systemd/launchd service management. Ready to use out of the box.',
      },
      {
        icon: 'devices',
        title: 'Cross-Platform Support',
        desc: 'Server: Linux, macOS, Windows. Client: iOS, Android. One unified system across all platforms.',
      },
      {
        icon: 'psychology',
        title: 'AI-Powered Assistant',
        desc: 'Built-in natural language control with voice input support. AI converts natural language to commands for intelligent server management.',
      },
    ],
    quickStart: {
      title: 'Quick Start',
      desc: 'Get started with Shadow Shuttle in three simple steps. No complex configuration required.',
      check1: 'Open Source · MIT License',
      check2: 'Cross-Platform · 5-Minute Setup',
      code: `# 1. Clone the repository
git clone https://github.com/l630630/Shadow-Shuttle.git
cd Shadow-Shuttle

# 2. Start the server daemon
cd shadowd
make build
./shadowd -config shadowd.yaml

# 3. Run the mobile application
cd ../mobile-app
npm install
npm run ios   # or npm run android`,
    },
    useCases: {
      title: 'Use Cases',
      items: [
        {
          icon: 'home',
          title: 'Home Server Management',
          desc: 'Manage your NAS, Raspberry Pi, and other home devices from anywhere without configuring router port forwarding.',
        },
        {
          icon: 'business',
          title: 'Enterprise Operations',
          desc: 'Securely access company servers with multi-device support and comprehensive operation audit logs.',
        },
        {
          icon: 'cloud',
          title: 'Cloud Server Operations',
          desc: 'Quickly respond to server alerts and perform emergency operations directly from your mobile device.',
        },
        {
          icon: 'developer_mode',
          title: 'Development & Debugging',
          desc: 'Access development environments from mobile, check logs, restart services, and troubleshoot issues on the go.',
        },
      ],
    },
    docs: {
      title: 'Complete Documentation',
      intro: {
        title: 'Introduction',
        body: 'Shadow Shuttle is a modern remote SSH access solution designed for the mobile era.\n\nCore Advantages:\n• Security First: Dual encryption with WireGuard and SSH\n• Mobile First: Native iOS/Android applications with seamless experience\n• Easy to Use: QR code pairing with one-click connection\n• Zero Configuration: No public IP or port forwarding required\n• Cross-Platform: Supports all major operating systems',
      },
      localSetup: {
        title: 'Local Deployment (Same LAN)',
        steps: 'Use Case: Usage within home or office local area network\n\nSteps:\n1. Start the Shadowd daemon on your server\n2. Ensure your mobile device and server are on the same network\n3. Add device in the mobile app (auto-discovery or manual entry)\n4. Connect and start using the SSH terminal\n\nFor detailed instructions, see: QUICK_START.md',
      },
      remoteSetup: {
        title: 'Cross-Network Deployment (Internet Access)',
        steps: 'Use Case: Access home or office servers from anywhere\n\nSteps:\n1. Deploy Headscale coordination server (requires public IP)\n2. Configure Shadowd to connect to Headscale\n3. Configure VPN connection in the mobile app\n4. Securely access servers via the Mesh network\n\nFor detailed instructions, see: CROSS_NETWORK_SETUP.md',
      },
      features: {
        title: 'Core Features',
        list: '• SSH Terminal: Full terminal emulation with color and special character support\n• Device Management: Multi-device support with quick switching\n• Command History: Records all executed commands with favorites support\n• QR Code Pairing: Scan to add devices without manual input\n• Fingerprint Authentication: Biometric protection for sensitive operations\n• AI Assistant: Natural language to command conversion with voice input\n• Offline Mode: Local caching with automatic sync when network recovers',
      },
      security: {
        title: 'Security Features',
        list: '• WireGuard VPN: Modern VPN protocol with excellent performance\n• SSH Key Authentication: RSA/ED25519 key support\n• End-to-End Encryption: All communications are encrypted\n• Device Fingerprinting: Prevents man-in-the-middle attacks\n• Zero-Trust Architecture: Deny by default with explicit authorization\n• Audit Logs: Complete operation records',
      },
      arch: {
        title: 'System Architecture',
        body: 'Architecture Components:\n\nMobile App (React Native)\n  ↓ WebSocket (8022)\nShadowd Daemon\n  ├─ SSH Server (2222)\n  ├─ gRPC Service (50052)\n  ├─ HTTP API (8080)\n  └─ mDNS Discovery\n  ↓ WireGuard\nHeadscale Coordinator\n\nTechnology Stack:\n• Backend: Go + WireGuard + SSH\n• Frontend: React Native + TypeScript\n• Coordination: Headscale (Open-source Tailscale implementation)',
      },
    },
    footer: {
      docs: 'Documentation',
      github: 'GitHub',
      feedback: 'Feedback',
      copy: '© 2025 Shadow Shuttle. All rights reserved.',
      tech: 'Built with Go + React Native · Powered by WireGuard & Headscale',
    },
  },
} as const;
