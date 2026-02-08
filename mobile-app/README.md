# Shadow Shuttle Mobile App

React Native mobile application for Shadow Shuttle - secure SSH access over private Mesh network.

## Features

### M3: Network Connection & Device Discovery
- ✅ VPN connection management (WireGuard)
- ✅ Device discovery via gRPC
- ✅ QR code pairing
- ✅ Device list with online status
- ✅ Local device persistence (AsyncStorage)
- ✅ Auto-refresh device statuses (30s interval)

### M4: Expert Terminal
- ✅ SSH connection service (via WebSocket proxy)
- ✅ Terminal UI with ANSI support
- ✅ Command execution
- ✅ Real-time output streaming
- ✅ Password authentication
- ✅ Device fingerprint verification
- ✅ Secure key storage

### Natural Language Control (NLC)
- ✅ AI-powered command generation
- ✅ Natural language to shell command translation
- ✅ Command safety checking
- ✅ Voice input support
- ✅ Command suggestions
- ✅ Conversation history
- ✅ **Multi-AI Provider Support**:
  - OpenAI (GPT-4)
  - Claude (Claude 3.5 Sonnet)
  - **Google Gemini (Gemini Pro)** ⭐ NEW!

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # UI screens
│   │   ├── DeviceListScreen.tsx
│   │   └── QRScannerScreen.tsx
│   ├── components/       # Reusable components
│   ├── services/         # Business logic services
│   │   ├── vpnService.ts
│   │   ├── grpcClient.ts
│   │   └── qrCodeService.ts
│   ├── stores/           # Zustand state management
│   │   ├── vpnStore.ts
│   │   └── deviceStore.ts
│   ├── types/            # TypeScript type definitions
│   │   └── device.ts
│   └── utils/            # Utility functions
├── App.tsx               # Main app component
├── package.json
└── tsconfig.json
```

## Installation

### Prerequisites
- Node.js >= 18
- React Native development environment
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Setup

```bash
# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### 📱 iOS Development Guides

- **[Quick Start - Real Device Testing](./QUICK_START_REAL_DEVICE.md)** - 5 分钟上手真机测试
- **[Xcode Usage Guide](./RUN_IOS_WITH_XCODE.md)** - 使用 Xcode 运行应用
- **[Real Device Testing Guide](./REAL_DEVICE_TESTING.md)** - 完整的真机测试指南
- **[Testing Checklist](./DEVICE_TESTING_CHECKLIST.md)** - 测试检查清单

### SSH Proxy Server Setup

**Note**: As of version 0.3.0, the WebSocket SSH proxy is built into shadowd. You no longer need to run a separate Node.js proxy server.

The shadowd daemon provides all necessary services:
- SSH Server (port 2222)
- WebSocket SSH Proxy (port 8022)
- gRPC API (port 50052)

Simply start shadowd and all services will be available:

```bash
cd shadowd
./shadowd -config shadowd.yaml
```

For detailed WebSocket SSH proxy documentation, see [shadowd/WEBSOCKET_SSH_GUIDE.md](../shadowd/WEBSOCKET_SSH_GUIDE.md).

#### Connection Configuration

The mobile app connects to shadowd's WebSocket proxy:
- **Android Emulator**: `ws://10.0.2.2:8022`
- **iOS Simulator**: `ws://localhost:8022`
- **Real Device**: Update `proxyServerUrl` in `src/services/sshService.ts` to your computer's IP address

**Important**: Ensure shadowd is running before using SSH features in the mobile app.

## State Management

The app uses Zustand for state management with two main stores:

### VPN Store (`vpnStore.ts`)
- Connection status
- Connect/disconnect actions
- Error handling

### Device Store (`deviceStore.ts`)
- Device list management
- Local persistence
- Status refresh
- Add/remove devices

## Services

### SSH Service (`sshService.ts`)
Manages SSH connections via shadowd's WebSocket proxy:
- Connect to remote devices
- Execute commands in real-time
- Stream output with ANSI support
- Handle connection errors
- Session management

**Configuration**:
- `useRealSSH = true`: Uses real SSH via shadowd's WebSocket proxy
- `proxyServerUrl`: WebSocket proxy server address (shadowd port 8022)

### VPN Service (`vpnService.ts`)
Manages WireGuard VPN connections:
- Connect to Mesh network
- Disconnect and cleanup
- Status monitoring

### gRPC Client (`grpcClient.ts`)
Communicates with Shadowd daemon:
- Get device information
- Generate pairing codes
- Health checks

### QR Code Service (`qrCodeService.ts`)
Handles device pairing:
- Parse QR code data
- Validate timestamps (防重放攻击)
- Convert to device objects

### Natural Language Controller (`nlController.ts`)
AI-powered command generation:
- Parse natural language input
- Generate shell commands
- Safety checking for dangerous commands
- Context-aware suggestions

### Voice Input Module (`voiceInputModule.ts`)
Voice command support:
- Speech-to-text conversion
- Real-time recording
- Multi-language support

## Screens

### Dashboard (Home Screen)
- VPN connection status
- Device statistics (online/offline)
- Quick access to devices
- Mesh network overview

### Device List Screen
- Displays all paired devices
- Shows online/offline status
- VPN connection toggle
- Pull-to-refresh
- Navigate to terminal or AI chat

### Terminal Screen
- Full-screen SSH terminal
- Real-time command execution
- ANSI color support
- Command history
- Copy/paste support

### AI Chat Screen
- Natural language command interface
- AI-powered command generation
- Command preview with safety warnings
- Conversation history
- Voice input support
- Device switching

