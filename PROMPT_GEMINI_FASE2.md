# 🚀 PROMPT PARA GEMINI 2.0 FLASH THINKING - FASE 2: MULTI-TENANCY

## 📋 CONTEXTO DEL PROYECTO

**Nombre:** Resply
**Descripción:** Plataforma SaaS B2B de chatbot con IA para atención al cliente 24/7
**Stack:** Next.js 16.0.0, React 19.2.0, TypeScript (strict mode), Supabase, Pinecone, OpenAI, Tailwind CSS
**Fase actual:** Fase 1 (Foundations & Cleanup) - ✅ 100% COMPLETADA
**Objetivo:** Implementar Fase 2 (Multi-tenancy Implementation) - Sistema multi-tenant completo con aislamiento de datos

---

## ✅ FASE 1 COMPLETADA - ESTADO ACTUAL

### Lo que YA está funcionando:

1. **Infraestructura Base**
   - ✅ Next.js 16.0.0 con React 19.2.0 y Turbopack
   - ✅ TypeScript strict mode habilitado (tsconfig.json configurado)
   - ✅ ESLint re-activado en builds
   - ✅ Deployment en Vercel configurado
   - ✅ Variables de entorno: `.env.local` con todas las keys

2. **Base de Datos Supabase**
   - ✅ 10 tablas creadas con RLS policies básicas
   - ✅ Tipos TypeScript generados (656 líneas en `types/database.ts`)
   - ✅ 2 funciones SQL: `get_user_workspaces()`, `has_workspace_permission()`
   - ✅ MCP Supabase funcionando correctamente

3. **Vector Database Pinecone**
   - ✅ Conectado (index: "saas", 1024 dims, 0 vectores)
   - ✅ Compatible con Voyage AI embeddings
   - ✅ Listo para namespaces multi-tenant (formato: `ws_{workspace_id}`)

4. **Limpieza y Branding**
   - ✅ 0% contenido religioso (APP PARRO eliminado)
   - ✅ 0% PWA (manifest.json, service workers eliminados)
   - ✅ Branding Resply completo (emails, templates, storage keys)
   - ✅ Favicons configurados (6 archivos en `/public`)

5. **UI Base**
   - ✅ Landing page profesional (`app/page.tsx`)
   - ✅ Dashboard layout creado (`app/(dashboard)/layout.tsx`)
   - ✅ 5 páginas de dashboard: workspaces, conversations, documents, analytics, settings
   - ✅ Dark mode implementado con persistencia localStorage

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS (SUPABASE)

### Tablas Existentes (10 tablas con RLS):

```sql
-- 1. WORKSPACES (Tenant principal)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  pinecone_namespace TEXT NOT NULL, -- Formato: ws_{workspace_id}
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature DECIMAL(2,1) DEFAULT 0.7,
  plan TEXT DEFAULT 'trial', -- trial, starter, professional, enterprise
  billing_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSPACE_MEMBERS (Usuarios por workspace)
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, user_id)
);

-- 3. WORKSPACE_SETTINGS (Configuración del chatbot)
CREATE TABLE workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  chatbot_name TEXT DEFAULT 'Asistente',
  welcome_message TEXT DEFAULT '¡Hola! ¿En qué puedo ayudarte?',
  language TEXT DEFAULT 'es',
  tone TEXT DEFAULT 'friendly',
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_instructions TEXT,
  business_hours JSONB,
  out_of_hours_message TEXT,
  handoff_conditions JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHANNELS (WhatsApp, Instagram, Facebook)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- whatsapp, instagram, facebook, web
  name TEXT,
  status TEXT DEFAULT 'disconnected', -- connected, disconnected, error
  credentials JSONB, -- Tokens, secrets, etc.
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  whatsapp_access_token TEXT,
  whatsapp_webhook_verify_token TEXT,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  error_message TEXT
);

-- 5. CONVERSATIONS (Conversaciones con clientes)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_metadata JSONB,
  status TEXT DEFAULT 'open', -- open, closed, assigned
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 6. MESSAGES (Mensajes de conversaciones)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- customer, agent, ai
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, audio, video, document
  media_url TEXT,
  ai_response BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2),
  sources_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DOCUMENTS (Base de conocimientos)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, error
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  chunk_count INT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DOCUMENT_CHUNKS (Chunks vectorizados)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  pinecone_id TEXT NOT NULL, -- ID del vector en Pinecone
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BILLING_SUBSCRIPTIONS (Suscripciones Stripe)
CREATE TABLE billing_subscriptions (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL, -- starter, professional, enterprise
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  conversations_limit INT NOT NULL,
  conversations_used INT DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ONBOARDING_PROGRESS (Progreso del onboarding)
CREATE TABLE onboarding_progress (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  completed_steps TEXT[],
  skipped_steps TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Funciones SQL Existentes:

```sql
-- get_user_workspaces(user_uuid UUID)
-- Retorna: [{workspace_id, role}, ...]
-- Uso: Obtener todos los workspaces de un usuario con su rol

