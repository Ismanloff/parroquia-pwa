# 🧹 PROMPT PARA CLAUDE - CLEANUP Y COMPLETAR FASE 2

## 📋 CONTEXTO DEL PROYECTO

**Proyecto:** Resply - Plataforma SaaS B2B de chatbot con IA
**Estado actual:** Fase 2 (Multi-tenancy) completada al 90%
**Tu misión:** Limpiar TypeScript warnings y completar funcionalidades pendientes

---

## ✅ LO QUE YA ESTÁ FUNCIONANDO

### Infraestructura Multi-tenant (100% funcional):
- ✅ Context API: `lib/contexts/WorkspaceContext.tsx` (97 líneas)
- ✅ Services: `lib/services/workspace.ts` (80 líneas), `lib/services/vector.ts` (42 líneas)
- ✅ Hooks: `lib/hooks/useCurrentWorkspace.ts` (17 líneas)
- ✅ Middleware: `proxy.ts` (40 líneas)
- ✅ Component: `components/WorkspaceSwitcher.tsx` (62 líneas)
- ✅ RLS Policies: 40+ policies aplicadas en Supabase
- ✅ Índices de performance: 7 índices creados
- ✅ Pinecone namespaces: Formato `ws_{workspace_id}`

### Páginas funcionando:
- ✅ `/dashboard/workspaces` - Listado de workspaces
- ✅ `/dashboard/workspaces/new` - Crear workspace (100% funcional)
- ⚠️ `/dashboard/workspaces/[workspaceId]/settings` - ESQUELETO (completar)
- ⚠️ `/dashboard/workspaces/[workspaceId]/members` - ESQUELETO (completar)

---

## 🎯 TU MISIÓN: 3 TAREAS

### ✅ TAREA 1: Limpiar TypeScript Warnings (30 min)

**Archivos con errores:**

#### 1.1 Variables no usadas (TS6133)
Estos son fáciles, solo elimina los imports no usados:

```typescript
// app/(dashboard)/dashboard/analytics/page.tsx
// ELIMINAR: BarChart3, Calendar (línea 4)

// app/(dashboard)/dashboard/conversations/page.tsx
// ELIMINAR: Filter, Building2 (línea 4)

// app/(dashboard)/dashboard/documents/page.tsx
// ELIMINAR: Plus, File, Folder (línea 4)

// app/(dashboard)/dashboard/settings/page.tsx
// ELIMINAR: User, Mail, Globe (línea 4)

// app/(dashboard)/workspaces/[workspaceId]/members/page.tsx
// ELIMINAR: UserPlus, Trash2 (línea 5)

// app/(dashboard)/workspaces/page.tsx
// ELIMINAR: Users (línea 4)

// Y otros archivos listados en errores de compilación
```

#### 1.2 Tabla `profiles` faltante en database types
**Problema:** Auth APIs usan `.from('profiles')` pero no existe en `types/database.ts`

**Solución:**
1. Verifica si existe tabla `profiles` en Supabase
2. Si SÍ existe: Regenera types con MCP Supabase
3. Si NO existe: Elimina referencias a `profiles` en:
   - `app/api/auth/forgot-password/route.ts:57`
   - `app/api/auth/login/route.ts:64`
   - `app/api/auth/verify-token/route.ts:36`

#### 1.3 Arreglar `possibly undefined` en workspaces/page.tsx
**Archivo:** `app/(dashboard)/workspaces/page.tsx:32`

```typescript
// ANTES (línea 32):
{ws.name[0].toUpperCase()}

// DESPUÉS:
{ws.name?.[0]?.toUpperCase() || 'W'}
```

---

### ✅ TAREA 2: Completar Página de Settings (60 min)

**Archivo:** `app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`

**Estado actual:** Solo tiene estructura básica (23 líneas)

