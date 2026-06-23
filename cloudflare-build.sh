#!/bin/bash
# Cloudflare Pages Build Script for KavachIQ
# Combines the marketing website (root) + React app (frontend/) into a single dist/

set -e

echo "🚀 Building KavachIQ for Cloudflare Pages..."

# Step 1: Build the frontend React app
echo "📦 Building React app (base: /app/)..."
cd frontend
npm ci
npm run build
cd ..

# Step 2: Create output directory
echo "📁 Creating dist/ ..."
mkdir -p dist

# Step 3: Copy marketing site files to dist/
echo "📄 Copying marketing site..."
cp index.html dist/
cp styles.css dist/
cp script.js dist/
cp Code.gs dist/ 2>/dev/null || true
cp favicon.ico dist/ 2>/dev/null || true
cp -r assets/ dist/ 2>/dev/null || true

# Step 4: Copy the React app build into dist/app/
echo "📦 Copying React app to dist/app/ ..."
mkdir -p dist/app
cp -r frontend/dist/* dist/app/

# Step 5: Create _redirects for SPA routing
echo "🔗 Creating _redirects..."
cat > dist/_redirects << 'EOF'
# KavachIQ Cloudflare Pages Redirects

# SPA routing for the React app — rewrite all /app/* paths to app's index.html
/app/*    /app/index.html    200

# The marketing site is served from the root by default
# All other files are served as-is

# Security headers (optional)
# /*    /headers   200
EOF

# Step 6: Create _headers file for security
echo "🛡️  Creating _headers..."
cat > dist/_headers << 'EOF'
# KavachIQ Security Headers
/app/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
EOF

echo "✅ Build complete! Output: dist/"
echo "   ├── index.html (marketing site)"
echo "   ├── styles.css"
echo "   ├── script.js"
echo "   ├── _redirects"
echo "   └── app/ (React SPA)"

ls -la dist/
