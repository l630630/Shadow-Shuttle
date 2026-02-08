## macOS 消息自动化脚本说明

这组脚本实现了 **方案一：AppleScript + Shell 封装**，用于从命令行给 **微信 / QQ 联系人发送消息**，并且方便之后在 AI 助手里统一调用。

目录结构：

- `wechat_send_message.applescript`：给微信联系人发消息的 AppleScript
- `qq_send_message.applescript`：给 QQ 联系人发消息的 AppleScript
- `send_wechat_message.sh`：Shell 封装，调用上面的微信 AppleScript
- `send_qq_message.sh`：Shell 封装，调用上面的 QQ AppleScript

> 假设仓库路径为：`/Users/a0000/YS`

---

### 1. 微信：给联系人发送消息

#### 1.1 手动执行示例

```bash
cd /Users/a0000/YS/mac-automation
bash send_wechat_message.sh "健健" "你好，这是来自 Shadow Shuttle 的测试消息 1"
```

脚本会自动：

1. 激活 WeChat 客户端
2. 使用快捷键聚焦到搜索框
3. 输入联系人名称（这里是“健健”）
4. 回车进入聊天窗口
5. 输入消息文本并回车发送

> 如果你的微信应用名称不是 `WeChat`（例如是中文“微信”），可以在 `wechat_send_message.applescript` 里把 `application "WeChat"` 改成实际名字。

---

### 2. QQ：给联系人发送消息

#### 2.1 手动执行示例

```bash
cd /Users/a0000/YS/mac-automation
bash send_qq_message.sh "健健" "你好，这是来自 Shadow Shuttle 的 QQ 测试消息"
```

逻辑同上：激活 QQ → 搜索联系人 → 进入会话 → 发送消息。  
由于 QQ 客户端 UI / 快捷键可能有差异，如果第一次运行没有正确聚焦到搜索框或聊天输入框，可以根据你本机的 QQ 界面，微调 AppleScript 中的按键顺序。

---

### 3. 可选：加入 PATH，便于 AI 生成更简短的命令

如果希望以后 AI 只生成：

- `send_wechat_message.sh "健健" "1"`
- `send_qq_message.sh "健健" "1"`

而不写完整路径，可以在终端中创建符号链接（示例）：

```bash
sudo ln -sf /Users/a0000/YS/mac-automation/send_wechat_message.sh /usr/local/bin/send_wechat_message
sudo ln -sf /Users/a0000/YS/mac-automation/send_qq_message.sh /usr/local/bin/send_qq_message
```

之后即可直接运行：

```bash
send_wechat_message "健健" "1"
send_qq_message "健健" "1"
```

AI 助手在解析“给微信/QQ 的健健发一条消息为 1”这类指令时，就可以优先生成上述命令。

---

### 4. 与 Shadow Shuttle / AI 助手集成（思路）

当前脚本已经可以独立使用，下一步可以在 NLC 系统提示中加入规则，例如：

- 当用户说“给微信联系人 X 发消息 Y”时，优先生成：
  - `send_wechat_message "X" "Y"`
- 当用户说“给 QQ 联系人 X 发消息 Y”时，优先生成：
  - `send_qq_message "X" "Y"`

这样，AI 助手就会统一走这些封装好的脚本，让“发消息”真正落到 QQ / 微信客户端上。以后如果你需要支持更多操作（@群里某人、发文件等），也可以在本目录继续按同样方式扩展脚本。

