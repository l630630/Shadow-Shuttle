# gRPC Module

This module implements the gRPC-Web interface for Shadowd, providing device information and pairing functionality for mobile clients.

## Overview

The gRPC server exposes three main RPC methods:

1. **GetDeviceInfo**: Returns detailed information about the device
2. **GeneratePairingCode**: Generates a pairing code for QR code scanning
3. **HealthCheck**: Returns the health status of the daemon

## Architecture

```
┌─────────────────┐
│  Mobile Client  │
└────────┬────────┘
         │ gRPC-Web
         ▼
┌─────────────────┐
│  gRPC Server    │
│  (Port 50051)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Device Info    │
│  Management     │
└─────────────────┘
```

## Protocol Buffers Definition

The service is defined in `proto/device.proto`:

```protobuf
service DeviceService {
  rpc GetDeviceInfo(Empty) returns (DeviceInfo);
  rpc GeneratePairingCode(Empty) returns (PairingCode);
  rpc HealthCheck(Empty) returns (HealthStatus);
}
```

## Usage

### Creating a Server

```go
import (
    "github.com/shadow-shuttle/shadowd/grpc"
    "github.com/shadow-shuttle/shadowd/types"
)

// Create device info
deviceInfo := grpc.GetDeviceInfoFromSystem(meshIP, sshPort, grpcPort)

// Configure server
config := grpc.Config{
    MeshIP:     "100.64.0.1",
    Port:       50051,
    TLSEnabled: false,
}

// Create and start server
server, err := grpc.NewServer(config, deviceInfo, log)
if err != nil {
    log.Fatal(err)
}

if err := server.Start(); err != nil {
    log.Fatal(err)
}
defer server.Stop()
```

### RPC Methods

#### GetDeviceInfo

Returns comprehensive device information including:
- Device ID and name
- Operating system and version
- Mesh IP address
- SSH and gRPC ports
- Online status

**Example Response:**
```json
{
  "id": "mycomputer-1234567890",
  "name": "mycomputer",
  "os": "linux",
  "os_version": "Ubuntu 20.04",
  "mesh_ip": "100.64.0.1",
  "public_key": "wg-public-key",
  "is_online": true,
  "last_seen": 1234567890,
  "ssh_port": 22,
  "grpc_port": 50051
}
```

#### GeneratePairingCode

Generates a pairing code for QR code scanning. The code includes:
- Device ID and name
- Mesh IP address
- Public key
- Timestamp (for replay attack prevention)

**Example Response:**
```json
{
  "device_id": "mycomputer-1234567890",
  "device_name": "mycomputer",
  "mesh_ip": "100.64.0.1",
  "public_key": "wg-public-key",
  "timestamp": 1234567890
}
```

**Security Note:** The timestamp should be validated by the client to ensure the pairing code is recent (e.g., within 5 minutes).

#### HealthCheck

Returns the health status of the daemon:
- Status: "healthy", "degraded", or "unhealthy"
- Uptime in seconds
- Connection status to Headscale
- Last check timestamp

**Example Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "connected": true,
  "last_check": 1234567890
}
```

## Configuration

The gRPC server is configured via the main `shadowd.yaml` configuration file:

```yaml
grpc:
  port: 50051
  tls_enabled: false
```

### Configuration Options

- **port**: The port to listen on (default: 50051)
- **tls_enabled**: Whether to enable TLS (default: false)

## Security

### Network Access Control

The gRPC server listens on the Mesh IP address, which means it's only accessible from within the Mesh network. This provides network-level isolation.

### Future Enhancements

- **TLS Support**: Add mutual TLS authentication
- **Rate Limiting**: Prevent abuse of the API
- **Authentication**: Add token-based authentication for additional security

## Testing

Run the unit tests:

```bash
go test -v ./grpc
```

Run tests with coverage:

```bash
go test -cover ./grpc
```

## Implementation Details

### Device Information Collection

The `GetDeviceInfoFromSystem` function collects device information from the system:

```go
func GetDeviceInfoFromSystem(meshIP string, sshPort, grpcPort int) *types.Device {
    hostname, _ := os.Hostname()
    
    return &types.Device{
        ID:        generateDeviceID(hostname),
        Name:      hostname,
        OS:        runtime.GOOS,
        OSVersion: getOSVersion(),
        MeshIP:    meshIP,
        SSHPort:   sshPort,
        GRPCPort:  grpcPort,
        IsOnline:  true,
        LastSeen:  time.Now(),
    }
}
```

### Server Lifecycle

1. **Initialization**: Create server with configuration and device info
2. **Start**: Bind to address and start accepting connections
3. **Serve**: Handle incoming RPC requests
4. **Stop**: Gracefully shutdown and cleanup resources

## Integration with Main Application

The gRPC server is initialized in `main.go`:

```go
// Initialize gRPC server
grpcServer := initializeGRPC(cfg, meshIP, log)
if grpcServer == nil {
    log.Fatal("Failed to initialize gRPC server")
}
defer grpcServer.Stop()
```

## Troubleshooting

### Server fails to start

**Error**: `failed to listen on address`

**Solution**: Check if the port is already in use or if the Mesh IP is correctly configured.

### Client cannot connect

**Error**: Connection timeout or refused

**Solution**: 
1. Verify the client is connected to the Mesh network
2. Check firewall rules
3. Verify the server is running and listening on the correct address

### Health check shows "degraded"

**Cause**: The device is not connected to Headscale

**Solution**: Check the WireGuard connection and Headscale configuration.

## Future Improvements

1. **gRPC-Web Proxy**: Add Envoy or similar proxy for browser-based clients
2. **Streaming RPCs**: Add streaming support for real-time updates
3. **Metrics**: Add Prometheus metrics for monitoring
4. **Tracing**: Add distributed tracing support
5. **API Versioning**: Support multiple API versions for backward compatibility

## References

- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [gRPC-Web](https://github.com/grpc/grpc-web)
