#!/bin/bash

# Multi-Stream Manager - Local Server Starter (Mac/Linux)
# This fixes YouTube Error 153 by running on localhost instead of file://

echo "================================================"
echo "🎬 Multi-Stream Manager - Starting Local Server"
echo "================================================"
echo ""
echo "✅ Starting server on http://localhost:8000"
echo ""
echo "📖 Open your browser and go to:"
echo "   http://localhost:8000/index.html"
echo ""
echo "💡 This runs on localhost to fix YouTube embedding"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null
then
    python3 -m http.server 8000
# Try Python 2 if Python 3 not found
elif command -v python &> /dev/null
then
    python -m SimpleHTTPServer 8000
else
    echo "❌ ERROR: Python not found!"
    echo ""
    echo "Please install Python to run the server:"
    echo "  - Mac: Install via Homebrew or python.org"
    echo "  - Linux: sudo apt-get install python3"
    echo ""
    exit 1
fi
