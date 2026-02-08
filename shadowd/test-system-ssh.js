#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 测试系统 SSH 连接');
console.log('====================\n');
console.log('现在 WebSocket 代理连接到系统 SSH 服务器 (端口 22)');
console.log('需要使用真实的系统用户密码\n');

const username = process.argv[2] || 'a0000';
const password = process.argv[3];

if (!password) {
  console.error('❌ 错误：需要提供密码');
  console.log('\n用法：');
  console.log('  node test-system-ssh.js <username> <password>');
  console.log('\n示例：');
  console.log('  node test-system-ssh.js a0000 your_mac_password');
  process.exit(1);
}

console.log(`📝 测试用户: ${username}`);
console.log(`📝 密码: ${'*'.repeat(password.length)}\n`);

const ws = new WebSocket('ws://localhost:8022');

ws.on('open', () => {
  console.log('✅ WebSocket 连接成功\n');
  console.log('📤 发送 SSH 连接请求...');
  
  ws.send(JSON.stringify({
    type: 'connect',
    host: 'localhost',
    port: 22,
    username,
    password,
  }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    if (msg.type === 'connected') {
      console.log('✅ SSH 认证成功！');
      console.log('✅ 已连接到系统 SSH 服务器\n');
      
      console.log('📤 发送测试命令: whoami');
      ws.send(JSON.stringify({
        type: 'data',
        data: 'whoami\n',
      }));
      
      setTimeout(() => {
        console.log('\n📤 发送测试命令: pwd');
        ws.send(JSON.stringify({
          type: 'data',
          data: 'pwd\n',
        }));
      }, 1000);
      
      setTimeout(() => {
        console.log('\n👋 断开连接...');
        ws.send(JSON.stringify({ type: 'disconnect' }));
        ws.close();
      }, 3000);
      
    } else if (msg.type === 'data') {
      console.log('📥 输出:', msg.data.trim());
      
    } else if (msg.type === 'error') {
      console.error('\n❌ SSH 错误:', msg.message);
      console.log('\n💡 提示：');
      console.log('  - 确认用户名正确');
      console.log('  - 确认密码正确（系统用户密码）');
      console.log('  - 确认系统 SSH 服务已开启');
      ws.close();
      process.exit(1);
      
    } else if (msg.type === 'closed') {
      console.log('🔌 SSH 连接已关闭');
      ws.close();
    }
  } catch (error) {
    console.error('❌ 解析消息失败:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket 连接已关闭');
  process.exit(0);
});

setTimeout(() => {
  console.error('\n⏱️  超时：10 秒内无响应');
  ws.close();
  process.exit(1);
}, 10000);
