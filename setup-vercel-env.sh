#!/bin/bash

# Script to configure environment variables in Vercel
cd "/Users/admin/Movies/Proyecto SaaS/resply"

echo "🔧 Configurando variables de entorno en Vercel..."

# Read .env.local and set each variable
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]] && [[ -n "$value" ]]; then
    # Remove any surrounding quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

    echo "⚙️  Setting $key..."
    echo "$value" | vercel env add "$key" production --force 2>/dev/null
  fi
done < .env.local

echo "✅ Variables de entorno configuradas en Vercel"
