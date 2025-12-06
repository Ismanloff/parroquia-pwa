# Guía de Deployment (Despliegue a Producción)

Esta guía te llevará paso a paso para desplegar la aplicación del Chatbot Parroquial en producción.

## 📋 Tabla de Contenidos

- [Pre-requisitos](#pre-requisitos)
- [Servicios Externos](#servicios-externos)
- [Deploy del Backend (Vercel)](#deploy-del-backend-vercel)
- [Deploy del Frontend (Expo)](#deploy-del-frontend-expo)
- [PWA Web (Vercel)](#pwa-web-vercel)
- [Variables de Entorno](#variables-de-entorno)
- [Health Checks](#health-checks)
- [Monitoreo](#monitoreo)
- [Troubleshooting de Deploy](#troubleshooting-de-deploy)

---

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:

- [ ] Node.js 20+ instalado
- [ ] npm 10+ instalado
- [ ] Cuenta de GitHub
- [ ] Código en repositorio de GitHub
- [ ] Acceso a las siguientes cuentas/servicios:
  - [ ] Vercel (para backend y PWA)
  - [ ] Expo (para apps móviles)
  - [ ] OpenAI
  - [ ] Anthropic
  - [ ] Pinecone
  - [ ] Supabase
  - [ ] Upstash Redis
  - [ ] Google Calendar (opcional)
  - [ ] Apple Developer (para iOS)
  - [ ] Google Play Console (para Android)

---

## 🌐 Servicios Externos

### 1. OpenAI API

1. Ir a https://platform.openai.com/
2. Crear cuenta o iniciar sesión
3. Ir a [API Keys](https://platform.openai.com/api-keys)
4. Crear nueva secret key
5. Copiar `OPENAI_API_KEY`

**Modelos requeridos**:
- `gpt-4o` (Agent principal)
- `text-embedding-3-large` (Embeddings para Pinecone)

**Costo estimado**: $10-50/mes dependiendo de tráfico

---

### 2. Anthropic API (Claude)

1. Ir a https://console.anthropic.com/
2. Crear cuenta
3. Ir a [API Keys](https://console.anthropic.com/settings/keys)
4. Crear nueva key
5. Copiar `ANTHROPIC_API_KEY`

**Modelo requerido**:
- `claude-3-5-haiku-20241022` (Query Expansion)

**Costo estimado**: $5-20/mes

---

### 3. Pinecone (Vector Database)

1. Ir a https://app.pinecone.io/
2. Crear cuenta (free tier disponible)
3. Crear nuevo proyecto
4. Crear índice:
   - **Name**: `parroquias`
   - **Dimensions**: `3072`
   - **Metric**: `cosine`
   - **Region**: `us-east-1` (AWS)
5. Copiar:
   - `PINECONE_API_KEY` (de Settings → API Keys)
   - `PINECONE_ENVIRONMENT` (ej: `us-east-1`)
   - `PINECONE_INDEX_NAME` → `parroquias`

**Indexar documentos**:
```bash
cd backend/scripts
npx tsx upload-intelligent-to-pinecone.ts
```

**Verificar**:
```bash
npx tsx check-pinecone-stats.ts
# Debe mostrar ~71 vectores
```

**Costo**: Free tier (1M queries/mes) suficiente para empezar

---

### 4. Supabase (Auth + Database)

1. Ir a https://supabase.com/
2. Crear nuevo proyecto
3. Esperar ~2 min a que se cree
4. Ir a Project Settings → API
5. Copiar:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)

**Crear tablas**:

```sql
-- Tabla de perfiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tabla de santos (opcional)
CREATE TABLE saints (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  feast_date DATE NOT NULL,
  description TEXT,
  image_url TEXT
);

-- Tabla de evangelios (opcional)
CREATE TABLE gospels (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  text TEXT NOT NULL,
  reference TEXT
);
```

**Costo**: Free tier suficiente para empezar

---

### 5. Upstash Redis (Cache)

1. Ir a https://console.upstash.com/
2. Crear cuenta
3. Crear nueva database Redis:
   - **Name**: `chatbot-cache`
   - **Region**: `us-east-1` (cerca de Vercel)
   - **Type**: Regional (Free)
4. Copiar:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Costo**: Free tier (10k commands/day)

---

### 6. Google Calendar (Opcional)

1. Crear calendario público en Google Calendar
2. Ir a Settings → Integrar calendario
3. Copiar URL ICAL (termina en `.ics`)
4. Guardar como `GOOGLE_CALENDAR_ICS_URL`

---

## 🚀 Deploy del Backend (Vercel)

### Paso 1: Conectar GitHub a Vercel

1. Ir a https://vercel.com/
2. Crear cuenta o login con GitHub
3. Click "New Project"
4. Import tu repositorio de GitHub
5. Configure el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `backend`
   - **Build Command**: (default) `next build`
   - **Output Directory**: (default) `.next`

### Paso 2: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agregar:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=parroquias

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...

# Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Google Calendar (opcional)
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/.../basic.ics

# Node Environment
NODE_ENV=production
```

**Importante**: Agregar a los 3 environments (Production, Preview, Development)

### Paso 3: Deploy

1. Click "Deploy"
2. Esperar ~2-3 minutos
3. Vercel te dará una URL: `https://tu-proyecto.vercel.app`

### Paso 4: Verificar Deploy

```bash
# Health check
curl https://tu-proyecto.vercel.app/api/health
# Debe retornar: {"status":"ok"}

# Test chat endpoint
curl -X POST https://tu-proyecto.vercel.app/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola"}'
```

### Paso 5: Configurar Dominio Custom (Opcional)

1. Vercel Dashboard → Settings → Domains
2. Agregar tu dominio (ej: `api.tuparroquia.com`)
3. Configurar DNS según instrucciones de Vercel
4. Esperar propagación (~5-30 min)

---

## 📱 Deploy del Frontend (Expo)

### Opción A: Build Local para Testing

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Expo Go (scan QR)
npx expo start
```

### Opción B: Build con EAS (Expo Application Services)

#### Setup Inicial

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure
```

Esto creará `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Configurar Variables de Entorno

Crear `backend/.env.production`:

```bash
EXPO_PUBLIC_BACKEND_URL=https://tu-proyecto.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://....supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### Build para iOS

```bash
# Development build
eas build --profile development --platform ios

# Production build (App Store)
eas build --profile production --platform ios
```

Necesitarás:
- Apple Developer account ($99/año)
- Bundle Identifier en `app.json`: `com.tuparroquia.app`
- Push Notification key (opcional)

#### Build para Android

```bash
# Development build
eas build --profile development --platform android

# Production build (Google Play)
eas build --profile production --platform android
```

Necesitarás:
- Google Play Console account ($25 one-time)
- Package name en `app.json`: `com.tuparroquia.app`

#### Submit a App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play
eas submit --platform android
```

---

## 🌐 PWA Web (Vercel)

El frontend también puede desplegarse como PWA.

### Paso 1: Build para Web

```bash
npx expo export --platform web
```

Esto genera archivos en `dist/` o `web-build/`.

### Paso 2: Deploy a Vercel

Opción 1 - Vercel CLI:

```bash
npm install -g vercel
vercel deploy
```

Opción 2 - GitHub Integration:

1. Conectar repo a Vercel
2. Root Directory: `.` (raíz)
3. Framework: Create React App o Vite
4. Build Command: `npx expo export --platform web`
5. Output Directory: `dist`

### Paso 3: Verificar PWA

1. Abrir `https://tu-app.vercel.app` en Chrome
2. Abrir DevTools → Application → Manifest
3. Verificar:
   - ✅ Manifest sin errores
   - ✅ Service Worker activado
   - ✅ Iconos cargados
4. Test de instalación:
   - Chrome mostrará ícono de instalación en address bar
   - Click para instalar PWA

---

## 🔐 Variables de Entorno - Resumen Completo

### Backend (Vercel)

```bash
# backend/.env.production
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=parroquias
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/.../basic.ics
NODE_ENV=production
```

### Frontend (Expo)

```bash
# .env.production
EXPO_PUBLIC_BACKEND_URL=https://tu-proyecto.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://....supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Importante**: Solo variables con prefijo `EXPO_PUBLIC_` son accesibles en el cliente.

---

## 🏥 Health Checks

### Backend Health Check

```bash
curl https://tu-proyecto.vercel.app/api/health
# Expected: {"status":"ok"}
```

### Pinecone Health Check

```bash
curl https://tu-proyecto.vercel.app/api/admin/pinecone-stats
# Expected: {"totalVectors":71,"dimension":3072}
```

### Cache Health Check

```bash
curl https://tu-proyecto.vercel.app/api/chat/cache-stats
# Expected: {"memoryCache":43,"semanticCache":"connected"}
```

### Frontend Health Check

```bash
curl https://tu-app.vercel.app/manifest.json
# Expected: JSON con nombre, icons, etc.
```

---

## 📊 Monitoreo

### Vercel Dashboard

1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto
3. Ver:
   - Deployments (historial)
   - Functions (latencia, errores)
   - Analytics (tráfico, requests)
   - Logs (real-time debugging)

### Vercel Logs en tiempo real

```bash
vercel logs --follow
```

### Error Tracking (Opcional - Sentry)

```bash
npm install --save @sentry/nextjs @sentry/react-native

# Configurar Sentry
npx @sentry/wizard -i nextjs
npx @sentry/wizard -i reactNative
```

Agregar DSN en variables de entorno:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 🚨 Troubleshooting de Deploy

### Backend: "Module not found" en build

**Causa**: Dependencias faltantes o path alias incorrectos

**Solución**:
```bash
# Verificar package.json
cd backend
npm install

# Verificar tsconfig.json tiene paths configurados
cat tsconfig.json | grep paths
```

### Backend: "Function timeout" en producción

**Causa**: Free tier de Vercel (10s), necesitas Pro

**Solución**:
```typescript
// En route.ts
export const maxDuration = 60; // Requiere Vercel Pro
```

O upgrade a [Vercel Pro](https://vercel.com/pricing) ($20/mes)

### Frontend: Build falla con "Expo CLI error"

**Solución**:
```bash
# Limpiar cache
npx expo start --clear

# Reinstalar
rm -rf node_modules
npm install

# Retry build
eas build --platform ios --clear-cache
```

### PWA: Service Worker no actualiza

**Solución**:
```javascript
// Increment CACHE_VERSION en service-worker.js
const CACHE_VERSION = 'v2'; // Era v1
```

### Supabase: "Invalid API key"

**Verificar**:
```bash
# .env debe tener ANON key (pública), no SERVICE_ROLE key (privada)
echo $SUPABASE_ANON_KEY | cut -c1-20
# Debe empezar con "eyJ"
```

---

## 📝 Checklist Final de Deployment

### Pre-Deploy

- [ ] Todos los tests pasan: `npm test`
- [ ] Linter pasa: `npm run lint`
- [ ] Build local funciona: `npm run build`
- [ ] Variables de entorno documentadas
- [ ] Secrets no están en código (están en .env)

### Post-Deploy Backend

- [ ] `/api/health` retorna 200
- [ ] `/api/chat/message` funciona
- [ ] Pinecone conectado (71 vectores)
- [ ] Redis conectado
- [ ] Supabase auth funciona

### Post-Deploy Frontend

- [ ] App instala en iOS
- [ ] App instala en Android
- [ ] PWA se puede instalar
- [ ] Service Worker activo
- [ ] Chat funciona end-to-end

### Monitoreo Continuo

- [ ] Setup Sentry o error tracking
- [ ] Configurar alertas en Vercel
- [ ] Verificar logs diariamente (primera semana)
- [ ] Monitor de uptime (ej: UptimeRobot)

---

## 🎉 ¡Deploy Exitoso!

Si todos los health checks pasan, ¡felicidades! Tu app está en producción.

**URLs de producción**:
- Backend API: `https://tu-proyecto.vercel.app`
- PWA Web: `https://tu-app.vercel.app`
- iOS App: https://apps.apple.com/app/tu-app
- Android App: https://play.google.com/store/apps/details?id=com.tuparroquia.app

**Próximos pasos**:
1. Compartir con usuarios beta
2. Recopilar feedback
3. Iterar y mejorar
4. Escalar según necesidad

---

**Última actualización**: 8 de noviembre de 2025

¿Problemas con deployment? Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-deployment)
