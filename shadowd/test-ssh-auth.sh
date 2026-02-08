#!/bin/bash

# Test SSH Password Authentication
# This script tests if shadowd SSH server accepts password authentication

echo "🧪 Testing SSH Password Authentication"
echo "======================================"
echo ""

# Check if shadowd is running
if ! pgrep -f "./shadowd" > /dev/null; then
    echo "❌ shadowd is not running"
    echo "   Start it with: ./start-dev.sh"
    exit 1
fi

echo "✅ shadowd is running"
echo ""

# Test SSH connection with password
echo "📡 Testing SSH connection to localhost:2222"
echo "   Username: testuser"
echo "   Password: test123"
echo ""

# Use sshpass if available, otherwise use expect
if command -v sshpass &> /dev/null; then
    echo "Using sshpass for automated testing..."
    sshpass -p "test123" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        -p 2222 testuser@localhost "echo 'SSH connection successful!'; exit"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SSH password authentication works!"
    else
        echo ""
        echo "❌ SSH password authentication failed"
        echo "   Check shadowd logs for details"
    fi
else
    echo "⚠️  sshpass not installed, manual test required"
    echo ""
    echo "Manual test command:"
    echo "  ssh -p 2222 testuser@localhost"
    echo ""
    echo "Enter any password when prompted (dev mode accepts any password)"
fi

echo ""
echo "📋 Check shadowd logs:"
echo "   tail -f shadowd.log"
