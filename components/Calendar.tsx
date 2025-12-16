'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Share2,
  Download,
  Loader2,
  RefreshCw,
  X,
  List,
  CalendarDays,
  Calendar as CalendarIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { haptics } from '@/lib/haptics';
import { Card } from '@/components/ui/Card';
import { EmptyCalendar, ErrorState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useCalendarEvents } from '@/hooks/useCachedFetch';

dayjs.locale('es');

type ViewMode = 'week' | 'month' | 'agenda';

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

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function detectCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (/(misa|eucarist|eucaristía)/i.test(t)) return 'mass';
  if (/(confes|peniten|reconcili)/i.test(t)) return 'confession';
  if (/(adoraci|exposici|santísimo|santisimo)/i.test(t)) return 'adoration';
  if (/(reuni[óo]n|cateques|grupo|curso|charla|aula|formaci|taller)/i.test(t)) return 'meeting';
  return 'other';
}

const CATEGORY_META: Record<
  EventCategory,
  { label: string; accent: string; pill: string; dot: string; bg: string; text: string }
> = {
  mass: {
    label: 'Misa',
    accent: 'bg-blue-600',
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/15 dark:bg-blue-500/25',
    text: 'text-blue-700 dark:text-blue-300',
  },
  confession: {
    label: 'Confesión',
    accent: 'bg-violet-600',
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    dot: 'bg-violet-500',
    bg: 'bg-violet-500/15 dark:bg-violet-500/25',
    text: 'text-violet-700 dark:text-violet-300',
  },
  adoration: {
    label: 'Adoración',
    accent: 'bg-amber-600',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    text: 'text-amber-700 dark:text-amber-300',
  },
  meeting: {
    label: 'Actividad',
    accent: 'bg-emerald-600',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  other: {
    label: 'Evento',
    accent: 'bg-slate-500',
    pill: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
    bg: 'bg-slate-500/15 dark:bg-slate-500/25',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

function formatEventTime(event: Event) {
  if (event.allDay) return 'Todo el día';
  const start = dayjs(event.start);
  const end = event.end ? dayjs(event.end) : null;
  if (end && end.isValid() && !end.isSame(start, 'minute')) {
    return `${start.format('HH:mm')} – ${end.format('HH:mm')}`;
  }
  return start.format('HH:mm');
}

function formatShortTime(event: Event) {
  if (event.allDay) return 'Día';
  return dayjs(event.start).format('HH:mm');
}

function getRelativeTime(event: Event): string | null {
  const now = dayjs();
  const start = dayjs(event.start);
  const diffMins = start.diff(now, 'minute');

  if (diffMins < 0) return null; // Ya pasó
  if (diffMins < 60) return `En ${diffMins} min`;
  if (diffMins < 120) return 'En 1 hora';
  if (diffMins < 1440) return `En ${Math.floor(diffMins / 60)} horas`;
  return null;
}

function escapeICSText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatICSDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^\p{L}\p{N}\s._-]+/gu, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80) || 'evento'
  );
}

