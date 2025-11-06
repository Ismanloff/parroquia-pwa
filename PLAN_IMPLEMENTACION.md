# 📋 PLAN DE IMPLEMENTACIÓN - RESPLY SAAS
**Fecha:** 3 Noviembre 2025
**Estado Actual:** Fase 1 Completada - Foundations & Document Management
**Próxima Fase:** Fase 2 - Chatbot RAG & Settings UI

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

### ✅ **COMPLETADO (Fase 1)**

#### 1. **Infraestructura Base**
- ✅ Next.js 16.0.0 + React 19.2.0 configurado
- ✅ TypeScript strict mode habilitado
- ✅ Tailwind CSS con diseño profesional
- ✅ Supabase conectado (auth + database)
- ✅ Pinecone index 'saas' configurado (1024 dims, Voyage AI)
- ✅ Multi-tenancy implementado (workspaces con namespaces)

#### 2. **Sistema de Autenticación**
- ✅ Login/Register funcional
- ✅ Password reset flow
- ✅ Email verification
- ✅ Session management con Supabase
- ✅ RLS policies aplicadas en tablas críticas

#### 3. **Gestión de Workspaces**
- ✅ Creación de workspaces (API con service role)
- ✅ Workspace switching funcional
- ✅ localStorage sync ('resply-active-workspace')
- ✅ Workspace members con RBAC (owner, admin, agent, viewer)
- ✅ Página de settings básica
- ✅ WorkspaceSwitcher component

#### 4. **Sistema de Documentos (RAG)**
- ✅ Upload de documentos (TXT, DOCX, PDF*)
- ✅ Supabase Storage para archivos
- ✅ Procesamiento de texto (mammoth para DOCX)
- ✅ Chunking con overlap (800 chars, 100 overlap)
- ✅ Embeddings con Voyage AI (1024 dims)
- ✅ Vectores en Pinecone con metadata completa
- ✅ document_chunks en Supabase
- ✅ API endpoints: /upload, /process, /list
- ✅ Dashboard de documentos con tabla
- ⚠️ **PDF processing deshabilitado** (import issues con pdf-parse)

#### 5. **Navegación y UI**
- ✅ Sidebar component con navegación
- ✅ Dashboard layout profesional
- ✅ Landing page con Hero, Features, Pricing
- ✅ Command Palette (Cmd+K)
- ✅ Dark mode support
- ✅ Loading states y error boundaries
- ✅ Toast notifications (Sonner)

#### 6. **Base de Datos**
- ✅ 10 tablas creadas (workspaces, workspace_members, documents, document_chunks, conversations, messages, channels, workspace_settings, billing_subscriptions, onboarding_progress)
- ✅ RLS configurado (mayoría de tablas)
- ✅ Migrations aplicadas (14 archivos)
- ✅ Tipos TypeScript generados

---

## ⚠️ **ISSUES CONOCIDOS**

### 🔴 **Críticos (Bloquean funcionalidad)**
1. **PDF Processing Deshabilitado**
   - **Issue:** `pdf-parse` no es compatible con Next.js webpack ESM
   - **Impacto:** No se pueden procesar PDFs
   - **Workaround temporal:** Solo DOCX y TXT
   - **Solución propuesta:** Usar alternativa (pdf.js, external API, o Edge Runtime)

2. **RLS Deshabilitado en workspace_members**
   - **Issue:** Infinite recursion en policies
   - **Impacto:** Riesgo de seguridad (tabla sin protección)
   - **Workaround:** Service role en API `/workspaces/create`
   - **Solución:** Implementar security definer functions

### 🟡 **Warnings (No bloquean, pero necesitan atención)**
1. **Supabase Security Advisors:**
   - Leaked password protection deshabilitado
   - MFA options insuficientes
   - Function search_path mutable en triggers

2. **Service Workers Fantasma:**
   - 404s en `/firebase-messaging-sw.js` y `/sw.js`
   - Residuos de PWA removida
   - No afecta funcionalidad, pero contamina logs

---

## 🚧 **NO IMPLEMENTADO (Pendiente)**

### **Backend / API**
- ❌ Chatbot RAG (búsqueda + generación de respuestas)
- ❌ Semantic caching (Redis Cloud configurado pero no usado)
- ❌ Query expansion con Anthropic Claude
- ❌ Conversational rewriting
- ❌ WhatsApp Business API integration (NO POSIBLE AÚN)
- ❌ Instagram API integration (NO POSIBLE AÚN)
- ❌ Facebook Messenger API (NO POSIBLE AÚN)
- ❌ Stripe billing integration
- ❌ Email transactional con Resend
- ❌ Webhooks para channels
- ❌ Analytics y métricas

