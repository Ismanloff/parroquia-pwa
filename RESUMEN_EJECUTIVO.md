# RESUMEN EJECUTIVO - SERVICIOS Y APIs
## Aplicación React Native PARROQUIA

**Documento:** RESUMEN RÁPIDO  
**Fecha:** Octubre 2025  
**Audiencia:** Developers, Tech Leads, Product Managers

---

## RESUMEN EJECUTIVO (2 MINUTOS)

**Qué es:** Aplicación de chatbot para parroquia católica con información parroquial, eventos y sacramentos.

**Stack:** React Native (Expo) + Next.js Backend + Pinecone RAG + Supabase Auth

**Capacidades principales:**
- Chat con IA (streaming en tiempo real)
- Búsqueda semántica en 71 documentos (Pinecone)
- Calendario de eventos (Google Calendar)
- Autenticación + Perfiles de usuario
- FAQ rápidas con cache (0ms)
- Botones inteligentes contextuales

**Rendimiento:**
- Respuestas simples: 0.3s (memoria cache)
- Respuestas con Pinecone: 2-5s
- Streaming: 70-80% mejora percibida

---

## SERVICIOS CRÍTICOS (EL CORAZÓN)

### 1. Chat Backend (Next.js API Routes)
- **Endpoint principal:** `/api/chat/message-stream` (SSE)
- **Tecnología:** OpenAI Agent SDK + Pinecone + Redis cache
- **Latencia:** 2-5 segundos (con streaming)
- **Copilot:** Claude Haiku para query expansion y conversational rewriting

### 2. Base de Datos
- **Usuarios:** Supabase Auth (JWT)
- **Documentos:** Pinecone (71 vectores, 3072 dims, búsqueda semántica)
- **Cache:** Redis Cloud (1h TTL) + Memory Cache (0ms, 43 FAQs)
- **Datos estáticos:** PostgreSQL (Supabase)

### 3. Inteligencia
- **RAG:** Query Expansion (3 variaciones) + Reciprocal Rank Fusion
- **Conversación:** Detección de follow-ups + reescritura automática
- **Pre-filtering:** Detecta saludos/thanks sin RAG (1-2s más rápido)
- **Moderation:** OpenAI Moderation API

### 4. Frontend (React Native)
- **State Management:** Zustand (chat messages) + React Context (auth, theme)
- **Data Fetching:** React Query (@tanstack)
- **Streaming:** react-native-sse (SSE client)
- **Navigation:** Expo Router (file-based)

---

## INTEGRATIONS EXTERNAS

| Servicio | Función | Criticidad | Fallback |
|----------|---------|------------|----------|
| **OpenAI** | Agent + GPT-4o-mini + Moderation | Crítica | - |
| **Anthropic** | Query Expansion (Claude Haiku) | Alta | Default query |
| **Pinecone** | Vector search (71 docs) | Crítica | Memory cache |
| **Supabase** | Auth + DB (users, saints, gospels) | Crítica | Local auth (dev) |
| **Redis Cloud** | Semantic cache | Alta | Memory cache |
| **Vercel KV** | Rate limiting + Circuit breaker | Media | Fail-open |
| **Google Calendar** | Event fetching (ICS) | Media | Empty events |
| **Resend** | Transactional email | Baja | Logging |

---

## ENDPOINTS CRÍTICOS

### Chat (Producción)
```
POST /api/chat/message-stream    → Streaming con agent (60s timeout)
POST /api/chat/quick             → Cache rápido (15s timeout)
GET  /api/calendar/events        → Eventos de Google Calendar
```

### Auth
```
POST /api/auth/register          → Signup + profile creation
POST /api/auth/login             → Login con JWT
POST /api/auth/forgot-password   → Reset password via email
```

### Debug/Admin
```
GET  /api/chat/cache-stats       → Cache statistics
GET  /api/debug/logger           → Real-time logs (dev only)
POST /api/admin/populate-cache   → Carga FAQs en memoria
```

---

## FLUJO DE UNA CONVERSACIÓN

