# Guía de Solución de Problemas (Troubleshooting)

Esta guía te ayudará a resolver problemas comunes al desarrollar o usar la aplicación del Chatbot Parroquial.

## 📋 Tabla de Contenidos

- [Problemas de Frontend](#problemas-de-frontend)
- [Problemas de Backend](#problemas-de-backend)
- [Problemas de Testing](#problemas-de-testing)
- [Problemas de Deployment](#problemas-de-deployment)
- [Problemas de PWA](#problemas-de-pwa)
- [Problemas de Performance](#problemas-de-performance)
- [Herramientas de Debugging](#herramientas-de-debugging)
- [Obtener Más Ayuda](#obtener-más-ayuda)

---

## 🎨 Problemas de Frontend

### App no carga en iOS Simulator

**Síntoma**: Pantalla blanca o "Metro bundler not running"

**Causas comunes**:
- Metro bundler no está corriendo
- Cache corrupto
- Puerto ocupado

**Soluciones**:

```bash
# 1. Limpiar cache de Expo
npx expo start --clear

# 2. Si persiste, limpiar completamente
rm -rf .expo node_modules
npm install
npx expo start

# 3. Si el puerto está ocupado
lsof -ti:8081 | xargs kill -9
npx expo start
```

**Verificación**:
```bash
# Debería mostrar el bundler corriendo
curl http://localhost:8081/status
```

---

### App no carga en Android Emulator

**Síntoma**: "Unable to connect to development server"

**Causas**:
- Emulador y computadora no pueden comunicarse
- ADB no configurado correctamente

**Soluciones**:

```bash
# 1. Reverse port forwarding (Android)
adb reverse tcp:8081 tcp:8081

# 2. Reiniciar ADB
adb kill-server
adb start-server

# 3. Usar tunnel mode
npx expo start --tunnel
```

---

### Dark Mode no funciona

**Síntoma**: App siempre en modo claro o siempre en modo oscuro

**Causa**: Configuración del sistema operativo o preferencia almacenada

**Solución**:

1. **iOS**: Settings → Display & Brightness → Appearance
2. **Android**: Settings → Display → Dark theme
3. **Limpiar AsyncStorage**:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   await AsyncStorage.removeItem('theme-preference');
   ```

**Debug**:
```typescript
// En components/ThemeProvider.tsx
console.log('System color scheme:', useColorScheme());
console.log('Stored preference:', storedTheme);
```

---

### Mensajes no se envían

**Síntoma**: Botón de enviar no responde o mensaje no aparece

**Causas**:
- Backend no accesible
- Error de red
- Token expirado
- Error en hook useChat

**Debug step-by-step**:

```bash
# 1. Verificar logs de Metro
# Buscar errores en la consola donde corriste `npx expo start`

# 2. Verificar network requests
# Usar React Native Debugger o Flipper
```

```typescript
// 3. Agregar logs en hooks/useChat.ts
const sendMessage = async (content: string) => {
  console.log('Sending message:', content);
  console.log('Backend URL:', BACKEND_URL);

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/message-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    // ...
  } catch (error) {
    console.error('Error details:', error);
  }
};
```

**Soluciones comunes**:

```bash
# Verificar variable de entorno
cat .env | grep EXPO_PUBLIC_BACKEND_URL
# Debe ser: EXPO_PUBLIC_BACKEND_URL=https://your-backend.vercel.app

# Si está mal
echo "EXPO_PUBLIC_BACKEND_URL=https://your-backend.vercel.app" >> .env
npx expo start --clear
```

---

### Error: "Network request failed"

**Síntoma**: Todas las llamadas API fallan con error de red

**Causas**:
- CORS bloqueando requests
- Backend no está corriendo
- URL incorrecta
- No hay conexión a internet

**Soluciones**:

```bash
# 1. Verificar que backend esté corriendo
curl https://your-backend.vercel.app/api/health
# Debe retornar 200 OK

# 2. Verificar CORS en backend
# En backend/app/api/chat/route.ts debe tener:
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

# 3. Test desde terminal
curl -X POST https://your-backend.vercel.app/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

---

### TypeScript errors en IDE

**Síntoma**: VSCode muestra errores rojos pero la app funciona

**Causa**: TypeScript server desactualizado o cache corrupto

**Soluciones**:

```bash
# 1. Reiniciar TypeScript server en VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# 2. Verificar versión de TypeScript
npx tsc --version  # Debe ser ~5.9.2

# 3. Regenerar archivos de tipos
rm -rf node_modules @types tsconfig.tsbuildinfo
npm install
```

---

## 🖥️ Problemas de Backend

### Error: "PINECONE_API_KEY not found"

**Síntoma**: Backend crash al iniciar con error de env variables

**Causa**: Archivo `.env` no configurado o variables faltantes

**Solución**:

```bash
# 1. Verificar que existe backend/.env
ls backend/.env

# 2. Si no existe, copiar del template
cd backend
cp .env.example .env

# 3. Editar con tus API keys
# Abrir backend/.env y agregar:
PINECONE_API_KEY=tu-api-key-aqui
OPENAI_API_KEY=tu-api-key-aqui
ANTHROPIC_API_KEY=tu-api-key-aqui
SUPABASE_URL=tu-url-aqui
SUPABASE_ANON_KEY=tu-key-aqui
UPSTASH_REDIS_REST_URL=tu-url-aqui
UPSTASH_REDIS_REST_TOKEN=tu-token-aqui

# 4. Verificar que se carguen
cd backend
node -e "require('dotenv').config(); console.log(process.env.PINECONE_API_KEY)"
```

**Verificación en Vercel**:
```bash
# Variables deben estar en Vercel Dashboard:
# Project → Settings → Environment Variables
```

---

### Timeout en requests (60s)

**Síntoma**: "Request timeout after 60000ms"

**Causas**:
- Query muy compleja para el Agent
- Pinecone responde lento
- OpenAI rate limit
- Claude API lenta

**Debug**:

```typescript
// Agregar timing logs en backend/app/api/chat/message-stream/route.ts
console.time('total-request');
console.time('pinecone-search');
const results = await pineconeTool.execute({...});
console.timeEnd('pinecone-search');

console.time('agent-response');
const response = await agent.run({...});
console.timeEnd('agent-response');
console.timeEnd('total-request');
```

**Soluciones**:

```typescript
// 1. Aumentar timeout temporalmente
// En backend/app/api/chat/message-stream/route.ts
export const maxDuration = 120; // 2 minutos

// 2. Optimizar query
// - Verificar que Query Expansion solo corra para queries cortas
// - Aumentar threshold de longitud de query
const needsExpansion = queryLength < 40; // Era 30

// 3. Verificar logs de Pinecone
// Ir a Pinecone Dashboard → Logs
// Buscar queries lentas

// 4. Revisar rate limits de OpenAI
// https://platform.openai.com/account/rate-limits
```

---

### Error: "Pinecone index not found"

**Síntoma**: 404 al intentar buscar en Pinecone

**Causa**: Índice no existe o nombre incorrecto

**Solución**:

```bash
# 1. Verificar nombre del índice en .env
cat backend/.env | grep PINECONE_INDEX_NAME
# Debe ser: PINECONE_INDEX_NAME=parroquias

# 2. Verificar que el índice existe
# Login a Pinecone Dashboard: https://app.pinecone.io/
# Debe haber un índice llamado "parroquias"

# 3. Si no existe, crear e indexar
cd backend/scripts
npx tsx upload-intelligent-to-pinecone.ts

# 4. Verificar stats
npx tsx check-pinecone-stats.ts
# Debe mostrar ~71 vectores
```

---

### Error: "OpenAI API rate limit"

**Síntoma**: "Rate limit exceeded" en requests

**Causa**: Demasiadas llamadas a OpenAI API

**Soluciones**:

```bash
# 1. Verificar tier de tu cuenta OpenAI
# https://platform.openai.com/account/limits

# 2. Implementar backoff exponencial
# Ya está implementado en el código con retry logic

# 3. Verificar cache está funcionando
# Logs deben mostrar:
# "✅ [Memory Cache] Cache hit" o
# "✅ [Semantic Cache] Cache hit"

# 4. Reducir uso temporal
# - Aumentar TTL de semantic cache a 2h
# - Agregar más entries a memory cache
# - Usar Claude Haiku en lugar de GPT-4o
```

---

### Vercel Functions timeout (10s)

**Síntoma**: "FUNCTION_INVOCATION_TIMEOUT" en Vercel logs

**Causa**: Free tier de Vercel tiene límite de 10s

**Soluciones**:

```typescript
// 1. Aumentar maxDuration (requiere plan Pro)
export const maxDuration = 60;

// 2. Si estás en free tier, optimizar:
// - Usar /api/chat/quick para queries simples (15s timeout)
// - Pre-procesar queries largas
// - Implementar queue con BullMQ o similar

// 3. Upgrade a Vercel Pro
// Permite hasta 300s de ejecución
```

---

## 🧪 Problemas de Testing

### Tests fallan con error de tipos

**Síntoma**: `Cannot find name 'describe'`, `it is not defined`

**Causa**: @types/jest no instalado

**Solución**:

```bash
npm install --save-dev @types/jest
npm test
```

---

### Tests de hooks fallan

**Síntoma**: "Invalid hook call" o "Hooks can only be called inside body of function"

**Causa**: No usar `renderHook` de testing-library

**Solución**:

```typescript
// ❌ Incorrecto
import { useChat } from '../useChat';
const result = useChat(); // Error!

// ✅ Correcto
import { renderHook } from '@testing-library/react-hooks';
const { result } = renderHook(() => useChat());

// Acceder a valores
expect(result.current.messages).toHaveLength(0);

// Llamar funciones
await act(async () => {
  await result.current.sendMessage('Test');
});
```

---

### Mock de fetch no funciona

**Síntoma**: Tests hacen llamadas reales a API

**Causa**: fetch no está mockeado correctamente

**Solución**:

```typescript
// En jest.setup.js
global.fetch = jest.fn();

// En cada test
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

// Mock de respuesta exitosa
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ response: 'Test response' }),
});

// Mock de error
(global.fetch as jest.Mock).mockRejectedValueOnce(
  new Error('Network error')
);
```

---

### Tests pasan localmente pero fallan en CI

**Síntoma**: GitHub Actions muestra tests fallando

**Causas**:
- Variables de entorno diferentes
- Timezone differences
- Archivos faltantes en CI

**Soluciones**:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  env:
    TZ: America/Mexico_City  # Fijar timezone
    NODE_ENV: test
    # Agregar env vars necesarias
    EXPO_PUBLIC_BACKEND_URL: http://localhost:3000
```

---

## 🚀 Problemas de Deployment

### Vercel build falla

**Síntoma**: "Build failed" en Vercel dashboard

**Causas comunes**:
- TypeScript errors
- Path alias no resueltos
- Missing dependencies

**Debug**:

```bash
# 1. Reproducir build localmente
cd backend
npm run build

# 2. Ver logs completos
# Vercel Dashboard → Deployments → [tu deployment] → Build Logs

# 3. Errores comunes y soluciones:
```

**Error: "Module not found: Cannot resolve '@/...'"**

```json
// Verificar tsconfig.json tiene paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// Verificar next.config.js (si backend es Next.js)
module.exports = {
  experimental: {
    externalDir: true,
  },
};
```

**Error: "Build exceeded maximum duration"**

```bash
# 1. Optimizar build
# - Eliminar dependencias no usadas
# - Usar .vercelignore para excluir archivos

# 2. Upgrade a Vercel Pro
# Free tier: 45 minutos
# Pro: Ilimitado
```

---

### Expo EAS build falla

**Síntoma**: EAS build no completa

**Debug**:

```bash
# 1. Ver logs detallados
eas build --platform ios --clear-cache

# 2. Verificar eas.json
cat eas.json

# 3. Errores comunes:
```

**Error: "No bundle identifier"**

```json
// app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.parroquias.app"
    },
    "android": {
      "package": "com.parroquias.app"
    }
  }
}
```

**Error: "Dependency conflict"**

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
eas build --platform ios
```

---

## 🌐 Problemas de PWA

### PWA no se instala

**Síntoma**: Banner de instalación no aparece

**Requisitos para PWA instalable**:
1. ✅ HTTPS (o localhost)
2. ✅ Manifest.json válido
3. ✅ Service Worker registrado
4. ✅ Al menos 1 icono 192x192 y 512x512
5. ✅ Usar la app por 30+ segundos

**Debug**:

```bash
# 1. Chrome DevTools → Application → Manifest
# Debe mostrar sin errores

# 2. Chrome DevTools → Application → Service Workers
# Debe mostrar "activated and running"

# 3. Chrome DevTools → Console
# Buscar errores de manifest o SW

# 4. Lighthouse audit
# Chrome DevTools → Lighthouse → Generate report → PWA
```

**Errores comunes**:

```json
// manifest.json - Verificar campos requeridos
{
  "name": "Chatbot Parroquial",  // ✅ Requerido
  "short_name": "Parroquias",    // ✅ Requerido
  "start_url": "/",              // ✅ Requerido
  "display": "standalone",       // ✅ Requerido
  "icons": [                     // ✅ Requerido (mín. 192 y 512)
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

### Service Worker no actualiza

**Síntoma**: Cambios en la app no se reflejan después de deploy

**Causa**: Service Worker cacheó versión antigua

**Solución para usuarios**:

```javascript
// En service-worker.js
const CACHE_VERSION = 'v2'; // Incrementar número

// Limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Solución para desarrollo**:

```bash
# Chrome DevTools → Application → Service Workers
# Click "Unregister"
# Refresh page

# O usar "Update on reload"
# Chrome DevTools → Application → Service Workers → ☑️ Update on reload
```

---

### Offline page no se muestra

**Síntoma**: Error de conexión en lugar de offline page

**Debug**:

```javascript
// En service-worker.js verificar fetch handler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Si falla, mostrar offline page
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});
```

---

## ⚡ Problemas de Performance

### Chat muy lento

**Síntoma**: Respuestas tardan más de 10 segundos

**Debug checklist**:

```bash
# 1. Verificar si usa cache
# Logs deben mostrar:
✅ [Memory Cache] Cache hit: "horarios de misa"
# O
✅ [Semantic Cache] Cache hit (similarity: 0.95)

# Si no usa cache, revisar:
# - Memory cache desactivado?
# - Redis no conectado?

# 2. Verificar Query Expansion
# Para queries LARGAS no debe hacer expansion:
⚡ [Query Expansion] SKIP - Query suficientemente específica (45 chars)

# Si hace expansion innecesaria:
# - Aumentar threshold de 30 a 40 chars

# 3. Verificar tiempos de Pinecone
⚡ [Pinecone] Búsqueda completada en 1500ms  # ✅ OK
⚡ [Pinecone] Búsqueda completada en 8000ms  # ❌ MUY LENTO

# Si Pinecone es lento:
# - Verificar región (debe ser us-east-1)
# - Revisar Pinecone Dashboard → Performance

# 4. Verificar Agent/OpenAI
⚡ [Agent] Respuesta en 3000ms  # ✅ OK
⚡ [Agent] Respuesta en 15000ms # ❌ MUY LENTO

# Si Agent es lento:
# - Revisar si está en rate limit
# - Considerar usar gpt-4o-mini
```

**Optimizaciones**:

```typescript
// 1. Agregar más FAQs a memory cache
// backend/app/api/chat/utils/memoryCache.ts
export const memoryCache: Record<string, string> = {
  // Agregar más entries comunes
  "horarios": "...",
  "direccion": "...",
  // ...
};

// 2. Aumentar threshold de Query Expansion
const needsExpansion = queryLength < 40; // Era 30

// 3. Aumentar TTL de semantic cache
// backend/app/api/chat/utils/semanticCache.ts
const TTL = 7200; // 2 horas (era 3600)
```

---

### App consume mucha batería

**Síntoma**: Batería drena rápido al usar la app

**Causas**:
- Polling excesivo
- Animaciones no optimizadas
- Memory leaks

**Soluciones**:

```typescript
// 1. Optimizar animaciones
// Usar useNativeDriver cuando sea posible
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Importante
}).start();

// 2. Cleanup de effects
useEffect(() => {
  const interval = setInterval(() => {
    // ...
  }, 1000);

  return () => clearInterval(interval); // ✅ Cleanup
}, []);

// 3. Memoización
const expensiveCalculation = useMemo(() => {
  return doExpensiveWork(data);
}, [data]);
```

---

### Bundle size muy grande

**Síntoma**: App tarda mucho en cargar inicial

**Análisis**:

```bash
# Web
npx expo export --platform web
npx source-map-explorer web-build/static/js/*.js

# Ver tamaño de paquetes
du -sh node_modules/*/ | sort -hr | head -20
```

**Optimizaciones**:

```typescript
// 1. Lazy loading de screens
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

// 2. Eliminar imports innecesarios
// Buscar en proyecto:
grep -r "import.*from '@testing-library'" app/

// 3. Usar imports específicos
// ❌ Importa todo lodash
import _ from 'lodash';

// ✅ Solo importa lo necesario
import debounce from 'lodash/debounce';
```

---

## 🛠️ Herramientas de Debugging

### React Native Debugger

```bash
# Instalar
brew install --cask react-native-debugger

# Usar
# 1. Abrir React Native Debugger
# 2. En app, shake device → "Debug"
# 3. Ver console, network, Redux
```

### Flipper

```bash
# Instalar
brew install --cask flipper

# Usar
# 1. Abrir Flipper
# 2. Conecta automáticamente a app en desarrollo
# 3. Ver logs, network, layout, database
```

### Chrome DevTools (Web/PWA)

```bash
# 1. Correr app en web
npx expo start --web

# 2. Abrir Chrome DevTools
# F12 o Cmd+Option+I

# 3. Tabs útiles:
# - Console: logs y errors
# - Network: requests HTTP
# - Application: manifest, SW, storage
# - Lighthouse: auditoría PWA
```

### Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Logs de un deployment específico
vercel logs [deployment-url]

# O en dashboard
# https://vercel.com/[user]/[project]/deployments
```

---

## ❓ Obtener Más Ayuda

### Recursos

1. **Documentación del proyecto**:
   - [README.md](README.md)
   - [SETUP.md](SETUP.md)
   - [REPORTE_SERVICES_APIS_COMPLETO.md](REPORTE_SERVICES_APIS_COMPLETO.md)

2. **Documentación de dependencias**:
   - [Expo Docs](https://docs.expo.dev/)
   - [React Native Docs](https://reactnative.dev/docs/getting-started)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Pinecone Docs](https://docs.pinecone.io/)

3. **Issues de GitHub**:
   - Buscar issues similares
   - Abrir nuevo issue con template

### Crear un Bug Report

Si no encuentras solución, crea un issue con:

```markdown
**Descripción**
[Descripción clara del problema]

**Pasos para reproducir**
1. ...
2. ...

**Comportamiento esperado**
[Qué debería pasar]

**Comportamiento actual**
[Qué pasa realmente]

**Logs**
```
[Pegar logs relevantes]
```

**Environment**
- OS: [iOS 17 / Android 14 / macOS]
- Node: [20.0.0]
- Expo SDK: [54]
- App version: [1.0.0]

**Screenshots**
[Si aplica]
```

### Contacto

- GitHub Issues: [repo/issues]
- Email: [contacto]

---

**Última actualización**: 8 de noviembre de 2025

¿Encontraste un problema no listado? [Contribuye a esta guía](CONTRIBUTING.md)!
