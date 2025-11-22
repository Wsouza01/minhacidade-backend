#!/bin/sh
set -e

echo "🐘 Rodando migrations Drizzle (JS)..."
pnpm drizzle-kit migrate --config=./drizzle.config.js

echo "🌱 Populando banco de dados (seed)..."
node dist/db/seed-prod.js

echo "🚀 Iniciando servidor..."
node dist/server.js
