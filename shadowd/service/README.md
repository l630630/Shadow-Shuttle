# Shadow Shuttle Daemon - System Service

This package provides cross-platform system service support for the Shadow Shuttle daemon (shadowd). It allows shadowd to run as a system service on Windows, macOS, and Linux.

## Features

- **Windows**: Service registration using Windows Service Control Manager (sc.exe)
- **macOS**: launchd service configuration with automatic restart
- **Linux**: systemd service with security hardening

## Installation

### Automated Installation

Use the provided installation scripts for your platform:

#### Windows

```powershell
# Run as Administrator
.\scripts\install-windows.ps1
```

#### macOS

```bash
# Run with sudo
sudo ./scripts/install-macos.sh
```

#### Linux

```bash
# Run with sudo
sudo ./scripts/install-linux.sh
```

### Manual Installation

#### Using the Service Manager Tool

Build the service manager:

```bash
go build -o shadowd-service ./cmd/service
```

Install the service:

```bash
# Windows (run as Administrator)
shadowd-service.exe -action install -executable "C:\path\to\shadowd.exe" -config "C:\path\to\shadowd.yaml"

# macOS/Linux (run with sudo)
sudo ./shadowd-service -action install -executable /usr/local/bin/shadowd -config /etc/shadowd/shadowd.yaml
```

## Service Management

### Using the Service Manager Tool

```bash
# Install service
shadowd-service -action install

# Start service
shadowd-service -action start

# Stop service
shadowd-service -action stop

# Check status
shadowd-service -action status

# Uninstall service
shadowd-service -action uninstall
```

### Using Platform-Specific Tools

#### Windows

```powershell
# Start service
sc.exe start shadowd

# Stop service
sc.exe stop shadowd

# Check status
sc.exe query shadowd

# Remove service
sc.exe delete shadowd
```

#### macOS

```bash
# Start service
sudo launchctl start com.shadowshuttle.shadowd

# Stop service
sudo launchctl stop com.shadowshuttle.shadowd

# Check status
sudo launchctl list | grep shadowd

# Remove service
sudo launchctl unload /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist
```

#### Linux

```bash
# Start service
sudo systemctl start shadowd

# Stop service
sudo systemctl stop shadowd

# Check status
sudo systemctl status shadowd

# Enable on boot
sudo systemctl enable shadowd

# Disable on boot
sudo systemctl disable shadowd

# View logs
sudo journalctl -u shadowd -f
```

## Configuration

### Service Configuration Options

The service manager accepts the following flags:

- `-action`: Action to perform (install, uninstall, start, stop, status)
- `-executable`: Path to shadowd executable (default: auto-detect)
- `-config`: Path to configuration file (default: /etc/shadowd/shadowd.yaml)
- `-workdir`: Working directory for the service (default: /var/lib/shadowd)
- `-user`: User to run the service as (Linux/macOS only, default: root)
- `-group`: Group to run the service as (Linux/macOS only, default: root)

### Default Paths

#### Windows

- Executable: `C:\Program Files\ShadowShuttle\shadowd.exe`
- Configuration: `C:\ProgramData\ShadowShuttle\shadowd.yaml`
- Data directory: `C:\ProgramData\ShadowShuttle\data`

#### macOS

- Executable: `/usr/local/bin/shadowd`
- Configuration: `/etc/shadowd/shadowd.yaml`
- Data directory: `/var/lib/shadowd`
- Logs: `/var/log/shadowd.log`, `/var/log/shadowd.error.log`
- Plist: `/Library/LaunchDaemons/com.shadowshuttle.shadowd.plist`

#### Linux

- Executable: `/usr/local/bin/shadowd`
- Configuration: `/etc/shadowd/shadowd.yaml`
- Data directory: `/var/lib/shadowd`
- Unit file: `/etc/systemd/system/shadowd.service`
- Logs: `journalctl -u shadowd`

## Service Configuration Files

### Windows Service

The Windows service is registered using `sc.exe` with the following properties:

- Service name: `shadowd`
- Display name: `Shadow Shuttle Daemon`
- Start type: Automatic
- Binary path: Includes `-config` flag pointing to configuration file

### macOS launchd

The launchd plist file includes:

