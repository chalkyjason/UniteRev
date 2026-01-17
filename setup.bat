@echo off
REM Live Protest Viewer - Easy Setup Script for Windows
REM This script will help you set up the app in just a few minutes!

echo ==========================================
echo   Live Protest Viewer - Easy Setup
echo ==========================================
echo.

REM Check if Docker is installed
echo Checking if Docker is installed...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop first:
    echo https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
echo Checking if Docker is running...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop (look for the whale icon in system tray)
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed and running!
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo Setting up your API keys...
    echo.
    echo You'll need two API keys (both are FREE):
    echo 1. YouTube Data API Key
    echo 2. Twitch Client ID and Secret
    echo.
    echo Follow the instructions in the README if you haven't gotten these yet.
    echo.

    REM Copy example env file
    copy "backend\.env.example" "backend\.env" >nul

    REM Ask for YouTube API key
    echo Enter your YouTube API Key:
    set /p YOUTUBE_KEY="YouTube API Key: "

    REM Ask for Twitch credentials
    echo.
    echo Enter your Twitch credentials:
    set /p TWITCH_ID="Twitch Client ID: "
    set /p TWITCH_SECRET="Twitch Client Secret: "

    REM Update .env file using PowerShell
    powershell -Command "(gc backend\.env) -replace 'YOUR_YOUTUBE_API_KEY_HERE', '%YOUTUBE_KEY%' | Set-Content backend\.env"
    powershell -Command "(gc backend\.env) -replace 'YOUR_TWITCH_CLIENT_ID_HERE', '%TWITCH_ID%' | Set-Content backend\.env"
    powershell -Command "(gc backend\.env) -replace 'YOUR_TWITCH_CLIENT_SECRET_HERE', '%TWITCH_SECRET%' | Set-Content backend\.env"

    echo.
    echo [OK] API keys saved!
) else (
    echo [OK] Configuration file found!
)

echo.
echo Starting the application...
echo This may take a few minutes the first time (downloading images).
echo.

REM Start docker compose
docker-compose up -d

REM Wait for services to be ready
echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if API is healthy
echo Checking if the backend is ready...
set RETRIES=0
:CHECK_HEALTH
curl -s http://localhost:8000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is ready!
    goto :READY
)
set /a RETRIES+=1
if %RETRIES% LSS 30 (
    echo|set /p="."
    timeout /t 2 /nobreak >nul
    goto :CHECK_HEALTH
)

:READY
echo.
echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Your Live Protest Viewer is now running!
echo.
echo Open your browser to:
echo http://localhost:3000
echo.
echo The viewer will open automatically in 3 seconds...
echo.

REM Try to open browser automatically
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ==========================================
echo   Quick Tips:
echo ==========================================
echo.
echo 1. Click 'Select Streams' to browse live protests
echo 2. Choose your grid layout (2x2, 3x3, 4x4, etc.)
echo 3. Click any stream to activate its audio (red border)
echo 4. Your settings save automatically!
echo.
echo To stop the app later, run:
echo   docker-compose down
echo.
echo To start it again, just run this script:
echo   setup.bat
echo.
echo ==========================================
echo.
echo Happy streaming!
echo.
pause