### **Frontend / UI**
- ❌ Chatbot UI (interfaz de conversación)
- ❌ Página de Conversations (lista de chats)
- ❌ Página de Channels (configurar integraciones)
- ❌ Settings page completa (solo existe básica)
- ❌ Analytics dashboard
- ❌ Team members management UI
- ❌ Billing & subscription UI
- ❌ Onboarding flow
- ❌ User profile page
- ❌ Notifications system

### **Testing & Deploy**
- ❌ Tests unitarios (Vitest configurado pero sin tests)
- ❌ Tests E2E
- ❌ CI/CD pipeline
- ❌ Deploy a Vercel producción
- ❌ Environment variables en Vercel
- ❌ Domain setup
- ❌ Monitoreo y logging

---

## 📅 **PLAN DETALLADO POR FASES**

---

## **FASE 2: CHATBOT RAG & SETTINGS (Alta Prioridad)**

### **Objetivo:** Implementar chatbot funcional con búsqueda RAG y configuración básica

### **2.1 - Chatbot Backend (API Routes)**

**Archivos a crear/modificar:**
- `app/api/chat/rag-search/route.ts` - Nueva ruta para búsqueda RAG
- `app/api/chat/generate/route.ts` - Nueva ruta para generación con OpenAI
- `app/api/chat/stream/route.ts` - Streaming de respuestas

**Implementación:**

```typescript
// app/api/chat/rag-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { VoyageAIClient } from 'voyageai';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  const { query, workspaceId, topK = 3 } = await req.json();

  // 1. Generate embedding with Voyage AI
  const voyageClient = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  const embedding = await voyageClient.embed({
    input: query,
    model: 'voyage-3-large'
  });

  // 2. Search in Pinecone namespace
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index('saas');
  const namespace = workspaceId; // Each workspace = namespace

  const results = await index.namespace(namespace).query({
    vector: embedding.data[0].embedding,
    topK,
    includeMetadata: true
  });

  // 3. Get full text from Supabase document_chunks
  const chunkIds = results.matches.map(m => m.id);
  const { data: chunks } = await supabaseAdmin
    .from('document_chunks')
    .select('content, document_id, chunk_index')
    .in('pinecone_id', chunkIds);

  return NextResponse.json({
    chunks,
    scores: results.matches.map(m => m.score)
  });
}
```

**Tareas:**
- [ ] Crear endpoint `/api/chat/rag-search` para búsqueda vectorial
- [ ] Crear endpoint `/api/chat/generate` para generar respuestas con OpenAI
- [ ] Implementar streaming con OpenAI Streaming API
- [ ] Agregar system prompt customizable por workspace
- [ ] Implementar query expansion con Anthropic Claude (opcional)
- [ ] Configurar semantic caching con Redis Cloud
- [ ] Agregar rate limiting por workspace
- [ ] Error handling y logging

**Estimación:** 2-3 días

---

### **2.2 - Chatbot Frontend (UI Components)**

**Archivos a crear:**
- `components/chat/ChatInterface.tsx` - Componente principal del chat
- `components/chat/MessageList.tsx` - Lista de mensajes
- `components/chat/MessageInput.tsx` - Input de usuario
- `components/chat/SourceCard.tsx` - Mostrar fuentes de documentos
- `app/(dashboard)/dashboard/chat/page.tsx` - Página del chat

**Implementación:**

```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { documentId: string; filename: string; preview: string }[];
  timestamp: Date;
}

export function ChatInterface({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (userMessage: string) => {
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Call RAG search + generate API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          workspaceId,
          history: messages.slice(-10) // Last 10 messages for context
        })
      });

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        // Update UI in real-time
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMsg, content: assistantMessage }];
          } else {
            return [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantMessage,
              timestamp: new Date()
            }];
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
```

**Tareas:**
- [ ] Crear ChatInterface component con estado de mensajes
- [ ] Implementar streaming de respuestas del chatbot
- [ ] Mostrar fuentes/documentos usados en la respuesta
- [ ] Agregar typing indicators
- [ ] Scroll automático al nuevo mensaje
- [ ] Markdown rendering en mensajes
- [ ] Code syntax highlighting
- [ ] Copy to clipboard para mensajes
- [ ] Regenerate response button
- [ ] Feedback buttons (👍/👎)
- [ ] Guardar conversaciones en Supabase (opcional Fase 2)

