# ✅ Manual Testing Checklist - Pre-Deployment

**Servidor Local:** http://localhost:3000
**Fecha:** 2025-01-05
**Versión:** Sprint 1 & 2 Complete

---

## 🎯 Overview

Esta guía te permite verificar visualmente todas las funcionalidades implementadas en esta sesión antes de deployar a Vercel.

**Tiempo estimado:** 15-20 minutos

---

## 📋 Checklist de Pruebas

### ✅ 1. Health Check & Monitoring

#### Test 1.1: Health Endpoint
**URL:** http://localhost:3000/api/health

**Qué verificar:**
- [ ] Página carga sin errores
- [ ] Muestra JSON con estructura:
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-01-05T...",
    "uptime": {
      "seconds": 123,
      "human": "0h 2m 3s"
    },
    "services": {
      "database": {
        "status": "healthy",
        "latency_ms": 45
      },
      "api": {
        "status": "healthy",
        "latency_ms": 50
      }
    },
    "version": "1.0.0",
    "environment": "development"
  }
  ```

**✅ Criterios de éxito:**
- Status code: 200
- `status: "healthy"`
- `database.status: "healthy"`
- Latency < 1000ms

**❌ Si falla:**
- Verifica conexión a Supabase en `.env.local`
- Revisa console logs del servidor

---

#### Test 1.2: Sentry Test Endpoints

**Base URL:** http://localhost:3000/api/test-sentry

**Tests a ejecutar:**

1. **Test básico:**
   - URL: http://localhost:3000/api/test-sentry?type=test
   - [ ] Devuelve 403 (esperado en local - solo staging/production)

2. **Error capture:**
   - URL: http://localhost:3000/api/test-sentry?type=error
   - [ ] Devuelve 403 o captura error

**✅ Criterios:**
- Endpoints responden (no 404)
- En producción, estos capturarán errores en Sentry

---

#### Test 1.3: Slack Alerts Test

**Base URL:** http://localhost:3000/api/alerts/test-slack

**Tests:**

1. **Sin webhook configurado (esperado):**
   - URL: http://localhost:3000/api/alerts/test-slack?type=test
   - [ ] Devuelve error sobre `SLACK_WEBHOOK_URL not configured` (OK)

**✅ Criterios:**
- Endpoint existe y responde
- Mensaje de error es claro
- En producción funcionará con webhook configurado

---

### ✅ 2. Dashboard & UI

#### Test 2.1: Home/Landing Page
**URL:** http://localhost:3000

**Qué verificar:**
- [ ] Página carga correctamente
- [ ] No hay errores de JavaScript en consola
- [ ] Estilos se aplican correctamente
- [ ] Navegación funciona

**Captura de pantalla:** Guarda screenshot como `test-screenshots/01-home.png`

---

#### Test 2.2: Login Page
**URL:** http://localhost:3000/login (o tu ruta de login)

**Qué verificar:**
- [ ] Formulario de login visible
- [ ] Campos de email/password funcionan
- [ ] Botón de submit está habilitado
- [ ] Links de "Forgot password" funcionan

**Test de login:**
1. Intenta login con credenciales incorrectas
   - [ ] Muestra mensaje de error apropiado
2. Login con credenciales correctas (si las tienes)
   - [ ] Redirect al dashboard
   - [ ] Session se guarda

**Captura:** `test-screenshots/02-login.png`

---

#### Test 2.3: Dashboard Principal
**URL:** http://localhost:3000/dashboard (requiere auth)

**Qué verificar:**
- [ ] Dashboard carga sin errores
- [ ] Sidebar/navegación visible
- [ ] Workspace selector funciona
- [ ] No hay console errors

**Captura:** `test-screenshots/03-dashboard.png`

---

### ✅ 3. Conversations & Widget

#### Test 3.1: Conversations List
**URL:** http://localhost:3000/dashboard/conversations

**Qué verificar:**
- [ ] Lista de conversaciones carga
- [ ] Filters funcionan
- [ ] Search bar funciona
- [ ] Paginación funciona (si hay muchas conversations)

**Captura:** `test-screenshots/04-conversations.png`

---

#### Test 3.2: Conversation Detail
**URL:** http://localhost:3000/dashboard/conversations/[id]

**Qué verificar:**
- [ ] Mensajes cargan correctamente
- [ ] Scroll funciona
- [ ] Timestamps son correctos
- [ ] Customer info visible

**Captura:** `test-screenshots/05-conversation-detail.png`

---

#### Test 3.3: Widget Embeddable
**URL:** Crear una página de prueba o usar la demo

**Qué verificar:**
- [ ] Widget se carga
- [ ] Botón flotante visible
- [ ] Click abre el chat
- [ ] Puedes enviar mensajes
- [ ] Respuestas llegan

**Captura:** `test-screenshots/06-widget.png`

---

### ✅ 4. Documents & Knowledge Base

#### Test 4.1: Documents List
**URL:** http://localhost:3000/dashboard/documents

**Qué verificar:**
- [ ] Lista de documentos carga
- [ ] Status visible (pending/processing/completed/error)
- [ ] Upload button visible
- [ ] Search/filters funcionan

**Captura:** `test-screenshots/07-documents.png`

---

#### Test 4.2: Document Upload
**URL:** http://localhost:3000/dashboard/documents/upload

**Qué verificar:**
- [ ] Upload form funciona
- [ ] Drag & drop funciona
- [ ] File types aceptados: PDF, DOCX, TXT
- [ ] Muestra preview del archivo
- [ ] Progress bar visible durante upload

**Test:**
1. Sube un PDF pequeño
   - [ ] Upload exitoso
   - [ ] Redirect a documents list
   - [ ] Documento aparece con status "pending" o "processing"

**Captura:** `test-screenshots/08-document-upload.png`

---

### ✅ 5. Chat & RAG

#### Test 5.1: Chat Interface (Dashboard)
**URL:** http://localhost:3000/dashboard/chat

**Qué verificar:**
- [ ] Chat interface carga
- [ ] Input field funciona
- [ ] Toggle "Use RAG" visible
- [ ] Conversation history carga

**Test de chat:**
1. Envía mensaje sin RAG
   - [ ] Respuesta llega
   - [ ] Streaming funciona (si implementado)
   - [ ] Mensaje se guarda en historial

2. Envía mensaje con RAG
   - [ ] Toggle RAG está ON
   - [ ] Respuesta incluye contexto de documentos
   - [ ] Sources visible (si implementado)

**Captura:** `test-screenshots/09-chat-interface.png`

---

### ✅ 6. Settings & Configuration

#### Test 6.1: Workspace Settings
**URL:** http://localhost:3000/dashboard/settings

**Qué verificar:**
- [ ] Settings page carga
- [ ] Tabs funcionan (General, Team, Billing, etc.)
- [ ] Forms son editables
- [ ] Save buttons funcionan

**Captura:** `test-screenshots/10-settings.png`

---

#### Test 6.2: Team Management
**URL:** http://localhost:3000/dashboard/team

**Qué verificar:**
- [ ] Lista de team members
- [ ] Invite button visible
- [ ] Roles mostrados correctamente
- [ ] Actions (edit/remove) funcionan

**Captura:** `test-screenshots/11-team.png`

---

### ✅ 7. API Endpoints (Postman/cURL)

#### Test 7.1: Health Check
```bash
curl http://localhost:3000/api/health
```
- [ ] Returns 200
- [ ] JSON válido

---

#### Test 7.2: Create Conversation Message
```bash
curl -X POST http://localhost:3000/api/conversations/test-123/messages \
  -H "Content-Type: application/json" \
  -H "X-Workspace-ID: your-workspace-id" \
  -d '{
    "content": "Test message",
    "role": "user",
    "metadata": {
      "customerName": "Test User"
    }
  }'