**Implementar:**

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { useCurrentWorkspace } from '@/lib/hooks/useCurrentWorkspace';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceSettings = Database['public']['Tables']['workspace_settings']['Row'];

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { workspace: currentWorkspace } = useCurrentWorkspace();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [language, setLanguage] = useState('es');
  const [tone, setTone] = useState('friendly');

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    if (!supabase || !workspaceId) return;

    try {
      // Fetch workspace
      const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (wsError) throw wsError;
      setWorkspace(wsData);
      setName(wsData.name);
      setSlug(wsData.slug);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (settingsError) throw settingsError;
      setSettings(settingsData);
      setChatbotName(settingsData.chatbot_name || '');
      setWelcomeMessage(settingsData.welcome_message || '');
      setLanguage(settingsData.language || 'es');
      setTone(settingsData.tone || 'friendly');
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!supabase || !workspaceId) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name, slug })
        .eq('id', workspaceId);

      if (error) throw error;
      alert('Workspace actualizado exitosamente');
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert('Error al actualizar workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!supabase || !workspaceId) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('workspace_settings')
        .update({
          chatbot_name: chatbotName,
          welcome_message: welcomeMessage,
          language,
          tone,
        })
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      alert('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error al actualizar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Configuración del Workspace</h1>

      {/* Sección: Workspace General */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Información General</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Workspace</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              URL: resply.com/w/{slug}
            </p>
          </div>

          <button
            onClick={handleSaveWorkspace}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Workspace'}
          </button>
        </div>
      </div>

      {/* Sección: Chatbot Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Configuración del Chatbot</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Chatbot</label>
            <input
              type="text"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Asistente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensaje de Bienvenida</label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="¡Hola! ¿En qué puedo ayudarte?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tono</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="friendly">Amigable</option>
                <option value="professional">Profesional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Sección: Zona Peligrosa */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-4">Zona Peligrosa</h2>

        <div className="space-y-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Eliminar este workspace borrará permanentemente todos los datos asociados:
            conversaciones, documentos, configuraciones, etc.
          </p>

          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => alert('TODO: Implementar eliminación de workspace')}
          >
            Eliminar Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Verificar que funcione:**
1. Navega a `/dashboard/workspaces/[id]/settings`
2. Verifica que carga los datos del workspace
3. Modifica nombre y guarda
4. Verifica que se actualiza en Supabase

---

### ✅ TAREA 3: Completar Página de Miembros (90 min)

**Archivo:** `app/(dashboard)/workspaces/[workspaceId]/members/page.tsx`

**Estado actual:** Solo tiene estructura básica (35 líneas)

**Implementar:**

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'] & {
  user_email?: string;
  user_name?: string;
};

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    if (!supabase || !workspaceId) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // TODO: Join con auth.users para obtener email y nombre
      // Por ahora solo mostramos user_id
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !workspaceId || !inviteEmail) return;

    setIsInviting(true);

    try {
      // TODO: Implementar lógica completa de invitación
      // 1. Verificar si email existe en auth.users
      // 2. Si existe, agregar a workspace_members
      // 3. Si no existe, crear invitación pendiente y enviar email

      // Por ahora, solo agregamos directamente (requiere que el usuario exista)
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users?.find(u => u.email === inviteEmail);

      if (!user) {
        alert('Usuario no encontrado. Debe registrarse primero.');
        return;
      }

      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: inviteRole,
          accepted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setInviteEmail('');
      setInviteRole('member');
      fetchMembers();
      alert('Miembro agregado exitosamente');
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Error al invitar miembro');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!supabase || !workspaceId) return;
    if (!confirm('¿Eliminar este miembro del workspace?')) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMembers();
      alert('Miembro eliminado');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error al eliminar miembro');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!supabase || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMembers();
      alert('Rol actualizado');
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Error al cambiar rol');
    }
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Miembros del Workspace</h1>

      {/* Formulario de invitación */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invitar Miembro
        </h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {isInviting ? 'Invitando...' : 'Invitar'}
          </button>
        </form>
      </div>

      {/* Lista de miembros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Miembros Actuales ({members.length})</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <div key={member.user_id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{member.user_email || member.user_id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {member.accepted_at ? 'Aceptado' : 'Pendiente'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>

                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay miembros en este workspace
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Verificar que funcione:**
1. Navega a `/dashboard/workspaces/[id]/members`
2. Verifica que lista los miembros actuales
3. Intenta invitar un usuario (debe existir en auth.users)
4. Verifica que puedes cambiar roles
5. Verifica que puedes eliminar miembros

---

## 📁 ARCHIVOS DEL PROYECTO

### Archivos que LEERÁS (para contexto):
- `types/database.ts` - Tipos de Supabase (656 líneas)
- `lib/supabase.ts` - Cliente de Supabase
- `lib/contexts/WorkspaceContext.tsx` - Context API
- `lib/services/workspace.ts` - Service de workspaces
- `PHASE2_COMPLETED.md` - Documentación de Fase 2

### Archivos que MODIFICARÁS:
- `app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx` - COMPLETAR
- `app/(dashboard)/workspaces/[workspaceId]/members/page.tsx` - COMPLETAR
- Archivos con TypeScript warnings (eliminar imports no usados)

### Archivos de referencia (NO modificar):
- `app/(dashboard)/workspaces/page.tsx` - Ejemplo de página funcional
- `app/(dashboard)/workspaces/new/page.tsx` - Ejemplo de formulario

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Seguridad:
- ✅ RLS policies ya están aplicadas en Supabase
- ✅ Solo owners/admins pueden modificar settings (verificado por RLS)
- ✅ Solo owners/admins pueden invitar/eliminar miembros (verificado por RLS)
- ⚠️ NO implementes lógica de permisos en cliente, confía en RLS

### UX:
- Muestra loading states mientras carga
- Muestra mensajes de éxito/error
- Deshabilita botones mientras se guarda
- Usa `alert()` por ahora (más adelante se cambiará a toast notifications)

### TypeScript:
- SIEMPRE usa strict mode
- NO uses `any`
- Verifica nulls con `?.` y `??`
- Usa tipos de `Database` para todo

---

## 🧪 TESTING

### Después de completar, verifica:

**Settings Page:**
1. [ ] Carga datos del workspace correctamente
2. [ ] Actualiza nombre del workspace
3. [ ] Actualiza slug del workspace
4. [ ] Actualiza configuración del chatbot
5. [ ] Muestra loading state
6. [ ] Muestra errores si falla

**Members Page:**
1. [ ] Lista miembros existentes
2. [ ] Invita nuevo miembro (si existe en auth.users)
3. [ ] Cambia rol de un miembro
4. [ ] Elimina un miembro
5. [ ] No permite eliminar owner
6. [ ] Muestra loading state

---

## 📊 MÉTRICAS DE ÉXITO

Al terminar:
- [ ] 0 errores TypeScript críticos
- [ ] < 5 warnings TypeScript (solo variables no usadas opcionales)
- [ ] Settings page 100% funcional
- [ ] Members page 90% funcional (invitaciones por email como TODO)

---

## 🚀 PRÓXIMOS PASOS (NO HAGAS ESTO)

Esto es para DESPUÉS, NO lo implementes ahora:
- Sistema de invitaciones por email con Resend
- Tabla de invitaciones pendientes
- Confirmación de eliminación de workspace
- Portal de billing integrado

---

## 📞 AYUDA

Si tienes dudas:
1. Lee `PHASE2_COMPLETED.md` para contexto completo
2. Lee `types/database.ts` para ver estructura de datos
3. Mira `app/(dashboard)/workspaces/new/page.tsx` como ejemplo de formulario funcional
4. Confía en las RLS policies - NO implementes lógica de permisos en cliente

---

**Tiempo estimado:** 2-3 horas
**Dificultad:** Media (solo CRUD básico con Supabase)
**Prioridad:** Alta (deja el proyecto production-ready)

¡Éxito! 🚀
