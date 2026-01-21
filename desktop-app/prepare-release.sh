#!/bin/bash

# AntifaTimes Stream Manager - Release Preparation Script
# This script helps prepare a release for GitHub

set -e

echo "================================================"
echo "🚀 AntifaTimes Stream Manager - Release Prep"
echo "================================================"
echo ""

# Check if we're in the desktop-app directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the desktop-app directory"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"
echo ""

# Ask for new version
read -p "Enter new version (e.g., 1.0.1): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo "❌ Version cannot be empty"
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version to $NEW_VERSION..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
rm package.json.bak

echo "✅ Version updated"
echo ""

# Ask if user wants to build now
read -p "Build app now? (y/n): " BUILD_NOW

if [ "$BUILD_NOW" = "y" ] || [ "$BUILD_NOW" = "Y" ]; then
    echo ""
    echo "🏗️  Building application..."
    echo ""

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing dependencies..."
        npm install
    fi

    # Build
    echo "🔨 Building for current platform..."
    npm run build

    echo ""
    echo "✅ Build complete!"
    echo ""
    echo "📂 Build files location: $(pwd)/dist/"
    echo ""
    ls -lh dist/ | grep -E '\.(dmg|exe|AppImage|yml|zip)$'
    echo ""
fi

echo "================================================"
echo "📋 Next Steps:"
echo "================================================"
echo ""
echo "1. Commit the version change:"
echo "   git add package.json"
echo "   git commit -m \"Bump version to v$NEW_VERSION\""
echo "   git push"
echo ""
echo "2. Create and push tag:"
echo "   git tag v$NEW_VERSION"
echo "   git push origin v$NEW_VERSION"
echo ""
echo "3. Create GitHub Release:"
echo "   https://github.com/chalkyjason/UniteRev/releases/new"
echo ""
echo "4. Upload these files from dist/:"
echo "   - All .dmg files (Mac)"
echo "   - All .zip files (Mac auto-update)"
echo "   - All .exe files (Windows)"
echo "   - All .AppImage files (Linux)"
echo "   - All .yml files (IMPORTANT for auto-update!)"
echo ""
echo "📖 See RELEASE_GUIDE.md for detailed instructions"
echo ""
echo "================================================"
