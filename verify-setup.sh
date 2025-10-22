#!/bin/bash
# Verification script for React Dashboard with Flask Backend setup

echo "========================================="
echo "BiB! Systems Monitor - Setup Verification"
echo "========================================="
echo ""

# Check Node.js installation
echo "Checking Node.js installation..."
node --version
npm --version
echo ""

# Check Python installation
echo "Checking Python installation..."
python3 --version
pip3 --version
echo ""

# Install dependencies
echo "Installing npm dependencies..."
npm install
echo ""

echo "Installing Python dependencies..."
pip3 install -r requirements.txt
echo ""

# Build React app
echo "Building React application..."
npm run build
echo ""

echo "========================================="
echo "Setup verification complete!"
echo "========================================="
echo ""
echo "To run the application:"
echo "1. Start Flask backend: python3 app.py"
echo "2. Start React dev server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Flask API will be available at http://localhost:5000"
echo "  - Health check: http://localhost:5000/api/health"
echo "  - Metrics: http://localhost:5000/api/metrics"
echo ""
