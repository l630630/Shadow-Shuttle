/**
 * Gemini Usage Examples
 * Gemini 使用示例
 * 
 * 展示如何在应用中使用 Gemini AI 服务
 */

import { apiKeyStore } from '../src/stores/apiKeyStore';
import { getNLController } from '../src/services/nlController';
import { GeminiService } from '../src/services/geminiService';
import { CommandContext } from '../src/types/nlc';

// ============================================================================
// 示例 1: 配置 Gemini API 密钥
// ============================================================================

async function example1_ConfigureAPIKey() {
  console.log('示例 1: 配置 Gemini API 密钥\n');
  
  // 保存 API 密钥（加密存储）
  const apiKey = 'AIzaSyD...your-api-key-here';
  await apiKeyStore.saveAPIKey('gemini', apiKey);
  console.log('✓ API 密钥已保存');
  
  // 获取掩码后的密钥（用于显示）
  const maskedKey = await apiKeyStore.getMaskedAPIKey('gemini');
  console.log(`✓ 掩码密钥: ${maskedKey}`);
  
  // 验证密钥是否有效
  const geminiService = new GeminiService(apiKey);
  const isValid = await geminiService.validateAPIKey(apiKey);
  console.log(`✓ 密钥有效性: ${isValid ? '有效' : '无效'}`);
}

// ============================================================================
// 示例 2: 设置 Gemini 为活动提供商
// ============================================================================

async function example2_SetActiveProvider() {
  console.log('\n示例 2: 设置 Gemini 为活动提供商\n');
  
  const nlController = getNLController();
  
  try {
    // 设置 Gemini 为活动提供商
    await nlController.setAIProvider('gemini');
    console.log('✓ Gemini 已设置为活动提供商');
    
    // 获取当前提供商
    const currentProvider = nlController.getCurrentProvider();
    console.log(`✓ 当前提供商: ${currentProvider}`);
  } catch (error) {
    console.error('✗ 设置失败:', error);
  }
}

// ============================================================================
// 示例 3: 解析简单命令
// ============================================================================

async function example3_ParseSimpleCommand() {
  console.log('\n示例 3: 解析简单命令\n');
  
  const nlController = getNLController();
  
  // 确保 Gemini 已配置
  await nlController.setAIProvider('gemini');
  
  // 创建命令上下文
  const context: CommandContext = {
    currentDirectory: '/home/user',
    deviceInfo: {
      id: 'device-001',
      name: 'My Server',
      os: 'linux',
      shell: 'bash',
      currentDirectory: '/home/user',
      username: 'user',
      hostname: 'myserver',
    },
    recentCommands: [],
    conversationHistory: [],
  };
  
  // 解析自然语言命令
  const input = '列出当前目录的所有文件';
  console.log(`用户输入: "${input}"`);
  
  const result = await nlController.parseNaturalLanguage(input, context);
  
  if (result.success) {
    console.log(`✓ 生成命令: ${result.command}`);
    console.log(`  解释: ${result.explanation}`);
    console.log(`  置信度: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  危险性: ${result.isDangerous ? '是' : '否'}`);
  } else {
    console.error(`✗ 解析失败: ${result.error}`);
  }
}

// ============================================================================
// 示例 4: 解析复杂命令
// ============================================================================

async function example4_ParseComplexCommand() {
  console.log('\n示例 4: 解析复杂命令\n');
  
  const nlController = getNLController();
  await nlController.setAIProvider('gemini');
  
  const context: CommandContext = {
    currentDirectory: '/var/log',
    deviceInfo: {
      id: 'device-001',
      name: 'My Server',
      os: 'linux',
      shell: 'bash',
      currentDirectory: '/var/log',
      username: 'user',
      hostname: 'myserver',
    },
    recentCommands: ['cd /var/log', 'ls -la'],
    conversationHistory: [],
  };
  
  const input = '查找所有大于 100MB 的日志文件并按大小排序';
  console.log(`用户输入: "${input}"`);
  
  const result = await nlController.parseNaturalLanguage(input, context);
  
  if (result.success) {
    console.log(`✓ 生成命令: ${result.command}`);
    console.log(`  解释: ${result.explanation}`);
    console.log(`  置信度: ${(result.confidence * 100).toFixed(1)}%`);
  } else {
    console.error(`✗ 解析失败: ${result.error}`);
  }
}

// ============================================================================
// 示例 5: 多轮对话
// ============================================================================

async function example5_ConversationContext() {
  console.log('\n示例 5: 多轮对话\n');
  
  const nlController = getNLController();
  await nlController.setAIProvider('gemini');
  
  const conversationHistory: any[] = [];
  
  const context: CommandContext = {
    currentDirectory: '/home/user',
    deviceInfo: {
      id: 'device-001',
      name: 'My Server',
      os: 'linux',
      shell: 'bash',
      currentDirectory: '/home/user',
      username: 'user',
      hostname: 'myserver',
    },
    recentCommands: [],
    conversationHistory,
  };
  
  // 第一轮对话
  console.log('用户: 创建一个名为 projects 的目录');
  let result = await nlController.parseNaturalLanguage(
    '创建一个名为 projects 的目录',
    context
  );
  
  if (result.success) {
    console.log(`AI: ${result.command}`);
    console.log(`   ${result.explanation}\n`);
    
    // 添加到对话历史
    conversationHistory.push({
      role: 'user',
      content: '创建一个名为 projects 的目录',
    });
    conversationHistory.push({
      role: 'assistant',
      content: result.explanation,
      metadata: { command: result.command },
    });
  }
  
  // 第二轮对话（使用上下文）
  console.log('用户: 进入这个目录');
  result = await nlController.parseNaturalLanguage(
    '进入这个目录',
    { ...context, conversationHistory }
  );
  
  if (result.success) {
    console.log(`AI: ${result.command}`);
    console.log(`   ${result.explanation}\n`);
    
    conversationHistory.push({
      role: 'user',
      content: '进入这个目录',
    });
    conversationHistory.push({
      role: 'assistant',
      content: result.explanation,
      metadata: { command: result.command },
    });
  }
  
  // 第三轮对话
  console.log('用户: 在里面创建一个 README 文件');
  result = await nlController.parseNaturalLanguage(
    '在里面创建一个 README 文件',
    { ...context, conversationHistory }
  );
  
  if (result.success) {
    console.log(`AI: ${result.command}`);
    console.log(`   ${result.explanation}`);
  }
}

