@echo off
chcp 65001 >nul

echo.
echo ========================================
echo   DeskLibrary 上传到 GitHub
echo ========================================
echo.

REM 获取 GitHub 用户名
set /p USERNAME="请输入你的 GitHub 用户名: "
if "%USERNAME%"=="" (
    echo [错误] 用户名不能为空
    pause
    exit /b 1
)

echo.
echo GitHub 用户名: %USERNAME%
echo 仓库地址: https://github.com/%USERNAME%/DeskLibrary
echo.
echo ========================================
echo   将要上传的文件
echo ========================================
echo.

git status --short

echo.
echo 确认以上文件列表正确
echo 注意：调试文档和个人数据已被排除
echo.

set /p CONFIRM="继续上传？(y/n) "
if /i not "%CONFIRM%"=="y" (
    echo 已取消
    pause
    exit /b 1
)

echo.
echo [1/4] 添加文件...
git add .

echo [2/4] 提交更改...
git commit -m "Initial commit: DeskLibrary v1.0.0"

echo [3/4] 设置远程仓库...
git remote set-url origin https://github.com/%USERNAME%/DeskLibrary.git 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/%USERNAME%/DeskLibrary.git
)

echo [4/4] 推送到 GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [提示] 如果推送失败，可能需要先在 GitHub 创建仓库
    echo 访问: https://github.com/new
    echo 仓库名: DeskLibrary
    echo.
)

echo.
echo ========================================
echo   完成！
echo ========================================
echo.
echo 访问你的仓库：
echo https://github.com/%USERNAME%/DeskLibrary
echo.
echo 下一步：
echo 1. 在浏览器中打开仓库地址
echo 2. 添加 Topics: electron, desktop-app, clipboard, windows
echo 3. 启用 Issues 和 Discussions
echo.
pause
