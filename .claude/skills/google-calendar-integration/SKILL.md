# Google Calendar Integration Skill

## Stack de Calendario
- **API:** Google Calendar API v3
- **Auth:** OAuth 2.0 con expo-web-browser
- **Display:** react-native-calendars 1.1313.0
- **Cache:** React Query con staleTime

## Arquitectura del Calendario

```
┌─────────────────────┐
│  Calendar Screen    │
└──────────┬──────────┘
           │
           v
┌──────────────────────────┐
│  useCalendarEvents Hook  │ ← React Query
└──────────┬───────────────┘
           │
           ├─ User Events (Supabase)
           └─ Public Events (Google Calendar API)
```

## Cuándo Usar Este Skill
- ✅ Integrar Google Calendar API
- ✅ Mostrar eventos en calendario
- ✅ Sincronizar eventos públicos
- ✅ Manejar zonas horarias
- ✅ Cachear eventos eficientemente

---

## 1. CALENDAR TOOL (Backend)

### Tool para Agente OpenAI
```typescript
// ✅ CORRECTO - backend/app/api/chat/tools/calendarTool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { google } from 'googleapis';

const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_CALENDAR_API_KEY,
});

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;

export const calendarTool = tool({
  description: `Obtiene eventos del calendario parroquial. 
  Usa esto cuando el usuario pregunte sobre:
  - Eventos próximos
  - Horarios de misas
  - Actividades de la parroquia
  - "¿Qué hay hoy/mañana/esta semana?"`,
  
  parameters: z.object({
    startDate: z.string().describe('Fecha inicio YYYY-MM-DD'),
    endDate: z.string().optional().describe('Fecha fin (opcional)'),
    maxResults: z.number().optional().default(10),
  }),
  
  execute: async ({ startDate, endDate, maxResults }) => {
    try {
      const response = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: endDate ? `${endDate}T23:59:59Z` : undefined,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items || [];
      
      return {
        success: true,
        count: events.length,
        events: events.map(event => ({
          id: event.id,
          title: event.summary,
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: 'No se pudieron obtener los eventos del calendario',
      };
    }
  },
});
```

---

## 2. BACKEND SERVICE

### Servicio de Google Calendar
```typescript
// ✅ CORRECTO - backend/app/api/calendar/service.ts
import { google } from 'googleapis';

const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_CALENDAR_API_KEY,
});

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;

interface GetEventsParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export const getGoogleCalendarEvents = async (
  params: GetEventsParams
) => {
  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: params.timeMin || new Date().toISOString(),
      timeMax: params.timeMax,
      maxResults: params.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Error al obtener eventos del calendario');
  }
};

export const getEventsForMonth = async (year: number, month: number) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  return getGoogleCalendarEvents({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
  });
};

export const getEventsForWeek = async (date: Date) => {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return getGoogleCalendarEvents({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
  });
};
```

### API Route
```typescript
// ✅ CORRECTO - backend/app/api/calendar/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarEvents } from '../service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = searchParams.get('maxResults');
    
    const events = await getGoogleCalendarEvents({
      timeMin: timeMin || undefined,
      timeMax: timeMax || undefined,
      maxResults: maxResults ? parseInt(maxResults) : undefined,
    });
    
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo eventos' },
      { status: 500 }
    );
  }
}
```

---

## 3. FRONTEND HOOKS

