# Gemini AI 设置指南

## 📋 概述

Shadow Shuttle 现在支持 Google Gemini AI 作为自然语言命令解析引擎。本指南将帮助你配置和使用 Gemini。

## 🔑 获取 Gemini API 密钥

### 步骤 1: 访问 Google AI Studio

1. 打开浏览器访问: https://makersuite.google.com/app/apikey
2. 使用你的 Google 账户登录

### 步骤 2: 创建 API 密钥

1. 点击 "Create API Key" 按钮
2. 选择一个 Google Cloud 项目（或创建新项目）
3. 复制生成的 API 密钥（格式: `AIza...`）

### 步骤 3: 保存 API 密钥

⚠️ **重要**: 请妥善保管你的 API 密钥，不要分享给他人

## 📱 在应用中配置 Gemini

### 方法 1: 使用 AI 设置界面（推荐）

1. 打开 Shadow Shuttle 应用
2. 进入 **个人中心** → **系统设置**
3. 找到 **AI 服务商** 部分
4. 点击 **Google Gemini** 卡片
5. 在输入框中粘贴你的 API 密钥
6. 点击 **保存** 按钮
7. 点击 Gemini 卡片选择它作为活动提供商

### 方法 2: 使用代码配置

```typescript
import { apiKeyStore } from './src/stores/apiKeyStore';
import { getNLController } from './src/services/nlController';

// 保存 Gemini API 密钥
await apiKeyStore.saveAPIKey('gemini', 'YOUR_GEMINI_API_KEY');

// 设置 Gemini 为活动提供商
const nlController = getNLController();
await nlController.setAIProvider('gemini');
```

## 🚀 使用 Gemini

### 1. 打开 AI 聊天

1. 在设备列表中选择一个设备
2. 点击 **AI 助手** 图标
3. 确保已连接到设备（需要 SSH 连接）

### 2. 发送自然语言命令

输入自然语言描述，例如：

- "列出当前目录的所有文件"
- "查找所有 .txt 文件"
- "显示系统内存使用情况"
- "创建一个名为 test 的目录"

### 3. 查看和执行命令

1. Gemini 会生成对应的 shell 命令
2. 查看命令和解释
3. 点击 **执行** 按钮运行命令
4. 查看命令输出

## 🔒 安全特性

### API 密钥加密

- 所有 API 密钥使用 **Expo SecureStore** 加密存储
- 密钥存储在设备的安全区域（Secure Enclave/Keystore）
- 应用中只显示掩码版本（如 `AIza...xyz`）

### 隐私保护

- 发送到 Gemini 的数据会自动过滤敏感信息
- 支持以下类型的数据脱敏：
  - 文件路径
  - IP 地址
  - 密码
  - API 密钥
  - 邮箱地址

### 危险命令检测

系统会自动检测危险命令并警告用户：

- `rm -rf` - 递归删除
- `dd` - 磁盘操作
- `mkfs` - 格式化
- `format` - Windows 格式化
- 等等...

## ⚙️ Gemini 配置

### API 配置

在 `mobile-app/src/config/nlc-constants.ts` 中：

```typescript
gemini: {
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  model: 'gemini-pro',
  maxTokens: 500,
  temperature: 0.3,
}
```

### 调整参数

- **maxTokens**: 控制响应长度（默认 500）
- **temperature**: 控制创造性（0.0-1.0，默认 0.3）
  - 较低值 = 更确定性的输出
  - 较高值 = 更有创造性的输出

## 🔄 切换 AI 提供商

你可以随时在以下提供商之间切换：

1. **OpenAI** (GPT-4)
2. **Claude** (Claude 3.5 Sonnet)
3. **Google Gemini** (Gemini Pro)

切换方法：
1. 进入 **个人中心** → **系统设置**
2. 在 **AI 服务商** 部分点击想要使用的提供商
3. 系统会立即切换到新的提供商

## 🐛 故障排除

### 问题 1: "Invalid API key" 错误

**解决方案**:
1. 检查 API 密钥是否正确复制
2. 确保密钥格式为 `AIza...`
3. 在 Google AI Studio 中验证密钥是否有效
4. 检查 API 配额是否已用完

### 问题 2: "Request timeout" 错误

**解决方案**:
1. 检查网络连接
2. 尝试增加超时时间
3. 稍后重试

### 问题 3: "Quota exceeded" 错误

**解决方案**:
1. 检查 Google Cloud 项目的配额
2. 等待配额重置（通常每天重置）
3. 考虑升级到付费计划

### 问题 4: 无法连接到 Gemini API

**解决方案**:
1. 检查设备网络连接
2. 确保没有防火墙阻止连接
3. 尝试使用 VPN

## 📊 API 使用限制

### 免费层级

- **每分钟请求数**: 60 次
- **每天请求数**: 1,500 次
- **每月 token 数**: 免费

### 付费层级

访问 Google Cloud Console 查看详细定价：
https://cloud.google.com/vertex-ai/pricing

## 🔗 相关链接

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Gemini 定价](https://ai.google.dev/pricing)

## 💡 最佳实践

1. **保护 API 密钥**: 不要在代码中硬编码或分享
2. **监控使用量**: 定期检查 API 使用情况
3. **优化提示**: 使用清晰、具体的自然语言描述
4. **测试命令**: 在执行前仔细检查生成的命令
5. **备份密钥**: 在安全的地方保存 API 密钥副本

## 🆘 获取帮助

如果遇到问题：

1. 查看应用日志
2. 检查 Gemini API 状态页面
3. 访问项目 GitHub Issues
4. 联系技术支持

---

**注意**: Gemini 是 Google 的产品，使用时需遵守 Google 的服务条款和使用政策。
