#!/bin/bash
# UPGRADE SYSTEM - QUICK START GUIDE
# Run these commands to get the upgrade system live

echo "🚀 Starting KavachIQ Upgrade System Setup..."
echo ""

# Step 1: Initialize Database
echo "📝 Step 1: Initializing database schema..."
cd backend
node src/migrations/initUpgradeSystem.js

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Database initialization failed"
    exit 1
fi

echo ""
echo "✨ Setup complete! Starting services..."
echo ""
echo "📌 NEXT STEPS:"
echo "1. Terminal 1 - Run backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Terminal 2 - Run frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000/upgrade"
echo ""
echo "✅ Your upgrade system is ready to use! 🎉"