```
- [ ] Returns 201
- [ ] Message created

---

#### Test 7.3: Chat Completion
```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your business hours?",
    "workspaceId": "your-workspace-id",
    "conversationId": "test-conv-123",
    "useRag": true
  }'
```
- [ ] Returns 200
- [ ] Response includes AI message
- [ ] Token usage tracked

---

### ✅ 8. Performance & Console

#### Test 8.1: Browser Console
**Abre DevTools → Console en cada página**

**Qué verificar:**
- [ ] No hay errores rojos
- [ ] Warnings aceptables (solo Sentry deprecation warnings)
- [ ] No memory leaks visibles
- [ ] No 404s en Network tab

---

#### Test 8.2: Network Tab
**Abre DevTools → Network**

**Qué verificar:**
- [ ] API calls exitosos (200/201)
- [ ] No requests colgados
- [ ] Latency razonable (< 2s para API calls)
- [ ] No 500 errors

---

#### Test 8.3: Lighthouse Score
**DevTools → Lighthouse → Run audit**

**Targets:**
- [ ] Performance: > 70
- [ ] Accessibility: > 90
- [ ] Best Practices: > 80
- [ ] SEO: > 80

---

### ✅ 9. Database Verification (Supabase)

#### Test 9.1: Supabase Dashboard
**URL:** https://supabase.com/dashboard

**Qué verificar:**
- [ ] Proyecto está activo
- [ ] Database tiene datos recientes
- [ ] No hay queries lentos en Logs
- [ ] Connection pool usage < 50%

---

#### Test 9.2: Tables Verification

**Tables a verificar:**
- [ ] `workspaces` - Tiene registros
- [ ] `users` - Usuarios pueden loguearse
- [ ] `conversations` - Se crean correctamente
- [ ] `messages` - Mensajes se guardan
- [ ] `documents` - Documentos listados
- [ ] `document_chunks` - Chunks generados

---

### ✅ 10. External Services

#### Test 10.1: OpenAI API
**Verificar en:** https://platform.openai.com/usage

- [ ] API key funciona
- [ ] Usage tracking visible
- [ ] No errores recientes
- [ ] Rate limits no alcanzados

---

#### Test 10.2: Pinecone
**Verificar en:** https://app.pinecone.io

- [ ] Index "saas" existe
- [ ] Vectors count > 0 (si subiste docs)
- [ ] Queries funcionando
- [ ] No throttling

---

#### Test 10.3: Voyage AI
**Verificar en:** https://voyage.ai/dashboard

- [ ] API key válida
- [ ] Usage tracking
- [ ] No errors

---

## 🚨 Common Issues & Fixes

### Issue 1: Database Connection Error
**Symptom:** Health check returns unhealthy
**Fix:**
1. Verifica `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Revisa Supabase dashboard - proyecto activo
3. Check connection string es correcta

