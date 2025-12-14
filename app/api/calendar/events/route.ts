import { NextRequest, NextResponse } from 'next/server';
import ICAL from 'ical.js';

const CALENDAR_URL =
  process.env.GOOGLE_CALENDAR_ICS_URL ||
  'https://calendar.google.com/calendar/ical/343cc18bcdaf62c1dedecab354763c9da46d8bcb3291037884db08a06f911dd6%40group.calendar.google.com/public/basic.ics';

// Cache para no hacer requests constantes a Google
let cachedEvents: any[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos (reducido para actualizaciones más rápidas)

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  allDay: boolean;
}

async function fetchAndParseICS(): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(CALENDAR_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
    }

    const icsData = await response.text();
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const events: CalendarEvent[] = [];

    // Rango de expansión: 1 mes atrás hasta 1 año adelante
    // Esto es necesario para "desplegar" los eventos repetitivos
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setMonth(rangeStart.getMonth() - 1);
    const rangeEnd = new Date(now);
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

    vevents.forEach((vevent) => {
      const event = new ICAL.Event(vevent);

      if (event.isRecurring()) {
        const iterator = event.iterator();
        let next;

        while ((next = iterator.next())) {
          const startDate = next;
          const jsDate = startDate.toJSDate();

          if (jsDate > rangeEnd) break;
          if (jsDate < rangeStart) continue;

          const endDate = next.clone();
          endDate.addDuration(event.duration);

          events.push({
            id: `${event.uid}_${jsDate.getTime()}`,
            title: event.summary || 'Sin título',
            start: jsDate.toISOString(),
            end: endDate.toJSDate().toISOString(),
            location: event.location || undefined,
            description: event.description || undefined,
            allDay: !startDate.hour && !startDate.minute,
          });
        }
      } else {
        const startDate = event.startDate;
        const endDate = event.endDate;
        const jsDate = startDate.toJSDate();

        // Incluir solo si es relevante (no muy antiguo) o futuro
        if (jsDate >= rangeStart || endDate.toJSDate() >= rangeStart) {
          events.push({
            id: event.uid,
            title: event.summary || 'Sin título',
            start: jsDate.toISOString(),
            end: endDate.toJSDate().toISOString(),
            location: event.location || undefined,
            description: event.description || undefined,
            allDay: !startDate.hour && !startDate.minute,
          });
        }
      }
    });

    // Ordenar por fecha de inicio
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return events;
  } catch (error) {
    console.error('Error parsing ICS:', error);
    throw error;
  }
}

async function getEvents(): Promise<CalendarEvent[]> {
  const now = Date.now();

  // Usar caché si es reciente
  if (cachedEvents && now - lastFetch < CACHE_DURATION) {
    return cachedEvents;
  }

  // Fetch nuevo
  cachedEvents = await fetchAndParseICS();
  lastFetch = now;

  return cachedEvents;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'upcoming', 'week', 'month'
    const date = searchParams.get('date'); // For month filter
    const limit = searchParams.get('limit'); // For upcoming filter
    const forceRefresh = searchParams.get('refresh') === 'true'; // Forzar actualización

    // Si se solicita refresh, invalidar caché
    if (forceRefresh) {
      console.log('🔄 Force refresh requested, invalidating cache');
      cachedEvents = null;
      lastFetch = 0;
    }

    const allEvents = await getEvents();
    const now = new Date();

    let filteredEvents = allEvents;

    // Filtrar eventos futuros o actuales (usar start para eventos que aún no comenzaron)
    filteredEvents = filteredEvents.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      // Incluir si el evento aún no ha terminado
      return eventEnd >= now || eventStart >= now;
    });

    // Aplicar filtros
    if (filter === 'upcoming') {
      const limitNum = limit ? parseInt(limit) : 5;
      filteredEvents = filteredEvents.slice(0, limitNum);
    } else if (filter === 'week') {
      // Eventos de los próximos 7 días (desde hoy)
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Calcular el día 7 desde hoy
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 6);
      sevenDaysLater.setHours(23, 59, 59, 999);

      filteredEvents = filteredEvents.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= today && eventStart <= sevenDaysLater;
      });
    } else if (filter === 'month' && date) {
      // Eventos del mes especificado
      const targetDate = new Date(date);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

      filteredEvents = filteredEvents.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= firstDay && eventStart <= lastDay;
      });
    }

    return NextResponse.json({
      events: filteredEvents,
      cached: Date.now() - lastFetch < CACHE_DURATION,
      lastUpdate: new Date(lastFetch).toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener eventos del calendario' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
