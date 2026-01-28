#!/bin/bash
# Shadow Shuttle Daemon - Linux Installation Script
# This script installs shadowd as a systemd service

set -e

# Configuration
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/shadowd"
DATA_DIR="/var/lib/shadowd"
BINARY_PATH="${BINARY_PATH:-./shadowd}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}Error: systemd is not available on this system${NC}"
    exit 1
fi

echo -e "${GREEN}Installing Shadow Shuttle Daemon...${NC}"

# Create directories
echo "Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$DATA_DIR"

# Copy binary
echo "Copying binary..."
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}Error: Binary not found at $BINARY_PATH${NC}"
    exit 1
fi
cp "$BINARY_PATH" "$INSTALL_DIR/shadowd"
chmod +x "$INSTALL_DIR/shadowd"

# Copy service manager if it exists
if [ -f "./shadowd-service" ]; then
    cp "./shadowd-service" "$INSTALL_DIR/shadowd-service"
    chmod +x "$INSTALL_DIR/shadowd-service"
fi

# Create default configuration if it doesn't exist
CONFIG_PATH="$CONFIG_DIR/shadowd.yaml"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Creating default configuration..."
    cat > "$CONFIG_PATH" << EOF
headscale:
  url: "https://your-headscale-server.com"
  preauth_key: "your-preauth-key"

device:
  name: "$(hostname -s)"

ssh:
  port: 22
  host_key_path: "$CONFIG_DIR/ssh_host_key"
  authorized_keys_path: "$CONFIG_DIR/authorized_keys"
  allowed_networks:
    - "100.64.0.0/10"

grpc:
  port: 50051
  tls_enabled: false
EOF
    chmod 644 "$CONFIG_PATH"
    echo -e "${YELLOW}Configuration file created at $CONFIG_PATH${NC}"
    echo -e "${YELLOW}Please edit this file with your Headscale server details${NC}"
fi

# Install service
echo "Installing systemd service..."
if [ -f "$INSTALL_DIR/shadowd-service" ]; then
    "$INSTALL_DIR/shadowd-service" -action install \
        -executable "$INSTALL_DIR/shadowd" \
        -config "$CONFIG_PATH" \
        -workdir "$DATA_DIR" \
        -user root \
        -group root
else
    echo -e "${YELLOW}Warning: Service manager not found, creating unit file manually...${NC}"
    UNIT_PATH="/etc/systemd/system/shadowd.service"
    cat > "$UNIT_PATH" << EOF
[Unit]
Description=Shadow Shuttle daemon for secure SSH access over Mesh network
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$DATA_DIR
ExecStart=$INSTALL_DIR/shadowd -config $CONFIG_PATH
Restart=on-failure
RestartSec=5s

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shadowd

[Install]
WantedBy=multi-user.target
EOF
    chmod 644 "$UNIT_PATH"
    systemctl daemon-reload
    systemctl enable shadowd
fi

echo ""
echo -e "${GREEN}Installation completed successfully!${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "1. Edit the configuration file at: $CONFIG_PATH"
echo "2. Add your Headscale server URL and preauth key"
echo "3. Start the service with: systemctl start shadowd"
echo "   Or use: shadowd-service -action start"
echo "4. Check status with: systemctl status shadowd"
echo ""
echo -e "To uninstall, run: shadowd-service -action uninstall"
