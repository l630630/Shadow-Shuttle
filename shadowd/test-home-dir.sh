#!/bin/bash

# Test SSH home directory
echo "Testing SSH connection home directory..."
echo ""

# Use expect to automate password input
expect << 'EOF'
spawn ssh -p 2222 a0000@localhost "pwd"
expect "password:"
send "liu630\r"
expect eof
EOF

echo ""
echo "Expected: /Users/a0000"
