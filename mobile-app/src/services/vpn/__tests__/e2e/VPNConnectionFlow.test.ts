/**
 * 端到端测试：完整 VPN 连接流程
 * 
 * 测试从配置输入到成功建立 VPN 连接的完整流程
 * 
 * 测试场景：
 * 1. 使用 Headscale 注册设备
 * 2. 获取 WireGuard 配置
 * 3. 配置存储
 * 4. 建立 VPN 连接
 * 5. Mesh IP 验证
 * 6. 通过 Mesh 网络的设备连接
 */

import { container } from '../../../core/DIContainer';
import { IVPNService } from '../../interfaces/IVPNService';
import { VPNStatus } from '../../interfaces/IWireGuardBridge';
import { getVPNLogger } from '../../logging/VPNLogger';
import { getVPNMetrics } from '../../metrics/VPNMetrics';

describe('端到端测试：完整 VPN 连接流程', () => {
  let vpnService: IVPNService;
  const logger = getVPNLogger();
  const metrics = getVPNMetrics();

  // 测试配置
  const testConfig = {
    headscaleUrl: process.env.TEST_HEADSCALE_URL || 'http://localhost:8080',
    deviceName: `test-device-${Date.now()}`,
    preAuthKey: process.env.TEST_PREAUTH_KEY || 'test-key',
  };

  beforeAll(() => {
    // 从 DI 容器解析 VPN 服务
    vpnService = container.resolve<IVPNService>('IVPNService');
    logger.info('E2E Test', '开始完整 VPN 连接流程测试');
  });

  afterAll(async () => {
    // 清理：断开连接并清除配置
    try {
      if (vpnService.isConnected()) {
        await vpnService.disconnect();
      }
      await vpnService.clearConfiguration();
      logger.info('E2E Test', '测试清理完成');
    } catch (error) {
      logger.error('E2E Test', '清理失败', { error });
    }
  });

  describe('步骤 1：设备注册', () => {
    it('应该成功向 Headscale 注册设备', async () => {
      logger.info('E2E Test', '步骤 1：注册设备');

      const result = await vpnService.register(testConfig);

      // 验证注册结果
      expect(result).toBeDefined();
      expect(result.meshIP).toBeDefined();
      expect(result.nodeId).toBeDefined();

      // 验证 Mesh IP 格式 (100.64.0.0/10)
      expect(result.meshIP).toMatch(/^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.\d{1,3}\.\d{1,3}$/);

      logger.info('E2E Test', '设备注册成功', {
        meshIP: result.meshIP,
        nodeId: result.nodeId,
      });
    }, 30000); // 30秒超时

    it('注册后应该已保存配置', async () => {
      const isConfigured = await vpnService.isConfigured();
      expect(isConfigured).toBe(true);

      const config = await vpnService.getConfiguration();
      expect(config).toBeDefined();
      expect(config?.interface).toBeDefined();
      expect(config?.peers).toBeDefined();
      expect(config?.peers.length).toBeGreaterThan(0);

      logger.info('E2E Test', '配置验证通过', {
        interfaceAddress: config?.interface.address,
        peerCount: config?.peers.length,
      });
    });
  });

  describe('步骤 2：VPN 连接', () => {
    it('应该成功连接到 VPN', async () => {
      logger.info('E2E Test', '步骤 2：连接到 VPN');

      const startTime = Date.now();
      await vpnService.connect();
      const duration = Date.now() - startTime;

      // 验证连接
      expect(vpnService.isConnected()).toBe(true);

      const status = await vpnService.getStatus();
      expect(status).toBe(VPNStatus.Connected);

      // 验证连接时间合理 (< 10秒)
      expect(duration).toBeLessThan(10000);

      logger.info('E2E Test', 'VPN 连接成功', {
        duration,
        status,
      });
    }, 15000); // 15秒超时

    it('应该有有效的连接信息', () => {
      const connectionInfo = vpnService.getConnectionInfo();

      expect(connectionInfo).toBeDefined();
      expect(connectionInfo.status).toBe(VPNStatus.Connected);
      expect(connectionInfo.connectedAt).toBeDefined();
      expect(connectionInfo.lastError).toBeNull();

      logger.info('E2E Test', '连接信息验证通过', connectionInfo);
    });
  });

  describe('步骤 3：Mesh 网络验证', () => {
    it('应该有有效的 Mesh IP', async () => {
      const config = await vpnService.getConfiguration();
      const meshIP = config?.interface.address.split('/')[0];

      expect(meshIP).toBeDefined();
      expect(meshIP).toMatch(/^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.\d{1,3}\.\d{1,3}$/);

      logger.info('E2E Test', 'Mesh IP 验证通过', { meshIP });
    });

    it('应该能够检测 Mesh 网络', async () => {
      const config = await vpnService.getConfiguration();
      const meshIP = config?.interface.address.split('/')[0];

      // 辅助函数：检查 IP 是否在 Mesh 范围内
      const isMeshIP = (ip: string): boolean => {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4) return false;
        
        // 100.64.0.0/10 范围
        if (parts[0] !== 100) return false;
        if (parts[1] < 64 || parts[1] > 127) return false;
        
        return true;
      };

      expect(isMeshIP(meshIP!)).toBe(true);

      logger.info('E2E Test', 'Mesh 网络检测验证通过');
    });
  });

  describe('步骤 4：性能指标', () => {
    it('应该已记录连接指标', () => {
      const metricsData = metrics.getMetrics();

      expect(metricsData.totalAttempts).toBeGreaterThan(0);
      expect(metricsData.successfulConnections).toBeGreaterThan(0);
      expect(metricsData.successRate).toBeGreaterThan(0);
      expect(metricsData.averageConnectionTime).toBeGreaterThan(0);

      logger.info('E2E Test', '性能指标验证通过', metricsData);
    });

    it('应该有活动会话', () => {
      const metricsData = metrics.getMetrics();

      expect(metricsData.currentSession).toBeDefined();
      expect(metricsData.currentSession?.startTime).toBeDefined();
      expect(metricsData.currentSession?.endTime).toBeUndefined();

      logger.info('E2E Test', '活动会话验证通过');
    });
  });

  describe('步骤 5：断开连接', () => {
    it('应该成功断开连接', async () => {
      logger.info('E2E Test', '步骤 5：断开 VPN 连接');

      await vpnService.disconnect();

      expect(vpnService.isConnected()).toBe(false);

      const status = await vpnService.getStatus();
      expect(status).toBe(VPNStatus.Disconnected);

      logger.info('E2E Test', 'VPN 断开连接成功');
    });

    it('应该已结束会话指标', () => {
      const metricsData = metrics.getMetrics();

      expect(metricsData.currentSession).toBeUndefined();

      logger.info('E2E Test', '会话指标验证通过');
    });
  });

  describe('步骤 6：配置清理', () => {
    it('应该清除配置', async () => {
      await vpnService.clearConfiguration();

      const isConfigured = await vpnService.isConfigured();
      expect(isConfigured).toBe(false);

      const config = await vpnService.getConfiguration();
      expect(config).toBeNull();

      logger.info('E2E Test', '配置清除成功');
    });
  });
});
