# 贡献指南

感谢你对 Shadow Shuttle 项目的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 检查 [Issues](https://github.com/l630630/Shadow-Shuttle/issues) 是否已有相关问题
2. 如果没有，创建新的 Issue
3. 使用清晰的标题和详细的描述
4. 如果是 bug，请提供复现步骤

### 提交代码

1. **Fork 项目**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/Shadow-Shuttle.git
   cd Shadow-Shuttle
   ```

3. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **进行更改**
   - 编写代码
   - 添加测试
   - 更新文档

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

6. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述
   - 提交 PR

---

## 📝 代码规范

### Go 代码

**格式化**:
```bash
gofmt -w .
```

**Lint**:
```bash
golangci-lint run
```

**规范**:
- 遵循 [Effective Go](https://golang.org/doc/effective_go)
- 使用有意义的变量名
- 添加必要的注释
- 错误处理要完整

### TypeScript 代码

**格式化**:
```bash
npm run format
```

**Lint**:
```bash
npm run lint
```

**规范**:
- 使用 TypeScript 严格模式
- 避免使用 `any` 类型
- 使用函数式编程风格
- 组件要有 PropTypes

### 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat(mobile): add fingerprint authentication

- Implement biometric authentication
- Add fallback to password
- Update security documentation

Closes #123
```

---

## 🧪 测试要求

### 单元测试

**Go**:
```bash
cd shadowd
go test ./...
```

**TypeScript**:
```bash
cd mobile-app
npm test
```

**要求**:
- 新功能必须有测试
- 测试覆盖率 > 80%
- 所有测试必须通过

### 集成测试

```bash
# 启动服务
./start-demo.sh

# 运行集成测试
./scripts/integration-test.sh
```

---

## 📚 文档要求

### 代码文档

**Go**:
```go
// NewServer creates a new SSH server instance.
// It validates the configuration and initializes the server.
//
// Parameters:
//   - config: SSH server configuration
//   - log: Logger instance
//
// Returns:
//   - *Server: Initialized server instance
//   - error: Error if initialization fails
func NewServer(config Config, log *logrus.Logger) (*Server, error) {
    // ...
}
```

**TypeScript**:
```typescript
/**
 * Connect to VPN using WireGuard
 * 
 * @param config - VPN configuration
 * @returns Connection status
 */
async connect(config: VPNConfig): Promise<ConnectionStatus> {
    // ...
}
```

### README 更新

如果你的更改影响用户使用：

- 更新 README.md
- 添加使用示例
- 更新安装步骤
- 添加截图（如果需要）

---

## 🎨 截图和视频

### 新功能截图

如果添加了新的 UI 功能：

1. 按照 [SCREENSHOTS_GUIDE.md](docs/SCREENSHOTS_GUIDE.md) 拍摄截图
2. 保存到 `docs/screenshots/` 目录
3. 更新相关文档
4. 在 PR 中包含截图

### 演示视频

对于重大功能：

1. 录制演示视频
2. 上传到 YouTube 或 Bilibili
3. 在 PR 中添加视频链接

---

## 🔍 代码审查

### 审查标准

- 代码质量
- 测试覆盖
- 文档完整性
- 性能影响
- 安全性

### 审查流程

1. 提交 PR 后，维护者会进行审查
2. 根据反馈进行修改
3. 所有检查通过后合并
4. 感谢你的贡献！

---

## 🏗️ 开发环境设置

### 后端开发

```bash
# 安装 Go 1.25+
brew install go

# 克隆项目
git clone git@github.com:l630630/Shadow-Shuttle.git
cd Shadow-Shuttle/shadowd

# 安装依赖
go mod download

# 运行测试
go test ./...

# 构建
go build -o shadowd
```

### 前端开发

```bash
# 安装 Node.js 18+
brew install node

# 进入移动端目录
cd mobile-app

# 安装依赖
npm install --legacy-peer-deps

# 运行 iOS
npm run ios

# 运行 Android
npm run android
```

---

## 🐛 调试技巧

### Go 调试

使用 Delve:
```bash
go install github.com/go-delve/delve/cmd/dlv@latest
dlv debug ./cmd/shadowd
```

### React Native 调试

1. 打开开发者菜单 (Command + D)
2. 选择 "Debug"
3. 在 Chrome DevTools 中调试

---

## 📊 性能优化

### Go 性能分析

```bash
# CPU 分析
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# 内存分析
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof
```

### React Native 性能

使用 React DevTools Profiler:
```bash
npm install -g react-devtools
react-devtools
```

---

## 🔒 安全注意事项

### 敏感信息

- 不要提交密钥、密码等敏感信息
- 使用环境变量或配置文件
- 添加到 `.gitignore`

### 依赖安全

```bash
# Go
go list -m all | nancy sleuth

# Node.js
npm audit
```

---

## 📞 获取帮助

如果你有任何问题：

- 查看 [文档](docs/)
- 搜索 [Issues](https://github.com/l630630/Shadow-Shuttle/issues)
- 创建新的 Issue
- 加入 [Discussions](https://github.com/l630630/Shadow-Shuttle/discussions)

---

## 🎉 贡献者

感谢所有贡献者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

**再次感谢你的贡献！** 🙏