### Hook Principal de Calendario
```typescript
// ✅ CORRECTO - hooks/useCalendarEvents.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserEvent, PublicEvent } from '@/types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

interface UseCalendarEventsParams {
  startDate: Date;
  endDate: Date;
}

export const useCalendarEvents = ({ 
  startDate, 
  endDate 
}: UseCalendarEventsParams) => {
  // Query para eventos públicos (Google Calendar)
  const publicEventsQuery = useQuery({
    queryKey: ['publicEvents', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/calendar/events?` +
        `timeMin=${startDate.toISOString()}&` +
        `timeMax=${endDate.toISOString()}`
      );
      
      if (!response.ok) throw new Error('Error fetching public events');
      
      const data = await response.json();
      return data.events as PublicEvent[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  });
  
  // Query para eventos del usuario (Supabase)
  const userEventsQuery = useQuery({
    queryKey: ['userEvents', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('starts_at', startDate.toISOString())
        .lte('starts_at', endDate.toISOString())
        .order('starts_at', { ascending: true });
      
      if (error) throw error;
      return data as UserEvent[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  return {
    publicEvents: publicEventsQuery.data || [],
    userEvents: userEventsQuery.data || [],
    loading: publicEventsQuery.isLoading || userEventsQuery.isLoading,
    error: publicEventsQuery.error || userEventsQuery.error,
    refetch: async () => {
      await Promise.all([
        publicEventsQuery.refetch(),
        userEventsQuery.refetch(),
      ]);
    },
  };
};
```

### Hook para Mes Específico
```typescript
// ✅ CORRECTO - hooks/useMonthEvents.ts
import { useCalendarEvents } from './useCalendarEvents';

export const useMonthEvents = (year: number, month: number) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  
  return useCalendarEvents({ startDate, endDate });
};
```

---

## 4. CALENDAR SCREEN

### Pantalla de Calendario
```typescript
// ✅ CORRECTO - app/(tabs)/calendar.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useMonthEvents } from '@/hooks/useMonthEvents';
import { EventCard } from '@/components/EventCard';
import dayjs from 'dayjs';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  
  const { publicEvents, userEvents, loading } = useMonthEvents(
    currentYear,
    currentMonth
  );
  
  // Combinar eventos
  const allEvents = [...publicEvents, ...userEvents];
  
  // Marcar días con eventos
  const markedDates = allEvents.reduce((acc, event) => {
    const date = dayjs(event.starts_at).format('YYYY-MM-DD');
    acc[date] = {
      marked: true,
      dotColor: '#3B82F6',
    };
    return acc;
  }, {} as Record<string, any>);
  
  // Eventos del día seleccionado
  const selectedDayEvents = allEvents.filter(event =>
    dayjs(event.starts_at).format('YYYY-MM-DD') === selectedDate
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          Calendario
        </Text>
      </View>
      
      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(date) => {
          setCurrentMonth(date.month - 1);
          setCurrentYear(date.year);
        }}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#3B82F6',
          },
        }}
        theme={{
          backgroundColor: '#FFFFFF',
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: '#6B7280',
          selectedDayBackgroundColor: '#3B82F6',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#3B82F6',
          dayTextColor: '#1F2937',
          textDisabledColor: '#D1D5DB',
          dotColor: '#3B82F6',
          arrowColor: '#3B82F6',
        }}
      />
      
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Eventos del {dayjs(selectedDate).format('D [de] MMMM')}
        </Text>
        
        {loading ? (
          <Text className="text-gray-500">Cargando eventos...</Text>
        ) : selectedDayEvents.length === 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center">
            <Text className="text-gray-500 dark:text-gray-400">
              No hay eventos programados
            </Text>
          </View>
        ) : (
          selectedDayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 5. COMPONENTES DE EVENTO

### Event Card
```typescript
// ✅ CORRECTO - components/EventCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Clock } from 'lucide-react-native';
import dayjs from 'dayjs';
import type { PublicEvent, UserEvent } from '@/types';

interface EventCardProps {
  event: PublicEvent | UserEvent;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const isUserEvent = 'user_id' in event;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
    >
      {/* Tipo de evento */}
      <View className="flex-row items-center mb-2">
        <Calendar size={16} color={isUserEvent ? '#10B981' : '#3B82F6'} />
        <Text className="text-xs ml-2 text-gray-500 dark:text-gray-400">
          {isUserEvent ? 'Mi evento' : 'Evento público'}
        </Text>
      </View>
      
      {/* Título */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {event.title}
      </Text>
      
      {/* Horario */}
      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600 dark:text-gray-300 ml-2">
          {dayjs(event.starts_at).format('HH:mm')} - 
          {dayjs(event.ends_at).format('HH:mm')}
        </Text>
      </View>
      
      {/* Ubicación */}
      {event.location && (
        <View className="flex-row items-center">
          <MapPin size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 dark:text-gray-300 ml-2">
            {event.location}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

---

## 6. TIMEZONE HANDLING

### Utilidades de Zona Horaria
```typescript
// ✅ CORRECTO - utils/timezone.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TIMEZONE = 'America/Mexico_City'; // Ajustar según parroquia

export const formatEventTime = (isoDate: string): string => {
  return dayjs(isoDate).tz(APP_TIMEZONE).format('HH:mm');
};

export const formatEventDate = (isoDate: string): string => {
  return dayjs(isoDate).tz(APP_TIMEZONE).format('DD/MM/YYYY');
};

export const isEventToday = (isoDate: string): boolean => {
  const eventDate = dayjs(isoDate).tz(APP_TIMEZONE);
  const today = dayjs().tz(APP_TIMEZONE);
  return eventDate.isSame(today, 'day');
};

export const getEventsForToday = (
  events: Array<PublicEvent | UserEvent>
): Array<PublicEvent | UserEvent> => {
  return events.filter(event => isEventToday(event.starts_at));
};
```

---

## 7. CACHE STRATEGY

### Configuración de Cache
```typescript
// ✅ CORRECTO - React Query config para calendario
const calendarQueryConfig = {
  // Eventos públicos: Cache más largo (10 min)
  publicEvents: {
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  },
  
  // Eventos de usuario: Cache más corto (5 min)
  userEvents: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  },
};
```

---

## CHECKLIST

- [ ] ✅ API Key de Google Calendar configurada
- [ ] ✅ Calendar ID correcto en .env
- [ ] ✅ Eventos públicos cacheados (10 min)
- [ ] ✅ Eventos de usuario cacheados (5 min)
- [ ] ✅ Zona horaria configurada correctamente
- [ ] ✅ Marcadores en calendario visual
- [ ] ✅ Eventos de hoy destacados
- [ ] ✅ Manejo de errores de API
- [ ] ✅ Pull-to-refresh implementado
- [ ] ✅ Tool de calendario en chatbot

---

## VARIABLES DE ENTORNO

```env
# Backend (.env)
GOOGLE_CALENDAR_API_KEY=AIzaSyXXXXXXXXXXXXXXX
GOOGLE_CALENDAR_ID=primary@example.com

# Frontend (.env)
EXPO_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
```
