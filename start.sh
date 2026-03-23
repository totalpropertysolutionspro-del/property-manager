#!/bin/bash

echo "Starting backend..."
cd backend
npx tsx src/server.ts &

echo "Starting frontend..."
cd ../frontend
npx vite --port 3100 &

wait