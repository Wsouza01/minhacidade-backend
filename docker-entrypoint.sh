#!/bin/sh
set -e

echo "🐘 Rodando migrations Drizzle (JS)..."
pnpm drizzle-kit migrate --config=./drizzle.config.js

RUN_DB_SEED=${RUN_DB_SEED:-false}
SEED_FILE=${DB_SEED_FILE:-dist/db/seed-prod.js}

if [ "$RUN_DB_SEED" = "true" ]; then
  if [ -f "$SEED_FILE" ]; then
    echo "🌱 Executando seed usando $SEED_FILE ..."
    node "$SEED_FILE"
  else
    echo "⚠️ Seed habilitado, mas arquivo não encontrado: $SEED_FILE"
  fi
else
  echo "ℹ️ Seed automático desabilitado. Pulei execução."
fi

echo "🚀 Iniciando servidor..."
node dist/server.js
