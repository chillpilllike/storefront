FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install libc6-compat if needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable Corepack
RUN corepack enable

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Extract PNPM_VERSION from package.json
RUN PNPM_VERSION=$(jq -r '.engines.pnpm' package.json | sed -E 's/[^0-9.]//g') && \
    echo "Using pnpm version: $PNPM_VERSION" && \
    corepack prepare pnpm@$PNPM_VERSION --activate

# Install dependencies using pnpm
RUN pnpm install 

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NEXT_OUTPUT=standalone

# Pass build arguments
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

# Enable Corepack in builder stage
RUN corepack enable

# Extract PNPM_VERSION again for the builder stage
RUN PNPM_VERSION=$(jq -r '.engines.pnpm' package.json | sed -E 's/[^0-9.]//g') && \
    echo "Using pnpm version: $PNPM_VERSION" && \
    corepack prepare pnpm@$PNPM_VERSION --activate

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Pass runtime environment variables
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the built application from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Start the application
CMD ["node", "server.js"]
