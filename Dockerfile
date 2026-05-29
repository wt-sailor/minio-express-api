# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{const j=JSON.parse(d);process.exit(j.status==='healthy'?0:1)}catch(e){process.exit(1)}})})"

# Start the application
CMD ["node", "dist/main.js"]
