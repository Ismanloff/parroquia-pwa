'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Share2, Download, Loader2, X } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { haptics } from '@/lib/haptics';
import { ErrorState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useCalendarEvents } from '@/hooks/useCachedFetch';

dayjs.locale('es');

// =============================================================================
// DESIGN TOKENS - Sistema de diseño consistente
// =============================================================================
const tokens = {
  // Colores principales
  colors: {
    primary: 'rgb(0, 122, 255)', // iOS Blue
    primaryBg: 'rgb(0, 122, 255)',
    today: 'rgb(255, 59, 48)', // iOS Red
    text: {
      primary: 'text-slate-900 dark:text-white',
      secondary: 'text-slate-500 dark:text-slate-400',
      tertiary: 'text-slate-400 dark:text-slate-500',
    },
  },
  // Categorías de eventos (dots)
  dots: {
    mass: 'bg-blue-500',
    confession: 'bg-violet-500',
    adoration: 'bg-amber-500',
    meeting: 'bg-emerald-500',
    other: 'bg-slate-400',
  },
} as const;

// =============================================================================
// TYPES
// =============================================================================
type EventCategory = 'mass' | 'confession' | 'adoration' | 'meeting' | 'other';

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

// =============================================================================
// UTILITIES
// =============================================================================
function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function detectCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (/(misa|eucarist)/i.test(t)) return 'mass';
  if (/(confes|peniten|reconcili)/i.test(t)) return 'confession';
  if (/(adoraci|exposici|santísimo)/i.test(t)) return 'adoration';
  if (/(reuni|cateques|grupo|curso|charla|formaci|taller)/i.test(t)) return 'meeting';
  return 'other';
}

function formatEventTime(event: Event) {
  if (event.allDay) return 'Todo el día';
  const start = dayjs(event.start);
  const end = event.end ? dayjs(event.end) : null;
  if (end && end.isValid() && !end.isSame(start, 'minute')) {
    return `${start.format('HH:mm')} – ${end.format('HH:mm')}`;
  }
  return start.format('HH:mm');
}

