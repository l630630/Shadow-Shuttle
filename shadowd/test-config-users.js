#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 测试配置文件中的用户');
console.log('========================\n');

// 测试配置文件中定义的用户
const tests = [
  { username: 'a0000', password: 'your_password_here', shouldPass: true },
  { username: 'admin', password: 'admin_password', shouldPass: true },
  { username: 'a0000', password: 'wrong', shouldPass: false },
];

async function testAuth(username, password, shouldPass) {
  return new Promise((resolve) => {
    console.log(`\n📝 测试: ${username} / ${password}`);
    console.log(`   预期: ${shouldPass ? '成功' : '失败'}`);
    
    const ws = new WebSocket('ws://localhost:8022');
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'connect',
        host: 'localhost',
        port: 2222,
        username,
        password,
      }));
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'connected') {
        console.log(`   结果: ✅ 认证成功`);
        ws.send(JSON.stringify({ type: 'disconnect' }));
        ws.close();
        resolve(shouldPass);
      } else if (msg.type === 'error') {
        console.log(`   结果: ❌ 认证失败`);
        ws.close();
        resolve(!shouldPass);
      }
    });
    
    ws.on('error', () => {
      console.log(`   结果: ❌ 连接错误`);
      resolve(false);
    });
    
    setTimeout(() => {
      ws.close();
      console.log(`   结果: ⏱️  超时`);
      resolve(false);
    }, 5000);
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testAuth(test.username, test.password, test.shouldPass);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n📊 测试结果');
  console.log('============');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (passed === tests.length) {
    console.log('\n🎉 所有测试通过！');
    console.log('\n💡 现在可以在手机 App 中使用这些账号：');
    console.log('   用户名: a0000');
    console.log('   密码: your_password_here');
    console.log('\n⚠️  记得在 shadowd.yaml 中修改密码！');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
