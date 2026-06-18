#!/bin/bash
set -e
npm install
npx next build
ls -la .next/standalone/server.js || (echo "Build failed - standalone not found" && exit 1)
# Copy static assets
cp -r .next/static .next/standalone/.next/
# Copy public files
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/
echo "Build completed successfully"