// ============================================================================
// 示例 6: 危险命令检测
// ============================================================================

async function example6_DangerousCommandDetection() {
  console.log('\n示例 6: 危险命令检测\n');
  
  const nlController = getNLController();
  await nlController.setAIProvider('gemini');
  
  const context: CommandContext = {
    currentDirectory: '/home/user',
    deviceInfo: {
      id: 'device-001',
      name: 'My Server',
      os: 'linux',
      shell: 'bash',
      currentDirectory: '/home/user',
      username: 'user',
      hostname: 'myserver',
    },
    recentCommands: [],
    conversationHistory: [],
  };
  
  // 测试危险命令
  const dangerousInputs = [
    '删除所有文件',
    '格式化磁盘',
    '清空根目录',
  ];
  
  for (const input of dangerousInputs) {
    console.log(`用户输入: "${input}"`);
    
    const result = await nlController.parseNaturalLanguage(input, context);
    
    if (result.success) {
      console.log(`  命令: ${result.command}`);
      console.log(`  危险性: ${result.isDangerous ? '⚠️ 危险' : '✓ 安全'}`);
      
      if (result.isDangerous) {
        console.log('  ⚠️ 警告: 此命令可能造成数据丢失，请谨慎执行！');
      }
    }
    console.log();
  }
}

// ============================================================================
// 示例 7: 错误处理
// ============================================================================

async function example7_ErrorHandling() {
  console.log('\n示例 7: 错误处理\n');
  
  const nlController = getNLController();
  
  try {
    // 尝试使用未配置的提供商
    await nlController.setAIProvider('gemini');
    console.log('✓ Gemini 已配置');
  } catch (error) {
    console.error('✗ 错误:', error instanceof Error ? error.message : '未知错误');
    console.log('  提示: 请先在设置中配置 Gemini API 密钥');
  }
  
  // 测试超时处理
  const context: CommandContext = {
    currentDirectory: '/home/user',
    deviceInfo: {
      id: 'device-001',
      name: 'My Server',
      os: 'linux',
      shell: 'bash',
      currentDirectory: '/home/user',
      username: 'user',
      hostname: 'myserver',
    },
    recentCommands: [],
    conversationHistory: [],
  };
  
  try {
    const result = await nlController.parseNaturalLanguage(
      '这是一个测试命令',
      context
    );
    
    if (!result.success) {
      console.log(`解析失败: ${result.error}`);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// ============================================================================
// 示例 8: 直接使用 GeminiService
// ============================================================================

async function example8_DirectGeminiService() {
  console.log('\n示例 8: 直接使用 GeminiService\n');
  
  const apiKey = await apiKeyStore.getAPIKey('gemini');
  
  if (!apiKey) {
    console.error('✗ 未找到 Gemini API 密钥');
    return;
  }
  
  const geminiService = new GeminiService(apiKey);
  
  // 检查服务状态
  console.log('检查服务状态...');
  const status = await geminiService.getServiceStatus();
  console.log(`  可用性: ${status.available ? '✓ 可用' : '✗ 不可用'}`);
  console.log(`  延迟: ${status.latency}ms`);
  
  if (!status.available) {
    console.error(`  错误: ${status.error}`);
    return;
  }
  
  // 发送请求
  console.log('\n发送请求...');
  const response = await geminiService.sendRequest(
    '显示当前目录',
    {
      timeout: 5000,
      conversationHistory: [],
    }
  );
  
  console.log(`✓ 命令: ${response.command}`);
  console.log(`  解释: ${response.explanation}`);
  console.log(`  置信度: ${(response.confidence * 100).toFixed(1)}%`);
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('Gemini AI 使用示例');
  console.log('='.repeat(60));
  
  try {
    await example1_ConfigureAPIKey();
    await example2_SetActiveProvider();
    await example3_ParseSimpleCommand();
    await example4_ParseComplexCommand();
    await example5_ConversationContext();
    await example6_DangerousCommandDetection();
    await example7_ErrorHandling();
    await example8_DirectGeminiService();
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 所有示例运行完成');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n✗ 示例运行失败:', error);
  }
}

// 导出示例函数
export {
  example1_ConfigureAPIKey,
  example2_SetActiveProvider,
  example3_ParseSimpleCommand,
  example4_ParseComplexCommand,
  example5_ConversationContext,
  example6_DangerousCommandDetection,
  example7_ErrorHandling,
  example8_DirectGeminiService,
  runAllExamples,
};

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}
