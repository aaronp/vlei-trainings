.PHONY: help start-ui start-keria start-schema-server start-schema-api start-all stop-keria build deploy deploy-prod install clean test test-schemas test-keria-connection package run stop-ui

# Default target - show help
help:
	@echo "Available targets:"
	@echo "  make install           - Install npm dependencies"
	@echo "  make start-ui          - Start the VLEI UI development server"
	@echo "  make start-keria       - Start the KERIA API using Docker Compose"
	@echo "  make build             - Build the application for production"
	@echo "  make deploy            - Deploy to Vercel (preview)"
	@echo "  make deploy-prod       - Deploy to Vercel (production)"
	@echo "  make clean             - Clean build artifacts"
	@echo "  make test              - Run integration tests"
	@echo "  make package           - Build and package the app in a Docker container"
	@echo "  make run               - Run the containerized app on port 3000"
	@echo "  make stop-ui           - Stop and remove the containerized UI"

test:
	npm run test:integration

test-schemas:
	npm run test:integration -- -t "should create a unique test schema"

test-keria-connection:
	npm run test:integration -- -t "should verify KERIA connection"

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

# Package the app in a Docker container
package: build
	@echo "Building Docker image for VLEI UI..."
	docker build -t vlei-ui:latest .

# Run the containerized app
run:
	@echo "Checking for existing vlei-ui container..."
	@docker stop vlei-ui 2>/dev/null || true
	@docker rm vlei-ui 2>/dev/null || true
	@echo "Running VLEI UI container on port 3000..."
	docker run -d --name vlei-ui -p 3000:3000 vlei-ui:latest
	@echo "VLEI UI is now running at http://localhost:3000"
	@echo "To stop the container, run: make stop-ui"

# Stop the containerized UI
stop-ui:
	@echo "Stopping VLEI UI container..."
	@docker stop vlei-ui 2>/dev/null || true
	@docker rm vlei-ui 2>/dev/null || true
	@echo "VLEI UI container stopped and removed."