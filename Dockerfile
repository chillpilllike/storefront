# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS base

# Install dependencies only when needed with no-cache

RUN apk add --update libc6-compat git && rm -rf /var/cache/apk/*

# Setup working directory
WORKDIR /app

# Enabling Corepack to manage package managers as specified in package.json
RUN corepack enable
RUN corepack prepare pnpm@9.6.0 --activate  # Explicitly install the specified pnpm version

# Copy only the necessary files for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install PNPM dependencies with existing flags (--frozen-lockfile and --prefer-offline)
# Note: pnpm does not support a --no-cache flag
RUN pnpm install --frozen-lockfile --prefer-offline

# Install additional packages
# Note: pnpm does not support a --no-cache flag for these commands
RUN pnpm i @saleor/macaw-ui
RUN pnpm i react-responsive-carousel

# Builder stage to build the application
FROM base AS builder
WORKDIR /app
COPY . .

# Set environment variables for Next.js build
ENV NEXT_OUTPUT=standalone
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

# Build the application using PNPM
RUN pnpm build

# Production stage to run the application
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=development

# Create system user and group for running the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy the built files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for security
USER nextjs

# Command to run the application
CMD ["node", "server.js"]
