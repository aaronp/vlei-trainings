.PHONY: help start-ui start-keria start-schema-server start-schema-api start-all stop-keria build deploy deploy-prod install clean

# Default target - show help
help:
	@echo "Available targets:"
	@echo "  make install           - Install npm dependencies"
	@echo "  make start-ui          - Start the VLEI UI development server"
	@echo "  make start-keria       - Start the KERIA API using Docker Compose"
	@echo "  make start-all         - Start UI, KERIA API, and schema API server"
	@echo "  make stop-keria        - Stop the KERIA API Docker containers"
	@echo "  make build             - Build the application for production"
	@echo "  make deploy            - Deploy to Vercel (preview)"
	@echo "  make deploy-prod       - Deploy to Vercel (production)"
	@echo "  make clean             - Clean build artifacts"
test:
	npm run test:integration
# Start the UI development server
start-ui:
	@echo "Starting VLEI UI development server..."
	npm run dev

# Start the KERIA API using Docker Compose
start-keria:
	@echo "Starting KERIA API via Docker Compose..."
	cd ../.. && ./deploy.sh

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