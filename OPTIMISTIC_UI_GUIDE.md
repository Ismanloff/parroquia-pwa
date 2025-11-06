# Guía de Optimistic UI con TanStack Query v5

## ¿Qué es Optimistic UI?

Optimistic UI es un patrón de diseño donde la interfaz se actualiza **inmediatamente** asumiendo que la operación del servidor tendrá éxito, en lugar de esperar la respuesta. Si falla, se revierten los cambios automáticamente.

### Beneficios

✅ **Experiencia instantánea** - Sin spinners de loading
✅ **Mejor UX** - La app se siente más rápida y fluida
✅ **Sincronización automática** - TanStack Query maneja el estado
✅ **Rollback automático** - Si falla, vuelve al estado anterior

---

## Configuración

### 1. QueryClient Setup

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
      throwOnError: false,
    },
  },
});
```

### 2. Provider Setup

```typescript
// components/Providers.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Uso: Hook Personalizado

### Ejemplo: Eliminar Documento

```typescript
// hooks/useOptimisticDocuments.ts
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export function useOptimisticDocuments(workspaceId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['documents', workspaceId];

  // Query: Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey,
    queryFn: () => fetchDocuments(workspaceId),
  });

  // Mutation: Delete with optimistic update
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,

    // 🚀 PASO 1: Actualización optimista
    onMutate: async (documentId) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey });

      // Guardar estado anterior (para rollback)
      const previousDocuments = queryClient.getQueryData(queryKey);

      // Actualizar cache inmediatamente
      queryClient.setQueryData(queryKey, (old) =>
        old?.filter((doc) => doc.id !== documentId)
      );

      // Retornar contexto para rollback
      return { previousDocuments };
    },

    // ❌ PASO 2: Rollback si falla
    onError: (err, documentId, context) => {
      // Restaurar estado anterior
      if (context?.previousDocuments) {
        queryClient.setQueryData(queryKey, context.previousDocuments);
      }
      toast.error('Error al eliminar');
    },

    // ✅ PASO 3: Confirmar éxito
    onSuccess: () => {
      toast.success('Documento eliminado');
    },

    // 🔄 PASO 4: Sincronizar con servidor
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    documents,
    deleteDocument: deleteMutation.mutate,
  };
}
```

---

## Uso en Componentes

### Ejemplo 1: Lista de Documentos

```typescript
'use client';

import { useOptimisticDocuments } from '@/hooks/useOptimisticDocuments';

export function DocumentsList() {
  const { documents, deleteDocument } = useOptimisticDocuments();

  return (
    <div>
      {documents.map((doc) => (
        <div key={doc.id}>
          <span>{doc.filename}</span>
          {/* ⚡ Eliminación instantánea sin loading */}
          <button onClick={() => deleteDocument(doc.id)}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Actualizar Preferencias

```typescript
import { useOptimisticPreferences } from '@/hooks/useOptimisticPreferences';

export function ThemeToggle() {
  const { updatePreferences } = useOptimisticPreferences();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    // ⚡ Cambio instantáneo sin esperar al servidor
    updatePreferences({
      userId: 'user-123',
      preferences: { theme },
    });
  };

  return (
    <button onClick={() => handleThemeChange('dark')}>
      Modo Oscuro
    </button>
  );
}
```

---

## Patrones Avanzados

### 1. Múltiples Queries Relacionadas

```typescript
onMutate: async (documentId) => {
  // Actualizar múltiples caches relacionadas
  await queryClient.cancelQueries({ queryKey: ['documents'] });
  await queryClient.cancelQueries({ queryKey: ['stats'] });

  // Actualizar ambas
  queryClient.setQueryData(['documents'], (old) => /* ... */);
  queryClient.setQueryData(['stats'], (old) => /* ... */);

  return { /* contexto para rollback */ };
};
```

### 2. Actualizaciones Complejas

```typescript
onMutate: async ({ documentId, newStatus }) => {
  const previousDocs = queryClient.getQueryData(queryKey);

  // Actualización compleja del estado
  queryClient.setQueryData(queryKey, (old) =>
    old?.map((doc) =>
      doc.id === documentId
        ? { ...doc, status: newStatus, updatedAt: new Date() }
        : doc
    )
  );

  return { previousDocs };
};
```

### 3. Usando Variables (Enfoque Simple)

Para casos donde solo se necesita mostrar el estado en UN lugar:

```typescript
const deleteMutation = useMutation({
  mutationFn: deleteDocument,
});

// En el componente:
const isOptimisticallyDeleted = deleteMutation.variables === doc.id;

return (
  <div style={{ opacity: isOptimisticallyDeleted ? 0.5 : 1 }}>
    {/* Contenido */}
  </div>
);
```

---

## Query Keys (Best Practices)

```typescript
// Centralizar query keys
export const queryKeys = {
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (workspaceId?: string) =>
      [...queryKeys.documents.lists(), workspaceId] as const,
    detail: (id: string) =>
      [...queryKeys.documents.all, 'detail', id] as const,
  },
};

// Uso:
useQuery({ queryKey: queryKeys.documents.list(workspaceId) });
```

---

## Cuándo Usar Optimistic UI

### ✅ Bueno para:

- Eliminar items
- Toggle switches (favoritos, likes)
- Actualizar preferencias
- Acciones simples de UI

### ❌ Evitar para:

- Operaciones complejas con validación del servidor
- Pagos o transacciones financieras
- Operaciones que no son reversibles
- Formularios con validación compleja

---

## Debugging

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Console Logs

```typescript
onMutate: async (data) => {
  console.log('[Optimistic] Updating...', data);
  // ...
},
onError: (err) => {
  console.error('[Optimistic] Failed, rolling back', err);
},
onSuccess: () => {
  console.log('[Optimistic] Success, synced with server');
},
```

---

## Recursos

- [TanStack Query Docs](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [React Query Examples](https://tanstack.com/query/v5/docs/framework/react/examples/optimistic-updates-cache)

---

## Archivos Creados

- ✅ `lib/queryClient.ts` - Configuración de QueryClient
- ✅ `hooks/useOptimisticDocuments.ts` - Hook para documentos
- ✅ `hooks/useOptimisticPreferences.ts` - Hook para preferencias
- ✅ `components/OptimisticUIDemo.tsx` - Componente demo
- ✅ `OPTIMISTIC_UI_GUIDE.md` - Esta guía

**Progreso: 11/17 tareas completadas (65%)**