```
1. Usuario: "¿Cuándo es Eloos?"
   ↓
2. Frontend: SSE → /api/chat/message-stream
   ↓
3. Backend:
   a) Pre-filter: ¿Saludo? NO → Continuar RAG
   b) Detection: ¿Calendario? NO → Pinecone
   c) Query Expansion: 3 variaciones ("Eloos", "grupo Eloos", "actividades Eloos")
   d) Pinecone: Búsqueda semántica + RRF → 3 fuentes top
   e) Agent: Usa sources para generar respuesta
   ↓
4. Streaming: Chunks vía SSE
   - "Eloos es..." (chunk 1)
   - "un grupo para..." (chunk 2)
   ↓
5. Quick Actions: Detecta "Eloos" → Botón "Inscribirme"
   ↓
6. Respuesta completa renderizada con botones interactivos
```

---

## OPTIMIZACIONES CLAVE (¿Por qué es rápido?)

| Optimización | Impacto | Implementación |
|-------------|---------|-----------------|
| **Streaming** | 70-80% mejora percibida | SSE en real-time |
| **Memory cache** | 0ms para FAQs | 43 preguntas pre-cargadas |
| **Pre-filtering** | Evita RAG costoso | Detecta saludos/thanks |
| **Query Expansion** | +30% mejor recall | Claude Haiku (3 variaciones) |
| **Conversational Rewriting** | Respuestas coherentes | Auto-contextualiza follow-ups |
| **Quick Actions** | UX mejorada | Botones contextuales |
| **Semantic cache** | Reutiliza respuestas | Redis (1h TTL) |

---

## SEGURIDAD

✅ **Autenticación:** Supabase + JWT + AsyncStorage persistence  
✅ **Content Filtering:** OpenAI Moderation API + Relevance checker  
✅ **Rate Limiting:** Vercel KV (configurable por IP/user)  
✅ **Circuit Breaker:** Protección de OpenAI API  
✅ **Error Boundaries:** Crash handling en frontend  
✅ **No secrets en cliente:** API key en backend, anon key para Supabase  

---

## MONITOREO Y DEBUGGING

**Logs en tiempo real:**
- `/api/debug/logger` (dashboard HTML en dev)
- Request IDs únicos para tracking
- Structured logging (info/warn/error/debug)

**Métricas disponibles:**
- Cache stats (Redis + Memory)
- Circuit breaker state
- Rate limit status
- API response times

**Alertas:**
- Circuit breaker activado
- Rate limit exceeded
- OpenAI API errors

---

## LIMITS Y CONSIDERACIONES

⚠️ **Costo:** 
- Pinecone: Query Expansion hace 3x requests (mitigado con cache)
- OpenAI: Agent requests + GPT-4o más caro (ok con volumen actual)

⚠️ **Escalabilidad:**
- 71 docs es suficiente para FAQ (pero crece cuando se agregan más)
- Pinecone puede manejar 100k+ documentos sin problema
- Redis TTL de 1h es conservador (puede reducirse)

⚠️ **Disponibilidad:**
- Fallback a Memory cache si Redis down
- Fallback a GPT-4o-mini si agent falla
- Conversational pre-filter si Pinecone slow

---

## CAMBIOS RECIENTES (Oct 2025)

✅ Query Expansion a Claude Haiku 4.5 (más rápido)  
✅ Conversational Rewriting automático  
✅ Pre-filtro de queries conversacionales  
✅ Quick Actions dinámicos  
✅ Streaming mejorado con status updates  
✅ Circuit breaker + Rate limiting  

---

## PRÓXIMOS STEPS (Roadmap)

🔄 Graph RAG (relaciones entre documentos)  
🔄 Voice input/output  
🔄 Analytics dashboard  
🔄 Admin panel para FAQs  
🔄 Multi-language support  

---

## CONTACTO Y REFERENCIAS

**Documentación completa:** `/REPORTE_SERVICES_APIS_COMPLETO.md`  
**Archivo de tipos:** `/types/chat.ts`  
**Backend source:** `/backend/app/api/`  
**Frontend source:** `/hooks/`, `/stores/`, `/contexts/`  

---

**Reporte generado:** Octubre 26, 2025
