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

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy production server and schema service files
COPY production-server.js ./

# Create directory structure and copy source files
RUN mkdir -p ./src/api ./src/services
COPY --from=builder /app/src/api/schemaApiRouter.js ./src/api/
COPY --from=builder /app/src/services/schemaStorage.js ./src/services/

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Start the app with our production server
CMD ["node", "production-server.js"]