### QR Scanner Screen
- Scan device QR codes
- Validate pairing codes
- Add devices automatically
- Instructions for pairing

### Command History Screen
- View past commands
- Filter by device
- Re-execute commands
- Export history

### Profile Screen
- User settings
- API key management
- App preferences
- About information

## TODO: Native Modules

The following features require native module integration:

1. **WireGuard VPN**
   - iOS: Use WireGuardKit
   - Android: Use wireguard-android library
   - Package: `react-native-wireguard` (custom)

2. **QR Code Scanner**
   - Package: `react-native-qrcode-scanner`
   - Requires camera permissions

3. **Secure Storage**
   - Package: `react-native-keychain`
   - For SSH private keys

## Usage Guide

### Connecting to a Device via SSH

1. **Start Shadowd**:
   ```bash
   cd shadowd
   ./shadowd -config shadowd.yaml
   ```

2. **Connect VPN** in the mobile app (Dashboard → Connect VPN)

3. **Select a Device** from the device list

4. **Enter SSH Password** when prompted

5. **Start Using Terminal** or **AI Chat**

### Using AI Chat

1. Navigate to the AI Chat tab
2. Select a device (or it will auto-select the first online device)
3. Enter SSH password to connect
4. Type natural language commands like:
   - "列出当前目录的文件"
   - "查看系统内存使用情况"
   - "创建一个名为 test 的文件夹"
5. Review the generated command
6. Confirm to execute or cancel

### Using Voice Input

1. In AI Chat screen, press and hold the microphone button
2. Speak your command in natural language
3. Release the button to process
4. The text will appear in the input field

### Configuring AI Providers

Shadow Shuttle supports multiple AI providers. You can configure and switch between them:

#### Supported Providers

1. **OpenAI (GPT-4)**
   - Get API key: https://platform.openai.com/api-keys
   - Format: `sk-...`

2. **Claude (Claude 3.5 Sonnet)**
   - Get API key: https://console.anthropic.com/
   - Format: `sk-ant-...`

3. **Google Gemini (Gemini Pro)** ⭐
   - Get API key: https://makersuite.google.com/app/apikey
   - Format: `AIza...`
   - See detailed setup: [GEMINI_SETUP.md](docs/GEMINI_SETUP.md)

#### Configuration Steps

1. **Open AI Settings**:
   - Navigate to: Profile → System Settings → AI Providers
   - Or use the dedicated AI Settings screen

2. **Add API Key**:
   - Select a provider (OpenAI, Claude, or Gemini)
   - Paste your API key
   - Click "Save"

3. **Select Active Provider**:
   - Click on the provider card to activate it
   - The app will use this provider for all AI commands

4. **Test the Connection**:
   - Go to AI Chat
   - Try a simple command like "list files"
   - Verify the AI generates the correct command

#### Security

- All API keys are encrypted using **Expo SecureStore**
- Keys are stored in device secure storage (Keychain/Keystore)
- Only masked versions are displayed in the UI (e.g., `sk-...xyz`)
- Keys are never transmitted to Shadow Shuttle servers

#### Testing Gemini

Run the test script to verify your Gemini setup:

```bash
# Set your API key
export GEMINI_API_KEY="your-api-key-here"

# Run the test
npx ts-node scripts/test-gemini.ts
```

For detailed Gemini setup instructions, see [docs/GEMINI_SETUP.md](docs/GEMINI_SETUP.md)

## Troubleshooting

### SSH Connection Fails

1. **Check Shadowd**: Ensure shadowd is running (`ps aux | grep shadowd`)
2. **Check Ports**: Verify ports 2222 and 8022 are listening (`lsof -i :8022`)
3. **Check Network**: Verify VPN is connected
4. **Check Device**: Ensure target device is online
5. **Check Credentials**: Verify SSH username and password in shadowd.yaml
6. **Check Firewall**: Ensure port 8022 is not blocked
7. **Check Logs**: View shadowd logs for errors

### WebSocket Connection Error

- **Android Emulator**: Use `ws://10.0.2.2:8022`
- **iOS Simulator**: Use `ws://localhost:8022`
- **Real Device**: Update `proxyServerUrl` in `sshService.ts` to your computer's IP
- **Verify Shadowd**: Ensure shadowd is running and WebSocket proxy is active

### Commands Not Executing

1. Check SSH session is still active
2. Verify network connection
3. Check shadowd logs for errors
4. Try reconnecting to the device

## Development Notes

### Real SSH Implementation

The app uses **real SSH connections** via shadowd's built-in WebSocket proxy:

- **Shadowd Integration**: WebSocket SSH proxy is built into shadowd (Go)
- **SSH Service**: `src/services/sshService.ts` with `useRealSSH = true`
- **Protocol**: WebSocket messages for SSH commands and output
- **Authentication**: Supports both password and private key authentication
- **Performance**: Better performance and lower memory usage than Node.js proxy (~10MB vs ~50MB)

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

### Building for Production

```bash
# Android
cd android
./gradlew assembleRelease

# iOS
cd ios
xcodebuild -workspace ShadowShuttleTemp.xcworkspace -scheme ShadowShuttleTemp -configuration Release
```

## Security Considerations

1. **Pairing Code Validation**
   - 5-minute expiration window
   - Timestamp verification
   - Signature validation (TODO)

2. **Secure Storage**
   - SSH keys stored in platform keychain
   - Device credentials encrypted

3. **Network Isolation**
   - All communication over Mesh network
   - No external internet access required

## License

MIT
