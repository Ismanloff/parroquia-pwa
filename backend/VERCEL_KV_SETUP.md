# 🚀 Configuración de Vercel KV para Semantic Cache

Este documento explica cómo configurar Vercel KV (Redis) para el cache semántico distribuido del chatbot.

## ¿Por qué Vercel KV?

✅ **Beneficios**:
- Cache compartido entre todas las instancias Edge
- Mayor tasa de aciertos (cache hits)
- Persistencia entre deployments
- Compatible con Edge Runtime
- Latencia ultra-baja (<5ms)

## 📋 Pasos de Configuración

### 1. Crear una base de datos KV en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a la pestaña **Storage**
3. Haz clic en **Create Database**
4. Selecciona **KV (Redis)**
5. Dale un nombre: `semantic-cache-prod` (o el que prefieras)
6. Selecciona la región más cercana a tus usuarios (ej: `iad1` para USA Este, `fra1` para Europa)
7. Haz clic en **Create**

### 2. Conectar KV a tu proyecto

Vercel automáticamente creará las siguientes variables de entorno:

```bash
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...
```

**No necesitas configurar nada manualmente**, Vercel las inyecta automáticamente en tu proyecto.

### 3. Verificar la integración

Después de hacer deploy, verifica que el cache funciona:

1. Envía un mensaje: "¿Qué es Eloos?"
2. Revisa los logs en Vercel Dashboard
3. Deberías ver:
   ```
   ❌ Cache MISS: ¿Qué es Eloos?
   💾 Cache guardado en KV: ¿Qué es Eloos?
   ```

4. Envía el MISMO mensaje de nuevo
5. Deberías ver:
   ```
   ⚡ Cache HIT (exacto): ¿Qué es Eloos?
   ⚡ Respuesta servida desde KV cache (0.05s)
   ```

## 📊 Monitoreo

### Ver estadísticas del cache

El cache incluye una función `getStats()` para ver métricas:

```typescript
const stats = await semanticCache.getStats();
console.log(stats);
// {
//   size: 15,
//   entries: [
//     { question: "¿Qué es Eloos?", age: 5 },  // 5 minutos
//     { question: "Eventos hoy", age: 2 },
//     ...
//   ]
// }
```

### Logs útiles

- `⚡ Cache HIT (exacto)` - Coincidencia exacta (100%)
- `⚡ Cache HIT (92% similar)` - Coincidencia semántica (≥90%)
- `❌ Cache MISS` - No encontrado en cache
- `🚫 Cache SKIP: Pregunta relacionada con calendario` - No cacheable
- `💾 Cache guardado en KV` - Guardado exitoso

## 🧹 Mantenimiento

### Limpiar cache expirado

El cleanup se ejecuta automáticamente cada 10 minutos. También puedes limpiarlo manualmente:

```typescript
await semanticCache.cleanup();
// 🧹 KV Cache cleanup: 5 keys expiradas removidas del índice
```

### Limpiar TODO el cache

```typescript
await semanticCache.clear();
// 🗑️ KV Cache completamente limpiado
```

## 💰 Costos

Vercel KV tiene un tier gratuito generoso:

| Plan | Requests/mes | Storage | Precio |
|------|--------------|---------|--------|
| **Hobby** | 30,000 | 256 MB | Gratis |
| **Pro** | 500,000 | 512 MB | Incluido |
| **Enterprise** | Custom | Custom | Custom |

Para este chatbot:
- ~10 requests por mensaje (get + set + index operations)
- ~1 KB por entrada
- **Estimado**: 3,000 mensajes/mes = 30,000 requests = **Gratis** ✅

## 🔒 Seguridad

- Las credenciales de KV se gestionan automáticamente por Vercel
- No exponer tokens en el código
- KV está aislado por proyecto
- Solo accesible desde tu backend Edge Runtime

## 🚨 Troubleshooting

### Error: "KV_REST_API_URL is not defined"

**Solución**: Asegúrate de que la base de datos KV está conectada al proyecto en Vercel Dashboard → Storage → Connect.

### Cache no funciona (siempre MISS)

**Posibles causas**:
1. Variables de entorno no configuradas → Verificar en Vercel Dashboard
2. Base de datos KV no conectada → Ir a Storage y conectar
3. Error en KV → Revisar logs de Vercel

### Latencia alta en cache

**Posibles causas**:
1. Región de KV lejos de tus usuarios → Crear nueva DB en región más cercana
2. Demasiadas keys en el índice → Ejecutar `cleanup()`

## 📚 Recursos

- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Edge Runtime Docs](https://vercel.com/docs/functions/edge-functions)
- [Redis Commands](https://redis.io/commands/)

---

## ✅ Checklist de Migración

- [x] `npm install @vercel/kv` instalado
- [x] `semanticCache.ts` migrado a async/await
- [x] Endpoint `/api/chat/message` actualizado con `await`
- [ ] Base de datos KV creada en Vercel
- [ ] KV conectada al proyecto
- [ ] Deploy realizado
- [ ] Verificar logs de cache HIT/MISS

---

**Fecha de migración**: 2025-10-16
**Versión**: 1.0.0
**Autor**: Claude Code
