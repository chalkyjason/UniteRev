#!/bin/bash

# AntifaTimes Stream Manager - Mac Launcher
# Double-click this file to launch on macOS

cd "$(dirname "$0")"

PORT=8000

# Find available port
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; do
    PORT=$((PORT + 1))
done

echo "================================================"
echo "🚩 AntifaTimes Stream Manager"
echo "================================================"
echo ""
echo "✅ Starting server on http://localhost:$PORT"
echo ""

# Start server in background
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
else
    echo "❌ ERROR: Python not found!"
    echo "Please install Python 3"
    exit 1
fi

# Wait for server to start
sleep 2

# Open browser
URL="http://localhost:$PORT/index.html"
echo "🌐 Opening browser to $URL"
echo ""

open "$URL"

echo "✅ Server is running!"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo ""

# Wait for server process
wait $SERVER_PID
