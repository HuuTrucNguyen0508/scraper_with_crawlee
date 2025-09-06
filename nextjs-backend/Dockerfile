# Use the official Node.js 18 image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy sql.js WASM files to public directory for Next.js
RUN mkdir -p public && \
    cp node_modules/sql.js/dist/sql-wasm.wasm public/ && \
    cp node_modules/sql.js/dist/sql-wasm.js public/

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Start the application
CMD ["pnpm", "start"]
