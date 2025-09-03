#!/bin/bash

# Build script for Cloudflare Pages

# Navigate to ui directory
cd ui

# Install dependencies using npm (Cloudflare Pages doesn't support Bun yet)
npm install

# Build the application
npm run build

# The output will be in ui/dist directory