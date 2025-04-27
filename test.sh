#!/bin/bash
# Test script for TradingView Symbol Search Proxy

echo "Testing TradingView Symbol Search Proxy..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if the server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Server is not running. Starting server..."
    node server.js &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    echo "Waiting for server to start..."
    sleep 3
fi

# Run the test script
echo "Running test script..."
node test-proxy.js

# If we started the server, stop it
if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping server..."
    kill $SERVER_PID
    echo "Server stopped."
fi

echo "Test complete!" 