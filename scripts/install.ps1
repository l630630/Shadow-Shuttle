# Shadow Shuttle Windows 一键安装脚本
# 需要管理员权限运行

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# 版本信息
$VERSION = "0.2.0"
$GITHUB_REPO = "your-org/shadow-shuttle"
$INSTALL_DIR = "C:\Program Files\ShadowShuttle"
$CONFIG_DIR = "C:\ProgramData\ShadowShuttle"
$DATA_DIR = "C:\ProgramData\ShadowShuttle\data"

# 颜色函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检测架构
function Get-Architecture {
    $arch = $env:PROCESSOR_ARCHITECTURE
    switch ($arch) {
        "AMD64" { return "amd64" }
        "ARM64" { return "arm64" }
        default {
            Write-Error-Custom "不支持的架构: $arch"
            exit 1
        }
    }
}

# 下载 shadowd
function Download-Shadowd {
    param([string]$Arch)
    
    Write-Info "下载 shadowd $VERSION..."
    
    $downloadUrl = "https://github.com/$GITHUB_REPO/releases/download/v$VERSION/shadowd-windows-$Arch.exe"
    $outputPath = "$env:TEMP\shadowd.exe"
    
    Write-Info "下载地址: $downloadUrl"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath -UseBasicParsing
        Write-Info "下载完成"
    } catch {
        Write-Error-Custom "下载失败: $_"
        exit 1
    }
    
    return $outputPath
}

# 创建目录
function Create-Directories {
    Write-Info "创建安装目录..."
    
    New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
    New-Item -ItemType Directory -Force -Path $CONFIG_DIR | Out-Null
    New-Item -ItemType Directory -Force -Path $DATA_DIR | Out-Null
    
    Write-Info "目录创建完成"
}

# 安装文件
function Install-Files {
    param([string]$SourcePath)
    
    Write-Info "安装 shadowd..."
    
    $destPath = Join-Path $INSTALL_DIR "shadowd.exe"
    Copy-Item -Path $SourcePath -Destination $destPath -Force
    
    Write-Info "shadowd 已安装到 $destPath"
}

# 生成配置文件
function Generate-Config {
    Write-Info "生成配置文件..."
    
    $hostname = $env:COMPUTERNAME
    $configPath = Join-Path $CONFIG_DIR "config.yaml"
    
    $configContent = @"
# Shadow Shuttle 配置文件
# 版本: $VERSION

# 服务器配置
server:
  # SSH 服务器监听地址
  ssh_listen: "0.0.0.0:2222"
  
  # gRPC 服务器监听地址
  grpc_listen: "0.0.0.0:50051"
  
  # 主机密钥路径
  host_key: "$($DATA_DIR -replace '\\', '\\')\ssh_host_key"

# Headscale 配置
headscale:
  # Headscale 服务器地址
  url: "https://vpn.shadowshuttle.io"
  
  # 认证密钥（首次运行时自动生成）
  auth_key: ""

# 安全配置
security:
  # 允许的认证方式
  auth_methods:
    - "publickey"
  
  # 禁用密码认证（推荐）
  disable_password_auth: true
  
  # 允许的用户（留空表示允许所有）
  allowed_users: []

# 日志配置
logging:
  # 日志级别: debug, info, warn, error
  level: "info"
  
  # 日志文件路径
  file: "$($DATA_DIR -replace '\\', '\\')\shadowd.log"
  
  # 日志最大大小 (MB)
  max_size: 100
  
  # 保留的日志文件数量
  max_backups: 3

# 设备信息
device:
  # 设备名称
  name: "$hostname"
  
  # 设备标签
  tags:
    - "auto-installed"
    - "windows"
"@
    
    Set-Content -Path $configPath -Value $configContent -Encoding UTF8
    Write-Info "配置文件已创建: $configPath"
}

# 添加到系统路径
function Add-ToPath {
    Write-Info "添加到系统 PATH..."
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$INSTALL_DIR*") {
        $newPath = "$currentPath;$INSTALL_DIR"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Info "已添加到系统 PATH"
    } else {
        Write-Info "已在系统 PATH 中"
    }
}

