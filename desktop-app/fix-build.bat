@echo off
REM Fix Windows build issues - Clean and reinstall dependencies

echo ================================================
echo   Fixing Windows Build Issues
echo ================================================
echo.

cd /d "%~dp0"

echo Step 1: Cleaning old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json
if exist "%LOCALAPPDATA%\electron" rmdir /s /q "%LOCALAPPDATA%\electron"
if exist "%LOCALAPPDATA%\electron-builder" rmdir /s /q "%LOCALAPPDATA%\electron-builder"
echo Clean complete
echo.

echo Step 2: Installing fresh dependencies...
call npm install
echo Dependencies installed
echo.

echo Step 3: Building app...
call npm run build:win
echo.

echo ================================================
echo   Build fix complete!
echo ================================================
echo.
echo If you still see errors, try:
echo 1. Update Node.js to latest LTS version (v20+)
echo 2. Clear npm cache: npm cache clean --force
echo 3. Restart your terminal/command prompt
echo.
pause
