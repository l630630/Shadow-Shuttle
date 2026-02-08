@echo off
REM SSH Proxy Server 启动脚本 (Windows)

echo 🚀 启动 SSH Proxy Server...
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo 🌐 服务器配置:
echo    端口: 8022
echo    Android 模拟器地址: ws://10.0.2.2:8022
echo    iOS 模拟器地址: ws://localhost:8022
echo.
echo 📱 确保 mobile-app/src/services/sshService.ts 中的地址配置正确
echo.
echo 🔥 启动服务器...
echo.

npm start
