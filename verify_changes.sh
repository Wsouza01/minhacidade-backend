#!/bin/bash

BASE_URL="http://localhost:3333"

# 1. Create Category (Global)
echo "Creating Global Category..."
curl -X POST "$BASE_URL/categorias" \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Categoria Global Teste\", \"descricao\": \"Teste Global\"}"

# 2. Fetch Categories (Should include the new one)
echo -e "\nFetching Categories..."
curl -s "$BASE_URL/categorias" | grep "Categoria Global Teste" && echo "✅ Category found!" || echo "❌ Category not found!"

# 3. Fetch Stats (Dashboard Fix Check)
echo -e "\nFetching Stats..."
STATS=$(curl -s "$BASE_URL/chamados/stats")
echo $STATS

# Check if stats sum up correctly (manual check by reading output)
