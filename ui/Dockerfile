# syntax=docker/dockerfile:1

# Multi-stage build for Bun + Vite + SolidJS application

################################################################################
# Base stage with Bun runtime
FROM oven/bun:1-alpine as base
WORKDIR /app

################################################################################
# Development dependencies stage
FROM base as dev-deps

# Copy only package files first
COPY package.json ./
RUN bun install

################################################################################
# Development stage
FROM base as development
WORKDIR /app

# Copy dependencies from dev-deps stage (cached)
COPY --from=dev-deps /app/node_modules ./node_modules
COPY package.json ./

# Copy everything else for development
# This layer will rebuild when any file changes, but deps are cached
COPY . .

EXPOSE 5173

# Start Vite dev server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

################################################################################
# Dependencies stage - cache npm packages
FROM base as deps

# Copy only package files first (most stable layer)
COPY package.json ./
RUN bun install

################################################################################
# Build stage
FROM base as build

# Copy dependencies from deps stage (cached)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy source files separately to maximize cache
# Configuration files (rarely change)
COPY tsconfig*.json ./
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Public assets (occasionally change)
COPY public ./public

# Index HTML (occasionally change)
COPY index.html ./

# Source code (frequently changes)
COPY src ./src

# Build the application
RUN bun run build

################################################################################
# Production stage
FROM oven/bun:1-alpine as production
WORKDIR /app

# Create non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy only what's needed for production
COPY --from=build --chown=appuser:appuser /app/dist ./dist
COPY --from=build --chown=appuser:appuser /app/package.json ./

USER appuser

EXPOSE 4173

# Serve the built application
CMD ["bun", "run", "serve"]

