#!/bin/bash

echo "🧹 Limpiando TODOS los caches..."

# 1. Limpiar cache de Metro bundler
echo "📦 Limpiando Metro bundler cache..."
rm -rf .expo/*
rm -rf node_modules/.cache/*
watchman watch-del-all 2>/dev/null || echo "⚠️  Watchman no instalado"

# 2. Limpiar cache de AsyncStorage (simulador iOS)
echo "📱 Para limpiar AsyncStorage del simulador:"
echo "   - Desinstala la app del simulador"
echo "   - O usa: xcrun simctl erase all (CUIDADO: borra TODOS los simuladores)"

# 3. Limpiar cache de React Query
echo "💾 React Query cache se limpia al recargar la app (QueryClient nuevo)"

# 4. Verificar cache de backend
echo "🔧 Verificando cache KV del backend..."
curl -X GET "https://chat-app-parroquias.vercel.app/api/chat/cache-stats" 2>/dev/null || echo "⚠️  No se pudo conectar al backend"

echo ""
echo "✅ Limpieza local completa"
echo ""
echo "📝 PASOS SIGUIENTES:"
echo "   1. Cierra completamente el Metro bundler (Ctrl+C)"
echo "   2. Desinstala la app del simulador/dispositivo"
echo "   3. Ejecuta: npm start -- --clear"
echo "   4. Reinstala la app"
echo ""
