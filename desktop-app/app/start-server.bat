@echo off
REM Multi-Stream Manager - Local Server Starter (Windows)
REM This fixes YouTube Error 153 by running on localhost instead of file://

echo ================================================
echo Multi-Stream Manager - Starting Local Server
echo ================================================
echo.
echo Starting server on http://localhost:8000
echo.
echo Open your browser and go to:
echo    http://localhost:8000/index.html
echo.
echo This runs on localhost to fix YouTube embedding
echo.
echo Press Ctrl+C to stop the server
echo.
echo ================================================
echo.

REM Try to start Python server
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    REM Try Python 2 if Python 3 failed
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: Python not found!
        echo.
        echo Please install Python from python.org
        echo.
        pause
        exit /b 1
    )
)
