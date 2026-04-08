#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# MySQL数据库配置（腾讯云）
export DATABASE_URL="mysql://chengze:EGhaehzpDrvwWH48@118.25.196.240:3306/chengze"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT}..."
    echo "Database: MySQL @ 118.25.196.240:3306/chengze"
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT}..."
start_service
