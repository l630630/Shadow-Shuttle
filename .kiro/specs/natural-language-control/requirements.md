# 需求文档 - 影梭第二阶段：自然语言智能控制

## 简介

影梭第二阶段在第一阶段（基础 VPN 连接、设备发现、SSH 终端）的基础上，增加自然语言和语音控制功能。用户可以通过自然语言（文字或语音）描述想要执行的操作，系统通过 AI 解析并转换为 Shell 命令执行。系统提供智能命令建议、命令历史管理和收藏功能，同时确保隐私保护和安全性。

## 术语表

- **NL_Controller**: 自然语言控制器，负责解析自然语言并转换为命令
- **AI_Service**: AI 语言模型服务（OpenAI GPT-4 / Claude API等多种API）
- **Voice_Input**: 语音输入模块，负责语音识别
- **Privacy_Filter**: 隐私过滤器，在发送到 AI 前脱敏敏感信息
- **Command_Suggestion**: 命令建议引擎，基于上下文和历史提供建议
- **Command_History**: 命令历史记录
- **Command_Favorite**: 收藏的常用命令
- **Dangerous_Command**: 危险命令（如 rm -rf, dd, mkfs 等）
- **Audit_Log**: 审计日志，记录所有命令执行
- **Sensitive_Info**: 敏感信息（文件路径、IP、密码等）
- **AI_Chat_Interface**: AI 对话界面，用于自然语言交互
- **Offline_Mode**: 离线模式，不依赖 AI 服务的功能

## 需求

### 需求 1: 自然语言命令解析

**用户故事:** 作为用户，我希望用中文或英文自然语言描述想做的事，系统自动转换为 Shell 命令，以便我不需要记忆复杂的命令语法。

#### 验收标准

1. WHEN 用户输入自然语言描述 THEN THE NL_Controller SHALL 调用 AI_Service 解析并返回对应的 Shell 命令
2. WHEN AI_Service 返回命令 THEN THE System SHALL 在执行前向用户展示命令并请求确认
3. WHEN 用户确认命令 THEN THE System SHALL 通过 SSH 连接执行该命令
4. WHEN AI_Service 解析失败或返回不明确结果 THEN THE System SHALL 提示用户重新描述或提供更多上下文
5. THE NL_Controller SHALL 支持中文和英文输入
6. WHEN AI_Service 响应时间超过 5 秒 THEN THE System SHALL 显示超时提示并允许用户取消
7. THE System SHALL 在命令执行后显示执行结果和退出状态码

### 需求 2: 语音输入控制

**用户故事:** 作为用户，我希望通过语音输入命令，以便在不方便打字的场景下也能控制电脑。

#### 验收标准

1. WHEN 用户按住语音按钮 THEN THE Voice_Input SHALL 开始录音并显示录音状态
2. WHEN 用户松开语音按钮 THEN THE Voice_Input SHALL 停止录音并开始语音识别
3. WHEN 语音识别完成 THEN THE System SHALL 将识别的文本显示在输入框中
4. WHEN 语音识别失败 THEN THE System SHALL 提示用户重新录音
5. THE Voice_Input SHALL 在 1 秒内完成语音识别
6. THE Voice_Input SHALL 支持中文和英文语音识别
7. WHEN 环境噪音过大 THEN THE System SHALL 提示用户在安静环境下录音

### 需求 3: 隐私保护

**用户故事:** 作为用户，我希望我的敏感信息不会被发送到 AI 服务，以便保护我的隐私和数据安全。

#### 验收标准

1. WHEN 用户输入包含文件路径 THEN THE Privacy_Filter SHALL 将路径替换为占位符（如 `<FILE_1>`）后再发送到 AI_Service
2. WHEN 用户输入包含 IP 地址 THEN THE Privacy_Filter SHALL 将 IP 替换为占位符（如 `<IP_1>`）后再发送到 AI_Service
3. WHEN 用户输入包含密码或密钥 THEN THE Privacy_Filter SHALL 将其替换为占位符（如 `<SECRET_1>`）后再发送到 AI_Service
4. WHEN AI_Service 返回命令 THEN THE System SHALL 将占位符还原为原始值
5. THE Privacy_Filter SHALL 在本地记录脱敏映射关系，不发送到服务器
6. THE System SHALL 在设置中提供隐私过滤开关选项
7. WHEN 隐私过滤关闭 THEN THE System SHALL 显示警告提示用户风险

### 需求 4: 危险命令检测

**用户故事:** 作为用户，我希望系统能检测危险命令并警告我，以便避免误操作导致数据丢失或系统损坏。

#### 验收标准

