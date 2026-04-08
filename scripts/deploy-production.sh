#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ai-content-hub}"
APP_NAME="${APP_NAME:-nandu-ai}"
NODE_BIN_DIR="${NODE_BIN_DIR:-/usr/local/node20/bin}"
export PATH="${NODE_BIN_DIR}:$PATH"

cd "${APP_DIR}"

echo "==> deploy: environment"
node -v
npm -v
pnpm -v
pm2 -v

echo "==> deploy: install dependencies"
pnpm install --frozen-lockfile

echo "==> deploy: build app"
pnpm build

echo "==> deploy: sync prisma schema"
npx prisma db push --schema=./prisma/schema.prisma

echo "==> deploy: prepare standalone runtime"
cp -r .next/standalone/* ./

echo "==> deploy: ensure logs dir"
mkdir -p /var/log/nandu-ai

echo "==> deploy: restart pm2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" --update-env
else
  pm2 start ecosystem.config.js --update-env
fi
pm2 save

echo "==> deploy: health check"
sleep 5
curl -fsS http://127.0.0.1:5000/api/health

echo
echo "==> deploy: done"