**Estimación:** 2-3 días

---

### **2.3 - Settings Page Completa**

**Archivos a modificar:**
- `app/(dashboard)/dashboard/settings/page.tsx`
- `components/Settings.tsx`

**Secciones a implementar:**
1. **Workspace Settings:**
   - Nombre del workspace
   - Logo upload
   - Primary color picker
   - Timezone

2. **Chatbot Configuration:**
   - chatbot_name
   - welcome_message
   - language (es, en, fr, pt)
   - tone (formal, friendly, professional)
   - ai_instructions (textarea)
   - ai_model selector (gpt-4o-mini, gpt-4, etc.)
   - ai_temperature slider

3. **Business Hours:**
   - Horarios por día de la semana
   - out_of_hours_message

4. **Team Members:**
   - Lista de miembros
   - Invitar nuevos miembros
   - Cambiar roles (owner, admin, agent, viewer)

**Tareas:**
- [ ] Diseñar tabs para diferentes secciones
- [ ] Implementar formularios con react-hook-form + zod
- [ ] Conectar con API `/api/workspaces/settings`
- [ ] Upload de logo a Supabase Storage
- [ ] Color picker con preview en tiempo real
- [ ] Validación de horarios de negocio
- [ ] Invitar miembros por email (Resend)

**Estimación:** 2 días

---

### **2.4 - Fix Critical Issues**

**Tareas:**
- [ ] **PDF Processing:** Evaluar alternativas (pdf.js, external API)
- [ ] **RLS workspace_members:** Implementar security definer functions
- [ ] **Limpiar service workers:** Remover referencias a PWA
- [ ] **Supabase Advisors:** Habilitar leaked password protection
- [ ] **Supabase Advisors:** Configurar MFA options

**Estimación:** 1-2 días

---

## **FASE 3: CONVERSATIONS & REALTIME (Media Prioridad)**

### **Objetivo:** Sistema de conversaciones con clientes (preparar para canales futuros)

**NOTA:** WhatsApp, Instagram, Facebook APIs NO están disponibles todavía. Esta fase prepara la infraestructura para cuando estén disponibles.

### **3.1 - Conversations Backend**

**Archivos a crear:**
- `app/api/conversations/list/route.ts`
- `app/api/conversations/[id]/route.ts`
- `app/api/conversations/[id]/messages/route.ts`
- `app/api/conversations/assign/route.ts`

**Tareas:**
- [ ] Crear endpoints CRUD para conversations
- [ ] Implementar filtros (status, assigned_agent, channel)
- [ ] Pagination con cursor-based
- [ ] Supabase Realtime para actualizaciones en tiempo real
- [ ] Assignment de conversaciones a agentes
- [ ] Cambio de status (open, assigned, resolved, closed)

**Estimación:** 2 días

---

### **3.2 - Conversations Frontend**

**Archivos a crear:**
- `app/(dashboard)/dashboard/conversations/page.tsx`
- `components/conversations/ConversationsList.tsx`
- `components/conversations/ConversationDetail.tsx`
- `components/conversations/MessageThread.tsx`

**Features:**
- Lista de conversaciones con info (cliente, último mensaje, status)
- Filtros y búsqueda
- Vista de detalle con thread de mensajes
- Asignar a agente
- Marcar como resuelta
- Agregar notas internas

**Tareas:**
- [ ] Diseñar UI similar a Intercom/Zendesk
- [ ] Split view: lista + detalle
- [ ] Realtime updates con Supabase Realtime
- [ ] Notifications cuando llega mensaje nuevo
- [ ] Quick replies (respuestas rápidas)
- [ ] Typing indicators

**Estimación:** 3 días

---

### **3.3 - Web Channel (Canal Web Embeddable)**

**Objetivo:** Widget de chat para sitios web de clientes

**Archivos a crear:**
- `app/api/channels/web/init/route.ts`
- `public/embed/chat-widget.js`
- `components/embed/ChatWidget.tsx`

**Features:**
- Widget embeddable con `<script>` tag
- Chat popup en esquina de página
- Branding customizable por workspace
- Guardar conversaciones en tabla `conversations` + `messages`
- AI auto-responde usando RAG

**Tareas:**
- [ ] Crear script de embed
- [ ] Widget React con iframe o shadow DOM
- [ ] API para crear conversación web
- [ ] Conectar con chatbot RAG
- [ ] Customización de colores/logo
- [ ] Preview en settings

**Estimación:** 3-4 días

