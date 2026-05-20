#!/bin/bash
npm install
npx next build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
