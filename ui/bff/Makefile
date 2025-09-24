.PHONY: install dev test package start stop

install:
	bun install

dev:
	bun run dev

test:
	bun run test:integration

package:
	docker build -t vlei-bff-api:latest . 


# Start the KERIA API using Docker Compose
start:
	@echo "Starting KERIA API via Docker Compose..."
	cd ../.. && ./deploy.sh

# Stop KERIA Docker containers
stop:
	@echo "Stopping KERIA Docker containers..."
	cd ../.. && docker-compose down
