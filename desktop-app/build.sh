#!/bin/bash

# AntifaTimes Stream Manager - Build Script
# Run this on your local machine to build installers

echo "================================================"
echo "🔨 Building AntifaTimes Stream Manager"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo "Please run this script from the desktop-app directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1/3: Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install dependencies"
    echo "Try: npm cache clean --force && npm install"
    exit 1
fi

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 2: Build for current platform
echo "🔨 Step 2/3: Building for your platform..."
echo ""

# Detect platform and build
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - Building .dmg installer"
    npm run build:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux - Building .AppImage"
    npm run build:linux
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows - Building .exe installer"
    npm run build:win
else
    echo "Could not detect platform. Building for all platforms..."
    npm run build:all
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""

# Step 3: Show results
echo "📂 Step 3/3: Build artifacts location:"
echo ""
echo "Your installers are in: $(pwd)/dist/"
echo ""

if [ -d "dist" ]; then
    echo "Files created:"
    ls -lh dist/ | grep -E '\.(dmg|exe|AppImage|deb)$' || ls -lh dist/
    echo ""
fi

echo "================================================"
echo "✅ BUILD COMPLETE!"
echo "================================================"
echo ""
echo "📤 Next Steps:"
echo "1. Find installers in dist/ folder"
echo "2. Test the installer on your machine"
echo "3. Upload to GitHub Releases or share directly"
echo ""
echo "ℹ️  See BUILD_GUIDE.md for:"
echo "   - User installation instructions"
echo "   - Security warnings (unsigned apps)"
echo "   - Code signing process"
echo ""
