# 测试去重功能

## 问题描述
设备列表中出现多个重复的 `630MacBook-Air.local` 设备，原因是：
1. 每次 API 失败时都会创建新的 mock 设备
2. Mock 设备使用 `Date.now()` 生成不同的 ID
3. 去重逻辑不完善，导致重复设备累积

## 修复内容

### 1. 修复 `discoverDevices` 函数
- **使用 Map 进行去重**：改用 `Map<string, Device>` 按 ID 去重
- **固定 mock 设备 ID**：使用 `'630MacBook-Air.local-mock'` 而不是 `Date.now()`
- **统一去重逻辑**：成功和失败路径都使用相同的 Map 去重

### 2. 添加 `deduplicateDevices` 函数
- 手动清理重复设备
- 保留最新的设备版本（基于 lastSeen）
- 返回清理后的设备数量

### 3. 自动去重
- 在 `loadDevices` 后自动调用 `deduplicateDevices`
- 确保每次加载都清理重复设备

### 4. UI 改进
- 在设备列表标题旁添加 "清理重复" 按钮
- 只在有多个设备时显示
- 点击后显示清理结果

## 测试步骤

### 1. 清理现有重复设备
```bash
# 重新构建应用
cd mobile-app/android
./fast-build.sh
```

### 2. 验证自动去重
1. 打开应用
2. 观察设备列表
3. 应该只显示一个 `630MacBook-Air.local` 设备

### 3. 测试手动清理
1. 点击 "清理重复" 按钮
2. 应该显示 "当前共有 X 个设备"
3. 设备列表应该没有重复

### 4. 测试持久化
1. 关闭应用
2. 重新打开
3. 设备列表应该保持清理后的状态

## 预期结果
- ✅ 只显示真实的设备（不重复）
- ✅ 每次启动自动清理重复设备
- ✅ 可以手动触发清理
- ✅ 清理结果持久化保存

## 代码变更
- `mobile-app/src/stores/deviceStore.ts`
  - 修复 `discoverDevices` 使用 Map 去重
  - 添加 `deduplicateDevices` 函数
  - 在 `loadDevices` 后自动去重
- `mobile-app/App.tsx`
  - 添加 "清理重复" 按钮
  - 导入 `deduplicateDevices` 函数
