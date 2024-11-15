# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app



# Install git to clone the repository
RUN apk add --no-cache git

# Install corepack and enable pnpm
RUN npm install -g corepack@0.24.1 && corepack enable

# Install dependencies using pnpm
RUN pnpm i

COPY . .

# Build the application
RUN pnpm run build

# Command to start the application
CMD ["pnpm", "run", "start"]