---

## **FASE 4: CHANNELS PLACEHOLDER (Baja Prioridad - Futuro)**

**IMPORTANTE:** Las APIs de Meta (WhatsApp Business, Instagram, Facebook Messenger) **no están disponibles todavía**. Esta fase crea placeholders y documentación para cuando estén listas.

### **4.1 - Channels Page (UI Only)**

**Archivos a crear:**
- `app/(dashboard)/dashboard/channels/page.tsx`
- `components/channels/ChannelCard.tsx`

**Diseño:**
```
┌─────────────────────────────────────────┐
│  Canales de Comunicación                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 📱 WhatsApp  │  │ 📷 Instagram │    │
│  │              │  │              │    │
│  │ PRÓXIMAMENTE │  │ PRÓXIMAMENTE │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 💬 Facebook  │  │ 🌐 Web       │    │
│  │              │  │              │    │
│  │ PRÓXIMAMENTE │  │   ACTIVO     │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

**Tareas:**
- [ ] Crear página con cards para cada canal
- [ ] Mostrar "Próximamente" con email de notificación
- [ ] Documentar requisitos de cada API
- [ ] Preparar migration para cuando APIs estén listas

**Estimación:** 1 día

---

## **FASE 5: BILLING & SUBSCRIPTIONS (Media Prioridad)**

### **Objetivo:** Integración con Stripe para facturación

### **5.1 - Stripe Integration**

**Archivos a crear:**
- `app/api/billing/create-checkout-session/route.ts`
- `app/api/billing/webhook/route.ts`
- `app/api/billing/portal/route.ts`

**Planes propuestos:**
```
FREE:
- 1 workspace
- 50 conversaciones/mes
- 10 documentos (max 5 MB)
- Web channel
- Soporte email

PRO ($29/mes):
- 3 workspaces
- 500 conversaciones/mes
- 100 documentos (max 50 MB)
- Todos los canales
- Soporte prioritario

