#!/bin/bash
# Shadow Shuttle 一键安装脚本
# 支持: Ubuntu, Debian, CentOS, macOS

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 版本信息
VERSION="0.2.0"
GITHUB_REPO="your-org/shadow-shuttle"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/shadowd"
DATA_DIR="/var/lib/shadowd"

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
            OS_VERSION=$VERSION_ID
        else
            print_error "无法检测 Linux 发行版"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        OS_VERSION=$(sw_vers -productVersion)
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    print_info "检测到操作系统: $OS $OS_VERSION"
}

# 检测架构
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        armv7l)
            ARCH="armv7"
            ;;
        *)
            print_error "不支持的架构: $ARCH"
            exit 1
            ;;
    esac
    
    print_info "检测到架构: $ARCH"
}

# 检查权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 下载 shadowd
download_shadowd() {
    print_info "下载 shadowd $VERSION..."
    
    local download_url
    if [ "$OS" = "macos" ]; then
        download_url="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/shadowd-darwin-${ARCH}"
    else
        download_url="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/shadowd-linux-${ARCH}"
    fi
    
    print_info "下载地址: $download_url"
    
    if command -v curl &> /dev/null; then
        curl -L "$download_url" -o /tmp/shadowd
    elif command -v wget &> /dev/null; then
        wget "$download_url" -O /tmp/shadowd
    else
        print_error "需要 curl 或 wget 来下载文件"
        exit 1
    fi
    
    chmod +x /tmp/shadowd
    mv /tmp/shadowd "$INSTALL_DIR/shadowd"
    
    print_info "shadowd 已安装到 $INSTALL_DIR/shadowd"
}

# 创建配置目录
create_directories() {
    print_info "创建配置目录..."
    
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$DATA_DIR"
    
    # 设置权限
    chmod 755 "$CONFIG_DIR"
    chmod 700 "$DATA_DIR"
}

# 生成配置文件
generate_config() {
    print_info "生成配置文件..."
    
    cat > "$CONFIG_DIR/config.yaml" << EOF
# Shadow Shuttle 配置文件
# 版本: $VERSION

# 服务器配置
server:
  # SSH 服务器监听地址
  ssh_listen: "0.0.0.0:2222"
  
  # gRPC 服务器监听地址
  grpc_listen: "0.0.0.0:50051"
  
  # 主机密钥路径
  host_key: "$DATA_DIR/ssh_host_key"

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
  file: "$DATA_DIR/shadowd.log"
  
  # 日志最大大小 (MB)
  max_size: 100
  
  # 保留的日志文件数量
  max_backups: 3

# 设备信息
device:
  # 设备名称（自动生成）
  name: "$(hostname)"
  
  # 设备标签
  tags:
    - "auto-installed"
EOF
    
    print_info "配置文件已创建: $CONFIG_DIR/config.yaml"
}

# 生成 SSH 主机密钥
generate_host_key() {
    print_info "生成 SSH 主机密钥..."
    
    if command -v ssh-keygen &> /dev/null; then
        ssh-keygen -t ed25519 -f "$DATA_DIR/ssh_host_key" -N "" -q
        chmod 600 "$DATA_DIR/ssh_host_key"
        print_info "SSH 主机密钥已生成"
    else
        print_warn "ssh-keygen 未找到，将在首次运行时自动生成"
    fi
}

# 安装为系统服务
install_service() {
    print_info "安装系统服务..."
    
    if [ "$OS" = "macos" ]; then
        install_launchd_service
    elif command -v systemctl &> /dev/null; then
        install_systemd_service
    else
        print_warn "无法检测服务管理器，请手动启动 shadowd"
        return
    fi
}

# 安装 systemd 服务
install_systemd_service() {
    cat > /etc/systemd/system/shadowd.service << EOF
[Unit]
Description=Shadow Shuttle Daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=$INSTALL_DIR/shadowd serve --config $CONFIG_DIR/config.yaml
Restart=on-failure
RestartSec=5s

# 安全加固
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable shadowd
    
    print_info "systemd 服务已安装"
}

# 安装 launchd 服务
install_launchd_service() {
    cat > /Library/LaunchDaemons/io.shadowshuttle.shadowd.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>io.shadowshuttle.shadowd</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/shadowd</string>
        <string>serve</string>
        <string>--config</string>
        <string>$CONFIG_DIR/config.yaml</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$DATA_DIR/stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$DATA_DIR/stderr.log</string>
</dict>
</plist>
EOF
    
    launchctl load /Library/LaunchDaemons/io.shadowshuttle.shadowd.plist
    
    print_info "launchd 服务已安装"
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        ufw allow 2222/tcp comment "Shadow Shuttle SSH"
        ufw allow 50051/tcp comment "Shadow Shuttle gRPC"
        print_info "UFW 防火墙规则已添加"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL
        firewall-cmd --permanent --add-port=2222/tcp
        firewall-cmd --permanent --add-port=50051/tcp
        firewall-cmd --reload
        print_info "firewalld 防火墙规则已添加"
    else
        print_warn "未检测到防火墙，请手动开放端口 2222 和 50051"
    fi
}

# 启动服务
start_service() {
    print_info "启动 shadowd 服务..."
    
    if [ "$OS" = "macos" ]; then
        launchctl start io.shadowshuttle.shadowd
    elif command -v systemctl &> /dev/null; then
        systemctl start shadowd
    else
        print_warn "请手动启动: shadowd serve --config $CONFIG_DIR/config.yaml"
        return
    fi
    
    sleep 2
    
    # 检查服务状态
    if [ "$OS" = "macos" ]; then
        if launchctl list | grep -q shadowd; then
            print_info "服务启动成功！"
        else
            print_error "服务启动失败"
        fi
    elif command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet shadowd; then
            print_info "服务启动成功！"
        else
            print_error "服务启动失败，查看日志: journalctl -u shadowd -f"
        fi
    fi
}

# 生成配对二维码
generate_qr() {
    print_info "生成配对二维码..."
    print_info "请稍等..."
    
    sleep 3
    
    if command -v shadowd &> /dev/null; then
        shadowd generate-qr
    else
        print_warn "请运行以下命令生成配对二维码:"
        echo "  sudo shadowd generate-qr"
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Shadow Shuttle 安装完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📱 下一步操作："
    echo ""
    echo "1. 生成配对二维码："
    echo "   sudo shadowd generate-qr"
    echo ""
    echo "2. 在手机 App 中扫描二维码添加设备"
    echo ""
    echo "3. 查看服务状态："
    if [ "$OS" = "macos" ]; then
        echo "   sudo launchctl list | grep shadowd"
    else
        echo "   sudo systemctl status shadowd"
    fi
    echo ""
    echo "4. 查看日志："
    if [ "$OS" = "macos" ]; then
        echo "   tail -f $DATA_DIR/stderr.log"
    else
        echo "   sudo journalctl -u shadowd -f"
    fi
    echo ""
    echo "📚 文档: https://docs.shadowshuttle.io"
    echo "💬 支持: support@shadowshuttle.io"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主函数
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Shadow Shuttle 安装程序 v$VERSION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    check_root
    detect_os
    detect_arch
    
    echo ""
    print_info "开始安装..."
    echo ""
    
    download_shadowd
    create_directories
    generate_config
    generate_host_key
    install_service
    configure_firewall
    start_service
    
    echo ""
    show_completion
}

# 运行主函数
main "$@"
