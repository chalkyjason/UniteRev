#!/bin/bash

# Live Protest Viewer - Easy Setup Script
# This script will help you set up the app in just a few minutes!

echo "=========================================="
echo "  Live Protest Viewer - Easy Setup  "
echo "=========================================="
echo ""

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${BLUE}Checking if Docker is installed...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo ""
    echo "Please install Docker Desktop first:"
    echo "Mac: https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    echo ""
    exit 1
fi

# Check if Docker is running
echo -e "${BLUE}Checking if Docker is running...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop (look for the whale icon 🐳)"
    echo "Then run this script again."
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running!${NC}"
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Setting up your API keys...${NC}"
    echo ""
    echo "You'll need two API keys (both are FREE):"
    echo "1. YouTube Data API Key"
    echo "2. Twitch Client ID and Secret"
    echo ""
    echo "Follow the instructions in the README if you haven't gotten these yet."
    echo ""

    # Copy example env file
    cp backend/.env.example backend/.env

    # Ask for YouTube API key
    echo -e "${BLUE}Enter your YouTube API Key:${NC}"
    read -p "YouTube API Key: " YOUTUBE_KEY

    # Ask for Twitch credentials
    echo ""
    echo -e "${BLUE}Enter your Twitch credentials:${NC}"
    read -p "Twitch Client ID: " TWITCH_ID
    read -p "Twitch Client Secret: " TWITCH_SECRET

    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/YOUR_YOUTUBE_API_KEY_HERE/$YOUTUBE_KEY/" backend/.env
        sed -i '' "s/YOUR_TWITCH_CLIENT_ID_HERE/$TWITCH_ID/" backend/.env
        sed -i '' "s/YOUR_TWITCH_CLIENT_SECRET_HERE/$TWITCH_SECRET/" backend/.env
    else
        # Linux
        sed -i "s/YOUR_YOUTUBE_API_KEY_HERE/$YOUTUBE_KEY/" backend/.env
        sed -i "s/YOUR_TWITCH_CLIENT_ID_HERE/$TWITCH_ID/" backend/.env
        sed -i "s/YOUR_TWITCH_CLIENT_SECRET_HERE/$TWITCH_SECRET/" backend/.env
    fi

    echo ""
    echo -e "${GREEN}✅ API keys saved!${NC}"
else
    echo -e "${GREEN}✅ Configuration file found!${NC}"
fi

echo ""
echo -e "${BLUE}Starting the application...${NC}"
echo "This may take a few minutes the first time (downloading images)."
echo ""

# Start docker compose
docker-compose up -d

# Wait for services to be ready
echo ""
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Check if API is healthy
echo -e "${BLUE}Checking if the backend is ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo ""
echo "=========================================="
echo -e "${GREEN}  🎉 Setup Complete! 🎉${NC}"
echo "=========================================="
echo ""
echo "Your Live Protest Viewer is now running!"
echo ""
echo -e "${BLUE}Open your browser to:${NC}"
echo "👉 http://localhost:3000"
echo ""
echo "The viewer will open automatically in 3 seconds..."
echo ""

# Try to open browser automatically
sleep 3
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000 in your browser"
fi

echo ""
echo "=========================================="
echo "  Quick Tips:"
echo "=========================================="
echo ""
echo "1. Click 'Select Streams' to browse live protests"
echo "2. Choose your grid layout (2x2, 3x3, 4x4, etc.)"
echo "3. Click any stream to activate its audio (red border)"
echo "4. Your settings save automatically!"
echo ""
echo "To stop the app later, run:"
echo "  docker-compose down"
echo ""
echo "To start it again, just run this script:"
echo "  ./setup.sh"
echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}Happy streaming! 📺🔴${NC}"
echo ""
