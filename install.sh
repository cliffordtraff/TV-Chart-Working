#!/bin/bash
# Installation script for TradingView Symbol Search Proxy

echo "Installing TradingView Symbol Search Proxy..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create public directory if it doesn't exist
if [ ! -d "public" ]; then
    echo "Creating public directory..."
    mkdir -p public
fi

# Copy files to public directory if they don't exist
if [ ! -f "public/watchlist.html" ]; then
    echo "Copying watchlist.html to public directory..."
    cp watchlist.html public/ 2>/dev/null || echo "watchlist.html not found, skipping..."
fi

if [ ! -f "public/alphaVantageService.js" ]; then
    echo "Copying alphaVantageService.js to public directory..."
    cp alphaVantageService.js public/ 2>/dev/null || echo "alphaVantageService.js not found, skipping..."
fi

if [ ! -f "public/config.js" ]; then
    echo "Copying config.js to public directory..."
    cp config.js public/ 2>/dev/null || echo "config.js not found, skipping..."
fi

if [ ! -f "public/symbolService.js" ]; then
    echo "Copying symbolService.js to public directory..."
    cp public/symbolService.js public/ 2>/dev/null || echo "symbolService.js not found, skipping..."
fi

echo "Installation complete!"
echo ""
echo "To start the server, run: npm start"
echo "To test the proxy, run: node test-proxy.js"
echo ""
echo "For more information, see the README.md file." 