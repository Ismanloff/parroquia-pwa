# Análisis Completo: Lo que Falta en la Migración PWA

## ✅ Ya Implementado

1. **Estructura básica:**
   - ✅ Tabs de navegación (Inicio, Calendario, Chat)
   - ✅ Layout principal con tab navigation
   - ✅ Sistema de ruteo básico

2. **Backend API:**
   - ✅ `/api/calendar/events` (Google Calendar)
   - ✅ `/api/chat` (OpenAI Agents)
   - ✅ Endpoints básicos de santos y evangelio (pero sin Supabase)

3. **Componentes básicos:**
   - ✅ Home (con santo y evangelio básico)
   - ✅ Calendar (vistas semanal y mensual)
   - ✅ Chat (básico)
   - ✅ TabNavigation

## ❌ Falta Implementar

### 1. **Configuración de Supabase** (CRÍTICO)

**Problema:** Los endpoints de santos y evangelio usan datos hardcodeados en lugar de Supabase.

**Archivos necesarios:**

```
/lib/supabase.ts          → Cliente de Supabase para Next.js
/types/database.ts        → Tipos de la base de datos
```

**Cambios necesarios:**

- Actualizar `/api/saints/today/route.ts` para usar Supabase
- Actualizar `/api/gospel/today/route.ts` para usar Supabase
- Crear cliente Supabase compatible con Next.js (no React Native)

### 2. **Librerías y Utilidades Faltantes**

**A) lib/dayjs.ts**

```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const getTodayDate = () => dayjs().tz('Europe/Madrid').format('YYYY-MM-DD');
export const formatDate = (date: Date | string, format: string) =>
  dayjs(date).tz('Europe/Madrid').format(format);
```

**B) lib/liturgicalColors.ts**

- Función `getLiturgicalSeason()` para obtener color litúrgico del día
- Tiempo Ordinario, Adviento, Navidad, Cuaresma, Pascua, etc.

### 3. **Componentes UI Faltantes**

En el proyecto original hay componentes UI reutilizables que faltan:

```
/components/ui/Button.tsx      → Botones con variantes (primary, outline, ghost)
/components/ui/Card.tsx        → Tarjetas con estilos consistentes
/components/ui/Loading.tsx     → Spinner de carga
/components/ui/EmptyState.tsx  → Estado vacío con icono y mensaje
/components/ui/Input.tsx       → Inputs de formulario
```

### 4. **Funcionalidades del Calendario que Faltan**

**A) Interacción en Vista Mensual** (CRÍTICO)

```typescript
// ACTUAL: Solo selecciona el día
<button onClick={() => day && setSelectedDay(day)}>

// DEBERÍA: Mostrar eventos del día automáticamente
// Al hacer clic en un día debería:
// 1. Seleccionar el día visualmente
// 2. Mostrar lista de eventos de ese día abajo
// 3. Scroll automático a la lista
```

**B) Funcionalidades Adicionales del Calendario Original:**

- Pull-to-refresh para recargar eventos
- Auto-refresh cada 2 minutos
- Badge de "HOY" y "MAÑANA" en eventos
- Timeline visual en vista semanal
- Colores litúrgicos en header

**C) Modal de Evento Mejorado:**
El modal actual es básico. En el original tiene:

- Botones de acción (Compartir, Agregar a calendario)
- Animación de entrada desde abajo
- Blur del fondo
- Mejor presentación de información

### 5. **Santo y Evangelio con Supabase**

**Actual:** Datos hardcodeados con fallback genérico

**Debería:**

1. Fetch desde Supabase tabla `saints` y `gospels`
2. Usar `getTodayDate()` con timezone Europe/Madrid
3. Mostrar datos reales de la base de datos
4. Fallback elegante si no hay datos

**Schema de Supabase:**

```sql
CREATE TABLE saints (
  id uuid PRIMARY KEY,
  date date UNIQUE NOT NULL,
  name text NOT NULL,
  bio text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE gospels (
  id uuid PRIMARY KEY,
  date date UNIQUE NOT NULL,
  passage text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

### 6. **Variables de Entorno**

**Falta crear `.env` en la raíz** (para que Next.js las detecte):

```bash
# .env
NEXT_PUBLIC_SUPABASE_URL=https://fqixdguidesjgovbwkua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Variables de servidor (sin NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=...
```

### 7. **Mejoras en el Componente Home**

**Falta:**

- Usar datos reales de Supabase
- Colores litúrgicos en el header
- Mejor manejo de estados de carga y error
- RefreshControl / Pull-to-refresh

### 8. **Sistema de Temas (Opcional)**

El proyecto original tiene `ThemeContext` para dark/light mode. No es crítico para MVP.

## 🎯 Prioridad de Implementación

### Alta Prioridad (Funcionalidad Crítica):

1. ✅ Configurar Supabase client
2. ✅ Actualizar endpoints de santos/evangelio para usar Supabase
3. ✅ Mejorar interacción del calendario (mostrar eventos al hacer clic)
4. ✅ Crear lib/dayjs.ts con timezone
5. ✅ Componentes UI básicos (Loading, EmptyState, Card)

### Media Prioridad (UX):

6. ⚠️ Pull-to-refresh en calendario
7. ⚠️ Auto-refresh de eventos cada 2 minutos
8. ⚠️ Colores litúrgicos (lib/liturgicalColors.ts)
9. ⚠️ Modal de evento mejorado

### Baja Prioridad (Nice to have):

10. ⬜ ThemeContext para dark mode
11. ⬜ Componentes UI avanzados (Button con todas las variantes)
12. ⬜ Animaciones y transiciones

## 📋 Plan de Acción

### Paso 1: Configurar Supabase

```bash
cd "/Users/admin/Movies/APP PARRO PWA"
npm install @supabase/supabase-js
```

Crear archivos:

- `/lib/supabase.ts`
- `/types/database.ts`

### Paso 2: Actualizar Endpoints

Modificar:

- `/app/api/saints/today/route.ts`
- `/app/api/gospel/today/route.ts`

Para que usen Supabase en lugar de datos hardcodeados.

### Paso 3: Mejorar Calendario

En `/components/Calendar.tsx`:

- Añadir scroll automático a lista de eventos
- Mejorar visualización de eventos del día seleccionado
- Añadir indicadores visuales

### Paso 4: Utilidades

Crear:

- `/lib/dayjs.ts` con timezone
- `/lib/liturgicalColors.ts` (opcional)

### Paso 5: Componentes UI

Crear en `/components/ui/`:

- `Loading.tsx`
- `EmptyState.tsx`
- `Card.tsx` (mejorado)

### Paso 6: Actualizar Home

Modificar `/components/Home.tsx` para:

- Usar datos reales de Supabase
- Mejor manejo de errores
- Estados de carga elegantes

## 🚀 Siguiente Paso Inmediato

**Empezar por:**

1. Instalar @supabase/supabase-js
2. Crear /lib/supabase.ts
3. Actualizar endpoints de API para usar Supabase
4. Poblar Supabase con datos de ejemplo

¿Procedemos con la implementación?