ENTERPRISE (Custom):
- Workspaces ilimitados
- Conversaciones ilimitadas
- Documentos ilimitados
- Custom integrations
- Dedicated support
- SLA garantizado
```

**Tareas:**
- [ ] Crear productos en Stripe Dashboard
- [ ] Implementar Checkout Session
- [ ] Webhook handler para eventos (subscription.created, updated, deleted)
- [ ] Actualizar `billing_subscriptions` table
- [ ] Customer Portal para gestionar suscripción
- [ ] Lógica de limits por plan
- [ ] Mostrar usage en dashboard

**Estimación:** 3-4 días

---

### **5.2 - Billing UI**

**Archivos a crear:**
- `app/(dashboard)/dashboard/billing/page.tsx`
- `components/billing/PlanCard.tsx`
- `components/billing/UsageChart.tsx`

**Features:**
- Mostrar plan actual
- Usage bars (conversaciones, documentos, etc.)
- Upgrade/downgrade buttons
- Historial de facturas
- Botón a Customer Portal

**Estimación:** 2 días

---

## **FASE 6: ANALYTICS & MONITORING (Baja Prioridad)**

### **Objetivo:** Dashboard de métricas y monitoreo

### **6.1 - Analytics Backend**

**Métricas a trackear:**
- Conversaciones por día/semana/mes
- Response time promedio del chatbot
- Documentos subidos
- Top preguntas de usuarios
- Satisfaction score (feedback 👍/👎)
- Active users

**Tareas:**
- [ ] Crear tabla `analytics_events`
- [ ] Event tracking en frontend
- [ ] Aggregation queries
- [ ] API endpoints para datos agregados
- [ ] Configurar Vercel Analytics
- [ ] Configurar Vercel Speed Insights

**Estimación:** 2-3 días

---

### **6.2 - Analytics Dashboard**

**Archivos a crear:**
- `app/(dashboard)/dashboard/analytics/page.tsx`
- `components/analytics/MetricCard.tsx`
- `components/analytics/ConversationsChart.tsx`

**Features:**
- Cards con KPIs principales
- Gráficos de tendencias (Recharts)
- Tabla de top documentos
- Exportar a CSV

**Estimación:** 2 días

---

## **FASE 7: TESTING, DEPLOY & POLISH (Alta Prioridad Final)**

### **7.1 - Testing**

**Tareas:**
- [ ] Tests unitarios con Vitest (utils, services)
- [ ] Tests de integración (API routes)
- [ ] Tests E2E con Playwright
- [ ] Coverage mínimo 60%
- [ ] Configurar CI con GitHub Actions

**Estimación:** 3-4 días

---

### **7.2 - Deploy a Vercel Producción**

**Checklist:**
- [ ] Crear proyecto en Vercel
- [ ] Configurar environment variables
- [ ] Conectar dominio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Preview deployments en branches
- [ ] Configurar Vercel KV para Redis (si se usa)
- [ ] Edge Functions para APIs críticas (opcional)
- [ ] Monitoreo con Vercel Analytics
- [ ] Error tracking con Sentry (opcional)

**Estimación:** 1-2 días

---

### **7.3 - Polish & Performance**

**Tareas:**
- [ ] Lighthouse audit (Performance, Accessibility, SEO)
- [ ] Optimizar imágenes (next/image)
- [ ] Lazy loading de componentes pesados
- [ ] Bundle size analysis (`npm run analyze`)
- [ ] Remover console.logs
- [ ] Documentación README actualizada
- [ ] CHANGELOG.md
- [ ] USER_GUIDE.md para clientes

**Estimación:** 2 días

---

## 📊 **ESTIMACIÓN TOTAL**

| Fase | Duración Estimada | Prioridad |
|------|------------------|-----------|
| Fase 2: Chatbot RAG & Settings | 7-10 días | 🔴 Alta |
| Fase 3: Conversations & Realtime | 8-10 días | 🟡 Media |
| Fase 4: Channels Placeholder | 1 día | 🟢 Baja |
| Fase 5: Billing & Subscriptions | 5-6 días | 🟡 Media |
| Fase 6: Analytics & Monitoring | 4-5 días | 🟢 Baja |
| Fase 7: Testing & Deploy | 6-8 días | 🔴 Alta |
| **TOTAL** | **31-40 días** (~6-8 semanas) | |

---

## 🎯 **RECOMENDACIÓN PARA PRÓXIMA CONVERSACIÓN**

### **Empezar con: FASE 2.1 - Chatbot Backend**

**Por qué:**
- Es la feature más crítica (core del producto)
- La infraestructura RAG ya está lista (documentos funcionando)
- Desbloquea testing del flujo completo
- Genera valor inmediato para usuarios

**Orden sugerido para Fase 2:**
1. `api/chat/rag-search` → Búsqueda vectorial funcional
2. `api/chat/generate` → Generación de respuestas
3. `ChatInterface.tsx` → UI básica del chat
4. Settings page → Configuración del chatbot
5. Testing manual del flujo completo
6. Fix PDF processing si hay tiempo

**Entregables al final de Fase 2:**
- ✅ Chatbot funcional con RAG
- ✅ Configuración de chatbot desde settings
- ✅ UI profesional de chat con streaming
- ✅ Documentación de uso

---

## 📝 **NOTAS IMPORTANTES**

1. **APIs de Meta:** NO implementar WhatsApp, Instagram, Facebook hasta que estén disponibles. Solo crear placeholders.

2. **Redis Caching:** El cliente de Redis está configurado pero no se está usando. Implementar semantic caching en Fase 2.

3. **Security:** Revisar RLS policies antes de producción. workspace_members DEBE tener RLS habilitado.

4. **Performance:** Con Pinecone + Voyage AI, búsquedas son <500ms. Mantener este estándar.

5. **Costs:**
   - Voyage AI: $0.06/1M tokens (200M gratis inicialmente)
   - Pinecone: $70/mes (1 pod, 100K vectores)
   - OpenAI: $0.15/1M tokens (gpt-4o-mini)
   - Supabase: Free tier suficiente para MVP
   - Vercel: Free tier para desarrollo, Pro ($20/mes) para producción

6. **Prioridades:** FASE 2 → FASE 7 (deploy) → FASE 3 → FASE 5 → FASE 6 → FASE 4

---

## 🚀 **QUICK START PARA PRÓXIMA SESIÓN**

```bash
# 1. Crear nueva rama
git checkout -b feature/chatbot-rag

# 2. Verificar env vars
cat .env.local | grep -E "OPENAI|VOYAGE|PINECONE|ANTHROPIC"

# 3. Iniciar dev server
npm run dev

# 4. Crear primer endpoint
touch app/api/chat/rag-search/route.ts

# 5. Testear con curl
curl -X POST http://localhost:3000/api/chat/rag-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Qué dice sobre vivienda?", "workspaceId": "26ca2ee9-4e53-4a3d-acc3-9359cda25cb4"}'
```

**¡EMPEZAR CON FASE 2.1!** 🎉