-- has_workspace_permission(user_uuid UUID, workspace_uuid UUID, required_role TEXT)
-- Retorna: BOOLEAN
-- Uso: Verificar si un usuario tiene permisos en un workspace
```

---

## 🎯 OBJETIVOS DE LA FASE 2: MULTI-TENANCY

### Objetivo Principal:
Implementar un sistema multi-tenant completo donde:
- Cada workspace es un tenant aislado
- Los usuarios pueden pertenecer a múltiples workspaces
- Todos los datos están aislados por workspace_id
- RLS policies garantizan seguridad a nivel de base de datos
- Pinecone usa namespaces separados (formato: `ws_{workspace_id}`)

### Sub-objetivos:
1. ✅ Sistema de autenticación multi-tenant
2. ✅ Selector de workspace en el header
3. ✅ Middleware para detectar workspace activo
4. ✅ RLS policies completas en todas las tablas
5. ✅ Context API para estado del workspace
6. ✅ Página de gestión de workspaces
7. ✅ Página de creación de workspace
8. ✅ Sistema de invitaciones por email
9. ✅ Gestión de miembros del workspace
10. ✅ Aislamiento de vectores en Pinecone

---

## 📝 CHECKLIST DETALLADA - 20 TAREAS

### 🔐 SEGURIDAD Y RLS (Tareas 1-5)

#### 1. Crear RLS Policies para `workspaces`
**Archivo:** Supabase Dashboard → SQL Editor o migración SQL
**Descripción:** Los usuarios solo pueden ver workspaces donde son miembros

```sql
-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: Ver workspaces donde soy miembro
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Crear workspace (todos los usuarios autenticados)
CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Actualizar workspace (solo owners/admins)
CREATE POLICY "Owners and admins can update workspaces"
  ON workspaces FOR UPDATE
  USING (
    has_workspace_permission(auth.uid(), id, 'admin')
  );

-- Policy: Eliminar workspace (solo owners)
CREATE POLICY "Owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (
    has_workspace_permission(auth.uid(), id, 'owner')
  );
```

#### 2. Crear RLS Policies para `workspace_members`
```sql
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON workspace_members FOR ALL
  USING (
    has_workspace_permission(auth.uid(), workspace_id, 'admin')
  );
```

#### 3. Crear RLS Policies para `conversations`
```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace conversations"
  ON conversations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### 4. Crear RLS Policies para `messages`
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages in their workspace"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

#### 5. Crear RLS Policies para `documents` y `document_chunks`
```sql
-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace documents"
  ON documents FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Document chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace chunks"
  ON document_chunks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

---

### 🏗️ INFRAESTRUCTURA (Tareas 6-10)

#### 6. Crear Context API para Workspace
**Archivo:** `lib/contexts/WorkspaceContext.tsx`
**Descripción:** Context global para manejar el workspace activo

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface WorkspaceContextValue {
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // TODO: Implementar lógica aquí
  // 1. Fetch workspaces del usuario al montar
  // 2. Leer workspace activo desde localStorage o URL
  // 3. Implementar switchWorkspace() con persistencia
  // 4. Implementar refreshWorkspaces()

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaces, isLoading, switchWorkspace, refreshWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
```

