# Shadow Shuttle 商业化部署架构

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层                                 │
├─────────────────────────────────────────────────────────────┤
│  iOS App (App Store)  │  Android App (Google Play)          │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    你的云服务层                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Headscale    │  │ API Gateway  │  │ Auth Service │      │
│  │ (VPN 协调)   │  │ (REST API)   │  │ (用户管理)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DERP Server  │  │ Billing API  │  │ Analytics    │      │
│  │ (NAT 穿透)   │  │ (计费系统)   │  │ (数据分析)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   客户服务器层                                │
├─────────────────────────────────────────────────────────────┤
│  客户服务器 1        客户服务器 2        客户服务器 N        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  shadowd     │  │  shadowd     │  │  shadowd     │      │
│  │  daemon      │  │  daemon      │  │  daemon      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 部署方案

### 方案 A: 完全托管 SaaS（推荐）

**你需要部署的服务：**

#### 1. Headscale 服务器（核心）
```yaml
# docker-compose.yml
version: '3.8'
services:
  headscale:
    image: headscale/headscale:latest
    container_name: headscale
    restart: unless-stopped
    ports:
      - "8080:8080"  # HTTP API
      - "50443:50443" # gRPC
    volumes:
      - ./config:/etc/headscale
      - ./data:/var/lib/headscale
    command: serve
    
  derp:
    image: tailscale/derper:latest
    container_name: derp
    restart: unless-stopped
    ports:
      - "3478:3478/udp"  # STUN
      - "443:443"        # HTTPS
    environment:
      - DERP_DOMAIN=derp.shadowshuttle.io
```

**部署位置：** AWS/GCP/Azure（推荐多区域部署）

**成本估算：**
- 小型（< 1000 用户）: $50-100/月
- 中型（1000-10000 用户）: $200-500/月
- 大型（> 10000 用户）: $1000+/月

#### 2. API Gateway（用户管理和计费）
```javascript
// 需要实现的 API 端点
POST   /api/v1/auth/register        // 用户注册
POST   /api/v1/auth/login           // 用户登录
GET    /api/v1/devices              // 获取设备列表
POST   /api/v1/devices              // 添加设备
DELETE /api/v1/devices/:id          // 删除设备
GET    /api/v1/subscription         // 获取订阅状态
POST   /api/v1/subscription/upgrade // 升级订阅
GET    /api/v1/usage                // 获取使用统计
```

**技术栈建议：**
- Node.js + Express / Go + Gin
- PostgreSQL（用户数据）
- Redis（会话缓存）
- Stripe（支付）

#### 3. 移动应用发布

**iOS (App Store)**
```bash
# 1. 准备发布
cd mobile-app
npm run build:ios

# 2. 配置 App Store Connect
# - 创建 App ID
# - 配置应用内购买（订阅）
# - 提交审核

# 3. 持续更新
# - 使用 Fastlane 自动化发布
```

**Android (Google Play)**
```bash
# 1. 准备发布
cd mobile-app
npm run build:android

# 2. 配置 Google Play Console
# - 创建应用
# - 配置订阅和计费
# - 提交审核

# 3. 持续更新
# - 使用 Fastlane 自动化发布
```

**成本：**
- Apple Developer: $99/年
- Google Play: $25 一次性
- 代码签名证书: $0-300/年

---

### 方案 B: 混合模式（降低成本）

**你提供：**
- Headscale 协调服务器（必须）
- DERP 中继服务器（必须）
- 移动应用（必须）
- 用户认证 API（必须）

**客户自己部署：**
- shadowd 守护进程（在他们的服务器上）

**优势：**
- 降低你的服务器成本
- 客户数据完全在自己服务器
- 更容易获得企业客户信任

---

## 🚀 快速启动指南

### 第一步：部署 Headscale

```bash
# 1. 克隆配置
git clone https://github.com/your-org/shadow-shuttle-infra
cd shadow-shuttle-infra/headscale

# 2. 配置域名
# 编辑 config/config.yaml
# 设置: server_url: https://vpn.shadowshuttle.io

# 3. 启动服务
docker-compose up -d

# 4. 创建第一个用户
docker exec headscale headscale users create default

# 5. 验证
curl https://vpn.shadowshuttle.io/health
```

### 第二步：部署 API Gateway

```bash
# 1. 创建数据库
createdb shadowshuttle

# 2. 配置环境变量
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost/shadowshuttle
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -hex 32)
STRIPE_SECRET_KEY=sk_live_xxx
HEADSCALE_URL=https://vpn.shadowshuttle.io
EOF

# 3. 运行迁移
npm run migrate

# 4. 启动服务
npm run start:prod
```

### 第三步：配置移动应用

```javascript
// mobile-app/src/config/api.ts
export const API_CONFIG = {
  // 你的 API 端点
  API_BASE_URL: 'https://api.shadowshuttle.io',
  
  // Headscale 端点
  HEADSCALE_URL: 'https://vpn.shadowshuttle.io',
  
  // DERP 服务器
  DERP_MAP: {
    regions: {
      1: {
        regionID: 1,
        regionCode: 'us-west',
        nodes: [{
          name: 'us-west-1',
          regionID: 1,
          hostName: 'derp-us.shadowshuttle.io',
          stunPort: 3478,
          derpPort: 443,
        }]
      }
    }
  }
};
```

### 第四步：发布应用

```bash
# iOS
cd mobile-app
fastlane ios release

# Android
fastlane android release
```

---

## 💰 商业模式建议

### 定价策略

| 方案 | 价格 | 设备数 | AI 命令 | 目标用户 |
|------|------|--------|---------|----------|
| 免费版 | $0 | 3 | 100/月 | 个人用户、试用 |
| 专业版 | $9.99/月 | 无限 | 无限 | 专业开发者 |
| 团队版 | $29.99/月 | 无限 | 无限 | 小团队（5人） |
| 企业版 | 定制 | 无限 | 无限 | 大型企业 |

