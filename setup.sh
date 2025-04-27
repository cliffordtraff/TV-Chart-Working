#!/bin/bash
# Setup script for TradingView Symbol Search Proxy

echo "Setting up TradingView Symbol Search Proxy..."

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
  cp watchlist.html public/
fi

if [ ! -f "public/alphaVantageService.js" ]; then
  echo "Copying alphaVantageService.js to public directory..."
  cp alphaVantageService.js public/
fi

if [ ! -f "public/config.js" ]; then
  echo "Copying config.js to public directory..."
  cp config.js public/
fi

if [ ! -f "public/symbolService.js" ]; then
  echo "Copying symbolService.js to public directory..."
  cp public/symbolService.js public/
fi

# Make the script executable
chmod +x setup.sh

echo "Setup complete!"
echo "To start the server, run: npm start"
echo "To test the proxy, run: node test-proxy.js" 