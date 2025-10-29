#!/bin/bash

# Comprehensive Test Runner Script
# This script runs tests with environment variables loaded from .env file

set -e

echo "=========================================="
echo "  DEX Data Fetcher - Test Runner"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with your secrets:"
    echo "  cp .env.example .env"
    echo ""
    echo "Then edit .env and add your RPC URLs and API keys."
    exit 1
fi

echo "✓ Found .env file"
echo ""

# Validate that required variables are set
source .env

if [ -z "$ETHEREUM_RPC_URL" ]; then
    echo "❌ Error: ETHEREUM_RPC_URL is not set in .env"
    exit 1
fi

if [ -z "$POLYGON_RPC_URL" ]; then
    echo "❌ Error: POLYGON_RPC_URL is not set in .env"
    exit 1
fi

echo "✓ Environment variables validated"
echo ""
echo "Configuration:"
echo "  ETHEREUM_RPC_URL: ${ETHEREUM_RPC_URL:0:30}..."
echo "  POLYGON_RPC_URL: ${POLYGON_RPC_URL:0:30}..."
if [ -n "$GRAPH_API_KEY" ]; then
    echo "  GRAPH_API_KEY: ${GRAPH_API_KEY:0:20}..."
else
    echo "  GRAPH_API_KEY: (not set)"
fi
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Run tests
echo "=========================================="
echo "  Running Comprehensive Tests"
echo "=========================================="
echo ""

npm run test:env

echo ""
echo "=========================================="
echo "  Tests Complete!"
echo "=========================================="
