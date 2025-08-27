#!/bin/bash

# Hardware Store Inventory System - Single Executable Build Script
# This script builds the React frontend and embeds it into the Go binary

set -e

echo "🏗️  Hardware Store Inventory System - Build Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "cmd/main.go" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Building React frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

# Build React for production
echo "   Building React production bundle..."
npm run build

cd ..

echo "✅ React frontend built successfully!"
echo ""

echo "📦 Step 2: Copying React build to embed location..."
# Remove old embedded files
rm -rf internal/embed/frontend/dist
mkdir -p internal/embed/frontend
cp -r frontend/dist internal/embed/frontend/

echo "✅ React build copied to embed location!"
echo ""

echo "📦 Step 3: Building Go binary with embedded React..."
# Build the Go binary
go build -ldflags="-s -w" -o hardware-store-inventory ./cmd/main.go

echo "✅ Go binary built successfully!"
echo ""

echo "🎉 Build completed successfully!"
echo ""
echo "📄 Single executable created: hardware-store-inventory"
echo "💾 Size: $(du -h hardware-store-inventory | cut -f1)"
echo ""
echo "🚀 To run the application:"
echo "   # First run (creates database and sample data):"
echo "   ./hardware-store-inventory --seed"
echo ""
echo "   # Normal operation:"
echo "   ./hardware-store-inventory"
echo ""
echo "🌐 Access your inventory system at: http://localhost:8080"
echo "📚 API documentation at: http://localhost:8080/docs/index.html"
echo ""
echo "Perfect for hardware store inventory management! 📦🔧"