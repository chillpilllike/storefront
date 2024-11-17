# Base image for Node.js
FROM node:20-alpine AS base

WORKDIR /app
# Enabling Corepack to manage package managers as specified in package.json
RUN corepack enable
RUN corepack prepare pnpm@9.6.0 --activate  # Explicitly install the specified pnpm version

# Copy only the necessary files for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install PNPM dependencies with existing flags (--frozen-lockfile and --prefer-offline)
# Note: pnpm does not support a --no-cache flag
RUN pnpm install --frozen-lockfile --prefer-offline

# Install additional dependencies
RUN pnpm i @saleor/macaw-ui react-responsive-carousel

RUN pnpm install 

COPY . . 


# Build the application
RUN pnpm build


# Start the application in production mode
CMD ["pnpm", "start"]