# 配置防火墙
function Configure-Firewall {
    Write-Info "配置 Windows 防火墙..."
    
    try {
        # SSH 端口
        New-NetFirewallRule -DisplayName "Shadow Shuttle SSH" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort 2222 `
            -Action Allow `
            -ErrorAction SilentlyContinue | Out-Null
        
        # gRPC 端口
        New-NetFirewallRule -DisplayName "Shadow Shuttle gRPC" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort 50051 `
            -Action Allow `
            -ErrorAction SilentlyContinue | Out-Null
        
        Write-Info "防火墙规则已添加"
    } catch {
        Write-Warn "防火墙配置失败，请手动开放端口 2222 和 50051"
    }
}

# 安装 Windows 服务
function Install-Service {
    Write-Info "安装 Windows 服务..."
    
    $serviceName = "ShadowShuttled"
    $exePath = Join-Path $INSTALL_DIR "shadowd.exe"
    $configPath = Join-Path $CONFIG_DIR "config.yaml"
    
    # 检查服务是否已存在
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Info "服务已存在，正在停止..."
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        Write-Info "删除旧服务..."
        & sc.exe delete $serviceName | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # 创建新服务
    Write-Info "创建服务..."
    $serviceArgs = "serve --config `"$configPath`""
    
    New-Service -Name $serviceName `
        -BinaryPathName "`"$exePath`" $serviceArgs" `
        -DisplayName "Shadow Shuttle Daemon" `
        -Description "Shadow Shuttle 远程访问守护进程" `
        -StartupType Automatic | Out-Null
    
    Write-Info "服务已安装"
}

# 启动服务
function Start-ShadowdService {
    Write-Info "启动 shadowd 服务..."
    
    $serviceName = "ShadowShuttled"
    
    try {
        Start-Service -Name $serviceName
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name $serviceName
        if ($service.Status -eq "Running") {
            Write-Info "服务启动成功！"
        } else {
            Write-Error-Custom "服务启动失败，状态: $($service.Status)"
        }
    } catch {
        Write-Error-Custom "服务启动失败: $_"
        Write-Info "查看日志: $DATA_DIR\shadowd.log"
    }
}

# 显示完成信息
function Show-Completion {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Info "Shadow Shuttle 安装完成！"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 下一步操作：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 生成配对二维码："
    Write-Host "   shadowd generate-qr" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 在手机 App 中扫描二维码添加设备"
    Write-Host ""
    Write-Host "3. 查看服务状态："
    Write-Host "   Get-Service ShadowShuttled" -ForegroundColor White
    Write-Host ""
    Write-Host "4. 查看日志："
    Write-Host "   Get-Content '$DATA_DIR\shadowd.log' -Tail 50 -Wait" -ForegroundColor White
    Write-Host ""
    Write-Host "5. 管理服务："
    Write-Host "   Start-Service ShadowShuttled   # 启动" -ForegroundColor White
    Write-Host "   Stop-Service ShadowShuttled    # 停止" -ForegroundColor White
    Write-Host "   Restart-Service ShadowShuttled # 重启" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 文档: https://docs.shadowshuttle.io" -ForegroundColor Cyan
    Write-Host "💬 支持: support@shadowshuttle.io" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

# 主函数
function Main {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  Shadow Shuttle 安装程序 v$VERSION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $arch = Get-Architecture
    Write-Info "检测到架构: $arch"
    Write-Info "操作系统: Windows $([System.Environment]::OSVersion.Version)"
    
    Write-Host ""
    Write-Info "开始安装..."
    Write-Host ""
    
    $downloadedFile = Download-Shadowd -Arch $arch
    Create-Directories
    Install-Files -SourcePath $downloadedFile
    Generate-Config
    Add-ToPath
    Configure-Firewall
    Install-Service
    Start-ShadowdService
    
    # 清理临时文件
    Remove-Item -Path $downloadedFile -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Show-Completion
}

# 运行主函数
try {
    Main
} catch {
    Write-Error-Custom "安装失败: $_"
    Write-Host $_.ScriptStackTrace
    exit 1
}
