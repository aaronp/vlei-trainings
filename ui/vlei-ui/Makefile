.PHONY: help start-ui start-keria start-schema-server start-schema-api start-all stop-keria build deploy deploy-prod install clean

# Default target - show help
help:
	@echo "Available targets:"
	@echo "  make install           - Install npm dependencies"
	@echo "  make start-ui          - Start the VLEI UI development server"
	@echo "  make start-keria       - Start the KERIA API using Docker Compose"
	@echo "  make start-schema-server - Start the basic schema server (legacy)"
	@echo "  make start-schema-api  - Start the enhanced schema REST API server"
	@echo "  make start-all         - Start UI, KERIA API, and schema API server"
	@echo "  make stop-keria        - Stop the KERIA API Docker containers"
	@echo "  make build             - Build the application for production"
	@echo "  make deploy            - Deploy to Vercel (preview)"
	@echo "  make deploy-prod       - Deploy to Vercel (production)"
	@echo "  make clean             - Clean build artifacts"

# Start the UI development server
start-ui:
	@echo "Starting VLEI UI development server..."
	npm run dev

# Start the KERIA API using Docker Compose
start-keria:
	@echo "Starting KERIA API via Docker Compose..."
	cd ../.. && ./deploy.sh

# Start the basic schema server (legacy)
start-schema-server:
	@echo "Starting basic schema server..."
	@command -v node >/dev/null 2>&1 || { echo >&2 "Node.js not installed. Please install Node.js"; exit 1; }
	node schema-server-example.js

# Start the enhanced schema REST API server
start-schema-api:
	@echo "Starting enhanced schema REST API server..."
	@command -v node >/dev/null 2>&1 || { echo >&2 "Node.js not installed. Please install Node.js"; exit 1; }
	node schema-server.js

# Start UI, KERIA API, and schema API server
start-all:
	@echo "Starting KERIA API, Schema API Server, and UI..."
	$(MAKE) start-keria
	@echo "Waiting for KERIA to be ready..."
	@sleep 5
	@echo "Starting schema API server in background..."
	node schema-server.js &
	@sleep 2
	$(MAKE) start-ui

# Stop KERIA Docker containers
stop-keria:
	@echo "Stopping KERIA Docker containers..."
	cd ../.. && docker-compose down

# Install dependencies
install:
	@echo "Installing npm dependencies..."
	npm install

# Build the application for production
build: install
	@echo "Building VLEI UI for production..."
	npm run build

# Deploy to Vercel (preview)
deploy: build
	@echo "Deploying to Vercel (preview)..."
	@command -v vercel >/dev/null 2>&1 || { echo >&2 "Vercel CLI not installed. Please run: npm i -g vercel"; exit 1; }
	vercel

# Deploy to Vercel (production)
deploy-prod: build
	@echo "Deploying to Vercel (production)..."
	@command -v vercel >/dev/null 2>&1 || { echo >&2 "Vercel CLI not installed. Please run: npm i -g vercel"; exit 1; }
	vercel --prod

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist
	rm -rf node_modules
	rm -rf .vercel