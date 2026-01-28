# Network Package

This package implements the WireGuard integration and Headscale connection management for Shadowd.

## Components

### WireGuardManager

The `WireGuardManager` is responsible for:

1. **WireGuard Key Management**: Generates and manages WireGuard private/public key pairs
2. **Headscale Registration**: Registers the device with the Headscale server and obtains mesh IP assignment
3. **Connection Management**: Initializes and maintains the WireGuard network interface
4. **Heartbeat Mechanism**: Sends periodic heartbeats to Headscale to maintain online status
5. **Health Checks**: Provides health check functionality to verify connection status
6. **Automatic Reconnection**: Detects network disconnections and automatically attempts to reconnect

## Features

### Heartbeat System

The manager sends periodic heartbeats to the Headscale server to:
- Update the device's "last seen" timestamp
- Maintain the connection state
- Detect network issues early

Default heartbeat interval: 30 seconds

### Connection Monitoring

A background goroutine continuously monitors the connection:
- Checks heartbeat freshness (fails if > 2x interval)
- Verifies WireGuard interface status
- Triggers automatic reconnection on failure

Check interval: 10 seconds

### Automatic Reconnection

When a connection failure is detected:
1. Marks the connection as disconnected
2. Waits for a configurable delay (default: 5 seconds)
3. Attempts to re-register with Headscale
4. Reinitializes the WireGuard interface
5. Retries up to a maximum number of attempts (default: 3)

### Health Check

The `HealthCheck()` method verifies:
- Connection status
- Mesh IP assignment
- IP address validity
- Heartbeat freshness (< 3x interval)

## Usage

```go
import (
    "github.com/shadow-shuttle/shadowd/network"
    "github.com/sirupsen/logrus"
)

// Create logger
log := logrus.New()

// Configure WireGuard manager
cfg := network.Config{
    HeadscaleURL:         "https://headscale.example.com",
    PreauthKey:           "your-preauth-key",
    DeviceName:           "MyComputer",
    HeartbeatInterval:    30 * time.Second,
    MaxReconnectAttempts: 3,
    ReconnectDelay:       5 * time.Second,
}

// Create manager
wgManager := network.NewWireGuardManager(cfg, log)

// Start the manager
if err := wgManager.Start(); err != nil {
    log.Fatal(err)
}
defer wgManager.Stop()

// Check connection status
if wgManager.IsConnected() {
    log.Info("Connected to mesh network")
    log.Infof("Mesh IP: %s", wgManager.GetMeshIP())
}

// Perform health check
if err := wgManager.HealthCheck(); err != nil {
    log.Warn("Health check failed:", err)
}

// Get detailed status
status := wgManager.GetStatus()
log.Info(status)
```

## Configuration

### Config Structure

```go
type Config struct {
    HeadscaleURL         string        // Headscale server URL
    PreauthKey           string        // Pre-authentication key
    DeviceName           string        // Device name
    HeartbeatInterval    time.Duration // Heartbeat interval (default: 30s)
    MaxReconnectAttempts int           // Max reconnection attempts (default: 3)
    ReconnectDelay       time.Duration // Delay between reconnects (default: 5s)
}
```

## Implementation Status

### ✅ Completed

- [x] Basic manager structure and lifecycle
- [x] Configuration management
- [x] Connection state tracking
- [x] Heartbeat mechanism
- [x] Connection monitoring
- [x] Automatic reconnection logic
- [x] Health check functionality
- [x] Status reporting
- [x] Thread-safe operations (mutex protection)
- [x] Graceful shutdown
- [x] Unit tests

### 🚧 TODO (Requires WireGuard Library Integration)

- [ ] Actual WireGuard key generation (currently using placeholders)
- [ ] Real Headscale API integration (HTTP client for registration)
- [ ] WireGuard interface initialization (device creation and configuration)
- [ ] Peer configuration from Headscale
- [ ] Network route management
- [ ] Interface up/down operations

## Testing

Run the unit tests:

```bash
cd shadowd
go test ./network/...
```

Run with verbose output:

```bash
go test -v ./network/...
```

Run with coverage:

```bash
go test -cover ./network/...
```

## Next Steps

1. **Integrate WireGuard Library**: Add `golang.zx2c4.com/wireguard` or similar library
2. **Implement Headscale API Client**: Create HTTP client for registration and heartbeat
3. **Complete Key Generation**: Use WireGuard library for proper key generation
4. **Interface Management**: Implement actual WireGuard device creation and configuration
5. **Add Integration Tests**: Test with real Headscale server

## Requirements Validation

This implementation addresses the following requirements:

- **Requirement 2.1**: Device registration and online status (via heartbeat)
- **Requirement 2.4**: Automatic connection to Headscale and heartbeat maintenance
- **Requirement 2.5**: Automatic reconnection on network disconnection

## Design Properties

This implementation supports the following design properties:

- **Property 5**: Network disconnection auto-reconnection (validates Requirement 2.5)
- **Property 4**: gRPC interface responsiveness (health check endpoint)
