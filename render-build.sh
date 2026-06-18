#!/bin/bash
set -e
npm install
npx next build
test -f .next/standalone/server.js || { echo "Build failed - standalone not found"; exit 1; }

echo "Copying static assets..."
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/public
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "Build completed"