---

### Issue 2: 404 on API Routes
**Symptom:** API calls return 404
**Fix:**
1. Verifica ruta en browser: `/api/health` not `/health`
2. Restart server: `npm run dev`
3. Clear `.next` cache: `rm -rf .next && npm run dev`

---

### Issue 3: Widget Not Loading
**Symptom:** Widget no aparece en página
**Fix:**
1. Verifica script tag está incluido
2. Check console for CORS errors
3. Verifica workspace ID es correcto

---

### Issue 4: Slow Performance
**Symptom:** Pages load > 3s
**Fix:**
1. Check database latency in health endpoint
2. Verify no pending migrations
3. Restart server
4. Check system resources (RAM/CPU)

---

## 📸 Screenshots Checklist

Guarda screenshots de:

1. [ ] Home page
2. [ ] Login page
3. [ ] Dashboard principal
4. [ ] Conversations list
5. [ ] Conversation detail con mensajes
6. [ ] Widget embeddable
7. [ ] Documents list
8. [ ] Chat interface
9. [ ] Settings page
10. [ ] Health check JSON

---

## ✅ Pre-Deployment Checklist

Antes de deployar a Vercel, confirma:

### Configuration
- [ ] Todas las env variables están en `.env.example`
- [ ] `.gitignore` actualizado
- [ ] No hay secretos hardcodeados en código
- [ ] TypeScript compila sin errores: `npm run type-check`
- [ ] Lint pasa: `npm run lint`

### Testing
- [ ] Todas las pruebas manuales pasaron
- [ ] No hay console errors críticos
- [ ] API endpoints funcionan
- [ ] Database accesible
- [ ] External services configurados

### Performance
- [ ] Health check < 1s
- [ ] Dashboard carga < 3s
- [ ] No memory leaks visibles
- [ ] Lighthouse scores aceptables

### Documentation
- [ ] README actualizado
- [ ] Environment variables documentadas
- [ ] API endpoints documentados
- [ ] Deploy instructions ready

---

## 🚀 Ready for Deployment?

Si todas las pruebas pasaron, estás listo para deployar a Vercel!

**Siguiente paso:** Ver `VERCEL_DEPLOYMENT.md` para instrucciones de deployment.

---

## 📞 Support

Si encuentras issues:

1. Revisa console logs: Terminal donde corre `npm run dev`
2. Revisa browser console: DevTools → Console
3. Revisa Supabase logs: Dashboard → Logs
4. Revisa Sentry (cuando esté configurado): sentry.io

---

**Fecha de testing:** 2025-01-05
**Tested by:** [Tu nombre]
**Status:** ⏳ Pending testing
**Deploy:** ⏳ Pending
