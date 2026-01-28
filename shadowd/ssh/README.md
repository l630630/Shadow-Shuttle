# SSH Server Module

This module implements a secure SSH server for Shadowd that listens on the Mesh IP address and provides remote access to the device.

## Features

- **Mesh IP Binding**: SSH server listens only on the WireGuard Mesh IP address
- **Public Key Authentication**: Only SSH key-based authentication is supported (password authentication is disabled)
- **Access Control**: Only connections from the Mesh network (100.64.0.0/10) are allowed
- **Host Key Management**: Automatic generation and persistence of SSH host keys
- **Authorized Keys**: Support for authorized_keys file for managing allowed public keys

## Security

### Requirements Met

- **Requirement 2.2**: SSH server accepts connections on Mesh IP address
- **Requirement 5.2**: SSH密钥认证强制 - Password authentication is disabled, only public key authentication is allowed
- **Requirement 5.3**: Mesh网络访问控制 - Only connections from Mesh network IP ranges are accepted

### Security Features

1. **No Password Authentication**: The `passwordHandler` always returns `false`, ensuring passwords cannot be used
2. **Network-Level Access Control**: IP-based filtering ensures only Mesh network clients can connect
3. **Public Key Verification**: Only pre-authorized public keys can authenticate
4. **Host Key Persistence**: Host keys are generated once and persisted to prevent MITM attacks

## Configuration

```yaml
ssh:
  # SSH server port (default: 22)
  port: 22
  
  # Path to SSH host key file (will be generated if not exists)
  host_key_path: /etc/shadowd/ssh_host_key
  
  # Path to authorized_keys file
  authorized_keys_path: /etc/shadowd/authorized_keys
  
  # Allowed networks (CIDR notation)
  allowed_networks:
    - 100.64.0.0/10  # Mesh network
```

## Usage

### Starting the SSH Server

```go
import (
    "github.com/shadow-shuttle/shadowd/ssh"
    "github.com/sirupsen/logrus"
)

log := logrus.New()

cfg := ssh.Config{
    MeshIP:             "100.64.0.1",
    Port:               22,
    HostKeyPath:        "/etc/shadowd/ssh_host_key",
    AuthorizedKeysPath: "/etc/shadowd/authorized_keys",
    AllowedNetworks:    []string{"100.64.0.0/10"},
}

server, err := ssh.NewServer(cfg, log)
if err != nil {
    log.Fatal(err)
}

if err := server.Start(); err != nil {
    log.Fatal(err)
}

// Server is now running
defer server.Stop()
```

### Managing Authorized Keys

The server supports two methods for managing authorized keys:

#### 1. Using authorized_keys File

Create a file at the configured path with SSH public keys (one per line):

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... user@host
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... user@host2
```

#### 2. Programmatic Management

```go
// Add a key
server.AddAuthorizedKey(publicKey)

// Remove a key
server.RemoveAuthorizedKey(publicKey)

// Get count
count := server.GetAuthorizedKeyCount()
```

## Access Control

The SSH server implements network-level access control to ensure only Mesh network clients can connect:

1. When a connection is received, the remote IP is extracted
2. The IP is checked against the configured `AllowedNetworks` CIDR ranges
3. If the IP is not in an allowed range, the connection is immediately rejected
4. Only after passing IP validation is public key authentication attempted

### Default Allowed Networks

By default, only the Mesh network range is allowed:
- `100.64.0.0/10` - Headscale/Tailscale Mesh network range

### Custom Allowed Networks

You can configure additional networks if needed:

```yaml
ssh:
  allowed_networks:
    - 100.64.0.0/10   # Mesh network
    - 192.168.1.0/24  # Local network (for testing)
```

## Host Key Management

The SSH server automatically manages host keys:

1. **First Run**: If no host key exists at `host_key_path`, a new RSA 2048-bit key is generated
2. **Subsequent Runs**: The existing host key is loaded from disk
3. **Key Format**: Keys are stored in PEM format (OpenSSH compatible)

### Manual Host Key Generation

You can also generate host keys manually:

```bash
ssh-keygen -t rsa -b 2048 -f /etc/shadowd/ssh_host_key -N ""
```

## Testing

Run the unit tests:

```bash
cd shadowd/ssh
go test -v
```

### Test Coverage

- Configuration validation
- IP-based access control
- Password authentication denial
- Public key authentication
- Authorized key management
- Host key generation and loading
- Server start/stop lifecycle

## Integration with Shadowd

The SSH server is integrated into the main Shadowd application:

1. WireGuard manager starts and obtains Mesh IP
2. SSH server is initialized with the Mesh IP
3. SSH server starts listening on `<MeshIP>:22`
4. Mobile clients can connect via SSH using their private keys

## Limitations

### Current Implementation

- **Shell Execution**: Interactive shell and command execution are not yet fully implemented
- **PTY Support**: PTY (pseudo-terminal) handling is basic
- **Session Management**: No session persistence or reconnection support

### Future Enhancements

- Full shell execution with proper PTY handling
- Command execution with output streaming
- Session recording and audit logging
- Rate limiting and connection throttling
- Support for SSH agent forwarding
- Support for port forwarding

## Troubleshooting

### Server Won't Start

1. Check if the Mesh IP is valid and assigned
2. Verify the port is not already in use
3. Ensure the host key path is writable
4. Check file permissions on host key (should be 0600)

### Authentication Failures

1. Verify the public key is in the authorized_keys file
2. Check the authorized_keys file format (one key per line)
3. Ensure the authorized_keys file is readable
4. Check logs for specific authentication errors

### Connection Refused

1. Verify the client is connecting from the Mesh network
2. Check the allowed_networks configuration
3. Ensure WireGuard is connected and Mesh IP is assigned
4. Verify firewall rules allow SSH traffic

## References

- [gliderlabs/ssh](https://github.com/gliderlabs/ssh) - SSH server library
- [golang.org/x/crypto/ssh](https://pkg.go.dev/golang.org/x/crypto/ssh) - SSH protocol implementation
- [OpenSSH authorized_keys format](https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT)