// ICS helpers
function escapeICS(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatICSDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildICS(event: Event) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + 3600000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parroquia//Calendar//ES',
    'BEGIN:VEVENT',
    `UID:${event.id}@parroquia`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

// =============================================================================
// COMPONENTS
// =============================================================================

/** Header del calendario - Mes/Año + Navegación + Hoy */
function CalendarHeader({
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: {
  currentMonth: dayjs.Dayjs;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      {/* Título del mes */}
      <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">
        {capitalize(currentMonth.format('MMMM YYYY'))}
      </h1>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <button
          onClick={onNext}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <button
          onClick={onToday}
          className="ml-2 px-3 h-8 text-[13px] font-semibold text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all"
        >
          Hoy
        </button>
      </div>
    </header>
  );
}

/** Fila de días de la semana */
function WeekdayRow() {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <div className="grid grid-cols-7 px-3 mb-1">
      {days.map((day, i) => (
        <div
          key={day + i}
          className={cn(
            'h-8 flex items-center justify-center text-[11px] font-semibold tracking-wide',
            i >= 5 ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
}

/** Celda de día individual */
function DayCell({
  day,
  isToday,
  isSelected,
  isCurrentMonth,
  eventCount,
  eventCategories,
  onSelect,
}: {
  day: dayjs.Dayjs;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  eventCount: number;
  eventCategories: EventCategory[];
  onSelect: () => void;
}) {
  const showDots = eventCount > 0 && eventCount <= 3;
  const showOverflow = eventCount > 3;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center h-11 rounded-full transition-colors',
        'active:scale-95 transition-transform',
        !isCurrentMonth && 'opacity-30',
        isSelected && 'bg-blue-600'
      )}
      aria-label={`${day.format('D [de] MMMM')}, ${eventCount} eventos`}
      aria-pressed={isSelected}
    >
      {/* Indicador de HOY (punto rojo pequeño arriba) */}
      {isToday && !isSelected && (
        <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-red-500" />
      )}

      {/* Número del día */}
      <span
        className={cn(
          'text-[15px] font-medium leading-none',
          isSelected ? 'text-white font-semibold' : 'text-slate-900 dark:text-white',
          isToday && !isSelected && 'text-red-500 font-semibold'
        )}
      >
        {day.format('D')}
      </span>

      {/* Dots de eventos */}
      {(showDots || showOverflow) && (
        <div className="flex items-center gap-[3px] mt-1 h-[5px]">
          {showDots &&
            eventCategories
              .slice(0, 3)
              .map((cat, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-[5px] h-[5px] rounded-full',
                    isSelected ? 'bg-white/80' : tokens.dots[cat]
                  )}
                />
              ))}
          {showOverflow && (
            <span
              className={cn(
                'text-[9px] font-bold leading-none',
                isSelected ? 'text-white/70' : 'text-slate-400'
              )}
            >
              +{eventCount - 2}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/** Grid del mes completo */
function MonthGrid({
  currentMonth,
  selectedDate,
  eventsByDate,
  onSelectDate,
}: {
  currentMonth: dayjs.Dayjs;
  selectedDate: dayjs.Dayjs;
  eventsByDate: Record<string, Event[]>;
  onSelectDate: (date: dayjs.Dayjs) => void;
}) {
  const days = useMemo(() => {
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const result: dayjs.Dayjs[] = [];
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      result.push(d);
    }
    return result;
  }, [currentMonth]);

  const today = dayjs();

  return (
    <div className="px-3">
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const dateKey = day.format('YYYY-MM-DD');
          const events = eventsByDate[dateKey] || [];
          const categories = events.map((e) => detectCategory(e.title));

          return (
            <DayCell
              key={dateKey}
              day={day}
              isToday={day.isSame(today, 'day')}
              isSelected={day.isSame(selectedDate, 'day')}
              isCurrentMonth={day.isSame(currentMonth, 'month')}
              eventCount={events.length}
              eventCategories={categories}
              onSelect={() => {
                haptics.light();
                onSelectDate(day);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Fila de evento en la agenda */
function EventRow({ event, onTap }: { event: Event; onTap: () => void }) {
  const category = detectCategory(event.title);
  const dotColor = tokens.dots[category];

  return (
    <button
      onClick={onTap}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
    >
      {/* Hora */}
      <div className="w-14 shrink-0 pt-0.5">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
          {event.allDay ? 'Día' : dayjs(event.start).format('HH:mm')}
        </span>
      </div>

      {/* Dot de categoría */}
      <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dotColor)} />

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-slate-900 dark:text-white leading-snug">
          {event.title}
        </p>
        {event.location && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        )}
      </div>

      {/* Flecha */}
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 shrink-0" />
    </button>
  );
}

/** Panel de agenda para el día seleccionado */
function AgendaPanel({
  selectedDate,
  events,
  onEventTap,
}: {
  selectedDate: dayjs.Dayjs;
  events: Event[];
  onEventTap: (event: Event) => void;
}) {
  const isToday = selectedDate.isSame(dayjs(), 'day');

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Header del día */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
          {isToday ? 'Hoy' : capitalize(selectedDate.format('dddd'))}
          <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">
            {selectedDate.format('D [de] MMMM')}
          </span>
        </h2>
      </div>

      {/* Lista de eventos */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-[15px] font-medium">Sin eventos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => (
              <EventRow key={event.id} event={event} onTap={() => onEventTap(event)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Bottom Sheet de detalles del evento */
function EventDetailSheet({
  event,
  onClose,
  onShare,
  onDownload,
}: {
  event: Event;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const category = detectCategory(event.title);
  const dotColor = tokens.dots[category];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-slide-up max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div
          className="px-5 pb-6 overflow-y-auto flex-1"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Title */}
          <div className="flex items-start gap-3 mb-4">
            <span className={cn('w-3 h-3 rounded-full mt-1.5 shrink-0', dotColor)} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight pr-8">
              {event.title}
            </h2>
          </div>

          {/* Date & Time */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-[15px] text-slate-900 dark:text-white font-medium">
              {capitalize(dayjs(event.start).format('dddd, D [de] MMMM'))}
            </p>
            <p className="text-[17px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
              {formatEventTime(event)}
            </p>
          </div>

          {/* Location */}
          {event.location && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Ubicación
                  </p>
                  <p className="text-[15px] text-slate-900 dark:text-white mt-0.5">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Descripción
              </p>
              <p className="text-[15px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onShare}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[15px] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-5 h-5" />
              Compartir
            </button>
            <button
              onClick={onDownload}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              <Download className="w-5 h-5" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function CalendarComponent() {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // Fetch events for visible range
  const visibleRange = useMemo(
    () => ({
      start: currentMonth.startOf('month').startOf('week'),
      end: currentMonth.endOf('month').endOf('week'),
    }),
    [currentMonth]
  );

  const { events, loading, error, refetch } = useCalendarEvents(
    visibleRange.start.toDate(),
    visibleRange.end.toDate()
  );

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    for (const event of events) {
      const key = dayjs(event.start).format('YYYY-MM-DD');
      (grouped[key] ||= []).push(event);
    }
    // Sort each day's events
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    );
    return grouped;
  }, [events]);

  // Events for selected date
  const selectedEvents = eventsByDate[selectedDate.format('YYYY-MM-DD')] || [];

  // Handlers
  const handlePrev = () => {
    haptics.light();
    setCurrentMonth((m) => m.subtract(1, 'month'));
  };

  const handleNext = () => {
    haptics.light();
    setCurrentMonth((m) => m.add(1, 'month'));
  };

  const handleToday = () => {
    haptics.light();
    const today = dayjs();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleSelectDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    // If selected date is in a different month, navigate there
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date);
    }
  };

  const handleShare = async (event: Event) => {
    haptics.medium();
    const text = [
      event.title,
      `${capitalize(dayjs(event.start).format('dddd, D [de] MMMM'))}`,
      formatEventTime(event),
      event.location,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text });
        toast.success('Evento compartido');
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    }
  };

  const handleDownload = (event: Event) => {
    haptics.success();
    const ics = buildICS(event);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.slice(0, 30)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Evento descargado');
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div
        className="bg-white dark:bg-slate-900 pt-safe"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <CalendarHeader
          currentMonth={currentMonth}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {/* Weekday labels */}
        <WeekdayRow />

        {/* Month Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch(true)} />
        ) : (
          <MonthGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            onSelectDate={handleSelectDate}
          />
        )}

        {/* Bottom padding for grid */}
        <div className="h-3" />
      </div>

      {/* Agenda Panel */}
      <AgendaPanel
        selectedDate={selectedDate}
        events={selectedEvents}
        onEventTap={(e) => {
          haptics.medium();
          setActiveEvent(e);
        }}
      />

      {/* Safe area bottom spacer */}
      <div className="h-20 bg-white dark:bg-slate-900" />

      {/* Event Detail Sheet */}
      {activeEvent && (
        <EventDetailSheet
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          onShare={() => handleShare(activeEvent)}
          onDownload={() => handleDownload(activeEvent)}
        />
      )}
    </div>
  );
}

export default CalendarComponent;
