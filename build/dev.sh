#!/bin/bash

# Hardware Store Inventory System - Development Script
# Runs React dev server and Go API server simultaneously

set -e

echo "🔧 Hardware Store Inventory System - Development Mode"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "cmd/main.go" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🚀 Starting development servers..."
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    pkill -P $$
    exit
}

trap cleanup SIGINT

# Build React for development (so embed doesn't fail)
echo "📦 Building React for development..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

npm run build
cd ..

# Copy to embed location
mkdir -p internal/embed/frontend
cp -r frontend/dist internal/embed/frontend/

echo "✅ React built and copied for development!"
echo ""

# Start Go API server in background
echo "🚀 Starting Go API server on :8080..."
go run cmd/main.go &
GO_PID=$!

# Wait a moment for Go server to start
sleep 2

# Start React development server
echo "🚀 Starting React development server on :3000..."
echo ""
echo "📍 Development URLs:"
echo "   React Dev Server: http://localhost:3000 (hot reload)"
echo "   Go API Server:    http://localhost:8080 (API + static React)"
echo "   API Docs:         http://localhost:8080/docs/index.html"
echo ""
echo "💡 Use React dev server (port 3000) for development with hot reload!"
echo "💡 Use Go server (port 8080) to test the embedded version!"
echo ""
echo "Press Ctrl+C to stop both servers..."
echo ""

cd frontend
npm run dev

# This line should never be reached, but just in case
wait $GO_PID