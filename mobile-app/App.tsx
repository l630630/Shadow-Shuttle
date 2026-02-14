import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DeviceListScreen } from './src/screens/DeviceListScreen';
import { TerminalScreen } from './src/screens/TerminalScreen';
import { AIChatScreen } from './src/screens/AIChatScreen';
import { CommandHistoryScreen } from './src/screens/CommandHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { Device } from './src/types/device';
import { getDeviceDiscoveryService } from './src/services/deviceDiscoveryService';
import { getAPIConfig } from './src/config/api';
import { BottomNav, TabId } from './src/components/BottomNav';
import { DeviceCard } from './src/components/DeviceCard';
import { Header } from './src/components/Header';
import { StatCard } from './src/components/StatCard';
import { AddDeviceModal } from './src/components/AddDeviceModal';
import { useAuthStore } from './src/stores/authStore';
import { useDeviceStore } from './src/stores/deviceStore';
import { colors, typography, spacing, borderRadius, shadows, layout, getThemeColors } from './src/styles/theme';

type Screen = 'dashboard' | 'devices' | 'terminal' | 'aichat' | 'history' | 'profile' | 'aisettings';

function App(): React.JSX.Element {
  // 强制使用 Dark 模式，与 shadow-shuttle web 版保持一致
  const isDarkMode = true; // useColorScheme() === 'dark';
  const themeColors = getThemeColors(isDarkMode);
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [vpnConnected, setVpnConnected] = useState(false);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('欢迎使用影梭终端\n$ ');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [selectedDeviceForAI, setSelectedDeviceForAI] = useState<any>(null); // AI 助手专用的设备选择
  // 设备列表统一由全局 store 管理，这里不再维护本地副本
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [homeTerminalDevice, setHomeTerminalDevice] = useState<Device | null>(null);
  const [homeTerminalConnected, setHomeTerminalConnected] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Auth state
  const { isLoggedIn, loadAuthState, loading: authLoading } = useAuthStore();
  const { addDevice: addDeviceToStore, loadDevices: loadDevicesFromStore, devices: storedDevices, refreshDeviceStatuses, discoverDevices, deduplicateDevices } = useDeviceStore();

  // Load auth state and devices on mount
  useEffect(() => {
    // 立即加载认证状态（不阻塞）
    loadAuthState();
    
    // 延迟加载设备数据，给 UI 时间渲染
    const timer = setTimeout(() => {
      console.log('🔵 [App] Loading persisted devices from store...');
      loadDevicesFromStore();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // ✨ 如果没有设备，延迟自动发现设备
  useEffect(() => {
    if (storedDevices.length === 0 && !authLoading) {
      // 延迟发现，避免阻塞 UI
      const timer = setTimeout(() => {
        console.log('🔵 [App] No devices found, auto-discovering...');
        discoverDevices();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [storedDevices.length, authLoading]);

  // 当 VPN 连接状态改变时，刷新设备状态
  useEffect(() => {
    if (vpnConnected) {
      // ✨ VPN 连接后，延迟刷新设备在线状态
      const timer = setTimeout(() => {
        refreshDeviceStatuses();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [vpnConnected]);

  // ✨ 使用 useCallback 缓存函数，避免子组件重渲染
  const handleTabChange = useCallback((newTab: TabId) => {
    // 如果从 AI 助手切换到其他 tab，清除 AI 助手的设备选择
    if (currentTab === 'ai' && newTab !== 'ai') {
      setSelectedDeviceForAI(null);
    }
    setCurrentTab(newTab);
  }, [currentTab]);

  const config = getAPIConfig();
  const discoveryService = getDeviceDiscoveryService({
    headscaleUrl: config.headscale.url,
    apiKey: config.headscale.apiKey,
  });

  // ✨ 直接使用 storedDevices，避免不必要的状态同步
  const devices = storedDevices;

  // ✨ 使用 useMemo 缓存计算结果
  const { onlineCount, offlineCount } = useMemo(() => ({
    onlineCount: devices.filter(d => d.online).length,
    offlineCount: devices.length - devices.filter(d => d.online).length,
  }), [devices]);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    flex: 1,
  };
  // ✨ 使用 useCallback 缓存 VPN 切换函数
  const toggleVPN = useCallback(() => {
    const newState = !vpnConnected;
    setVpnConnected(newState);
    
    if (!newState) {
      // VPN 断开时，断开首页终端连接
      setHomeTerminalDevice(null);
      setHomeTerminalConnected(false);
      setOutput('欢迎使用影梭终端\n$ ');
    }
    
    setOutput(prev => prev + `\nVPN ${newState ? '已连接' : '已断开'}\n$ `);
  }, [vpnConnected]);

  // ✨ 缓存命令执行函数
  const executeCommand = useCallback(async () => {
    if (!command.trim()) return;
    
    if (!homeTerminalConnected || !homeTerminalDevice) {
      setOutput(prev => prev + command + '\n⚠️ 请先连接到设备\n💡 点击"设备列表"→选择设备→使用SSH终端\n$ ');
      setCommand('');
      return;
    }

    // 显示命令
    setOutput(prev => prev + command + '\n');
    
    try {
      // TODO: 实际发送命令到 SSH 服务
      // 临时模拟响应
      setOutput(prev => prev + `正在 ${homeTerminalDevice.name} 上执行命令...\n$ `);
    } catch (error) {
      setOutput(prev => prev + `错误: ${error}\n$ `);
    }
    
    setCommand('');
  }, [command, homeTerminalConnected, homeTerminalDevice]);

  // ✨ 缓存设备点击处理函数
  const handleDevicePress = useCallback((device: Device) => {
    if (!device.online) {
      Alert.alert(
        '设备离线',
        `${device.name} 当前离线，无法连接`,
        [{ text: '确定' }]
      );
      return;
    }
    setSelectedDevice(device);
  }, []);

  // 切换首页终端连接的设备
  const switchHomeTerminalDevice = useCallback((device: Device) => {
    if (!device.online) {
      Alert.alert(
        '设备离线',
        `${device.name} 当前离线，无法连接`,
        [{ text: '确定' }]
      );
      return;
    }
    
    setHomeTerminalDevice(device);
    setHomeTerminalConnected(true);
    setOutput(prev => prev + `\n已切换到 ${device.name} (${device.meshIP})\n$ `);
  }, []);

  // ✨ 使用 useCallback 缓存工具函数
  const formatLastSeen = useCallback((date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  }, []);

  // ✨ 使用 useCallback 缓存设备图标函数
  const getDeviceIcon = useCallback((device: Device): string => {
    if (device.hostname.includes('mac') || device.hostname.includes('Mac')) {
      return '💻';
    }
    if (device.hostname.includes('win') || device.hostname.includes('Win')) {
      return '🖥️';
    }
    if (device.hostname.includes('linux') || device.hostname.includes('ubuntu')) {
      return '🐧';
    }
    return '💻';
  }, []);

  // 简单的导航对象
  const navigation = {
    navigate: (screen: string, params?: any) => {
      if (screen === 'Terminal') {
        setSelectedDevice(params?.device);
        handleTabChange('dashboard'); // 暂时保持在 dashboard，后续可以添加专门的终端 tab
      } else if (screen === 'QRScanner') {
        setShowAddDeviceModal(false);
        setShowQRScanner(true);
      } else if (screen === 'AIChat') {
        // AI 对话需要设备参数
        if (params?.device) {
          setSelectedDeviceForAI(params.device);
          handleTabChange('ai');
        } else {
          Alert.alert(
            '错误',
            '请先选择一个设备',
            [{ text: '确定' }]
          );
        }
      } else if (screen === 'History') {
        handleTabChange('history');
      }
    },
    goBack: () => {
      handleTabChange('dashboard');
    },
  };

  // 处理手动添加设备
  const handleManualAddDevice = async (ip: string, port: string, username: string, password: string) => {
    try {
      // 创建新设备对象
      const newDevice: Device = {
        id: `device-${Date.now()}`,
        name: `${username}@${ip}`,
        hostname: ip,
        meshIP: ip,
        sshPort: parseInt(port),
        online: false, // 初始状态为离线，需要测试连接
        lastSeen: new Date(),
        publicKey: '', // 手动添加的设备暂时没有公钥
      };

      // 添加到 store
      await addDeviceToStore(newDevice);

      Alert.alert(
        '添加成功',
        `设备 ${newDevice.name} 已添加\n正在测试连接...`,
        [{ text: '确定' }]
      );

      // TODO: 测试 SSH 连接
      // 这里可以调用 sshService 测试连接
    } catch (error) {
      throw new Error('添加设备失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理扫码添加设备
  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  // ⚠️ 注意：所有 hooks 已经在上面定义完毕，
  // 从这里开始可以根据状态做条件渲染（早返回），不会再新增 hooks。

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            加载中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  // 如果在设备列表页面（通过 dashboard 显示）
  if (currentTab === 'dashboard' && devices.length > 0 && !selectedDevice) {
    // 显示完整设备列表
    // 暂时保持在 dashboard，后续可以添加专门的设备列表视图
  }

  // 如果正在展示二维码扫描界面，独占全屏（无底部导航）
  if (showQRScanner) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <QRScannerScreen
          navigation={{
            ...navigation,
            goBack: () => setShowQRScanner(false),
          }}
        />
      </SafeAreaView>
    );
  }

  // 如果选中了设备且在 dashboard，显示终端页面（全屏，无底部导航）
  if (selectedDevice && currentTab === 'dashboard') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <TerminalScreen
          route={{ params: { device: selectedDevice } }}
          navigation={{
            ...navigation,
            goBack: () => {
              setSelectedDevice(null);
            },
          }}
        />
      </SafeAreaView>
    );
  }

  // 如果在 AI 对话界面
  if (currentTab === 'ai') {
    // 如果没有选择设备，自动选择第一个在线设备
    if (!selectedDeviceForAI && devices.length > 0) {
      const firstOnlineDevice = devices.find(d => d.online);
      if (firstOnlineDevice) {
        // 使用 setTimeout 避免在渲染期间更新状态
        setTimeout(() => setSelectedDeviceForAI(firstOnlineDevice), 0);
      }
    }
    
    // 如果还是没有设备，显示设备列表供选择
    if (!selectedDeviceForAI) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={themeColors.background}
          />
          
          {/* Header */}
          <View style={[styles.aiDeviceSelectHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <Text style={[styles.aiDeviceSelectTitle, { color: themeColors.textPrimary }]}>
              选择设备
            </Text>
            <Text style={[styles.aiDeviceSelectSubtitle, { color: themeColors.textSecondary }]}>
              选择一个设备开始 AI 对话
            </Text>
          </View>

          {/* Device List */}
          <ScrollView style={styles.aiDeviceSelectList} contentContainerStyle={styles.aiDeviceSelectContent}>
            {!vpnConnected ? (
              <View style={styles.emptyDevicesCard}>
                <Icon name="wifi-off" size={48} color={themeColors.textMuted} />
                <Text style={[styles.emptyDevicesText, { color: themeColors.textSecondary }]}>
                  请先连接 VPN 以查看设备
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleTabChange('dashboard')}
                >
                  <Text style={styles.primaryButtonText}>返回首页连接</Text>
                </TouchableOpacity>
              </View>
            ) : loadingDevices ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                  正在加载设备...
                </Text>
              </View>
            ) : devices.length === 0 ? (
              <View style={styles.emptyDevicesCard}>
                <Icon name="devices" size={48} color={themeColors.textMuted} />
                <Text style={[styles.emptyDevicesText, { color: themeColors.textSecondary }]}>
                  还没有配对的设备
                </Text>
                <TouchableOpacity
                  style={[styles.scanButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('QRScanner')}
                >
                  <Icon name="qr-code-scanner" size={20} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>扫码配对</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onPress={(dev) => {
                      if (dev.online) {
                        setSelectedDeviceForAI(dev);
                      } else {
                        Alert.alert(
                          '设备离线',
                          `${dev.name} 当前离线，无法使用 AI 助手`,
                          [{ text: '确定' }]
                        );
                      }
                    }}
                  />
                ))}
              </>
            )}
          </ScrollView>

          <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <AIChatScreen
          route={{ params: { device: selectedDeviceForAI } }}
          navigation={navigation}
        />
        <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      </SafeAreaView>
    );
  }

  // 如果在命令历史界面
  if (currentTab === 'history') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <CommandHistoryScreen navigation={navigation} />
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </SafeAreaView>
    );
  }

  // 如果在个人中心界面
  if (currentTab === 'profile') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.background}
        />
        <ProfileScreen navigation={navigation} />
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </SafeAreaView>
    );
  }

  // Dashboard (首页)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Header
          showLogo
        />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="在线节点"
            value={onlineCount}
            icon="wifi"
            iconColor={colors.online}
          />
          <StatCard
            title="离线节点"
            value={offlineCount}
            icon="wifi-off"
            iconColor={colors.offline}
          />
        </View>

        {/* VPN Status Card */}
        <View style={styles.section}>
          <View style={[
            styles.vpnCard,
            { 
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
            shadows.md,
          ]}>
            <View style={styles.vpnHeader}>
              <Text style={[styles.vpnTitle, { color: themeColors.textPrimary }]}>
                VPN 状态
              </Text>
              <View style={styles.vpnStatusRow}>
                <View style={[
                  styles.vpnStatusDot,
                  { backgroundColor: vpnConnected ? colors.online : colors.offline }
                ]} />
                <Text style={[styles.vpnStatusText, { color: themeColors.textPrimary }]}>
                  {vpnConnected ? '已连接' : '未连接'}
                </Text>
              </View>
            </View>

            {vpnConnected && (
              <Text style={[styles.vpnIp, { color: themeColors.textSecondary }]}>
                Mesh IP: 100.64.0.1
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.vpnButton,
                { backgroundColor: vpnConnected ? colors.status.error : colors.primary },
                shadows.md,
              ]}
              onPress={toggleVPN}
              activeOpacity={0.8}
            >
              <Text style={styles.vpnButtonText}>
                {vpnConnected ? '断开连接' : '连接 VPN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Device List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
              Mesh 设备
            </Text>
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
              <TouchableOpacity onPress={() => {
                // TODO: 显示完整设备列表模态框或导航到设备列表页面
                Alert.alert('设备列表', '完整设备列表功能开发中...');
              }}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  查看全部
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!vpnConnected ? (
            <View style={styles.emptyDevicesCard}>
              <Icon name="wifi-off" size={48} color={themeColors.textMuted} />
              <Text style={[styles.emptyDevicesText, { color: themeColors.textSecondary }]}>
                请先连接 VPN 以查看设备
              </Text>
            </View>
          ) : loadingDevices ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                正在加载设备...
              </Text>
            </View>
          ) : devices.length === 0 ? (
            <View style={styles.emptyDevicesCard}>
              <Icon name="devices" size={48} color={themeColors.textMuted} />
              <Text style={[styles.emptyDevicesText, { color: themeColors.textSecondary }]}>
                还没有配对的设备
              </Text>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('QRScanner')}
              >
                <Icon name="qr-code-scanner" size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>扫码配对</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {devices.slice(0, 3).map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onPress={handleDevicePress}
                />
              ))}
              {devices.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    // TODO: 显示完整设备列表
                    Alert.alert('设备列表', '完整设备列表功能开发中...');
                  }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    查看全部 {devices.length} 个设备 →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>


      </ScrollView>

      {/* FAB - Add Device */}
      <TouchableOpacity
        style={[styles.fab, shadows.primary]}
        onPress={() => setShowAddDeviceModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Device Modal */}
      <AddDeviceModal
        visible={showAddDeviceModal}
        onClose={() => setShowAddDeviceModal(false)}
        onManualAdd={handleManualAddDevice}
        onScanQR={handleScanQR}
      />

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: layout.bottomNavHeight + spacing.xl,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },

  // VPN Card
  vpnCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  vpnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vpnTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  vpnStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vpnStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vpnStatusText: {
    fontSize: typography.fontSize.base,
  },
  vpnIp: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  vpnButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  vpnButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Empty States
  emptyDevicesCard: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyDevicesText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // Loading
  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // View All Button
  viewAllButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: layout.fabBottom,
    right: layout.fabRight,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State (for AI/Profile tabs)
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateHint: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },

  // Primary Button
  primaryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // AI Device Select
  aiDeviceSelectHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
  },
  aiDeviceSelectTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  aiDeviceSelectSubtitle: {
    fontSize: typography.fontSize.base,
  },
  aiDeviceSelectList: {
    flex: 1,
  },
  aiDeviceSelectContent: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl,
  },
});

export default App;
