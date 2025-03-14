#!/bin/bash

# Change to the project root directory (where this script is located)
cd "$(dirname "$0")/.." || exit 1

# Default port for this project
PORT=5174

# Kill any existing process on the port
kill_port() {
    lsof -i tcp:${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
}

# Kill existing process and start the dev server
kill_port
export VITE_PORT=$PORT
export PATH="./node_modules/.bin:$PATH"
npm run dev
