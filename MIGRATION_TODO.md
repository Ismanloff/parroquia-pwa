# Tareas de Migración Pendientes - Resply

Este documento lista las tareas que deben completarse para finalizar la adaptación de APP PARRO PWA a Resply.

## ✅ Completado (Fase 1 - Semana 1)

- [x] Fork APP PARRO PWA → crear proyecto resply
- [x] Eliminar APIs parroquiales (calendar, gospel, saints)
- [x] Eliminar componentes parroquiales (Calendar.tsx, Home.tsx)
- [x] Eliminar utilidades parroquiales (liturgicalColors.ts)
- [x] Actualizar branding en package.json
- [x] Actualizar manifest.json con información de Resply
- [x] Actualizar agent instructions a chatbot B2B
- [x] Actualizar workflow_name a "resply_chatbot_streaming"

## ⚠️ CRÍTICO - Requiere Atención Inmediata

### 1. Memory Cache FAQs (app/api/chat/utils/memoryCache.ts)
**Líneas:** 778 líneas, 43 FAQs

**Tarea:** Reemplazar las 43 FAQs religiosas con FAQs de tu negocio B2B

**Estructura de cada FAQ:**
```typescript
{
  "question": "¿Pregunta principal?",
  "answer": "Respuesta detallada aquí...",
  "variations": [
    "variacion 1",
    "variacion 2",
    "pregunta alternativa"
  ]
}
```

**Ejemplos de FAQs B2B recomendadas:**
- Precios y planes
- Cómo registrarse / crear cuenta
- Métodos de pago aceptados
- Política de reembolso
- Horarios de soporte
- Funcionalidades principales
- Integraciones disponibles
- Límites del plan gratuito
- Cómo cancelar suscripción
- Requisitos técnicos
- Privacidad y seguridad de datos
- Tiempo de implementación
- Soporte técnico disponible
- Actualizaciones y mantenimiento
- Diferencias entre planes

**Archivo:** `/app/api/chat/utils/memoryCache.ts` (líneas 47-778)

### 2. Pinecone Knowledge Base
**Tarea:** Eliminar los 71 documentos religiosos y vectorizar documentación de tu empresa

**Pasos:**
1. Acceder a Pinecone dashboard
2. Index: `saas` (o el nombre configurado)
3. Eliminar namespace actual o crear uno nuevo
4. Vectorizar documentos de tu empresa:
   - Documentación de producto
   - Políticas de uso
   - Guías de usuario
   - FAQs extendidas
   - Terms of Service
   - Privacy Policy
   - Tutoriales / How-to guides

**Herramienta:** Usa el script en `/skill 5/scripts/upload-documents.py` (adaptar paths)

### 3. Variables de Entorno (.env)
**Tarea:** Actualizar variables de entorno con tus credenciales

**Archivo:** `.env.local`

**Variables a actualizar:**
```bash
# Branding
NEXT_PUBLIC_APP_NAME="Resply"
NEXT_PUBLIC_APP_URL="https://resply.com"
AGENT_NAME="Asistente de Atención al Cliente"

# Meta APIs (WhatsApp Business - PENDIENTE CONFIGURAR)
META_APP_ID="tu-app-id"
META_APP_SECRET="tu-app-secret"
META_WEBHOOK_VERIFY_TOKEN="tu-token-secreto"

# Stripe (PENDIENTE CONFIGURAR)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# OpenAI (ya configurado, verificar)
OPENAI_API_KEY="tu-key"

# Pinecone (ya configurado, verificar namespace)
PINECONE_API_KEY="tu-key"
PINECONE_INDEX_NAME="saas"

# Supabase (ya configurado, verificar)
SUPABASE_URL="tu-url"
SUPABASE_SERVICE_ROLE_KEY="tu-key"
```

### 4. Iconos y Assets del PWA
**Tarea:** Reemplazar iconos parroquiales con logo de Resply

**Archivos a reemplazar:**
```
/public/icons/icon-72x72.png
/public/icons/icon-96x96.png
/public/icons/icon-128x128.png
/public/icons/icon-144x144.png
/public/icons/icon-152x152.png
/public/icons/icon-192x192.png
/public/icons/icon-384x384.png
/public/icons/icon-512x512.png
/public/icons/shortcut-home.png
/public/icons/shortcut-chat.png
/public/icons/shortcut-settings.png
/public/favicon.ico
/public/apple-touch-icon.png
```

**Herramientas recomendadas:**
- https://realfavicongenerator.net/
- https://maskable.app/ (para maskable icons)

### 5. Screenshots del PWA
**Tarea:** Actualizar screenshots en `/public/screenshots/`

