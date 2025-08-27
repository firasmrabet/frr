# Multi-stage Dockerfile for the frontend
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
# Install build dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# Production stage - serve with nginx
FROM nginx:stable-alpine AS production
# Remove default static files
RUN rm -rf /usr/share/nginx/html/*
# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
