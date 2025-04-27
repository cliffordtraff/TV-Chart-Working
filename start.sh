#!/bin/bash
# Start script for TradingView Symbol Search Proxy

echo "Starting TradingView Symbol Search Proxy..."

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

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Dependencies are not installed. Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server..."
node server.js 