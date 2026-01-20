@echo off
REM AntifaTimes Stream Manager - One-Click Launcher (Windows)
REM Starts server and opens browser automatically

cd /d "%~dp0"

set PORT=8000

echo ================================================
echo  AntifaTimes Stream Manager
echo ================================================
echo.
echo  Starting server on http://localhost:%PORT%
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python from python.org
    echo.
    pause
    exit /b 1
)

REM Start server in background
echo  Starting server...
start /B python -m http.server %PORT% >nul 2>&1

REM Wait for server to start
timeout /t 2 /nobreak >nul

REM Open browser
set URL=http://localhost:%PORT%/index.html
echo  Opening browser to %URL%
echo.
start "" "%URL%"

echo  Server is running!
echo.
echo  Press Ctrl+C or close this window to stop the server
echo.
echo ================================================
echo.

REM Keep window open and server running
python -m http.server %PORT%
