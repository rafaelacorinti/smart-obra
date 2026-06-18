#!/bin/bash
set -e
npm install
npx next build
ls -la .next/standalone/server.js || (echo "Build failed - standalone not found" && exit 1)
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/
