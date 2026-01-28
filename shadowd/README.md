# Shadowd - Shadow Shuttle Daemon

Shadowd is the daemon component of the Shadow Shuttle system that runs on user computers. It provides SSH access and device information through a gRPC interface over a private Mesh network.

## Features

- **Mesh Network Integration**: Connects to Headscale server and joins the WireGuard-based Mesh network
- **SSH Server**: Provides secure SSH access through the Mesh network
- **gRPC Interface**: Exposes device information and pairing functionality via gRPC-Web
- **Cross-Platform**: Runs on Windows, macOS, and Linux as a system service
- **Auto-Reconnect**: Automatically reconnects to Headscale if the network connection is lost

## Requirements

- Go 1.21 or later
- WireGuard installed on the system
- Access to a Headscale server

## Installation

### Quick Installation (Recommended)

For automated installation as a system service, see [INSTALL.md](INSTALL.md).

```bash
# Linux
sudo ./scripts/install-linux.sh

# macOS
sudo ./scripts/install-macos.sh

# Windows (PowerShell as Administrator)
.\scripts\install-windows.ps1
```

### From Source

```bash
# Clone the repository
git clone https://github.com/shadow-shuttle/shadowd.git
cd shadowd

# Build the binary
go build -o shadowd

# Copy the example configuration
cp config.example.yaml shadowd.yaml

# Edit the configuration with your settings
nano shadowd.yaml
```

## Configuration

Create a `shadowd.yaml` file with the following structure:

```yaml
headscale:
  url: https://your-headscale-server.com
  preauth_key: your-preauth-key

ssh:
  port: 22
  host_key_path: /etc/shadowd/ssh_host_key

grpc:
  port: 50051
  tls_enabled: false

device:
  name: MyComputer
```

### Configuration Options

- **headscale.url**: URL of your Headscale server
- **headscale.preauth_key**: Pre-authentication key from Headscale (generate with `headscale preauthkeys create`)
- **ssh.port**: Port for the SSH server (default: 22)
- **ssh.host_key_path**: Path to the SSH host key file
- **grpc.port**: Port for the gRPC server (default: 50051)
- **grpc.tls_enabled**: Enable TLS for gRPC connections
- **device.name**: Name of this device (displayed in the mobile app)

## Usage

### Running Manually

```bash
# Run with default config file (shadowd.yaml)
./shadowd

# Run with custom config file
./shadowd -config /path/to/config.yaml
```

### Running as a System Service

**Recommended**: Use the automated installation scripts and service manager tool.

See [INSTALL.md](INSTALL.md) for detailed instructions, or [service/README.md](service/README.md) for service management documentation.

#### Quick Service Management

```bash
# Install service
sudo shadowd-service -action install

# Start service
sudo shadowd-service -action start

# Check status
sudo shadowd-service -action status

# Stop service
sudo shadowd-service -action stop

# Uninstall service
sudo shadowd-service -action uninstall
```

#### Manual Service Configuration (Advanced)

<details>
<summary>Linux (systemd)</summary>

```bash
# Copy the binary to /usr/local/bin
sudo cp shadowd /usr/local/bin/

# Create systemd service file
sudo nano /etc/systemd/system/shadowd.service
```

Add the following content:

```ini
[Unit]
Description=Shadow Shuttle Daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/shadowd -config /etc/shadowd/shadowd.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable shadowd
sudo systemctl start shadowd
sudo systemctl status shadowd
```

</details>

<details>
<summary>macOS (launchd)</summary>

```bash
# Copy the binary to /usr/local/bin
sudo cp shadowd /usr/local/bin/

# Create launchd plist file
sudo nano /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
```

Add the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shadowshuttle.shadowd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/shadowd</string>
        <string>-config</string>
        <string>/etc/shadowd/shadowd.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load and start the service:

```bash
sudo launchctl load /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
sudo launchctl start com.shadowshuttle.shadowd
```

</details>

<details>
<summary>Windows (Service)</summary>

Use the automated installation script or service manager tool (see [INSTALL.md](INSTALL.md)).

```powershell
# Using service manager
shadowd-service.exe -action install
shadowd-service.exe -action start

# Or using sc.exe
sc.exe create shadowd binPath= "C:\path\to\shadowd.exe -config C:\path\to\shadowd.yaml"
sc.exe start shadowd
```

</details>

## Development

### Project Structure

```
shadowd/
├── config/          # Configuration management
├── types/           # Core data structures
├── main.go          # Entry point
├── go.mod           # Go module definition
└── README.md        # This file
```

### Running Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...
```

### Building

```bash
# Build for current platform
go build -o shadowd

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o shadowd-linux

# Build for macOS
GOOS=darwin GOARCH=amd64 go build -o shadowd-macos

# Build for Windows
GOOS=windows GOARCH=amd64 go build -o shadowd.exe
```

## gRPC API

Shadowd exposes the following gRPC services:

### DeviceService

- **GetDeviceInfo**: Returns information about this device
- **GeneratePairingCode**: Generates a QR code for pairing with the mobile app
- **HealthCheck**: Returns the health status of the daemon

See the design document for detailed API specifications.

## Security

- SSH connections use key-based authentication only (password authentication is disabled)
- Only accepts connections from within the Mesh network
- All communication is encrypted using WireGuard
- Configuration files should have restricted permissions (0600)

## Troubleshooting

### Daemon won't start

1. Check the configuration file is valid YAML
2. Verify the Headscale URL is accessible
3. Check the pre-authentication key is valid
4. Review logs for error messages

### Can't connect to SSH

1. Verify the daemon is running
2. Check the device is registered in Headscale (`headscale nodes list`)
3. Verify the Mesh IP address is correct
4. Check firewall rules allow SSH connections

### gRPC connection fails

1. Verify the gRPC port is not blocked by firewall
2. Check the daemon is listening on the correct port
3. Verify the client is connecting to the correct Mesh IP

## License

TODO: Add license information

## Contributing

TODO: Add contribution guidelines
