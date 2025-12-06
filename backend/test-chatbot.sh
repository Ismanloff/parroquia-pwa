#!/bin/bash
# Script para ejecutar tests del chatbot

echo "🧪 Iniciando tests del chatbot parroquial..."
echo ""

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "❌ El backend no está corriendo en http://localhost:3000"
  echo "   Por favor inicia el backend primero con: npm run dev"
  exit 1
fi

echo "✅ Backend detectado en http://localhost:3000"
echo ""

# Ejecutar tests
cd "$(dirname "$0")/.." || exit 1
npx ts-node backend/tests/chatbot-manual-test.ts
