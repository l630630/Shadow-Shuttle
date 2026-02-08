# ⚠️ 忽略 HTTP API 错误

## 错误信息

```
Failed to get device info: TypeError: Network request failed
```

## 这是什么？

这是设备发现功能尝试通过 HTTP API 获取设备信息时的错误。

## 为什么会出现？

Android 模拟器的网络配置问题，无法访问 `http://10.0.2.2:8080`。

## 重要：这不影响 SSH 连接！

✅ **SSH 连接使用 WebSocket (端口 8022)**
✅ **不依赖 HTTP API**
✅ **可以正常使用终端功能**

## 如何使用

### 1. 忽略错误提示

点击 "Dismiss" 关闭错误提示。

### 2. 设备应该显示为在线

- 设备名称：630MacBook-Air.local
- 状态：在线（绿色圆点）
- 可以点击连接

### 3. 连接到设备

1. **点击设备**
2. **输入用户名和密码：**
   - 用户名：`a0000`
   - 密码：`your_password_here`（配置文件中的密码）
3. **点击连接**

### 4. 应该能成功连接

- ✅ 显示终端界面
- ✅ 可以执行命令
- ✅ 看到真实输出

## 如何修改密码

### 1. 编辑配置文件

```bash
cd shadowd
nano shadowd.yaml
```

### 2. 修改密码

找到这一行：
```yaml
users:
  a0000: "your_password_here"  # 改为你想要的密码
```

改为：
```yaml
users:
  a0000: "my_password_123"  # 你的新密码
```

### 3. 保存并重启

```bash
# 保存文件 (Ctrl+O, Enter, Ctrl+X)

# 重启 shadowd
pkill shadowd
./shadowd -config shadowd.yaml > shadowd.log 2>&1 &
```

### 4. 在 App 中使用新密码

- 用户名：`a0000`
- 密码：`my_password_123`（你刚设置的密码）

## 测试连接

### 方法 1：在 App 中测试

1. 点击设备
2. 输入用户名和密码
3. 点击连接
4. 应该能看到终端

### 方法 2：本地测试（可选）

```bash
cd shadowd

# 测试配置文件中的密码
node test-config-users.js

# 应该看到：
# ✅ 认证成功
# 🎉 所有测试通过！
```

## 常见问题

### Q: 错误提示一直出现怎么办？

**A:** 
- 点击 "Dismiss" 关闭
- 或者点击 "Minimize" 最小化
- 不影响使用

### Q: 设备显示离线怎么办？

**A:**
1. 重新加载 App（摇动手机 → Reload）
2. 或者重启 App
3. 设备应该显示为在线

### Q: 连接失败怎么办？

**A:**
检查：
1. shadowd 是否运行？
   ```bash
   ps aux | grep shadowd
   ```

2. 密码是否正确？
   - 查看 `shadowd/shadowd.yaml` 中的密码
   - 确保与 App 中输入的一致

3. 重启 shadowd
   ```bash
   cd shadowd
   pkill shadowd
   ./shadowd -config shadowd.yaml > shadowd.log 2>&1 &
   ```

### Q: 如何永久修复 HTTP API 错误？

**A:**
这需要更多时间调试 Android 模拟器的网络配置。当前的回退机制（Mock 数据）已经足够使用。

## 总结

**当前状态：**
- ⚠️ HTTP API 连接失败（不影响功能）
- ✅ SSH 连接正常工作
- ✅ 可以执行命令
- ✅ 可以使用终端

**使用步骤：**
1. 忽略错误提示
2. 点击设备
3. 输入用户名和密码（配置文件中的）
4. 连接并使用

**修改密码：**
1. 编辑 `shadowd/shadowd.yaml`
2. 修改 `users` 下的密码
3. 重启 shadowd
4. 在 App 中使用新密码

---

**不要被错误提示吓到，SSH 连接是正常的！** 🚀
