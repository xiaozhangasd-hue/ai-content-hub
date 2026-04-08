#!/bin/sh
set -e
export DATABASE_URL="${DATABASE_URL:-file:/app/data/data.db}"
prisma db push --schema=/app/prisma/schema.prisma
exec su-exec nextjs node server.js
