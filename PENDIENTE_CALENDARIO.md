# Pendiente: Migración Completa del Calendario

## ✅ Completado

1. **Orden de pestañas corregido:**
   - Calendario (primero)
   - Chat (segundo)
   - Recursos (tercero)

2. **Tab inicial cambiado a Calendario**

## ❌ Pendiente

### 1. Migrar Calendario Completo

**Archivo original:** `/Users/admin/Movies/APP PARRO/app/(tabs)/calendar.tsx` (1258 líneas)

**Componentes que faltan:**

#### A) Vista Semanal

- Listado de eventos de la semana actual
- Fetch desde `/api/calendar/events?filter=week`
- Colores por tipo de evento
- Modal de detalles de evento

#### B) Vista Mensual

- Calendario mensual con grid de días
- Eventos por día
- Navegación mes anterior/siguiente
- Fetch desde `/api/calendar/events?filter=month&date={fecha}`

#### C) Santo del Día

- Fetch desde API externa de santos
- Mostrar nombre del santo
- Imagen del santo (opcional)
- Descripción breve

#### D) Evangelio del Día

- Fetch desde API del Vaticano o similar
- Mostrar lectura del evangelio
- Cita bíblica
- Texto completo

### 2. Dependencias Necesarias

```bash
npm install dayjs
npm install react-calendar  # O implementar calendario custom
```

### 3. Estructura del Componente Calendar.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Book, Cross } from 'lucide-react';
import dayjs from 'dayjs';

type ViewMode = 'week' | 'month';

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  allDay: boolean;
};