1. WHEN AI_Service 返回的命令包含 `rm -rf` THEN THE System SHALL 标记为危险命令并显示红色警告
2. WHEN AI_Service 返回的命令包含 `dd`, `mkfs`, `fdisk`, `format` THEN THE System SHALL 标记为危险命令并显示红色警告
3. WHEN 检测到危险命令 THEN THE System SHALL 要求用户二次确认并输入设备名称
4. WHEN 用户取消危险命令 THEN THE System SHALL 不执行该命令并返回对话界面
5. THE System SHALL 在审计日志中记录所有危险命令的执行尝试
6. THE System SHALL 提供危险命令列表的自定义配置
7. WHEN 命令包含 `sudo` 或管理员权限 THEN THE System SHALL 显示权限提升警告

### 需求 5: 智能命令建议

**用户故事:** 作为用户，我希望系统能基于上下文和历史提供命令建议，以便快速执行常用操作。

#### 验收标准

1. WHEN 用户开始输入文本 THEN THE Command_Suggestion SHALL 实时显示相关的历史命令建议
2. WHEN 用户选择建议的命令 THEN THE System SHALL 自动填充到输入框
3. WHEN 用户在特定目录下 THEN THE Command_Suggestion SHALL 优先建议该目录下常用的命令
4. WHEN 用户最近执行过类似命令 THEN THE Command_Suggestion SHALL 将其排在建议列表前面
5. THE Command_Suggestion SHALL 在 500 毫秒内返回建议列表
6. THE Command_Suggestion SHALL 最多显示 5 条建议
7. WHEN 没有匹配的建议 THEN THE System SHALL 不显示建议列表

### 需求 6: 命令历史管理

**用户故事:** 作为用户，我希望系统保存我的命令历史，以便查看和重新执行之前的命令。

#### 验收标准

1. WHEN 用户执行命令 THEN THE Command_History SHALL 保存命令文本、执行时间、设备信息和执行结果
2. WHEN 用户打开历史界面 THEN THE System SHALL 按时间倒序显示所有历史命令
3. WHEN 用户点击历史命令 THEN THE System SHALL 显示命令详情（包括输出和退出状态）
4. WHEN 用户选择重新执行历史命令 THEN THE System SHALL 将命令填充到输入框并请求确认
5. THE Command_History SHALL 支持按设备、时间范围和关键词筛选
6. THE Command_History SHALL 在本地存储最多 1000 条历史记录
7. WHEN 历史记录超过 1000 条 THEN THE System SHALL 自动删除最旧的记录

### 需求 7: 命令收藏功能

**用户故事:** 作为用户，我希望能收藏常用命令，以便快速访问和执行。

#### 验收标准

1. WHEN 用户在历史或对话界面长按命令 THEN THE System SHALL 显示收藏选项
2. WHEN 用户收藏命令 THEN THE System SHALL 提示用户输入命令名称和描述
3. WHEN 用户打开收藏界面 THEN THE System SHALL 显示所有收藏的命令
4. WHEN 用户点击收藏的命令 THEN THE System SHALL 将命令填充到输入框并请求确认
5. THE Command_Favorite SHALL 支持编辑命令名称、描述和命令内容
6. THE Command_Favorite SHALL 支持删除收藏的命令
7. THE Command_Favorite SHALL 支持按名称搜索收藏的命令

### 需求 8: AI 对话界面

**用户故事:** 作为用户，我希望通过对话式界面与 AI 交互，以便获得更自然的使用体验。

#### 验收标准

1. WHEN 用户打开 AI 助手界面 THEN THE System SHALL 显示聊天式布局（顶部状态、中部对话、底部输入）
2. WHEN 用户发送消息 THEN THE AI_Chat_Interface SHALL 立即显示用户消息气泡
3. WHEN AI_Service 处理中 THEN THE System SHALL 显示"思考中"动画
4. WHEN AI_Service 返回命令 THEN THE System SHALL 显示 AI 消息气泡，包含命令和确认按钮
5. WHEN 用户确认执行 THEN THE System SHALL 显示执行结果在对话中
6. THE AI_Chat_Interface SHALL 保持对话历史，支持上下文连续对话
7. THE AI_Chat_Interface SHALL 支持清除对话历史

### 需求 9: 离线模式

**用户故事:** 作为用户，我希望在没有网络或 AI 服务不可用时，仍能使用历史和收藏功能，以便在任何情况下都能工作。

#### 验收标准

