#!/bin/bash
set -e
npm install
rm -rf .next
npx next build
echo "Build completed successfully"
