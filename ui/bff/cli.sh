#!/bin/bash

# KERI AID CLI Launcher
# This script launches the interactive CLI tool for managing KERI AIDs

echo "🆔 Starting KERI AID CLI Tool..."
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun runtime is not installed."
    echo "Please install Bun from https://bun.sh/"
    exit 1
fi

# Check if KERIA service is running (optional check)
SERVICE_URL="http://localhost:3001"
if ! curl -s "$SERVICE_URL" > /dev/null 2>&1; then
    echo "⚠️  Warning: KERIA service may not be running at $SERVICE_URL"
    echo "   Make sure to start the service before using AID operations."
    echo ""
fi

# Navigate to CLI directory and run
cd "$(dirname "$0")/cli"
exec bun run index.ts