FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
# Use ci for cleaner, faster installs in CI/Docker environments
RUN npm ci --silent

# Copy application code (respects .dockerignore - excludes node_modules/)
COPY . .

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "start"]