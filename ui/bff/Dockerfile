# Use the official Bun image
FROM oven/bun:1.2-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for better Docker layer caching)
# Copy package.json and bun.lockb (if it exists)
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Expose the port the app runs on
EXPOSE 3001

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3001

# Default command - can be overridden in docker-compose
CMD ["bun", "run", "dev"]