#### 7. Crear Middleware para Workspace Detection
**Archivo:** `proxy.ts` (Next.js 16 usa "proxy" en vez de "middleware")
**Descripción:** Detectar workspace activo desde URL o subdomain

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detectar workspace desde subdomain o path
  // Ejemplo: acme.resply.com → workspace_slug = "acme"
  // Ejemplo: resply.com/w/acme → workspace_slug = "acme"

  const hostname = request.headers.get('host') || '';
  const workspaceSlug = extractWorkspaceSlug(hostname, pathname);

  if (workspaceSlug) {
    // Agregar header con workspace slug
    const response = NextResponse.next();
    response.headers.set('x-workspace-slug', workspaceSlug);
    return response;
  }

  return NextResponse.next();
}

function extractWorkspaceSlug(hostname: string, pathname: string): string | null {
  // TODO: Implementar lógica de extracción
  // 1. Subdomain: acme.resply.com → "acme"
  // 2. Path: /w/acme/dashboard → "acme"
  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 8. Crear Hook useCurrentWorkspace
**Archivo:** `lib/hooks/useCurrentWorkspace.ts`
**Descripción:** Hook para obtener workspace activo con validación

```typescript
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useCurrentWorkspace() {
  const { workspace, workspaces, isLoading } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    // Redirigir a selector de workspace si no hay workspace activo
    if (!isLoading && !workspace && workspaces.length > 0) {
      router.push('/workspaces');
    }
  }, [workspace, workspaces, isLoading, router]);

  return { workspace, workspaces, isLoading };
}
```

#### 9. Crear Servicio de Workspace
**Archivo:** `lib/services/workspace.ts`
**Descripción:** Funciones para gestionar workspaces

```typescript
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];

export const workspaceService = {
  // Obtener workspaces del usuario
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .rpc('get_user_workspaces', { user_uuid: userId });

    if (error) throw error;

    // Fetch complete workspace data
    const workspaceIds = data.map(w => w.workspace_id);
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds);

    if (wsError) throw wsError;
    return workspaces || [];
  },

  // Crear nuevo workspace
  async createWorkspace(data: WorkspaceInsert, userId: string): Promise<Workspace> {
    // 1. Crear workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // 2. Agregar usuario como owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    // 3. Crear workspace settings por defecto
    const { error: settingsError } = await supabase
      .from('workspace_settings')
      .insert({ workspace_id: workspace.id });

    if (settingsError) throw settingsError;

    return workspace;
  },

  // Verificar permisos
  async hasPermission(userId: string, workspaceId: string, requiredRole: 'owner' | 'admin' | 'member'): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_workspace_permission', {
        user_uuid: userId,
        workspace_uuid: workspaceId,
        required_role: requiredRole,
      });

    if (error) throw error;
    return data || false;
  },

  // Invitar usuario
  async inviteMember(workspaceId: string, email: string, role: 'admin' | 'member'): Promise<void> {
    // TODO: Implementar
    // 1. Verificar si el email existe en auth.users
    // 2. Si existe, agregar a workspace_members
    // 3. Si no existe, crear invitación pendiente y enviar email
  },
};
```

#### 10. Crear Selector de Workspace en Header
**Archivo:** `components/WorkspaceSwitcher.tsx`
**Descripción:** Dropdown para cambiar entre workspaces

```typescript
'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function WorkspaceSwitcher() {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {workspace ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
              {workspace.name[0].toUpperCase()}
            </div>
            <span className="font-medium">{workspace.name}</span>
            <ChevronDown className="w-4 h-4" />
          </>
        ) : (
          <span>Seleccionar workspace</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                switchWorkspace(ws.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
                {ws.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-left">{ws.name}</span>
              {workspace?.id === ws.id && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <Link
            href="/workspaces/new"
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span>Crear workspace</span>
          </Link>
        </div>
      )}
    </div>
  );
}
```

---

### 📄 PÁGINAS Y RUTAS (Tareas 11-15)

#### 11. Crear Página de Listado de Workspaces
**Archivo:** `app/(dashboard)/workspaces/page.tsx`
**Descripción:** Página para listar y gestionar workspaces del usuario

```typescript
'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { Plus, Settings, Users } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacesPage() {
  const { workspaces, workspace, switchWorkspace } = useWorkspace();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Workspaces</h1>
        <Link
          href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Crear workspace
        </Link>
      </div>

      <div className="grid gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {ws.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{ws.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">/{ws.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchWorkspace(ws.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {workspace?.id === ws.id ? 'Activo' : 'Seleccionar'}
                </button>
                <Link
                  href={`/workspaces/${ws.id}/settings`}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 12. Crear Página de Creación de Workspace
**Archivo:** `app/(dashboard)/workspaces/new/page.tsx`
**Descripción:** Formulario para crear nuevo workspace

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceService } from '@/lib/services/workspace';
import { supabase } from '@/lib/supabase';

export default function NewWorkspacePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const workspace = await workspaceService.createWorkspace({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        pinecone_namespace: `ws_${crypto.randomUUID().split('-')[0]}`,
      }, user.data.user.id);

      router.push(`/dashboard?workspace=${workspace.id}`);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Error al crear workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Workspace</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre del Workspace</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Mi Empresa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Slug (URL)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="mi-empresa"
          />
          <p className="text-sm text-gray-600 mt-1">
            Si dejas en blanco, se generará automáticamente
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creando...' : 'Crear Workspace'}
        </button>
      </form>
    </div>
  );
}
```

#### 13. Crear Página de Configuración de Workspace
**Archivo:** `app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`
**Descripción:** Configuración del workspace (nombre, slug, plan, etc.)

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    // TODO: Fetch workspace data
  }, [workspaceId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Configuración del Workspace</h1>
      {/* TODO: Implementar formulario de configuración */}
    </div>
  );
}
```

#### 14. Crear Página de Gestión de Miembros
**Archivo:** `app/(dashboard)/workspaces/[workspaceId]/members/page.tsx`
**Descripción:** Listar, invitar y gestionar miembros del workspace

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Mail, UserPlus, Trash2 } from 'lucide-react';

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar invitación
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Miembros del Workspace</h1>

      {/* Formulario de invitación */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
        <h2 className="font-semibold mb-4">Invitar Miembro</h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Mail className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lista de miembros */}
      {/* TODO: Implementar lista */}
    </div>
  );
}
```

