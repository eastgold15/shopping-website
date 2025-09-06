@echo off
chcp 65001 >nul
echo ========================================
echo    构建统一部署镜像
echo ========================================
echo.

:: 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装或未启动
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker 环境检查通过
echo.

:: 设置镜像名称和标签
set IMAGE_NAME=shopping-website
set IMAGE_TAG=latest
set FULL_IMAGE_NAME=%IMAGE_NAME%:%IMAGE_TAG%

echo 🏗️  开始构建统一镜像: %FULL_IMAGE_NAME%
echo.

:: 构建镜像
echo 📦 构建 Docker 镜像...
docker build -f Dockerfile.unified -t %FULL_IMAGE_NAME% .

if %errorlevel% equ 0 (
    echo.
    echo ✅ 镜像构建成功！
    echo.
    echo 📊 镜像信息:
    docker images %IMAGE_NAME%
    echo.
    echo 🚀 部署命令:
    echo    cd onepanel
    echo    docker-compose up -d
    echo.
    echo 🔍 测试命令:
    echo    docker run --rm -p 80:80 -e DOMAIN=localhost %FULL_IMAGE_NAME%
    echo.
) else (
    echo ❌ 镜像构建失败
    echo 请检查构建日志中的错误信息
)

echo 📝 构建完成时间: %date% %time%
echo.
pause