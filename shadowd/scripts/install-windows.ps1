# Shadow Shuttle Daemon - Windows Installation Script
# This script installs shadowd as a Windows service

param(
    [string]$InstallDir = "C:\Program Files\ShadowShuttle",
    [string]$ConfigDir = "C:\ProgramData\ShadowShuttle",
    [string]$BinaryPath = ".\shadowd.exe"
)

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

Write-Host "Installing Shadow Shuttle Daemon..." -ForegroundColor Green

# Create directories
Write-Host "Creating directories..."
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
New-Item -ItemType Directory -Force -Path "$ConfigDir\data" | Out-Null

# Copy binary
Write-Host "Copying binary..."
if (-not (Test-Path $BinaryPath)) {
    Write-Error "Binary not found at $BinaryPath"
    exit 1
}
Copy-Item $BinaryPath "$InstallDir\shadowd.exe" -Force

# Copy service manager
if (Test-Path ".\shadowd-service.exe") {
    Copy-Item ".\shadowd-service.exe" "$InstallDir\shadowd-service.exe" -Force
}

# Create default configuration if it doesn't exist
$configPath = "$ConfigDir\shadowd.yaml"
if (-not (Test-Path $configPath)) {
    Write-Host "Creating default configuration..."
    $configContent = @"
headscale:
  url: "https://your-headscale-server.com"
  preauth_key: "your-preauth-key"

device:
  name: "$env:COMPUTERNAME"

ssh:
  port: 22
  host_key_path: "$ConfigDir\ssh_host_key"
  authorized_keys_path: "$ConfigDir\authorized_keys"
  allowed_networks:
    - "100.64.0.0/10"

grpc:
  port: 50051
  tls_enabled: false
"@
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "Configuration file created at $configPath" -ForegroundColor Yellow
    Write-Host "Please edit this file with your Headscale server details" -ForegroundColor Yellow
}

# Install service
Write-Host "Installing Windows service..."
$servicePath = "$InstallDir\shadowd-service.exe"
if (Test-Path $servicePath) {
    & $servicePath -action install -executable "$InstallDir\shadowd.exe" -config $configPath -workdir "$ConfigDir\data"
} else {
    Write-Host "Service manager not found, using sc.exe directly..."
    $binPath = "`"$InstallDir\shadowd.exe`" -config `"$configPath`""
    sc.exe create shadowd binPath= $binPath DisplayName= "Shadow Shuttle Daemon" start= auto
    sc.exe description shadowd "Shadow Shuttle daemon for secure SSH access over Mesh network"
}

Write-Host ""
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the configuration file at: $configPath"
Write-Host "2. Add your Headscale server URL and preauth key"
Write-Host "3. Start the service with: sc.exe start shadowd"
Write-Host "   Or use: $InstallDir\shadowd-service.exe -action start"
Write-Host ""
Write-Host "To uninstall, run: $InstallDir\shadowd-service.exe -action uninstall" -ForegroundColor Gray