1. WHEN AI_Service 不可用 THEN THE System SHALL 自动切换到离线模式
2. WHEN 在离线模式下 THEN THE System SHALL 禁用自然语言解析功能并显示提示
3. WHEN 在离线模式下 THEN THE System SHALL 允许用户访问命令历史和收藏
4. WHEN 在离线模式下 THEN THE System SHALL 允许用户直接输入 Shell 命令执行
5. WHEN 网络恢复 THEN THE System SHALL 自动切换回在线模式
6. THE System SHALL 在设置中显示当前模式状态（在线/离线）
7. THE System SHALL 允许用户手动切换到离线模式

### 需求 10: API 密钥管理

**用户故事:** 作为用户，我希望安全地管理 AI 服务的 API 密钥，以便保护我的账户安全。

#### 验收标准

1. WHEN 用户首次使用 THEN THE System SHALL 提示用户输入 AI 服务 API 密钥
2. WHEN 用户输入 API 密钥 THEN THE System SHALL 将密钥加密存储在设备安全存储区域
3. WHEN 用户查看 API 密钥 THEN THE System SHALL 仅显示部分字符（如 `sk-...xyz`）
4. WHEN 用户更新 API 密钥 THEN THE System SHALL 验证新密钥有效性后再保存
5. THE System SHALL 支持选择不同的 AI 服务提供商（OpenAI、Claude）
6. THE System SHALL 在 API 调用失败时检查是否为密钥问题并提示用户
7. THE System SHALL 提供删除 API 密钥的选项

### 需求 11: 审计日志

**用户故事:** 作为用户，我希望系统记录所有命令执行的审计日志，以便追踪和审查操作历史。

#### 验收标准

1. WHEN 用户执行命令 THEN THE Audit_Log SHALL 记录时间戳、用户输入、AI 解析结果、执行命令和执行结果
2. WHEN 用户执行危险命令 THEN THE Audit_Log SHALL 额外标记为高风险操作
3. WHEN 用户打开审计日志界面 THEN THE System SHALL 显示所有日志记录
4. THE Audit_Log SHALL 支持按时间范围、设备和风险级别筛选
5. THE Audit_Log SHALL 支持导出为 JSON 或 CSV 格式
6. THE Audit_Log SHALL 在本地存储最多 30 天的日志
7. WHEN 日志超过 30 天 THEN THE System SHALL 自动删除过期日志

### 需求 12: 性能要求

**用户故事:** 作为用户，我希望系统响应迅速，以便获得流畅的使用体验。

#### 验收标准

1. WHEN 用户发送自然语言请求 THEN THE AI_Service SHALL 在 3 秒内返回解析结果
2. WHEN 用户使用语音输入 THEN THE Voice_Input SHALL 在 1 秒内完成识别
3. WHEN 用户输入文本 THEN THE Command_Suggestion SHALL 在 500 毫秒内返回建议
4. WHEN 用户打开历史或收藏界面 THEN THE System SHALL 在 200 毫秒内加载并显示列表
5. THE Privacy_Filter SHALL 在 50 毫秒内完成脱敏处理
6. THE System SHALL 支持至少 5 个并发 AI 请求而不影响性能
7. THE System SHALL 在低端设备上保持流畅的 UI 响应（60 FPS）

### 需求 13: 多语言支持

**用户故事:** 作为用户，我希望系统支持中英文界面和输入，以便使用我熟悉的语言。

#### 验收标准

1. THE System SHALL 支持中文和英文界面语言切换
2. WHEN 用户切换语言 THEN THE System SHALL 立即更新所有界面文本
3. THE NL_Controller SHALL 自动检测用户输入的语言（中文或英文）
4. THE Voice_Input SHALL 根据系统语言设置选择对应的语音识别引擎
5. THE System SHALL 在设置中提供语言选择选项
6. THE System SHALL 保存用户的语言偏好设置
7. WHEN 系统语言为中文 THEN THE System SHALL 使用中文提示和错误信息

### 需求 14: 错误处理和用户反馈

**用户故事:** 作为用户，我希望系统能清晰地告知错误原因并提供解决方案，以便快速解决问题。

#### 验收标准

1. WHEN AI_Service 调用失败 THEN THE System SHALL 显示具体错误原因（网络问题、API 密钥无效、配额超限）
2. WHEN 命令执行失败 THEN THE System SHALL 显示退出状态码和错误输出
3. WHEN 语音识别失败 THEN THE System SHALL 提示用户检查麦克风权限或重新录音
4. WHEN 隐私过滤检测到敏感信息 THEN THE System SHALL 在发送前显示脱敏预览
5. THE System SHALL 为每种错误类型提供具体的解决建议
6. THE System SHALL 在错误发生时提供重试或取消选项
7. THE System SHALL 在审计日志中记录所有错误事件