- Label: `com.shadowshuttle.shadowd`
- RunAtLoad: true (starts on boot)
- KeepAlive: true (automatic restart on failure)
- User/Group: Configurable (default: root/wheel)
- Logging: Redirected to `/var/log/shadowd.log`

### Linux systemd

The systemd unit file includes:

- Type: simple
- Restart: on-failure (automatic restart)
- RestartSec: 5s
- Security hardening:
  - NoNewPrivileges=true
  - PrivateTmp=true
  - ProtectSystem=strict
  - ProtectHome=true
- Logging: journald

## Uninstallation

### Automated Uninstallation

#### Windows

```powershell
# Run as Administrator
.\scripts\uninstall-windows.ps1

# Keep configuration files
.\scripts\uninstall-windows.ps1 -KeepConfig
```

#### macOS/Linux

```bash
# Run with sudo
sudo ./scripts/uninstall-unix.sh

# Keep configuration files
sudo ./scripts/uninstall-unix.sh --keep-config
```

### Manual Uninstallation

```bash
# Stop and uninstall service
shadowd-service -action uninstall

# Remove binaries and configuration manually
```

## Troubleshooting

### Windows

**Service fails to start:**
- Check Event Viewer (Windows Logs > Application)
- Verify the executable path is correct
- Ensure configuration file exists and is valid

**Permission denied:**
- Run PowerShell as Administrator
- Check that the service account has necessary permissions

### macOS

**Service not starting:**
- Check logs: `tail -f /var/log/shadowd.log`
- Verify plist syntax: `plutil -lint /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist`
- Check permissions: `ls -la /Library/LaunchDaemons/com.shadowshuttle.shadowd.plist`

**Permission denied:**
- Run commands with `sudo`
- Ensure binary has execute permissions: `chmod +x /usr/local/bin/shadowd`

### Linux

**Service not starting:**
- Check status: `systemctl status shadowd`
- View logs: `journalctl -u shadowd -n 50`
- Verify unit file: `systemctl cat shadowd`

**Permission denied:**
- Run commands with `sudo`
- Check SELinux/AppArmor policies if applicable

**Service not enabled on boot:**
- Enable service: `systemctl enable shadowd`
- Verify: `systemctl is-enabled shadowd`

## Security Considerations

### Linux Security Hardening

The systemd service includes several security features:

- **NoNewPrivileges**: Prevents privilege escalation
- **PrivateTmp**: Isolates /tmp directory
- **ProtectSystem**: Makes system directories read-only
- **ProtectHome**: Restricts access to home directories
- **ReadWritePaths**: Only allows writing to data directory

### Running as Non-Root User (Linux/macOS)

For enhanced security, you can run shadowd as a non-root user:

```bash
# Create shadowd user
sudo useradd -r -s /bin/false shadowd

# Install service with custom user
sudo shadowd-service -action install -user shadowd -group shadowd

# Ensure proper permissions
sudo chown -R shadowd:shadowd /var/lib/shadowd
sudo chown shadowd:shadowd /etc/shadowd/shadowd.yaml
```

**Note**: Running as non-root may require additional configuration for SSH and network access.

## Development

### Building

```bash
# Build shadowd
go build -o shadowd .

# Build service manager
go build -o shadowd-service ./cmd/service
```

### Testing

```bash
# Run tests
go test ./service/...

# Test service installation (requires root/admin)
sudo go test ./service/... -tags=integration
```

## API Reference

See [service.go](service.go) for the complete API documentation.

### Service Interface

```go
type Service interface {
    Install() error
    Uninstall() error
    Start() error
    Stop() error
    Status() (string, error)
}
```

### Creating a Service

```go
import "github.com/shadow-shuttle/shadowd/service"

cfg := service.Config{
    Name:             "shadowd",
    DisplayName:      "Shadow Shuttle Daemon",
    Description:      "Shadow Shuttle daemon for secure SSH access",
    ExecutablePath:   "/usr/local/bin/shadowd",
    ConfigPath:       "/etc/shadowd/shadowd.yaml",
    WorkingDirectory: "/var/lib/shadowd",
    User:             "root",
    Group:            "root",
}

svc, err := service.NewService(cfg)
if err != nil {
    log.Fatal(err)
}

// Install and start
if err := svc.Install(); err != nil {
    log.Fatal(err)
}
if err := svc.Start(); err != nil {
    log.Fatal(err)
}
```

## License

See the main project LICENSE file.
