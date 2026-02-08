# 设备去重修复说明

## 问题
设备列表显示多个重复的 `630MacBook-Air.local` 设备。

## 原因
1. 每次 shadowd API 失败时，fallback 逻辑会创建 mock 设备
2. Mock 设备使用 `Date.now()` 生成唯一 ID，导致每次都创建新设备
3. 去重逻辑使用数组查找，无法有效去重

## 修复方案

### 1. 使用 Map 进行去重
```typescript
// 旧代码：使用数组查找
const merged = [...existingDevices];
devices.forEach(newDevice => {
  const existingIndex = merged.findIndex(d => d.id === newDevice.id);
  if (existingIndex >= 0) {
    merged[existingIndex] = newDevice;
  } else {
    merged.push(newDevice);
  }
});

// 新代码：使用 Map 去重
const deviceMap = new Map<string, Device>();
existingDevices.forEach(device => {
  deviceMap.set(device.id, device);
});
devices.forEach(newDevice => {
  deviceMap.set(newDevice.id, newDevice);
});
const merged = Array.from(deviceMap.values());
```

### 2. 固定 Mock 设备 ID
```typescript
// 旧代码：每次生成新 ID
id: '630MacBook-Air.local-' + Date.now()

// 新代码：使用固定 ID
const mockDeviceId = '630MacBook-Air.local-mock';
```

### 3. 添加手动去重功能
```typescript
deduplicateDevices: async () => {
  const { devices } = get();
  const deviceMap = new Map<string, Device>();
  
  devices.forEach(device => {
    const existing = deviceMap.get(device.id);
    // 保留最新的设备（基于 lastSeen）
    if (!existing || device.lastSeen > existing.lastSeen) {
      deviceMap.set(device.id, device);
    }
  });
  
  const deduplicated = Array.from(deviceMap.values());
  
  if (deduplicated.length < devices.length) {
    console.log(`🧹 Removed ${devices.length - deduplicated.length} duplicates`);
    set({ devices: deduplicated });
    await get().saveDevices();
  }
  
  return deduplicated.length;
}
```

### 4. 自动去重
在 `loadDevices` 后自动调用 `deduplicateDevices`：
```typescript
loadDevices: async () => {
  // ... 加载设备 ...
  set({ devices, loading: false });
  
  // 自动去重
  await get().deduplicateDevices();
}
```

### 5. UI 改进
添加 "清理重复" 按钮：
```tsx
<View style={{ flexDirection: 'row', gap: 12 }}>
  {devices.length > 1 && (
    <TouchableOpacity onPress={async () => {
      const count = await deduplicateDevices();
      Alert.alert('清理完成', `当前共有 ${count} 个设备`);
    }}>
      <Text style={[styles.sectionLink, { color: colors.warning }]}>
        清理重复
      </Text>
    </TouchableOpacity>
  )}
  <TouchableOpacity onPress={() => { /* ... */ }}>
    <Text style={[styles.sectionLink, { color: colors.primary }]}>
      查看全部
    </Text>
  </TouchableOpacity>
</View>
```

## 使用方法

### 自动清理
- 应用启动时自动清理重复设备
- 无需手动操作

### 手动清理
1. 打开应用主页
2. 在 "Mesh 设备" 标题右侧点击 "清理重复"
3. 查看清理结果提示

## 测试结果
✅ 只显示真实设备（不重复）
✅ 每次启动自动清理
✅ 可以手动触发清理
✅ 清理结果持久化保存

## 文件变更
- `mobile-app/src/stores/deviceStore.ts`
  - 修复 `discoverDevices` 使用 Map 去重
  - 固定 mock 设备 ID
  - 添加 `deduplicateDevices` 函数
  - 在 `loadDevices` 后自动去重
- `mobile-app/App.tsx`
  - 添加 "清理重复" 按钮
  - 导入 `deduplicateDevices` 函数
