# How to Run E2E Tests

## Quick Start

### 1. Setup Headscale Server

#### Option A: Use Docker (Recommended)
```bash
cd headscale
docker-compose up -d
```

#### Option B: Use Local Installation
```bash
cd headscale
make install
make start
```

### 2. Generate Pre-Auth Key
```bash
cd headscale
make create-preauth-key
```

Copy the generated key.

### 3. Configure Test Environment
```bash
cd mobile-app/src/services/vpn/__tests__/e2e
cp .env.test.example .env.test
```

Edit `.env.test` and add your configuration:
```bash
TEST_HEADSCALE_URL=http://localhost:8080
TEST_PREAUTH_KEY=<your-key-here>
```

### 4. Run Tests
```bash
cd mobile-app
npm run test:e2e
```

## Detailed Steps

### Step 1: Verify Prerequisites

Check that you have:
- [ ] Node.js 16+ installed
- [ ] React Native environment setup
- [ ] iOS Simulator or device (for iOS tests)
- [ ] Headscale server accessible

### Step 2: Install Dependencies
```bash
cd mobile-app
npm install
```

### Step 3: Build iOS Native Modules
```bash
cd ios
pod install
cd ..
```

### Step 4: Start Metro Bundler
```bash
npm start
```

### Step 5: Run Tests (in another terminal)

#### Run all E2E tests
```bash
npm run test:e2e
```

#### Run specific test
```bash
npm test -- VPNConnectionFlow.test.ts
```

#### Run with verbose output
```bash
npm test -- --verbose VPNConnectionFlow.test.ts
```

#### Run with coverage
```bash
npm run test:e2e:coverage
```

## Test Execution Flow

### VPNConnectionFlow.test.ts

```
┌─────────────────────────────────────┐
│ Step 1: Device Registration        │
│ - Register with Headscale           │
│ - Verify Mesh IP                    │
│ - Verify configuration saved        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 2: VPN Connection              │
│ - Connect to VPN                    │
│ - Verify connection status          │
│ - Check connection time             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 3: Mesh Network Verification  │
│ - Verify Mesh IP format             │
│ - Test Mesh IP detection            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 4: Performance Metrics         │
│ - Check connection metrics          │
│ - Verify session tracking           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 5: Disconnection               │
│ - Disconnect VPN                    │
│ - Verify clean disconnection        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 6: Configuration Cleanup       │
│ - Clear configuration               │
│ - Verify cleanup                    │
└─────────────────────────────────────┘
```

### DeviceConnectivity.test.ts

```
┌─────────────────────────────────────┐
│ Mesh IP Detection                   │
│ - Test valid/invalid Mesh IPs       │
│ - Classify test device IPs          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Device Reachability                 │
│ - Verify VPN connection             │
│ - Check Mesh IP configuration       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Connection Type Detection           │
│ - Detect Mesh/LAN/WAN               │
│ - Verify detection logic            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Device Addition Flow                │
│ - Test IP preference                │
│ - Verify Mesh IP hints              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Network Switching                   │
│ - Handle VPN state changes          │
│ - Update device connectivity        │
└─────────────────────────────────────┘
```

## Expected Output

### Successful Test Run
```
 PASS  src/services/vpn/__tests__/e2e/VPNConnectionFlow.test.ts
  E2E: Complete VPN Connection Flow
    Step 1: Device Registration
      ✓ should register device with Headscale (2345ms)
      ✓ should have saved configuration after registration (123ms)
    Step 2: VPN Connection
      ✓ should connect to VPN successfully (3456ms)
      ✓ should have valid connection info (45ms)
    Step 3: Mesh Network Verification
      ✓ should have valid Mesh IP (67ms)
      ✓ should be able to detect Mesh network (23ms)
    Step 4: Performance Metrics
      ✓ should have recorded connection metrics (34ms)
      ✓ should have active session (12ms)
    Step 5: Disconnection
      ✓ should disconnect successfully (234ms)
      ✓ should have ended session metrics (45ms)
    Step 6: Configuration Cleanup
      ✓ should clear configuration (123ms)

 PASS  src/services/vpn/__tests__/e2e/DeviceConnectivity.test.ts
  E2E: Device Connectivity through Mesh Network
    Mesh IP Detection
      ✓ should correctly identify Mesh IP addresses (12ms)
      ✓ should identify test device Mesh IP correctly (8ms)
    Device Reachability
      ✓ should verify VPN is connected before testing (45ms)
      ✓ should have valid Mesh IP configuration (67ms)
    Connection Type Detection
      ✓ should detect connection type based on IP (15ms)
    Device Addition Flow
      ✓ should prefer Mesh IP when VPN is connected (23ms)
      ✓ should show Mesh IP hint when VPN is connected (12ms)
    Network Switching
      ✓ should handle VPN connection state changes (89ms)
      ✓ should update device connectivity based on VPN status (34ms)

Test Suites: 2 passed, 2 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        8.234 s
```

## Troubleshooting

### Tests Fail to Start
```
Error: Cannot find module 'react-native'
```
**Solution**: Run `npm install` in mobile-app directory

### Headscale Connection Failed
```
Error: Network request failed
```
**Solution**: 
- Check Headscale server is running: `docker ps` or `make status`
- Verify TEST_HEADSCALE_URL is correct
- Check firewall settings

### Registration Timeout
```
Error: Timeout - Async callback was not invoked within the 30000 ms timeout
```
**Solution**:
- Increase timeout in test file
- Check Headscale server performance
- Verify pre-auth key is valid

### VPN Connection Failed
```
Error: VPN connection failed
```
**Solution**:
- Check iOS VPN permissions
- Verify WireGuard configuration
- Check device logs: `npm run ios:logs`

### Tests Pass but VPN Doesn't Work in App
This means the test environment differs from the app environment:
- Check DI container registration in App.tsx
- Verify native modules are properly linked
- Test on real device, not just simulator

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd mobile-app
          npm install
      
      - name: Start Headscale
        run: |
          cd headscale
          docker-compose up -d
          sleep 10
      
      - name: Generate Pre-Auth Key
        run: |
          cd headscale
          KEY=$(make create-preauth-key)
          echo "TEST_PREAUTH_KEY=$KEY" >> $GITHUB_ENV
      
      - name: Run E2E Tests
        env:
          TEST_HEADSCALE_URL: http://localhost:8080
          TEST_PREAUTH_KEY: ${{ env.TEST_PREAUTH_KEY }}
        run: |
          cd mobile-app
          npm run test:e2e
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./mobile-app/coverage/lcov.info
```

## Performance Benchmarks

Target performance metrics:
- Device registration: < 30s
- VPN connection: < 15s
- Configuration save: < 1s
- Mesh IP detection: < 100ms

## Next Steps

After E2E tests pass:
1. Run on real iOS device
2. Test with multiple devices
3. Test network switching scenarios
4. Test background/foreground transitions
5. Perform stress testing
