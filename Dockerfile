# Base Node image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install necessary dependencies for sharp
RUN apk add --no-cache libc6-compat python3 make g++ libpng-dev jpeg-dev

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./



# Install pnpm and dependencies
RUN corepack enable
RUN corepack prepare pnpm@9.6.0 --activate
RUN pnpm i --frozen-lockfile --prefer-offline
RUN pnpm add sharp

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove any cache folders before building
RUN rm -rf .next node_modules/.cache

# Build the Next.js application
ENV NEXT_OUTPUT=standalone
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

RUN corepack enable
RUN corepack prepare pnpm@9.6.0 --activate
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files for standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ensure correct permissions for .next/cache
RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs .next
RUN chown -R nextjs:nodejs /app

USER nextjs

CMD ["node", "server.js"]
