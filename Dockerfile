# Base image for Node.js
FROM node:20-alpine AS base

WORKDIR /app

# Install additional dependencies
RUN pnpm i @saleor/macaw-ui react-responsive-carousel

RUN pnpm install 


# Build the application
RUN pnpm build


# Start the application in production mode
CMD ["pnpm", "dev"]