function buildSingleEventICS(event: Event) {
  const now = new Date();
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parroquia PWA//Calendario//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeICSText(event.id || `${start.getTime()}@parroquia-pwa`)}`,
    `DTSTAMP:${formatICSDateTime(now)}`,
    `DTSTART:${formatICSDateTime(start)}`,
    `DTEND:${formatICSDateTime(end)}`,
    `SUMMARY:${escapeICSText(event.title || 'Evento')}`,
  ];

  if (event.location) lines.push(`LOCATION:${escapeICSText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function CalendarComponent() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [cursorDate, setCursorDate] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // Calcular rango visible para el fetch
  const visibleRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: cursorDate.startOf('month').startOf('week'),
        end: cursorDate.endOf('month').endOf('week'),
      };
    }
    if (viewMode === 'agenda') {
      // Agenda: próximos 30 días
      return {
        start: dayjs().startOf('day'),
        end: dayjs().add(30, 'day').endOf('day'),
      };
    }
    return {
      start: cursorDate.startOf('week'),
      end: cursorDate.endOf('week'),
    };
  }, [cursorDate, viewMode]);

  const {
    events,
    loading,
    isRevalidating,
    error,
    meta,
    refetch: loadEvents,
  } = useCalendarEvents(visibleRange.start.toDate(), visibleRange.end.toDate());

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    for (const event of events) {
      const dateKey = dayjs(event.start).format('YYYY-MM-DD');
      (grouped[dateKey] ||= []).push(event);
    }

    for (const dateKey of Object.keys(grouped)) {
      const bucket = grouped[dateKey];
      if (!bucket) continue;
      bucket.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }

    return grouped;
  }, [events]);

  // Upcoming events for agenda view
  const upcomingEvents = useMemo(() => {
    const now = dayjs();
    return events
      .filter((e) => dayjs(e.start).isAfter(now.subtract(1, 'hour')))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  const weekStart = useMemo(() => cursorDate.startOf('week'), [cursorDate]);
  const weekEnd = useMemo(() => cursorDate.endOf('week'), [cursorDate]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekStart]
  );

  const monthDays = useMemo(() => {
    const gridStart = cursorDate.startOf('month').startOf('week');
    const gridEnd = cursorDate.endOf('month').endOf('week');

    const days: dayjs.Dayjs[] = [];
    for (
      let d = gridStart;
      d.isBefore(gridEnd, 'day') || d.isSame(gridEnd, 'day');
      d = d.add(1, 'day')
    ) {
      days.push(d);
    }
    return days;
  }, [cursorDate]);

  const handleDateSelect = (date: dayjs.Dayjs) => {
    haptics.light();
    setSelectedDate(date);
    if (viewMode === 'month' && !date.isSame(cursorDate, 'month')) {
      setCursorDate(date);
    }
  };

  const handlePrev = () => {
    haptics.light();
    if (viewMode === 'week') {
      setCursorDate((d) => d.subtract(1, 'week'));
      setSelectedDate((d) => d.subtract(1, 'week'));
      return;
    }
    setCursorDate((d) => d.subtract(1, 'month'));
    setSelectedDate((d) => d.subtract(1, 'month'));
  };

  const handleNext = () => {
    haptics.light();
    if (viewMode === 'week') {
      setCursorDate((d) => d.add(1, 'week'));
      setSelectedDate((d) => d.add(1, 'week'));
      return;
    }
    setCursorDate((d) => d.add(1, 'month'));
    setSelectedDate((d) => d.add(1, 'month'));
  };

  const handleToday = () => {
    haptics.light();
    const today = dayjs();
    setCursorDate(today);
    setSelectedDate(today);
  };

  const handleRefresh = () => {
    haptics.medium();
    void loadEvents(true);
  };

  const handleShareEvent = async (event: Event) => {
    haptics.medium();
    const text = [
      event.title,
      `${capitalize(dayjs(event.start).format('dddd'))}, ${dayjs(event.start).format('D [de] MMMM')} · ${formatEventTime(event)}`,
      event.location,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url: window.location.href });
        toast.success('Evento compartido');
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
      } catch {
        toast.info(text);
      }
    }
  };

  const downloadICS = (event: Event) => {
    haptics.success();
    const ics = buildSingleEventICS(event);
    const filename = `${safeFilename(event.title)}.ics`;
    downloadTextFile(filename, ics, 'text/calendar;charset=utf-8');
    toast.success('Evento descargado (.ics)');
  };

  const openEvent = (event: Event) => {
    haptics.medium();
    setActiveEvent(event);
  };

  const closeEvent = () => {
    haptics.light();
    setActiveEvent(null);
  };

  // ============================================================
  // RENDER: Week View
  // ============================================================
  const renderWeekView = () => {
    return (
      <div className="space-y-4">
        {/* Date Strip - Apple Calendar Style */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-1.5 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center">
            <button
              onClick={handlePrev}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-1 justify-center">
              {weekDays.map((day) => {
                const isSelected = day.isSame(selectedDate, 'day');
                const isToday = day.isSame(dayjs(), 'day');
                const dateKey = day.format('YYYY-MM-DD');
                const dayEventsList = eventsByDate[dateKey] || [];
                const count = dayEventsList.length;
                const isPast = day.isBefore(dayjs(), 'day');

                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[44px] h-[62px] rounded-xl transition-all mx-0.5',
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : isPast
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50',
                      isToday && !isSelected && 'ring-2 ring-blue-500/50 ring-inset'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] uppercase font-semibold tracking-wide',
                        isSelected ? 'text-blue-100' : ''
                      )}
                    >
                      {day.format('dd')}
                    </span>
                    <span
                      className={cn(
                        'text-lg font-bold leading-none mt-0.5',
                        isSelected ? 'text-white' : isToday ? 'text-blue-600' : ''
                      )}
                    >
                      {day.format('D')}
                    </span>
                    {/* Event indicators */}
                    <div className="flex gap-0.5 mt-1 h-1.5">
                      {count > 0 && count <= 3 ? (
                        dayEventsList
                          .slice(0, 3)
                          .map((ev, i) => (
                            <span
                              key={i}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isSelected
                                  ? 'bg-white/80'
                                  : CATEGORY_META[detectCategory(ev.title)].dot
                              )}
                            />
                          ))
                      ) : count > 3 ? (
                        <>
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isSelected ? 'bg-white/80' : 'bg-blue-500'
                            )}
                          />
                          <span
                            className={cn(
                              'text-[8px] font-bold leading-none',
                              isSelected ? 'text-white/80' : 'text-slate-400'
                            )}
                          >
                            +{count - 1}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Events List */}
        {!loading && !error && events.length === 0 ? (
          <EmptyCalendar onRefresh={handleRefresh} />
        ) : (
          <div className="space-y-5 pb-20">
            {weekDays.map((day) => {
              const dateKey = day.format('YYYY-MM-DD');
              const dayEvents = eventsByDate[dateKey] || [];
              const isToday = day.isSame(dayjs(), 'day');
              const isPast = day.isBefore(dayjs(), 'day');

              if (isPast) return null;
              if (dayEvents.length === 0 && !isToday) return null;

              return (
                <section key={dateKey}>
                  {/* Day Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center w-12 h-12 rounded-xl',
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {day.format('MMM')}
                      </span>
                      <span className="text-lg font-black leading-none">{day.format('D')}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {isToday ? 'Hoy' : capitalize(day.format('dddd'))}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {dayEvents.length > 0
                          ? `${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`
                          : 'Sin eventos'}
                      </p>
                    </div>
                  </div>

                  {/* Events */}
                  {dayEvents.length === 0 ? (
                    <div className="ml-15 pl-4 border-l-2 border-dashed border-slate-200 dark:border-slate-700 py-4">
                      <p className="text-sm text-slate-400 italic">No hay eventos programados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((event) => {
                        const category = detectCategory(event.title);
                        const catMeta = CATEGORY_META[category];
                        const relativeTime = getRelativeTime(event);

                        return (
                          <button
                            key={event.id}
                            onClick={() => openEvent(event)}
                            className={cn(
                              'w-full text-left rounded-xl p-3 transition-all active:scale-[0.99]',
                              'bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50',
                              'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                            )}
                          >
                            <div className="flex gap-3">
                              {/* Time Column */}
                              <div className="flex flex-col items-center w-14 shrink-0">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  {formatShortTime(event)}
                                </span>
                                {event.end && !event.allDay && (
                                  <span className="text-[10px] text-slate-400">
                                    {dayjs(event.end).format('HH:mm')}
                                  </span>
                                )}
                              </div>

                              {/* Color Bar */}
                              <div
                                className={cn('w-1 rounded-full self-stretch', catMeta.accent)}
                              />

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-foreground leading-tight line-clamp-2">
                                    {event.title}
                                  </p>
                                  {relativeTime && (
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                      {relativeTime}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  {event.location && (
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate max-w-[150px]">
                                        {event.location}
                                      </span>
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                                      catMeta.bg,
                                      catMeta.text
                                    )}
                                  >
                                    {catMeta.label}
                                  </span>
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: Month View - Google Calendar Style
  // ============================================================
  const renderMonthView = () => {
    const weekLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
      <div className="space-y-4 pb-20">
        {/* Month Grid */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-3 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekLabels.map((label, i) => (
              <div
                key={label + i}
                className={cn(
                  'text-[11px] font-bold text-center py-1',
                  i >= 5 ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const isInMonth = day.isSame(cursorDate, 'month');
              const isSelected = day.isSame(selectedDate, 'day');
              const isToday = day.isSame(dayjs(), 'day');
              const dateKey = day.format('YYYY-MM-DD');
              const dayEventsList = eventsByDate[dateKey] || [];
              const count = dayEventsList.length;

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    'relative flex flex-col items-center p-1 rounded-lg transition-all min-h-[52px]',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                    !isInMonth && !isSelected && 'opacity-30'
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-foreground',
                      isToday &&
                        !isSelected &&
                        'bg-blue-100 dark:bg-blue-900/50 rounded-full w-6 h-6 flex items-center justify-center'
                    )}
                  >
                    {day.format('D')}
                  </span>

                  {/* Mini events */}
                  <div className="flex flex-col gap-0.5 mt-1 w-full px-0.5">
                    {dayEventsList.slice(0, 2).map((ev) => {
                      const cat = detectCategory(ev.title);
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            'text-[8px] font-medium truncate px-1 py-0.5 rounded',
                            isSelected
                              ? 'bg-white/20 text-white'
                              : CATEGORY_META[cat].bg + ' ' + CATEGORY_META[cat].text
                          )}
                        >
                          {formatShortTime(ev)}
                        </div>
                      );
                    })}
                    {count > 2 && (
                      <span
                        className={cn(
                          'text-[8px] font-bold text-center',
                          isSelected ? 'text-white/70' : 'text-slate-400'
                        )}
                      >
                        +{count - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'flex flex-col items-center justify-center w-12 h-12 rounded-xl',
                selectedDate.isSame(dayjs(), 'day')
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {selectedDate.format('MMM')}
              </span>
              <span className="text-lg font-black leading-none">{selectedDate.format('D')}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {selectedDate.isSame(dayjs(), 'day')
                  ? 'Hoy'
                  : capitalize(selectedDate.format('dddd'))}
              </h3>
              <p className="text-xs text-slate-500">
                {(eventsByDate[selectedDate.format('YYYY-MM-DD')]?.length ?? 0) > 0
                  ? `${eventsByDate[selectedDate.format('YYYY-MM-DD')]?.length} eventos`
                  : 'Sin eventos'}
              </p>
            </div>
          </div>

          {(() => {
            const dateKey = selectedDate.format('YYYY-MM-DD');
            const dailyEvents = eventsByDate[dateKey] || [];

            if (dailyEvents.length === 0) {
              return (
                <div className="text-center py-8 text-slate-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="font-medium">No hay eventos este día</p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {dailyEvents.map((event) => {
                  const category = detectCategory(event.title);
                  const catMeta = CATEGORY_META[category];

                  return (
                    <button
                      key={event.id}
                      onClick={() => openEvent(event)}
                      className="w-full text-left rounded-xl p-3 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-md transition-all active:scale-[0.99]"
                    >
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center w-14 shrink-0">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {formatShortTime(event)}
                          </span>
                        </div>
                        <div className={cn('w-1 rounded-full self-stretch', catMeta.accent)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{event.title}</p>
                          {event.location && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: Agenda View - List Style
  // ============================================================
  const renderAgendaView = () => {
    // Group by date
    const groupedEvents: Record<string, Event[]> = {};
    for (const event of upcomingEvents) {
      const dateKey = dayjs(event.start).format('YYYY-MM-DD');
      (groupedEvents[dateKey] ||= []).push(event);
    }

    const sortedDates = Object.keys(groupedEvents).sort();

    return (
      <div className="space-y-4 pb-20">
        {sortedDates.length === 0 ? (
          <EmptyCalendar onRefresh={handleRefresh} />
        ) : (
          sortedDates.map((dateKey) => {
            const day = dayjs(dateKey);
            const isToday = day.isSame(dayjs(), 'day');
            const isTomorrow = day.isSame(dayjs().add(1, 'day'), 'day');
            const dayEvents = groupedEvents[dateKey] || [];

            return (
              <section key={dateKey}>
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-6 px-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex flex-col items-center justify-center',
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <span className="text-[9px] font-bold uppercase">{day.format('MMM')}</span>
                      <span className="text-base font-black leading-none">{day.format('D')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {isToday ? 'Hoy' : isTomorrow ? 'Mañana' : capitalize(day.format('dddd'))}
                      </p>
                      <p className="text-xs text-slate-500">{day.format('D [de] MMMM')}</p>
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-2 mt-2">
                  {dayEvents.map((event) => {
                    const category = detectCategory(event.title);
                    const catMeta = CATEGORY_META[category];
                    const relativeTime = isToday ? getRelativeTime(event) : null;

                    return (
                      <button
                        key={event.id}
                        onClick={() => openEvent(event)}
                        className="w-full text-left rounded-xl p-3 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-md transition-all active:scale-[0.99]"
                      >
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center w-12 shrink-0">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {formatShortTime(event)}
                            </span>
                            {event.end && !event.allDay && (
                              <span className="text-[10px] text-slate-400">
                                {dayjs(event.end).format('HH:mm')}
                              </span>
                            )}
                          </div>
                          <div className={cn('w-1 rounded-full self-stretch', catMeta.accent)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-foreground line-clamp-1">
                                {event.title}
                              </p>
                              {relativeTime && (
                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                  {relativeTime}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {event.location && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{event.location}</span>
                                </span>
                              )}
                              <span
                                className={cn(
                                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                                  catMeta.bg,
                                  catMeta.text
                                )}
                              >
                                {catMeta.label}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-4 flex flex-col sticky top-0 z-20"
        style={{
          background: 'var(--glass-background)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {viewMode === 'agenda'
                ? 'Próximos'
                : viewMode === 'month'
                  ? capitalize(cursorDate.format('MMMM'))
                  : `${weekStart.format('D')} – ${weekEnd.format('D MMM')}`}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {viewMode === 'agenda'
                ? 'Próximos 30 días'
                : viewMode === 'month'
                  ? cursorDate.format('YYYY')
                  : cursorDate.format('MMMM YYYY')}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={loading || isRevalidating}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95 disabled:opacity-50"
              aria-label="Actualizar"
            >
              <RefreshCw className={cn('w-5 h-5', (loading || isRevalidating) && 'animate-spin')} />
            </button>
            {viewMode !== 'agenda' && (
              <button
                onClick={handleToday}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95"
              >
                Hoy
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 flex items-center justify-between">
          {viewMode !== 'agenda' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {viewMode === 'agenda' && <div />}

          {/* View Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => {
                setViewMode('week');
                haptics.light();
              }}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
              title="Vista semanal"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('month');
                haptics.light();
              }}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
              title="Vista mensual"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('agenda');
                haptics.light();
              }}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
              title="Vista agenda"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
        {error ? (
          <ErrorState onRetry={handleRefresh} />
        ) : loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : viewMode === 'week' ? (
          renderWeekView()
        ) : viewMode === 'month' ? (
          renderMonthView()
        ) : (
          renderAgendaView()
        )}
      </div>

      {/* Event Details Sheet */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeEvent}
            aria-label="Cerrar detalles"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[28px] shadow-2xl animate-slide-up"
            style={{ maxHeight: '85vh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <button
              onClick={closeEvent}
              className="absolute top-3 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className="px-6 pb-8 overflow-y-auto"
              style={{
                maxHeight: 'calc(85vh - 60px)',
                paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
              }}
            >
              <div className="space-y-5">
                {/* Category color header */}
                {(() => {
                  const category = detectCategory(activeEvent.title);
                  const catMeta = CATEGORY_META[category];
                  return (
                    <div className={cn('rounded-xl p-4', catMeta.bg)}>
                      <span
                        className={cn('text-xs font-bold uppercase tracking-wider', catMeta.text)}
                      >
                        {catMeta.label}
                      </span>
                      <h2 className="text-xl font-black text-foreground leading-tight mt-1">
                        {activeEvent.title}
                      </h2>
                    </div>
                  );
                })()}

                {/* Date & Time */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {capitalize(dayjs(activeEvent.start).format('dddd, D [de] MMMM'))}
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatEventTime(activeEvent)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {activeEvent.location && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Ubicación
                      </p>
                      <p className="text-sm font-medium text-foreground">{activeEvent.location}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {activeEvent.description && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      Descripción
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                      {activeEvent.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => void handleShareEvent(activeEvent)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir
                  </button>
                  <button
                    onClick={() => downloadICS(activeEvent)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarComponent;
