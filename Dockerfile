# arenas/Dockerfile (Frontend)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
