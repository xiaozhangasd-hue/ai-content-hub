#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Generating Prisma client..."
pnpm prisma generate

# MySQL数据库配置（腾讯云）
export DATABASE_URL="mysql://chengze:EGhaehzpDrvwWH48@118.25.196.240:3306/chengze"
echo "Syncing database schema..."
pnpm prisma db push --skip-generate

echo "Building the Next.js project with webpack..."
pnpm next build --webpack

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
