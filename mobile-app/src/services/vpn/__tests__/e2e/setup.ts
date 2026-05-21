/**
 * 端到端测试设置
 * 
 * 端到端测试的全局设置
 */

import { registerVPNServices } from '../../registerVPNServices';
import { getVPNLogger } from '../../logging/VPNLogger';

// 在测试前注册所有 VPN 服务
beforeAll(() => {
  console.log('🔧 设置端到端测试...');
  
  try {
    registerVPNServices();
    console.log('✅ VPN 服务已注册');
  } catch (error) {
    console.error('❌ 注册 VPN 服务失败:', error);
    throw error;
  }
});

// 全局测试超时
jest.setTimeout(60000); // 60 秒

// 设置日志记录器
const logger = getVPNLogger();
logger.info('E2E Test', '测试套件已初始化');

// 所有测试后清理
afterAll(() => {
  logger.info('E2E Test', '测试套件已完成');
  console.log('✅ 端到端测试完成');
});
