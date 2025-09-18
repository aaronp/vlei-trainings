.PHONY: help start-ui start-keria start-all stop-keria

# Default target - show help
help:
	@echo "Available targets:"
	@echo "  make start-ui      - Start the VLEI UI development server"
	@echo "  make start-keria   - Start the KERIA API using Docker Compose"
	@echo "  make start-all     - Start both UI and KERIA API"
	@echo "  make stop-keria    - Stop the KERIA API Docker containers"

# Start the UI development server
start-ui:
	@echo "Starting VLEI UI development server..."
	npm run dev

# Start the KERIA API using Docker Compose
start-keria:
	@echo "Starting KERIA API via Docker Compose..."
	cd ../.. && ./deploy.sh

# Start both UI and KERIA API
start-all:
	@echo "Starting KERIA API and UI..."
	$(MAKE) start-keria
	@echo "Waiting for KERIA to be ready..."
	@sleep 10
	$(MAKE) start-ui

# Stop KERIA Docker containers
stop-keria:
	@echo "Stopping KERIA Docker containers..."
	cd ../.. && docker-compose down