#### 15. Actualizar Dashboard Layout con WorkspaceSwitcher
**Archivo:** `app/(dashboard)/layout.tsx`
**Descripción:** Agregar WorkspaceSwitcher al header del dashboard

```typescript
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Resply</h1>
              <WorkspaceSwitcher />
            </div>
            {/* TODO: Agregar UserMenu */}
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
```

---

### 🔌 INTEGRACIÓN PINECONE (Tareas 16-17)

#### 16. Actualizar Vector Service con Namespace
**Archivo:** `lib/services/vector.ts` (crear si no existe)
**Descripción:** Agregar soporte para namespaces de Pinecone

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export const vectorService = {
  // Upsert vectors con namespace de workspace
  async upsertVectors(workspaceId: string, vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }>) {
    const namespace = `ws_${workspaceId}`;
    await index.namespace(namespace).upsert(vectors);
  },

  // Query vectors con namespace de workspace
  async queryVectors(workspaceId: string, queryVector: number[], topK: number = 5) {
    const namespace = `ws_${workspaceId}`;
    const results = await index.namespace(namespace).query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });
    return results.matches || [];
  },

  // Eliminar namespace completo (cuando se elimina workspace)
  async deleteNamespace(workspaceId: string) {
    const namespace = `ws_${workspaceId}`;
    await index.namespace(namespace).deleteAll();
  },
};
```

#### 17. Actualizar Document Processing con Workspace
**Archivo:** `app/api/documents/process/route.ts` (actualizar si existe)
**Descripción:** Procesar documentos con namespace del workspace

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { vectorService } from '@/lib/services/vector';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { documentId, workspaceId } = await req.json();

    // 1. Obtener documento de Supabase
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    // 2. Descargar archivo
    // TODO: Implementar descarga del file_url

    // 3. Extraer texto y dividir en chunks
    // TODO: Implementar chunking

    // 4. Generar embeddings
    // TODO: Implementar embeddings con OpenAI/Voyage

    // 5. Upsert a Pinecone con namespace del workspace
    await vectorService.upsertVectors(workspaceId, [
      // vectors aquí
    ]);

    // 6. Guardar chunks en Supabase
    // TODO: Insert en document_chunks

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

### 🧪 TESTING Y VALIDACIÓN (Tareas 18-20)

#### 18. Crear Tests para Workspace Service
**Archivo:** `lib/services/__tests__/workspace.test.ts`
**Descripción:** Unit tests para workspace service

```typescript
import { describe, it, expect, vi } from 'vitest';
import { workspaceService } from '../workspace';

