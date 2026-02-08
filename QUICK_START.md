# 🚀 快速开始指南

## 当前状态

✅ **SSH 连接可用**
✅ **密码认证已配置**
✅ **终端功能正常**
✅ **WebSocket SSH 代理集成在 shadowd**
⚠️ **HTTP API 有错误（不影响使用）**

## 5 分钟快速开始

### 1. 设置密码（1 分钟）

```bash
cd shadowd

# 编辑配置文件
nano shadowd.yaml

# 找到这一行并修改密码：
# users:
#   a0000: "your_password_here"  # 改为你的密码

# 保存：Ctrl+O, Enter, Ctrl+X
```

### 2. 启动 shadowd（1 分钟）

```bash
# 重启 shadowd
pkill shadowd
./shadowd -config shadowd.yaml > shadowd.log 2>&1 &

# 等待 2 秒
sleep 2

# 检查是否运行
ps aux | grep shadowd | grep -v grep
```

应该看到 shadowd 进程。

**Shadowd 启动的服务：**
- SSH Server: `127.0.0.1:2222`
- WebSocket SSH 代理: `0.0.0.0:8022`
- gRPC Server: `127.0.0.1:50052`

### 3. 测试连接（1 分钟）

```bash
# 测试密码认证
node test-config-users.js
```

应该看到：
```
✅ 认证成功
🎉 所有测试通过！
```

### 4. 在手机 App 中使用（2 分钟）

1. **打开 App**

2. **忽略错误提示**
   - 看到 "Failed to get device info" 错误
   - 点击 "Dismiss" 关闭

3. **点击设备**
   - 设备名称：630MacBook-Air.local
   - 应该显示为在线（绿色圆点）

4. **输入凭据**
   - 用户名：`a0000`
   - 密码：你在配置文件中设置的密码

5. **连接**
   - 点击连接按钮
   - 应该看到终端界面

6. **测试命令**
   ```bash
   whoami
   pwd
   ls
   ```

## 默认账号

如果你还没有修改配置文件，使用默认密码：

| 用户名 | 密码 |
|--------|------|
| `a0000` | `your_password_here` |
| `admin` | `admin_password` |

⚠️ **强烈建议修改默认密码！**

## 常见问题

### Q: 看到 "Failed to get device info" 错误

**A:** 正常！点击 "Dismiss" 关闭，不影响使用。

### Q: 设备显示离线

**A:** 重新加载 App（摇动手机 → Reload）。

### Q: 连接失败

**A:** 
1. 检查密码是否正确
2. 检查 shadowd 是否运行
3. 重启 shadowd

### Q: 如何修改密码

**A:**
1. 编辑 `shadowd/shadowd.yaml`
2. 修改 `users` 下的密码
3. 重启 shadowd：`pkill shadowd && ./shadowd -config shadowd.yaml > shadowd.log 2>&1 &`

## 测试清单

- [ ] 修改了配置文件中的密码
- [ ] 重启了 shadowd
- [ ] 运行了测试脚本（通过）
- [ ] 在 App 中看到设备（在线）
- [ ] 输入了正确的用户名和密码
- [ ] 连接成功
- [ ] 可以执行命令

## 下一步

### 短期

1. ✅ 使用 SSH 终端
2. ✅ 测试 AI 助手功能
3. ✅ 测试命令历史

### 中期

1. 🔄 修复 HTTP API 连接
2. 🔄 实现真实设备发现
3. 🔄 添加公钥认证

### 长期

1. 📅 多设备管理
2. 📅 文件传输
3. 📅 剪贴板同步

## 相关文档

- 📄 `mobile-app/配置文件密码认证.md` - 密码配置详细说明
- 📄 `mobile-app/忽略HTTP_API错误.md` - 错误处理说明
- 📄 `shadowd/WEBSOCKET_SSH_GUIDE.md` - WebSocket SSH 代理使用指南
- 📄 `shadowd/test-config-users.js` - 测试脚本

## 获取帮助

如果遇到问题：

1. **查看日志**
   ```bash
   cd shadowd
   tail -50 shadowd.log
   ```

2. **重启 shadowd**
   ```bash
   cd shadowd
   pkill shadowd
   ./shadowd -config shadowd.yaml > shadowd.log 2>&1 &
   ```

3. **测试连接**
   ```bash
   cd shadowd
   node test-config-users.js
   ```

---

**现在开始使用吧！** 🎉

**记住：**
- 用户名：`a0000`
- 密码：你在 `shadowd.yaml` 中设置的密码
- 忽略 HTTP API 错误提示
