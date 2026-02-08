#!/bin/bash
# Quick start script for shadowd in development mode

set -e

echo "🚀 Starting shadowd in development mode..."
echo ""

# Check if shadowd binary exists
if [ ! -f "./shadowd" ]; then
    echo "❌ shadowd binary not found. Building..."
    go build -o shadowd .
    echo "✅ Build complete"
    echo ""
fi

# Check if config exists
if [ ! -f "./shadowd.yaml" ]; then
    echo "❌ Configuration file not found. Creating from example..."
    cp shadowd.yaml.example shadowd.yaml
    echo "✅ Configuration created"
    echo ""
    echo "⚠️  Please edit shadowd.yaml with your settings"
    exit 1
fi

# Kill any existing shadowd processes
if pgrep -x "shadowd" > /dev/null; then
    echo "⚠️  Stopping existing shadowd processes..."
    pkill -9 shadowd || true
    sleep 1
fi

echo "📋 Configuration:"
echo "   - WebSocket SSH Proxy: 0.0.0.0:8022"
echo "   - SSH Server: 127.0.0.1:2222"
echo "   - gRPC Server: 127.0.0.1:50052"
echo ""

echo "🔧 Starting shadowd..."
./shadowd -config shadowd.yaml