describe('WorkspaceService', () => {
  it('should create workspace with owner member', async () => {
    // TODO: Implementar test
  });

  it('should verify user permissions correctly', async () => {
    // TODO: Implementar test
  });

  it('should list user workspaces', async () => {
    // TODO: Implementar test
  });
});
```

#### 19. Validar RLS Policies
**Descripción:** Script de validación de RLS policies
**Archivo:** `scripts/validate-rls.mjs`

```javascript
#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function validateRLS() {
  console.log('🔒 Validando RLS policies...\n');

  // Test 1: Usuario solo ve sus workspaces
  console.log('Test 1: Usuario solo ve sus propios workspaces');
  // TODO: Implementar validación

  // Test 2: Usuario no puede ver conversaciones de otros workspaces
  console.log('Test 2: Aislamiento de conversaciones');
  // TODO: Implementar validación

  // Test 3: Usuario no puede eliminar workspace de otro
  console.log('Test 3: Protección contra eliminación no autorizada');
  // TODO: Implementar validación

  console.log('\n✅ Todas las validaciones pasaron');
}

validateRLS().catch(console.error);
```

#### 20. Crear Checklist de QA Manual
**Archivo:** `PHASE2_QA_CHECKLIST.md`

```markdown
# ✅ Checklist de QA - Fase 2: Multi-Tenancy

## Autenticación y Workspaces
- [ ] Usuario puede crear nuevo workspace
- [ ] Usuario puede ver solo sus workspaces
- [ ] Usuario puede cambiar entre workspaces
- [ ] Workspace activo se persiste en localStorage
- [ ] Selector de workspace muestra todos los workspaces del usuario

## Permisos y Roles
- [ ] Owner puede invitar admins y members
- [ ] Admin puede invitar members
- [ ] Member NO puede invitar usuarios
- [ ] Owner puede eliminar workspace
- [ ] Admin NO puede eliminar workspace

## Aislamiento de Datos
- [ ] Conversaciones solo visibles en su workspace
- [ ] Documentos solo visibles en su workspace
- [ ] Mensajes solo visibles en su workspace
- [ ] Pinecone usa namespace correcto (ws_{workspace_id})

## Invitaciones
- [ ] Usuario puede invitar por email
- [ ] Email de invitación se envía correctamente
- [ ] Usuario invitado recibe email
- [ ] Usuario puede aceptar invitación
- [ ] Usuario aparece en lista de miembros

