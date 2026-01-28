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

### M4: Expert Terminal (Planned)
- SSH connection service
- Terminal UI with ANSI support
- Command execution
- Device fingerprint verification
- Secure key storage

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

## Screens

### Device List Screen
- Displays all paired devices
- Shows online/offline status
- VPN connection toggle
- Pull-to-refresh
- Navigate to terminal

### QR Scanner Screen
- Scan device QR codes
- Validate pairing codes
- Add devices automatically
- Instructions for pairing

## TODO: Native Modules

The following features require native module integration:

1. **WireGuard VPN**
   - iOS: Use WireGuardKit
   - Android: Use wireguard-android library
   - Package: `react-native-wireguard` (custom)

2. **QR Code Scanner**
   - Package: `react-native-qrcode-scanner`
   - Requires camera permissions

3. **SSH Client**
   - Package: `react-native-ssh` (custom)
   - Native SSH implementation

4. **Secure Storage**
   - Package: `react-native-keychain`
   - For SSH private keys

## Development Notes

### Placeholder Implementations

Current implementation includes placeholder code for:
- WireGuard connection (needs native module)
- gRPC calls (needs protobuf compilation)
- QR scanner (needs camera integration)

These will be replaced with actual implementations when native modules are integrated.

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
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
