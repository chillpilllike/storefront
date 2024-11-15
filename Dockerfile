# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS base

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat git

# Setup working directory
WORKDIR /app

# Enabling Corepack to manage package managers as specified in package.json
RUN corepack enable

# Copy only the necessary files for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install PNPM via Corepack and install dependencies
RUN corepack prepare pnpm@$(jq -r '.engines.pnpm' package.json | sed -E 's/[^0-9.]//g') --activate
RUN pnpm install --frozen-lockfile --prefer-offline

RUN pnpm i @saleor/macaw-ui
RUN pnpm install @radix-ui/react-slot
RUN pnpm install class-variance-authority
RUN pnpm install embla-carousel-react
RUN pnpm install tailwind-merge
RUN pnpm install swiper@11.1.14



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
ENV NODE_ENV=production

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
