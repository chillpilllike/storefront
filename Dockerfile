# Base image for Node.js
FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@9.6.0 --activate  # Install the specified pnpm version

# Install additional dependencies
RUN pnpm i @saleor/macaw-ui react-responsive-carousel

RUN pnpm install 


# Build the application
RUN pnpm build


# Start the application in production mode
CMD ["pnpm", "dev"]
