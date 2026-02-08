#!/bin/bash

# 确保使用正确的 Node.js 版本
export PATH=/Users/a0000/.volta/bin:$PATH
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

echo "Node version: $(node --version)"
echo "Java version: $(java -version 2>&1 | head -1)"

cd ..
npm run android
