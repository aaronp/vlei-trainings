# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create a simple script to inject environment variables at runtime
RUN echo '#!/bin/sh\n\
# This script allows runtime environment variable injection\n\
# For now, we just start serve\n\
serve -s dist -l 3000' > /app/start.sh && chmod +x /app/start.sh

# Expose port 3000 (serve default port)
EXPOSE 3000

# Start the app with our script
CMD ["/app/start.sh"]