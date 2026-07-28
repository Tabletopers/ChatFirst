#!/bin/bash
set -e

echo "🚀 Deploying ChatFirst..."

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "🔨 Building application..."
npm run build

echo "🐳 Building Docker image..."
docker build -t chatfirst:latest .

echo "✅ Build complete!"
echo ""
echo "To run locally:"
echo "  docker-compose up"
echo ""
echo "To deploy to Render.com:"
echo "  1. Push to GitHub"
echo "  2. Connect repo at render.com"
echo "  3. Set env vars (OPENAI_API_KEY, JWT_SECRET, etc.)"
echo ""
echo "To deploy to Vercel (frontend only):"
echo "  cd frontend && vercel --prod"
