#!/bin/bash
# Shadow Shuttle Daemon - Unix (macOS/Linux) Uninstallation Script

set -e

# Configuration
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/shadowd"
DATA_DIR="/var/lib/shadowd"
KEEP_CONFIG=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-config)
            KEEP_CONFIG=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Uninstalling Shadow Shuttle Daemon...${NC}"

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
else
    echo -e "${RED}Error: Unsupported platform${NC}"
    exit 1
fi

# Stop and remove service
echo "Stopping and removing service..."
if [ -f "$INSTALL_DIR/shadowd-service" ]; then
    "$INSTALL_DIR/shadowd-service" -action uninstall || true
else
    if [ "$PLATFORM" = "macos" ]; then
        PLIST_PATH="/Library/LaunchDaemons/com.shadowshuttle.shadowd.plist"
        if [ -f "$PLIST_PATH" ]; then
            launchctl unload "$PLIST_PATH" 2>/dev/null || true
            rm -f "$PLIST_PATH"
        fi
    elif [ "$PLATFORM" = "linux" ]; then
        systemctl stop shadowd 2>/dev/null || true
        systemctl disable shadowd 2>/dev/null || true
        rm -f /etc/systemd/system/shadowd.service
        systemctl daemon-reload
    fi
fi

# Remove binaries
echo "Removing binaries..."
rm -f "$INSTALL_DIR/shadowd"
rm -f "$INSTALL_DIR/shadowd-service"

# Remove data directory
if [ -d "$DATA_DIR" ]; then
    echo "Removing data directory..."
    rm -rf "$DATA_DIR"
fi

# Remove configuration directory (unless --keep-config is specified)
if [ "$KEEP_CONFIG" = false ]; then
    if [ -d "$CONFIG_DIR" ]; then
        echo "Removing configuration directory..."
        rm -rf "$CONFIG_DIR"
    fi
else
    echo -e "${YELLOW}Keeping configuration directory at: $CONFIG_DIR${NC}"
fi

# Remove log files (macOS)
if [ "$PLATFORM" = "macos" ]; then
    rm -f /var/log/shadowd.log
    rm -f /var/log/shadowd.error.log
fi

echo ""
echo -e "${GREEN}Uninstallation completed successfully!${NC}"
