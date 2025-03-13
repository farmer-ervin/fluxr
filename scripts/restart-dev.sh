#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.." || exit 1

# Kill any existing node processes running on port 5173 (Vite's default port)
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start the development server with nodemon
npm run dev:watch 