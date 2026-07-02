# Multi-stage build for production
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
WORKDIR /app/backend
RUN npm install
WORKDIR /app

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY . .
COPY backend/ backend/

# Build frontend
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for graceful shutdown
RUN apk add --no-cache dumb-init

# Copy built backend
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

# Copy built frontend
COPY --from=builder /app/dist ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