export function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Santo del día
  const [santo, setSanto] = useState<{ nombre: string; descripcion: string } | null>(null);

  // Evangelio del día
  const [evangelio, setEvangelio] = useState<{ cita: string; texto: string } | null>(null);

  // Fetch week events
  const fetchWeekEvents = async () => {
    const response = await fetch('/api/calendar/events?filter=week');
    const data = await response.json();
    setWeekEvents(data.events || []);
  };

  // Fetch month events
  const fetchMonthEvents = async (date: Date) => {
    const response = await fetch(`/api/calendar/events?filter=month&date=${date.toISOString()}`);
    const data = await response.json();
    setMonthEvents(data.events || []);
  };

  // Fetch santo del día
  const fetchSanto = async () => {
    // TODO: Implementar fetch desde API de santos
    // Ejemplo: https://www.santoral.es/api/...
  };

  // Fetch evangelio del día
  const fetchEvangelio = async () => {
    // TODO: Implementar fetch desde API del Vaticano
    // Ejemplo: https://liturgia.misionesscp.es/api/...
  };

  useEffect(() => {
    if (viewMode === 'week') {
      fetchWeekEvents();
    } else {
      fetchMonthEvents(selectedMonth);
    }
    fetchSanto();
    fetchEvangelio();
  }, [viewMode, selectedMonth]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header>...</header>

      {/* Tabs: Semana / Mes */}
      <div className="flex gap-2 px-6 py-2">
        <button onClick={() => setViewMode('week')}>Semana</button>
        <button onClick={() => setViewMode('month')}>Mes</button>
      </div>

      {/* Santo del Día */}
      <div className="px-6 py-4 bg-blue-50 border-b">
        <div className="flex items-center gap-2">
          <Cross className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold">Santo del día</p>
            <p className="text-xs text-slate-600">{santo?.nombre || 'Cargando...'}</p>
          </div>
        </div>
      </div>

      {/* Evangelio del Día */}
      <div className="px-6 py-4 bg-indigo-50 border-b">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold">Evangelio del día</p>
            <p className="text-xs text-slate-600">{evangelio?.cita || 'Cargando...'}</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'week' ? (
          <WeekView events={weekEvents} />
        ) : (
          <MonthView events={monthEvents} selectedMonth={selectedMonth} />
        )}
      </div>
    </div>
  );
}
```

### 4. APIs Sugeridas

#### Santo del Día:

- https://www.santoral.es/ (scraping)
- https://www.catholic.net/santos/ (scraping)
- Crear endpoint propio: `/api/saints/today`

#### Evangelio del Día:

- https://liturgia.misionesscp.es/
- http://evangeliodeldia.org/
- Crear endpoint propio: `/api/gospel/today`

### 5. Conversión React Native → React

```typescript
// React Native                    →  React (Web)
View                               →  div
Text                               →  p, span, h1, etc.
TouchableOpacity                   →  button
ScrollView                         →  div with overflow-y-auto
RefreshControl                     →  Pull-to-refresh library o custom
Modal                              →  Dialog/Modal component
Platform.OS === 'ios'              →  Eliminar (siempre web)
SafeAreaView                       →  div con padding
FlatList                           →  div.map() o virtual scroll
StyleSheet.create()                →  Tailwind classes
```

### 6. Ejemplo Vista Semanal

```tsx
function WeekView({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="px-6 py-4 space-y-3">
      {events.length === 0 ? (
        <p className="text-center text-slate-500">No hay eventos esta semana</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{dayjs(event.start).format('ddd D MMM, HH:mm')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

### 7. Ejemplo Vista Mensual

```tsx
function MonthView({ events, selectedMonth }: { events: CalendarEvent[]; selectedMonth: Date }) {
  const daysInMonth = dayjs(selectedMonth).daysInMonth();
  const firstDayOfMonth = dayjs(selectedMonth).startOf('month').day();

  return (
    <div className="px-6 py-4">
      {/* Header con navegación mes */}
      <div className="flex items-center justify-between mb-4">
        <button>← Anterior</button>
        <h2>{dayjs(selectedMonth).format('MMMM YYYY')}</h2>
        <button>Siguiente →</button>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}

        {/* Días del mes */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const eventsForDay = events.filter((e) => dayjs(e.start).date() === day);

          return (
            <div key={day} className="aspect-square border rounded-lg p-2 hover:bg-slate-50">
              <div className="text-sm font-semibold">{day}</div>
              {eventsForDay.length > 0 && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🚀 Próximos Pasos

1. **Instalar dayjs:**

   ```bash
   cd "/Users/admin/Movies/APP PARRO PWA"
   npm install dayjs
   ```

2. **Reemplazar `components/Calendar.tsx`** con la implementación completa

3. **Crear endpoints para santo y evangelio** (opcional, o usar APIs externas)

4. **Copiar estilos y lógica del archivo original:**
   - Colores de eventos
   - Modal de detalles
   - Pull-to-refresh
   - Loading states

5. **Probar en http://localhost:3002**

---

## 📝 Prompt para Continuar (Nueva Sesión)

```
Necesito terminar la migración del calendario en APP PARRO PWA.

Ya está hecho:
- ✅ Orden de pestañas corregido (Calendario, Chat, Recursos)
- ✅ Backend API copiado completo
- ✅ Chat funcionando
- ✅ Estructura básica del proyecto

Falta:
- ❌ Migrar calendario completo con vista semanal y mensual
- ❌ Añadir santo del día
- ❌ Añadir evangelio del día

Archivo original: /Users/admin/Movies/APP PARRO/app/(tabs)/calendar.tsx (1258 líneas)
Archivo a reemplazar: /Users/admin/Movies/APP PARRO PWA/components/Calendar.tsx

Instrucciones:
1. Lee el archivo original completo
2. Convierte de React Native a React (View → div, Text → p, etc.)
3. Implementa vista semanal con eventos desde /api/calendar/events?filter=week
4. Implementa vista mensual con grid de días
5. Añade santo del día (API externa o endpoint propio)
6. Añade evangelio del día (API externa o endpoint propio)
7. Usa dayjs para fechas
8. Mantén los colores y estilos del original

Por favor, migra el calendario completo paso a paso.
```