### 收入预测（保守估计）

**第一年：**
- 免费用户: 10,000
- 付费转化率: 5%
- 付费用户: 500
- 月收入: $5,000
- 年收入: $60,000

**第二年：**
- 免费用户: 50,000
- 付费用户: 2,500
- 月收入: $25,000
- 年收入: $300,000

### 成本结构

**固定成本（月）：**
- 服务器: $500
- 域名/SSL: $20
- 第三方服务: $200
- 总计: ~$720/月

**变动成本：**
- AI API 调用: $0.002/次
- 带宽: $0.01/GB
- 存储: $0.023/GB/月

**盈亏平衡点：** ~100 付费用户

---

## 🔐 安全和合规

### 数据安全
- [ ] 所有 API 使用 HTTPS
- [ ] 数据库加密（静态）
- [ ] 传输加密（TLS 1.3）
- [ ] 定期安全审计

### 隐私合规
- [ ] GDPR 合规（欧盟）
- [ ] CCPA 合规（加州）
- [ ] 隐私政策
- [ ] 服务条款
- [ ] 数据删除机制

### 备份策略
- [ ] 数据库每日备份
- [ ] 配置文件版本控制
- [ ] 灾难恢复计划
- [ ] 多区域冗余

---

## 📊 监控和分析

### 关键指标（KPI）

**用户指标：**
- DAU/MAU（日活/月活）
- 用户留存率
- 付费转化率
- 流失率

**技术指标：**
- API 响应时间
- VPN 连接成功率
- 命令执行延迟
- 错误率

**业务指标：**
- MRR（月度经常性收入）
- ARPU（每用户平均收入）
- CAC（客户获取成本）
- LTV（客户生命周期价值）

### 监控工具

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      
  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

---

## 🎯 上线检查清单

### 技术准备
- [ ] Headscale 服务器部署并测试
- [ ] DERP 服务器配置完成
- [ ] API Gateway 部署并测试
- [ ] 数据库备份策略就绪
- [ ] 监控和告警配置完成
- [ ] 负载测试通过
- [ ] 安全审计完成

### 应用发布
- [ ] iOS 应用提交审核
- [ ] Android 应用提交审核
- [ ] 应用内购买配置完成
- [ ] 崩溃报告集成（Sentry/Firebase）
- [ ] 分析工具集成（Mixpanel/Amplitude）

### 法律和合规
- [ ] 隐私政策发布
- [ ] 服务条款发布
- [ ] 公司注册完成
- [ ] 支付处理商协议签署
- [ ] GDPR/CCPA 合规检查

### 营销准备
- [ ] 官网上线
- [ ] 文档网站上线
- [ ] 社交媒体账号创建
- [ ] 产品演示视频制作
- [ ] 新闻稿准备

### 客户支持
- [ ] 支持邮箱设置
- [ ] 工单系统部署
- [ ] FAQ 文档编写
- [ ] 社区论坛设置

---

## 📈 增长策略

### 获客渠道

1. **内容营销**
   - 技术博客（SSH 安全、远程运维）
   - YouTube 教程
   - 开源社区贡献

2. **产品导向增长**
   - 免费版本（病毒式传播）
   - 推荐奖励计划
   - 开发者社区

3. **付费广告**
   - Google Ads（关键词：remote ssh, server management）
   - Reddit（r/sysadmin, r/devops）
   - Twitter/X（开发者社区）

4. **合作伙伴**
   - 云服务商（AWS, GCP, Azure）
   - DevOps 工具集成
   - 托管服务提供商

### 留存策略

1. **产品优化**
   - 持续改进 AI 功能
   - 添加用户请求的功能
   - 提升性能和稳定性

2. **用户教育**
   - 定期发送使用技巧
   - 案例研究分享
   - 最佳实践指南

3. **客户成功**
   - 主动支持
   - 定期回访
   - 使用情况分析

---

## 🛠️ 技术栈总结

### 后端
- **语言**: Go 1.25+
- **框架**: Gin / Echo
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **消息队列**: RabbitMQ / Kafka（可选）

### 前端
- **移动端**: React Native 0.73
- **Web 管理后台**: Next.js 14
- **状态管理**: Zustand / Redux Toolkit
- **UI 组件**: React Native Paper / Tailwind

### 基础设施
- **容器**: Docker + Docker Compose
- **编排**: Kubernetes（可选，大规模时）
- **CI/CD**: GitHub Actions / GitLab CI
- **监控**: Prometheus + Grafana
- **日志**: Loki / ELK Stack
- **CDN**: Cloudflare

### 第三方服务
- **支付**: Stripe
- **邮件**: SendGrid / AWS SES
- **短信**: Twilio
- **分析**: Mixpanel / Amplitude
- **错误追踪**: Sentry
- **客服**: Intercom / Zendesk

---

## 📞 下一步行动

1. **立即行动（本周）**
   - [ ] 注册域名（shadowshuttle.io）
   - [ ] 设置 AWS/GCP 账号
   - [ ] 部署测试环境

2. **短期目标（1 个月）**
   - [ ] 完成 Headscale 生产部署
   - [ ] 开发 API Gateway
   - [ ] 准备应用商店资料

3. **中期目标（3 个月）**
   - [ ] 应用上架 App Store 和 Google Play
   - [ ] 获得前 100 个用户
   - [ ] 收集用户反馈并迭代

4. **长期目标（6-12 个月）**
   - [ ] 达到 1000 付费用户
   - [ ] 实现盈亏平衡
   - [ ] 考虑融资或自力更生

---

**需要帮助？** 联系我们的部署支持团队：deploy@shadowshuttle.io