## Edge Cases
- [ ] ¿Qué pasa si usuario no tiene workspaces? → Redirige a /workspaces/new
- [ ] ¿Qué pasa si workspace_id es inválido? → Error 404
- [ ] ¿Qué pasa si usuario pierde permisos? → Redirige a /workspaces
- [ ] ¿Qué pasa al eliminar workspace? → Vectores en Pinecone se eliminan
```

---

## 📚 ARCHIVOS CLAVE A REVISAR

### Ya existentes (para contexto):
1. `types/database.ts` - Tipos TypeScript completos (656 líneas)
2. `lib/supabase.ts` - Cliente de Supabase configurado
3. `app/(dashboard)/layout.tsx` - Layout del dashboard
4. `app/page.tsx` - Landing page
5. `.env.local` - Variables de entorno

### A crear:
1. `lib/contexts/WorkspaceContext.tsx`
2. `lib/hooks/useCurrentWorkspace.ts`
3. `lib/services/workspace.ts`
4. `lib/services/vector.ts`
5. `components/WorkspaceSwitcher.tsx`
6. `app/(dashboard)/workspaces/page.tsx`
7. `app/(dashboard)/workspaces/new/page.tsx`
8. `app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`
9. `app/(dashboard)/workspaces/[workspaceId]/members/page.tsx`
10. `proxy.ts` (middleware)

---

## 🚨 CONSIDERACIONES IMPORTANTES

### Seguridad:
1. **RLS is CRITICAL** - Todas las tablas DEBEN tener RLS habilitado
2. **Validar workspace_id** - SIEMPRE validar que el usuario tenga acceso
3. **No confiar en el cliente** - Validar permisos en el servidor
4. **Pinecone namespaces** - NUNCA mezclar vectores entre workspaces

### Performance:
1. **Indexar workspace_id** - Crear índices en todas las FK de workspace_id
2. **Cachear workspaces** - Usar React Query o SWR para cachear lista de workspaces
3. **Lazy load** - No cargar todos los miembros hasta que sea necesario

### UX:
1. **Persistencia** - Guardar workspace activo en localStorage
2. **Loading states** - Mostrar skeletons mientras carga
3. **Error handling** - Mensajes claros cuando falta permiso
4. **Onboarding** - Guiar al usuario al crear su primer workspace

---

## 🎯 CRITERIOS DE ACEPTACIÓN

La Fase 2 está completa cuando:

1. ✅ Usuario puede crear workspaces
2. ✅ Usuario puede cambiar entre workspaces con el selector
3. ✅ Todas las tablas tienen RLS policies funcionales
4. ✅ Usuario puede invitar miembros por email
5. ✅ Miembros pueden ser listados y gestionados
6. ✅ Conversaciones, documentos y mensajes están aislados por workspace
7. ✅ Pinecone usa namespaces separados (`ws_{workspace_id}`)
8. ✅ Tests básicos de RLS pasan
9. ✅ QA manual checklist completo
10. ✅ Workspace activo persiste entre recargas de página

---

## 📖 RECURSOS Y DOCUMENTACIÓN

### Supabase:
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

### Pinecone:
- Namespaces: https://docs.pinecone.io/docs/namespaces
- Node.js SDK: https://docs.pinecone.io/docs/node-client

### Next.js 16:
- Middleware (proxy): https://nextjs.org/docs/app/building-your-application/routing/middleware
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---

## 🤖 INSTRUCCIONES PARA GEMINI

**Modo de trabajo:**
1. Lee TODA esta documentación antes de empezar
2. Usa el "thinking mode" para planificar la arquitectura
3. Implementa las 20 tareas EN ORDEN (1 → 20)
4. Después de cada tarea, valida que funcione antes de continuar
5. Commitea después de cada sub-fase (tareas 1-5, 6-10, 11-15, 16-17, 18-20)
6. Al final, ejecuta el checklist de QA completo

**Estilo de código:**
- TypeScript strict mode (NO usar `any`, usar tipos completos)
- Componentes funcionales con hooks
- Nombres descriptivos en español para UI, inglés para código
- Comentarios en español para lógica compleja
- Usar `async/await` en vez de `.then()`
- Manejar TODOS los errores con try/catch

**Prioridades:**
1. **SEGURIDAD** - RLS policies son lo más importante
2. **AISLAMIENTO** - Datos NUNCA deben mezclarse entre workspaces
3. **UX** - El cambio de workspace debe ser instantáneo
4. **TESTING** - Validar que RLS funciona correctamente

---

## 📞 CONTACTO Y SIGUIENTE FASE

**Estado actual:** Fase 1 completa, listo para Fase 2
**Duración estimada Fase 2:** 2-3 semanas (25-35 horas)
**Siguiente fase:** Fase 3 - WhatsApp Business API Integration

**¿Dudas?** Consulta `MIGRATION_TODO.md` para ver el roadmap completo de 7 fases.

---

**Fecha de creación:** 3 de Noviembre 2025
**Última actualización:** 3 de Noviembre 2025
**Estado:** Listo para implementación en Gemini 2.0 Flash Thinking
