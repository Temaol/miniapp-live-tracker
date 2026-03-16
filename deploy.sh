#!/usr/bin/env bash
# deploy.sh — one-shot deploy of backend + frontend to Railway
# Usage: ./deploy.sh
set -euo pipefail

export PATH="/tmp/node-v20.11.1-darwin-x64/bin:$PATH"
RAILWAY="railway"

echo ""
echo "══════════════════════════════════════════"
echo "  TripRoute — Railway Deploy"
echo "══════════════════════════════════════════"
echo ""

# ── 1. Login check ────────────────────────────────────────────────────────────
if ! $RAILWAY whoami &>/dev/null; then
  echo "🔐 Not logged in — opening browser for Railway login..."
  $RAILWAY login
fi
echo "✅ Logged in as: $($RAILWAY whoami)"

# ── 2. Deploy BACKEND ─────────────────────────────────────────────────────────
echo ""
echo "📦 Deploying BACKEND (FastAPI + SQLite)..."
cd "$(dirname "$0")/backend"

# Link or create service
if [ ! -f .railway/config.json ]; then
  echo "   Linking backend service (follow prompts)..."
  $RAILWAY link --service backend
fi

$RAILWAY up --detach
BACKEND_URL=$($RAILWAY domain 2>/dev/null || echo "")
echo "✅ Backend deployed: ${BACKEND_URL:-'(check Railway dashboard for URL)'}"

# ── 3. Deploy FRONTEND ────────────────────────────────────────────────────────
echo ""
echo "🌐 Deploying FRONTEND (React + Vite)..."
cd "$(dirname "$0")/frontend"

if [ ! -f .railway/config.json ]; then
  echo "   Linking frontend service (follow prompts)..."
  $RAILWAY link --service frontend
fi

# Inject the backend URL as a build-time env var
if [ -n "$BACKEND_URL" ]; then
  echo "   Setting VITE_API_URL=${BACKEND_URL}..."
  $RAILWAY variables --set "VITE_API_URL=https://${BACKEND_URL}"
fi

$RAILWAY up --detach
FRONTEND_URL=$($RAILWAY domain 2>/dev/null || echo "")
echo "✅ Frontend deployed: ${FRONTEND_URL:-'(check Railway dashboard for URL)'}"

echo ""
echo "══════════════════════════════════════════"
echo "  Done! Register the Mini App URL in"
echo "  @BotFather → Edit Bot → Edit Menu Button"
echo ""
echo "  Frontend : https://${FRONTEND_URL}"
echo "  Backend  : https://${BACKEND_URL}/docs"
echo "══════════════════════════════════════════"
