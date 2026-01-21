#!/bin/bash

# Fix macOS build issues - Clean and reinstall dependencies

echo "================================================"
echo "🔧 Fixing macOS Build Issues"
echo "================================================"
echo ""

cd "$(dirname "$0")"

echo "🗑️  Step 1: Cleaning old dependencies..."
rm -rf node_modules
rm -f package-lock.json
rm -rf ~/.electron
rm -rf ~/Library/Caches/electron
rm -rf ~/Library/Caches/electron-builder
echo "✅ Clean complete"
echo ""

echo "📦 Step 2: Installing fresh dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3: Building app..."
npm run build:mac
echo ""

echo "================================================"
echo "✅ Build fix complete!"
echo "================================================"
echo ""
echo "If you still see errors, try:"
echo "1. Update Node.js to latest LTS version (v20+)"
echo "2. Clear npm cache: npm cache clean --force"
echo "3. Restart your terminal"
echo ""
