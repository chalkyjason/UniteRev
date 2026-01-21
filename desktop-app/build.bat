@echo off
REM AntifaTimes Stream Manager - Build Script (Windows)
REM Run this on your Windows machine to build installers

echo ================================================
echo  Building AntifaTimes Stream Manager
echo ================================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ERROR: package.json not found!
    echo Please run this script from the desktop-app directory
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo  Step 1/3: Installing dependencies...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo  Failed to install dependencies
    echo Try: npm cache clean --force ^&^& npm install
    pause
    exit /b 1
)

echo.
echo  Dependencies installed
echo.

REM Step 2: Build for Windows
echo  Step 2/3: Building Windows installer...
echo.
call npm run build:win

if %errorlevel% neq 0 (
    echo.
    echo  Build failed
    pause
    exit /b 1
)

echo.
echo  Build complete!
echo.

REM Step 3: Show results
echo  Step 3/3: Build artifacts location:
echo.
echo Your installer is in: %cd%\dist\
echo.

if exist dist (
    echo Files created:
    dir /B dist\*.exe 2>nul
    echo.
)

echo ================================================
echo  BUILD COMPLETE!
echo ================================================
echo.
echo  Next Steps:
echo 1. Find installer in dist\ folder
echo 2. Test the installer on your machine
echo 3. Upload to GitHub Releases or share directly
echo.
echo  See BUILD_GUIDE.md for:
echo    - User installation instructions
echo    - Security warnings (unsigned apps)
echo    - Code signing process
echo.
pause