**Archivos:**
```
/public/screenshots/home-narrow.png
/public/screenshots/calendar-narrow.png  (renombrar a dashboard-narrow.png)
/public/screenshots/chat-narrow.png
```

**Tamaño recomendado:** 540x720px (form_factor: narrow)

### 6. README.md
**Tarea:** Actualizar README con información de Resply

**Secciones a actualizar:**
- Título y descripción del proyecto
- Logo (si existe)
- Features específicas de Resply
- Instrucciones de setup
- Variables de entorno
- Enlaces a documentación

### 7. Otros Archivos de Documentación
**Archivos a eliminar o actualizar:**
```
ANALISIS_MIGRACION_FALTANTE.md (eliminar)
COMPARATIVA_REACT_NATIVE_VS_PWA.md (eliminar)
HUSKY_SETUP.md (mantener)
IMPLEMENTACION_COMPLETADA.md (actualizar)
PLAN_MEJORAS_2025.md (actualizar)
PENDIENTE_CALENDARIO.md (eliminar)
```

## 📋 Fase 2 - Implementar Multi-tenancy (Semanas 2-5)

**Ver:** `/skill 6/` para guías detalladas

- [ ] Crear tablas en Supabase (ejecutar `/skill 6/scripts/init_workspace.sql`)
- [ ] Implementar RLS policies (ejecutar `/skill 6/scripts/setup_rls.sql`)
- [ ] Agregar `tenant_id` a todas las queries
- [ ] Implementar middleware para extraer tenant
- [ ] Modificar Pinecone para usar namespaces por tenant
- [ ] UI de selección de workspace
- [ ] Testing de tenant isolation

## 📋 Fase 3 - WhatsApp Business API (Semanas 6-8)

**Ver:** `/skill 1/` y `/skill 4/` para guías detalladas

- [ ] Crear Meta App en Facebook Developer
- [ ] Configurar Webhook endpoint `/api/webhooks/meta`
- [ ] Implementar signature verification (HMAC SHA256)
- [ ] Setup BullMQ queue system
- [ ] Implementar send message API
- [ ] Template management
- [ ] Status tracking (delivered, read, failed)
- [ ] Testing con WhatsApp Sandbox

## 📋 Fase 4 - Billing con Stripe (Semanas 9-10)

**Ver:** `/skill 6/references/06-billing-stripe.md`

- [ ] Crear cuenta Stripe
- [ ] Configurar productos y precios
- [ ] Implementar Checkout session
- [ ] Webhook handler para eventos
- [ ] Subscription management UI
- [ ] Usage tracking por tenant
- [ ] Invoice generation

## 📋 Fase 5 - Admin Dashboard (Semanas 11-13)

**Ver:** `/skill 6/references/04-dashboard-settings.md`

- [ ] Dashboard con métricas
- [ ] User management (CRUD)
- [ ] Conversation history
- [ ] Document upload UI para knowledge base
- [ ] Team management con RBAC
- [ ] Analytics real-time

## 📋 Fase 6 - Testing & CI/CD (Semanas 14-16)

**Ver:** `/skill 10/` y `/skill 7/`

- [ ] Vitest unit tests
- [ ] Playwright E2E tests
- [ ] Multi-tenant isolation tests
- [ ] Load testing (Artillery)
- [ ] GitHub Actions workflows
- [ ] Automated deployment

## 📋 Fase 7 - Monitoring & Launch (Semanas 17-18)

**Ver:** `/skill 8/` y `/skill 11/`

- [ ] Sentry error tracking
- [ ] Vercel Analytics
- [ ] Custom metrics (Prometheus)
- [ ] Grafana dashboards
- [ ] Alerting (Slack/Email)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Beta launch 🚀

---

## 📚 Recursos Disponibles

- **12 Skills** con guías paso a paso en `/skill 1/` a `/skill 12/`
- **Scripts SQL** en `/skill 6/scripts/`
- **Diagramas** en cada skill (carpeta `assets/`)
- **MCP Servers** funcionales en `/mcp-servers/`
- **Roadmap detallado** en `/Documentación/ROADMAP_12_SEMANAS_DETALLADO.md`

## 🎯 Prioridades

1. **CRÍTICO (Semana 1):** Memory Cache FAQs, Pinecone Knowledge Base, Variables de entorno
2. **IMPORTANTE (Semana 1):** Iconos, Screenshots, README
3. **MEDIO (Semanas 2-5):** Multi-tenancy
4. **BAJO (Semanas 6+):** WhatsApp, Billing, Admin, Testing, Monitoring

---

**Fecha de creación:** 2 de Noviembre 2025
**Última actualización:** 2 de Noviembre 2025
**Estado:** Fase 1 - 70% completado
