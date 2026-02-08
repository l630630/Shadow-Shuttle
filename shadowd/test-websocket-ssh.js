#!/usr/bin/env node

/**
 * Test WebSocket SSH Proxy
 * This script tests the WebSocket SSH proxy connection
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:8022';

console.log('🧪 Testing WebSocket SSH Proxy');
console.log('================================\n');

console.log(`📡 Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connected\n');
  
  console.log('📤 Sending SSH connection request...');
  const connectMsg = {
    type: 'connect',
    host: 'localhost',  // This will be ignored by proxy
    port: 2222,         // This will be ignored by proxy
    username: 'testuser',
    password: 'test123',
  };
  
  console.log('Request:', JSON.stringify(connectMsg, null, 2));
  ws.send(JSON.stringify(connectMsg));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('\n📥 Received message:');
    console.log('Type:', msg.type);
    
    if (msg.type === 'connected') {
      console.log('✅ SSH connection established!');
      console.log('Message:', msg.message);
      
      // Send a test command
      console.log('\n📤 Sending test command: whoami');
      ws.send(JSON.stringify({
        type: 'data',
        data: 'whoami\n',
      }));
      
      // Close after 2 seconds
      setTimeout(() => {
        console.log('\n👋 Closing connection...');
        ws.send(JSON.stringify({ type: 'disconnect' }));
        ws.close();
      }, 2000);
      
    } else if (msg.type === 'data') {
      console.log('Output:', msg.data);
      
    } else if (msg.type === 'error') {
      console.error('❌ Error:', msg.message);
      ws.close();
      
    } else if (msg.type === 'closed') {
      console.log('🔌 SSH connection closed');
      ws.close();
    }
  } catch (error) {
    console.error('❌ Failed to parse message:', error);
    console.log('Raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket connection closed');
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n⏱️  Timeout: No response after 10 seconds');
  ws.close();
  process.exit(1);
}, 10000);
