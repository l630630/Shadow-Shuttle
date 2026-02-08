/**
 * WebSocket SSH Proxy Server
 * 为 React Native 应用提供 SSH 连接代理
 */

const WebSocket = require('ws');
const { Client } = require('ssh2');

const PORT = process.env.PORT || 8022;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket SSH Proxy Server listening on port ${PORT}`);
console.log(`📱 Mobile app should connect to: ws://10.0.2.2:${PORT}`);

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`✅ Client connected from ${clientIP}`);
  
  const sshClient = new Client();
  let stream = null;
  let isConnected = false;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'connect') {
        console.log(`🔌 Connecting to SSH server ${data.host}:${data.port}...`);
        
        // SSH 连接配置
        const sshConfig = {
          host: data.host || 'localhost',
          port: data.port || 22,
          username: data.username,
        };
        
        // 添加认证方式
        if (data.password) {
          sshConfig.password = data.password;
        } else if (data.privateKey) {
          sshConfig.privateKey = data.privateKey;
        }
        
        // 连接到 SSH 服务器
        sshClient.on('ready', () => {
          console.log(`✅ SSH connection established to ${data.host}:${data.port}`);
          isConnected = true;
          
          ws.send(JSON.stringify({ 
            type: 'connected',
            message: 'SSH connection established'
          }));
          
          // 打开交互式 shell
          sshClient.shell((err, s) => {
            if (err) {
              console.error('❌ Failed to open shell:', err.message);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: `Failed to open shell: ${err.message}`
              }));
              return;
            }
            
            stream = s;
            console.log('✅ Shell opened');
            
            // 转发 SSH 输出到 WebSocket
            stream.on('data', (data) => {
              ws.send(JSON.stringify({ 
                type: 'data', 
                data: data.toString('utf-8') 
              }));
            });
            
            stream.stderr.on('data', (data) => {
              ws.send(JSON.stringify({ 
                type: 'data', 
                data: data.toString('utf-8') 
              }));
            });
            
            stream.on('close', () => {
              console.log('📪 Shell closed');
              ws.send(JSON.stringify({ type: 'closed' }));
              sshClient.end();
              isConnected = false;
            });
          });
        });
        
        sshClient.on('error', (err) => {
          console.error('❌ SSH error:', err.message);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: err.message 
          }));
          isConnected = false;
        });
        
        sshClient.on('close', () => {
          console.log('📪 SSH connection closed');
          if (isConnected) {
            ws.send(JSON.stringify({ type: 'closed' }));
          }
          isConnected = false;
        });
        
        // 开始连接
        sshClient.connect(sshConfig);
        
      } else if (data.type === 'data') {
        // 转发命令到 SSH
        if (stream && isConnected) {
          stream.write(data.data);
        } else {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Not connected to SSH server' 
          }));
        }
        
      } else if (data.type === 'resize') {
        // 调整终端大小
        if (stream && isConnected) {
          stream.setWindow(data.rows, data.cols);
        }
        
      } else if (data.type === 'disconnect') {
        console.log('🔌 Client requested disconnect');
        if (stream) {
          stream.end();
        }
        sshClient.end();
        isConnected = false;
      }
    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Server error: ${error.message}` 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`📪 Client disconnected from ${clientIP}`);
    if (stream) {
      stream.end();
    }
    sshClient.end();
    isConnected = false;
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

wss.on('error', (error) => {
  console.error('❌ WebSocket Server error:', error.message);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
