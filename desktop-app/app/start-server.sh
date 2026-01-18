#!/bin/bash

# AntifaTimes Stream Manager - Local Server Starter (Mac/Linux)
# This fixes YouTube Error 153 by running on localhost instead of file://

# Try different ports if 8000 is in use
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; do
    echo "⚠️  Port $PORT is already in use, trying next port..."
    PORT=$((PORT + 1))
done

echo "================================================"
echo "🚩 AntifaTimes Stream Manager - Starting Server"
echo "================================================"
echo ""
echo "✅ Starting server on http://localhost:$PORT"
echo ""
echo "📖 Open your browser and go to:"
echo "   http://localhost:$PORT/index.html"
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
    python3 -m http.server $PORT
# Try Python 2 if Python 3 not found
elif command -v python &> /dev/null
then
    python -m SimpleHTTPServer $PORT
else
    echo "❌ ERROR: Python not found!"
    echo ""
    echo "Please install Python to run the server:"
    echo "  - Mac: Install via Homebrew or python.org"
    echo "  - Linux: sudo apt-get install python3"
    echo ""
    exit 1
fi
