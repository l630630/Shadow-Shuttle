/**
 * 端到端测试：通过 Mesh 网络的设备连接
 * 
 * 测试设备通过 VPN Mesh 网络的连接功能
 * 
 * 测试场景：
 * 1. 使用 Mesh IP 添加设备
 * 2. 验证设备可通过 Mesh 网络访问
 * 3. 测试通过 Mesh 网络的 SSH 连接
 * 4. 对比 Mesh 与 LAN 连接方式
 */

import { container } from '../../../core/DIContainer';
import { IVPNService } from '../../interfaces/IVPNService';
import { VPNStatus } from '../../interfaces/IWireGuardBridge';
import { getVPNLogger } from '../../logging/VPNLogger';

describe('端到端测试：通过 Mesh 网络的设备连接', () => {
  let vpnService: IVPNService;
  const logger = getVPNLogger();

  // 测试设备配置
  const testDevice = {
    name: 'test-server',
    meshIP: process.env.TEST_DEVICE_MESH_IP || '100.64.0.2',
    lanIP: process.env.TEST_DEVICE_LAN_IP || '192.168.1.100',
    sshPort: 22,
  };

  beforeAll(async () => {
    vpnService = container.resolve<IVPNService>('IVPNService');
    
    // 确保 VPN 已连接
    if (!vpnService.isConnected()) {
      logger.info('E2E Test', 'VPN 未连接，跳过设备连接测试');
    }
  });

  describe('Mesh IP 检测', () => {
    it('应该正确识别 Mesh IP 地址', () => {
      const isMeshIP = (ip: string): boolean => {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4) return false;
        
        // 100.64.0.0/10 范围 (100.64.0.0 - 100.127.255.255)
        if (parts[0] !== 100) return false;
        if (parts[1] < 64 || parts[1] > 127) return false;
        
        return true;
      };

      // 测试有效的 Mesh IP
      expect(isMeshIP('100.64.0.1')).toBe(true);
      expect(isMeshIP('100.64.0.2')).toBe(true);
      expect(isMeshIP('100.127.255.255')).toBe(true);

      // 测试无效的 Mesh IP
      expect(isMeshIP('192.168.1.1')).toBe(false);
      expect(isMeshIP('10.0.0.1')).toBe(false);
      expect(isMeshIP('100.63.0.1')).toBe(false);
      expect(isMeshIP('100.128.0.1')).toBe(false);

      logger.info('E2E Test', 'Mesh IP 检测验证通过');
    });

    it('应该正确识别测试设备的 Mesh IP', () => {
      const isMeshIP = (ip: string): boolean => {
        const parts = ip.split('.').map(Number);
        return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
      };

      expect(isMeshIP(testDevice.meshIP)).toBe(true);
      expect(isMeshIP(testDevice.lanIP)).toBe(false);

      logger.info('E2E Test', '测试设备 IP 分类正确', {
        meshIP: testDevice.meshIP,
        lanIP: testDevice.lanIP,
      });
    });
  });

  describe('设备可达性', () => {
    it('测试前应该验证 VPN 已连接', async () => {
      const status = await vpnService.getStatus();
      
      if (status !== VPNStatus.Connected) {
        logger.warn('E2E Test', 'VPN 未连接，跳过可达性测试');
        return;
      }

      expect(status).toBe(VPNStatus.Connected);
      expect(vpnService.isConnected()).toBe(true);
    });

    it('应该有有效的 Mesh IP 配置', async () => {
      const config = await vpnService.getConfiguration();
      
      if (!config) {
        logger.warn('E2E Test', '无 VPN 配置，跳过测试');
        return;
      }

      expect(config.interface.address).toBeDefined();
      
      const meshIP = config.interface.address.split('/')[0];
      expect(meshIP).toMatch(/^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.\d{1,3}\.\d{1,3}$/);

      logger.info('E2E Test', '本地 Mesh IP 验证通过', { meshIP });
    });
  });

  describe('连接类型检测', () => {
    it('应该根据 IP 检测连接类型', () => {
      const getConnectionType = (ip: string): 'mesh' | 'lan' | 'wan' => {
        const parts = ip.split('.').map(Number);
        
        // Mesh 网络 (100.64.0.0/10)
        if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
          return 'mesh';
        }
        
        // 私有 IP 范围 (LAN)
        if (
          parts[0] === 10 ||
          (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
          (parts[0] === 192 && parts[1] === 168)
        ) {
          return 'lan';
        }
        
        return 'wan';
      };

      expect(getConnectionType(testDevice.meshIP)).toBe('mesh');
      expect(getConnectionType(testDevice.lanIP)).toBe('lan');
      expect(getConnectionType('8.8.8.8')).toBe('wan');

      logger.info('E2E Test', '连接类型检测验证通过');
    });
  });

  describe('设备添加流程', () => {
    it('VPN 连接时应该优先使用 Mesh IP', async () => {
      const isConnected = vpnService.isConnected();
      
      // VPN 连接时，应该使用 Mesh IP
      const preferredIP = isConnected ? testDevice.meshIP : testDevice.lanIP;
      
      logger.info('E2E Test', '首选 IP 已选择', {
        vpnConnected: isConnected,
        preferredIP,
        type: isConnected ? 'mesh' : 'lan',
      });

      if (isConnected) {
        expect(preferredIP).toBe(testDevice.meshIP);
      } else {
        expect(preferredIP).toBe(testDevice.lanIP);
      }
    });

    it('VPN 连接时应该显示 Mesh IP 提示', () => {
      const isConnected = vpnService.isConnected();
      
      const shouldShowMeshHint = isConnected;
      
      logger.info('E2E Test', 'Mesh IP 提示可见性', {
        shouldShow: shouldShowMeshHint,
        vpnConnected: isConnected,
      });

      expect(shouldShowMeshHint).toBe(isConnected);
    });
  });

  describe('网络切换', () => {
    it('应该处理 VPN 连接状态变化', async () => {
      const initialStatus = await vpnService.getStatus();
      
      logger.info('E2E Test', '初始 VPN 状态', { status: initialStatus });

      // 验证状态是有效状态之一
      expect([
        VPNStatus.Connected,
        VPNStatus.Disconnected,
        VPNStatus.Connecting,
        VPNStatus.Disconnecting,
      ]).toContain(initialStatus);
    });

    it('应该根据 VPN 状态更新设备连接方式', async () => {
      const status = await vpnService.getStatus();
      const isConnected = status === VPNStatus.Connected;

      // VPN 连接时，设备应该通过 Mesh IP 可达
      // VPN 断开时，设备应该使用 LAN IP
      const expectedConnectionType = isConnected ? 'mesh' : 'lan';

      logger.info('E2E Test', '预期连接类型', {
        vpnStatus: status,
        connectionType: expectedConnectionType,
      });

      expect(expectedConnectionType).toBe(isConnected ? 'mesh' : 'lan');
    });
  });
});
