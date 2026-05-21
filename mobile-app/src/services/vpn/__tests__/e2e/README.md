# End-to-End Tests for VPN Integration

## Overview

This directory contains end-to-end tests that verify the complete VPN connection flow from device registration to network connectivity.

## Test Files

### 1. VPNConnectionFlow.test.ts
Tests the complete VPN connection lifecycle:
- Device registration with Headscale
- WireGuard configuration retrieval and storage
- VPN connection establishment
- Mesh IP verification
- Performance metrics validation
- Disconnection and cleanup

### 2. DeviceConnectivity.test.ts
Tests device connectivity through the Mesh network:
- Mesh IP detection and validation
- Connection type detection (Mesh/LAN/WAN)
- Device reachability verification
- Network switching behavior

## Prerequisites

### 1. Headscale Server
You need a running Headscale server for testing. You can use:
- Local Headscale instance (recommended for testing)
- Docker container: `docker-compose up -d` in `headscale/` directory

### 2. Pre-Auth Key
Generate a pre-auth key from your Headscale server:
```bash
cd headscale
make create-preauth-key
```

### 3. Test Device (Optional)
For device connectivity tests, you need a device in the Mesh network:
- Another device with Headscale client installed
- Or use the Headscale server itself

## Configuration

Create a `.env.test` file in the project root:

```bash
# Headscale Configuration
TEST_HEADSCALE_URL=http://localhost:8080
TEST_PREAUTH_KEY=your-preauth-key-here

# Test Device Configuration (optional)
TEST_DEVICE_MESH_IP=100.64.0.2
TEST_DEVICE_LAN_IP=192.168.1.100
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm test -- VPNConnectionFlow.test.ts
npm test -- DeviceConnectivity.test.ts
```

### Run with coverage
```bash
npm run test:e2e:coverage
```

### Run in watch mode
```bash
npm run test:e2e:watch
```

## Test Scenarios

### Scenario 1: First-Time Setup
1. User opens VPN settings
2. Enters Headscale URL and pre-auth key
3. Clicks "Register Device"
4. App registers with Headscale
5. App retrieves WireGuard configuration
6. Configuration is saved securely
7. User clicks "Connect"
8. VPN connects successfully
9. Mesh IP is displayed

### Scenario 2: Adding Device via Mesh Network
1. VPN is connected
2. User opens "Add Device" modal
3. App shows Mesh IP hint
4. User enters device Mesh IP
5. Device is added and marked as "Mesh Network"
6. User can connect to device via SSH

### Scenario 3: Network Switching
1. VPN is connected (using Mesh network)
2. Network changes (WiFi → Cellular)
3. Auto-reconnect triggers
4. VPN reconnects automatically
5. Device connectivity maintained

## Expected Results

### VPNConnectionFlow.test.ts
- ✅ Device registration completes in < 30s
- ✅ Mesh IP is in valid range (100.64.0.0/10)
- ✅ Configuration is saved and retrievable
- ✅ VPN connection completes in < 15s
- ✅ Connection info is accurate
- ✅ Performance metrics are recorded
- ✅ Disconnection is clean

### DeviceConnectivity.test.ts
- ✅ Mesh IP detection is accurate
- ✅ Connection type detection works correctly
- ✅ Device addition prefers Mesh IP when VPN is connected
- ✅ Network switching updates device connectivity

## Troubleshooting

### Test Timeout
If tests timeout, check:
- Headscale server is running and accessible
- Pre-auth key is valid
- Network connectivity is stable

### Registration Fails
- Verify Headscale URL is correct
- Check pre-auth key hasn't expired
- Ensure Headscale server is configured correctly

### Connection Fails
- Check iOS VPN permissions are granted
- Verify WireGuard configuration is valid
- Check device logs for errors

### Device Not Reachable
- Ensure test device is in the same Mesh network
- Verify Mesh IP is correct
- Check firewall rules

## CI/CD Integration

These tests can be run in CI/CD pipelines with some modifications:

1. **Mock Mode**: Use mocked Headscale responses
2. **Test Server**: Deploy temporary Headscale instance
3. **Skip Device Tests**: Only run connection flow tests

Example GitHub Actions workflow:
```yaml
- name: Run E2E Tests
  env:
    TEST_HEADSCALE_URL: ${{ secrets.TEST_HEADSCALE_URL }}
    TEST_PREAUTH_KEY: ${{ secrets.TEST_PREAUTH_KEY }}
  run: npm run test:e2e
```

## Performance Benchmarks

Expected performance metrics:
- Device registration: < 30 seconds
- VPN connection: < 15 seconds
- Configuration save/load: < 1 second
- Mesh IP detection: < 100ms

## Security Notes

- Pre-auth keys should be rotated regularly
- Test configurations should not use production credentials
- Mesh IPs should be validated before use
- All sensitive data should be cleared after tests

## Future Improvements

- [ ] Add SSH connection tests
- [ ] Add network latency tests
- [ ] Add bandwidth tests
- [ ] Add multi-device tests
- [ ] Add stress tests (many connections)
- [ ] Add background/foreground transition tests
