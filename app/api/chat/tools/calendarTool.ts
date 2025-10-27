import { tool } from "@openai/agents";
import { z } from "zod";
import ICAL from 'ical.js';

const CALENDAR_URL = process.env.GOOGLE_CALENDAR_ICS_URL ||
  'https://calendar.google.com/calendar/ical/2ca61dd15b0992030db91fe0df4c6f59720ac5901439d6227dfef642c33c0986%40group.calendar.google.com/public/basic.ics';

// Cache compartido con la API de calendario (optimizado para reducir fetches)
let cachedEvents: any[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos (calendarios no cambian tan seguido)

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

    const events: CalendarEvent[] = vevents.map((vevent) => {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate;
      const endDate = event.endDate;

      const allDay = !startDate.hour && !startDate.minute;

      return {
        id: event.uid,
        title: event.summary || 'Sin título',
        start: startDate.toJSDate().toISOString(),
        end: endDate.toJSDate().toISOString(),
        location: event.location || undefined,
        description: event.description || undefined,
        allDay,
      };
    });

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return events;
  } catch (error) {
    console.error('Error parsing ICS:', error);
    throw error;
  }
}

async function getEvents(): Promise<CalendarEvent[]> {
  const now = Date.now();

  if (cachedEvents && (now - lastFetch) < CACHE_DURATION) {
    return cachedEvents;
  }

  cachedEvents = await fetchAndParseICS();
  lastFetch = now;

  return cachedEvents;
}

function formatEventForChat(event: CalendarEvent): string {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Madrid'
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
    hour12: false // Usar formato 24 horas
  };

  let dateStr = startDate.toLocaleDateString('es-ES', dateOptions);

  if (event.allDay) {
    dateStr += ' (todo el día)';
  } else {
    const startTime = startDate.toLocaleTimeString('es-ES', timeOptions);
    const endTime = endDate.toLocaleTimeString('es-ES', timeOptions);
    dateStr += ` de ${startTime} a ${endTime}`;
  }

  let result = `**${event.title}**\n📅 ${dateStr}`;

  if (event.location) {
    result += `\n📍 ${event.location}`;
  }

  if (event.description) {
    result += `\n📝 ${event.description}`;
  }

  return result;
}

// Schema para los parámetros del tool
const CalendarToolInputSchema = z.object({
  timeframe: z.enum(['upcoming', 'today', 'tomorrow', 'week', 'weekend', 'next_week', 'month', 'custom']).describe(
    'El periodo de tiempo para buscar eventos: upcoming (próximos eventos), today (hoy), tomorrow (mañana), week (esta semana completa lun-dom), weekend (este fin de semana), next_week (próxima semana), month (este mes), custom (rango personalizado)'
  ),
  limit: z.number().nullable().default(10).describe('Número máximo de eventos a devolver'),
  startDate: z.string().nullable().default(null).describe('Fecha de inicio para búsqueda custom (formato ISO)'),
  endDate: z.string().nullable().default(null).describe('Fecha de fin para búsqueda custom (formato ISO)'),
});

// Crear el tool de calendario usando la función helper tool()
export const calendarTool = tool({
  name: "get_calendar_events",
  description: "Obtiene eventos del calendario parroquial. USA SIEMPRE esta herramienta cuando el usuario pregunte por: fechas, días (hoy, mañana, fin de semana, lunes, martes...), eventos, actividades, misas, celebraciones. IMPORTANTE: 'week' incluye TODO de lunes a domingo, 'weekend' es solo sábado y domingo.",
  parameters: CalendarToolInputSchema,
  execute: async ({ timeframe, limit, startDate, endDate }) => {
    try {
      const allEvents = await getEvents();
      const now = new Date();
      const eventLimit = limit ?? 10;

      // Añadir fecha actual al inicio de la respuesta
      const currentDateStr = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Madrid'
      });

      // Filtrar eventos futuros o actuales (FIX: incluir eventos que aún no han comenzado)
      let filteredEvents = allEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventEnd >= now || eventStart >= now;
      });

      if (timeframe === 'upcoming') {
        filteredEvents = filteredEvents.slice(0, eventLimit);
      } else if (timeframe === 'today') {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= todayStart && eventStart <= todayEnd;
        });
      } else if (timeframe === 'tomorrow') {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= tomorrow && eventStart <= tomorrowEnd;
        });
      } else if (timeframe === 'week') {
        // ESTA SEMANA COMPLETA: de lunes a domingo
        const today = new Date(now);
        const dayOfWeek = today.getDay();

        // Calcular lunes de esta semana
        const monday = new Date(today);
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        // Calcular domingo de esta semana
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= monday && eventStart <= sunday;
        });
      } else if (timeframe === 'weekend') {
        // FIN DE SEMANA: sábado y domingo de esta semana
        const today = new Date(now);
        const dayOfWeek = today.getDay();

        // Calcular sábado de esta semana
        const saturday = new Date(today);
        const daysUntilSaturday = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
        saturday.setDate(today.getDate() + daysUntilSaturday);
        saturday.setHours(0, 0, 0, 0);

        // Calcular domingo de esta semana
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= saturday && eventStart <= sunday;
        });
      } else if (timeframe === 'next_week') {
        // PRÓXIMA SEMANA: lunes a domingo de la siguiente semana
        const today = new Date(now);
        const dayOfWeek = today.getDay();

        // Calcular lunes de la próxima semana
        const nextMonday = new Date(today);
        const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0);

        // Calcular domingo de la próxima semana
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        nextSunday.setHours(23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= nextMonday && eventStart <= nextSunday;
        });
      } else if (timeframe === 'month') {
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= firstDay && eventStart <= lastDay;
        });
      } else if (timeframe === 'custom' && startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);

        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= customStart && eventStart <= customEnd;
        });
      }

      if (filteredEvents.length === 0) {
        const timeframeText = {
          upcoming: 'los próximos días',
          today: 'hoy',
          tomorrow: 'mañana',
          week: 'esta semana',
          weekend: 'este fin de semana',
          next_week: 'la próxima semana',
          month: 'este mes',
          custom: 'el periodo solicitado'
        }[timeframe] || 'el periodo solicitado';

        return `[Fecha actual: ${currentDateStr}]\n\nNo hay eventos programados para ${timeframeText}.`;
      }

      const formattedEvents = filteredEvents.map(formatEventForChat).join('\n\n---\n\n');

      const timeframeText = {
        upcoming: 'próximo' + (filteredEvents.length !== 1 ? 's' : ''),
        today: 'para hoy',
        tomorrow: 'para mañana',
        week: 'esta semana',
        weekend: 'este fin de semana',
        next_week: 'la próxima semana',
        month: 'este mes',
        custom: 'en el periodo solicitado'
      }[timeframe] || 'encontrados';

      const header = `[Fecha actual: ${currentDateStr}]\n\n✅ Encontré ${filteredEvents.length} evento${filteredEvents.length !== 1 ? 's' : ''} ${timeframeText}:\n\n`;

      return header + formattedEvents;
    } catch (error: any) {
      console.error('Error in calendar tool:', error);
      return `Lo siento, no pude obtener los eventos del calendario en este momento. Por favor, intenta más tarde o consulta directamente la pestaña de Calendario en la app.`;
    }
  },
});
