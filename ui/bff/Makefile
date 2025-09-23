.PHONY: install dev test package

install:
	bun install

dev:
	bun run dev

test:
	bun run test:integration

package:
	docker build -t vlei-bff-api:latest . 