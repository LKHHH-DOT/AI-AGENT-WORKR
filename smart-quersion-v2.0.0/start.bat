@echo off
chcp 65001 >nul
title 智能问卷系统 v2.0.0
echo ================================
echo   智能问卷系统 v2.0.0
echo ================================
echo.

:: 检查是否已构建
if not exist "client\dist\index.html" (
    echo [构建] 正在打包前端...
    cd client
    call npx vite build
    cd ..
    echo [构建] 完成
)

:: 生产模式启动
echo [启动] 正在启动服务...
echo [访问] http://localhost:5000
set NODE_ENV=production
node server/index.js

pause
