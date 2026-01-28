# Shadow Shuttle Daemon - Windows Uninstallation Script

param(
    [string]$InstallDir = "C:\Program Files\ShadowShuttle",
    [string]$ConfigDir = "C:\ProgramData\ShadowShuttle",
    [switch]$KeepConfig = $false
)

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

Write-Host "Uninstalling Shadow Shuttle Daemon..." -ForegroundColor Yellow

# Stop and remove service
Write-Host "Stopping and removing service..."
$servicePath = "$InstallDir\shadowd-service.exe"
if (Test-Path $servicePath) {
    & $servicePath -action uninstall
} else {
    sc.exe stop shadowd
    sc.exe delete shadowd
}

# Remove installation directory
if (Test-Path $InstallDir) {
    Write-Host "Removing installation directory..."
    Remove-Item -Path $InstallDir -Recurse -Force
}

# Remove configuration directory (unless -KeepConfig is specified)
if (-not $KeepConfig) {
    if (Test-Path $ConfigDir) {
        Write-Host "Removing configuration directory..."
        Remove-Item -Path $ConfigDir -Recurse -Force
    }
} else {
    Write-Host "Keeping configuration directory at: $ConfigDir" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Uninstallation completed successfully!" -ForegroundColor Green
