# Shadow Shuttle Daemon - Installation Guide

This guide provides step-by-step instructions for installing shadowd as a system service on Windows, macOS, and Linux.

## Prerequisites

- Go 1.21 or later (for building from source)
- Administrator/root privileges
- Network access to your Headscale server

## Quick Installation

### 1. Build the Binaries

```bash
# Clone the repository
git clone https://github.com/shadow-shuttle/shadowd.git
cd shadowd

# Build shadowd and service manager
make build build-service

# Or build for all platforms
make build-all
```

### 2. Install as System Service

#### Windows

```powershell
# Open PowerShell as Administrator
cd shadowd
.\scripts\install-windows.ps1
```

#### macOS

```bash
# Open Terminal
cd shadowd
sudo ./scripts/install-macos.sh
```

#### Linux

```bash
# Open Terminal
cd shadowd
sudo ./scripts/install-linux.sh
```

### 3. Configure

Edit the configuration file with your Headscale server details:

**Windows**: `C:\ProgramData\ShadowShuttle\shadowd.yaml`
**macOS/Linux**: `/etc/shadowd/shadowd.yaml`

```yaml
headscale:
  url: "https://your-headscale-server.com"
  preauth_key: "your-preauth-key-here"

device:
  name: "MyComputer"
```

### 4. Start the Service

#### Windows

```powershell
# Using service manager
shadowd-service -action start

# Or using sc.exe
sc.exe start shadowd
```

#### macOS

```bash
# Using service manager
sudo shadowd-service -action start

# Or using launchctl
sudo launchctl start com.shadowshuttle.shadowd
```

#### Linux

```bash
# Using service manager
sudo shadowd-service -action start

# Or using systemctl
sudo systemctl start shadowd
```

## Verification

Check that the service is running:

```bash
# Windows
sc.exe query shadowd

# macOS
sudo launchctl list | grep shadowd

# Linux
sudo systemctl status shadowd
```

## Troubleshooting

### Service Won't Start

1. Check the configuration file is valid YAML
2. Verify Headscale server URL is accessible
3. Check logs:
   - **Windows**: Event Viewer > Application logs
   - **macOS**: `/var/log/shadowd.log`
   - **Linux**: `sudo journalctl -u shadowd -n 50`

### Permission Errors

- Ensure you're running installation scripts with administrator/root privileges
- On Linux, check SELinux/AppArmor policies

### Network Issues

- Verify firewall allows outbound connections to Headscale server
- Check that WireGuard kernel module is available (Linux)

## Uninstallation

### Windows

```powershell
.\scripts\uninstall-windows.ps1
```

### macOS/Linux

```bash
sudo ./scripts/uninstall-unix.sh
```

To keep configuration files:

```bash
# Windows
.\scripts\uninstall-windows.ps1 -KeepConfig

# macOS/Linux
sudo ./scripts/uninstall-unix.sh --keep-config
```

## Advanced Configuration

### Running as Non-Root User (Linux/macOS)

```bash
# Create shadowd user
sudo useradd -r -s /bin/false shadowd

# Install with custom user
sudo shadowd-service -action install \
  -user shadowd \
  -group shadowd \
  -executable /usr/local/bin/shadowd \
  -config /etc/shadowd/shadowd.yaml

# Set permissions
sudo chown -R shadowd:shadowd /var/lib/shadowd
sudo chown shadowd:shadowd /etc/shadowd/shadowd.yaml
```

### Custom Installation Paths

```bash
# Install to custom location
sudo shadowd-service -action install \
  -executable /opt/shadowd/bin/shadowd \
  -config /opt/shadowd/etc/shadowd.yaml \
  -workdir /opt/shadowd/data
```

## Getting Help

- Documentation: See [README.md](README.md) and [service/README.md](service/README.md)
- Issues: Report bugs on GitHub
- Logs: Check service logs for detailed error messages

## Next Steps

After installation:

1. Generate SSH keys for authentication
2. Configure authorized_keys file
3. Test SSH connection from mobile app
4. Set up automatic backups of configuration
