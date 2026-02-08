# 架构决策：完全使用 Shadowd 的好处

## 当前架构简述

| 组件 | 作用 | 运行位置 |
|------|------|----------|
| **shadowd** | Mesh 入网(Headscale/WireGuard)、SSH 服务、gRPC(设备信息/配对/健康) | 用户电脑，系统服务 |
| **desktop-gateway** | HTTP 工具接口(wechat.send630, files.read, apps.open 等) | 用户电脑，需手动 `node gateway.js` |
| **ssh-proxy-server** | WebSocket 代理，手机 → 代理 → 设备 SSH | 通常与设备同机或可访问设备 Mesh IP 的机器 |
| **手机 App** | 通过 Mesh IP 连 SSH；通过 10.0.2.2:18800 或本机 IP 调 desktop-gateway | 手机 |

目前「桌面工具」能力在 **desktop-gateway**，和 **shadowd** 是两套进程、两套入口。

---

## 完全使用 Shadowd 的含义

把「桌面工具」能力（执行 wechat.send630、files.read、apps.open、notify.send 等）**收拢进 shadowd**，由 shadowd 统一对外提供：

- Mesh + SSH + 设备信息/配对/健康（现有）
- **工具执行 API**（新增，如 gRPC `ExecuteTool` 或 HTTP 子模块）

手机只通过 **Mesh 网络** 连到 shadowd，不再依赖本机 18800 或 desktop-gateway 进程。

---

## 完全使用 Shadowd 的好处

### 1. 单一入口、统一部署

- 设备上只跑 **一个常驻进程**（shadowd），无需再单独起 Node 的 desktop-gateway。
- 安装/升级/卸载只维护 shadowd，运维和用户心智更简单。

### 2. 天然走 Mesh，不依赖局域网

- 手机已通过 Headscale/WireGuard 和电脑在同一 Mesh，工具调用走 **Mesh 通道** 即可。
- 不要求手机和电脑在同一 WiFi，也不依赖模拟器的 10.0.2.2 或本机 18800 端口暴露。

### 3. 安全与权限统一

- 认证、设备配对、Mesh 身份都在 shadowd 一侧，工具执行权限可以和现有 SSH/设备信任模型统一。
- 可复用同一套白名单、审计、风险等级（如 tools.json 中的策略），而不是在 Node 里再实现一遍。

### 4. 生命周期一致、可靠性更好

- shadowd 以系统服务运行，随开机启动；工具能力始终可用。
- 不依赖用户「记得开 desktop-gateway」，减少「工具执行失败：Not found」类问题。

### 5. 跨平台一致

- shadowd 已是 Windows/macOS/Linux 的同一套 daemon，工具 API 放在 shadowd 里，三端行为一致。
- desktop-gateway 当前是 Node，若要支持 Windows/Linux 的 GUI 或系统调用，需要在各平台再写一层；收进 shadowd 后可用 Go 统一封装各平台差异。

### 6. 扩展方式统一

- 新工具（如 `terminal.run`、`clipboard.get`）通过 gRPC 或 shadowd 内 HTTP 子模块扩展即可。
- 配置（白名单、风险等级）可放在 shadowd 的配置（如 `shadowd.yaml`）或同一套策略文件，便于统一管理。

### 7. 与现有 gRPC 体系一致

- 已有 DeviceService（GetDeviceInfo、GeneratePairingCode、HealthCheck），新增例如 `ToolService.ExecuteTool` 即可。
- 手机端已有 Headscale/Mesh 与设备发现，只需增加对「工具调用」的调用路径，架构更一致。

---

## 需要做的取舍

| 方面 | 当前 desktop-gateway | 完全使用 shadowd |
|------|----------------------|-------------------|
| 开发/迭代速度 | Node，改完即跑，适合快速试工具 | Go，需编译、部署 shadowd，适合稳定后收口 |
| 调试 | 单独进程，端口 18800，易抓包、易重启 | 与 SSH/gRPC 同进程，需区分日志与接口 |
| 权限/沙箱 | 当前为单机脚本调用，可逐步加策略 | 由 shadowd 统一做权限与审计，更集中 |

---

## 建议

- **短期**：保留 desktop-gateway，继续用其快速迭代「桌面工具」列表与协议（例如保持现有 HTTP JSON 语义）。
- **中期**：在 shadowd 中新增工具执行能力（如 gRPC `ExecuteTool` + 与现有 tools.json 同构的策略），手机在「已连接该设备」时优先走 shadowd 调工具，desktop-gateway 可作为本机/开发回退。
- **长期**：工具能力与策略全部迁入 shadowd，desktop-gateway 仅作兼容或下线，实现「完全使用 shadowd」的单一入口架构。

这样既保留当前迭代效率，又逐步获得「单一进程、走 Mesh、权限统一、跨平台一致」等好处。
