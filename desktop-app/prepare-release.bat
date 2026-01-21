@echo off
REM AntifaTimes Stream Manager - Release Preparation Script (Windows)
REM This script helps prepare a release for GitHub

echo ================================================
echo   AntifaTimes Stream Manager - Release Prep
echo ================================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: Run this script from the desktop-app directory
    exit /b 1
)

REM Get current version (requires Node.js)
for /f "delims=" %%i in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%i
echo Current version: %CURRENT_VERSION%
echo.

REM Ask for new version
set /p NEW_VERSION="Enter new version (e.g., 1.0.1): "

if "%NEW_VERSION%"=="" (
    echo ERROR: Version cannot be empty
    exit /b 1
)

REM Update package.json version
echo Updating package.json version to %NEW_VERSION%...
powershell -Command "(gc package.json) -replace '\"version\": \"%CURRENT_VERSION%\"', '\"version\": \"%NEW_VERSION%\"' | Out-File -encoding UTF8 package.json"
echo Version updated
echo.

REM Ask if user wants to build now
set /p BUILD_NOW="Build app now? (y/n): "

if /i "%BUILD_NOW%"=="y" (
    echo.
    echo Building application...
    echo.

    REM Install dependencies if needed
    if not exist "node_modules" (
        echo Installing dependencies...
        call npm install
    )

    REM Build
    echo Building for Windows...
    call npm run build:win

    echo.
    echo Build complete!
    echo.
    echo Build files location: %cd%\dist\
    echo.
    dir /b dist\*.exe dist\*.yml
    echo.
)

echo ================================================
echo   Next Steps:
echo ================================================
echo.
echo 1. Commit the version change:
echo    git add package.json
echo    git commit -m "Bump version to v%NEW_VERSION%"
echo    git push
echo.
echo 2. Create and push tag:
echo    git tag v%NEW_VERSION%
echo    git push origin v%NEW_VERSION%
echo.
echo 3. Create GitHub Release:
echo    https://github.com/chalkyjason/UniteRev/releases/new
echo.
echo 4. Upload these files from dist/:
echo    - All .exe files (Windows)
echo    - All .yml files (IMPORTANT for auto-update!)
echo.
echo See RELEASE_GUIDE.md for detailed instructions
echo.
echo ================================================
pause
