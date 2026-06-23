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

# Step 5: _worker.js stays at the project root as the Worker entry point
# It's set as main = "_worker.js" in wrangler.toml, so Wrangler compiles it
# as the Worker script, separate from the static assets.
echo "🔧 _worker.js is the Worker entry point (set via wrangler.toml)"

# Step 6: Create _headers file for security (supported by Workers + Assets)
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
echo "   ├── _worker.js (Worker entry point - at project root)"
echo "   ├── _headers"
echo "   └── app/ (React SPA)"

ls -la dist/
