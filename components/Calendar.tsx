'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Share2,
  Download,
  Grid3X3,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { haptics } from '@/lib/haptics';
import { Card } from '@/components/ui/Card';
import { EmptyCalendar, ErrorState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

dayjs.locale('es');

type ViewMode = 'week' | 'month';

type ApiResponse = {
  events: Event[];
  cached?: boolean;
  lastUpdate?: string;
};

type EventCategory = 'mass' | 'confession' | 'adoration' | 'meeting' | 'other';

interface Event {
  id: string;
  title: string;
  start: string; // ISO date string
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
  { label: string; accent: string; pill: string; dot: string }
> = {
  mass: {
    label: 'Misa',
    accent: 'bg-blue-600',
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  confession: {
    label: 'Confesión',
    accent: 'bg-violet-600',
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200',
    dot: 'bg-violet-500',
  },
  adoration: {
    label: 'Adoración',
    accent: 'bg-amber-600',
    pill: 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  meeting: {
    label: 'Actividad',
    accent: 'bg-emerald-600',
    pill: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  other: {
    label: 'Evento',
    accent: 'bg-slate-500',
    pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    dot: 'bg-slate-400',
  },
};

function formatEventTime(event: Event) {
  if (event.allDay) return 'Todo el día';
  const start = dayjs(event.start);
  const end = event.end ? dayjs(event.end) : null;
  if (end && end.isValid() && !end.isSame(start, 'minute')) {
    return `${start.format('HH:mm')}–${end.format('HH:mm')}`;
  }
  return start.format('HH:mm');
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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ cached: boolean; lastUpdate?: string } | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  const visibleRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: cursorDate.startOf('month').startOf('week'),
        end: cursorDate.endOf('month').endOf('week'),
      };
    }
    return {
      start: cursorDate.startOf('week'),
      end: cursorDate.endOf('week'),
    };
  }, [cursorDate, viewMode]);

  const loadEvents = useCallback(
    async (opts: { forceRefresh?: boolean } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: visibleRange.start.toDate().toISOString(),
          end: visibleRange.end.toDate().toISOString(),
        });

        if (opts.forceRefresh) {
          params.set('refresh', 'true');
          params.set('ts', String(Date.now())); // cache-buster (también para SW)
        }

        const res = await fetch(`/api/calendar/events?${params.toString()}`, {
          cache: opts.forceRefresh ? 'no-store' : 'default',
        });

        const data = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok) {
          throw new Error(
            data?.events
              ? 'Error al cargar eventos'
              : (data as any)?.error || 'Error al cargar eventos'
          );
        }

        setEvents(Array.isArray(data?.events) ? data!.events : []);
        setMeta({ cached: Boolean(data?.cached), lastUpdate: data?.lastUpdate });
      } catch (err) {
        console.error(err);
        setEvents([]);
        setMeta(null);
        setError('No se pudieron cargar los eventos. Revisa tu conexión e inténtalo de nuevo.');
        haptics.error();
      } finally {
        setLoading(false);
      }
    },
    [visibleRange.end, visibleRange.start]
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // Group events by date for rendering
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
    void loadEvents({ forceRefresh: true });
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
        await navigator.share({
          title: event.title,
          text,
          url: window.location.href,
        });
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

  // --- Render Helpers ---

  const renderWeekView = () => {
    return (
      <div className="space-y-6">
        {/* Date Strip (Week) */}
        <div className="flex justify-between items-center bg-card-background rounded-2xl p-2 shadow-sm border border-card-border">
          <button
            onClick={handlePrev}
            className="p-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 justify-center">
            {weekDays.map((day) => {
              const isSelected = day.isSame(selectedDate, 'day');
              const isToday = day.isSame(dayjs(), 'day');
              const dateKey = day.format('YYYY-MM-DD');
              const count = eventsByDate[dateKey]?.length ?? 0;
              const dotClass =
                count > 0
                  ? CATEGORY_META[detectCategory(eventsByDate[dateKey]?.[0]?.title || '')].dot
                  : '';

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[46px] h-[64px] rounded-2xl transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
                    isToday &&
                      !isSelected &&
                      'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <span className="text-[10px] uppercase font-semibold tracking-wide mb-0.5">
                    {day.format('ddd')}
                  </span>
                  <span
                    className={cn(
                      'text-lg font-bold leading-none',
                      isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {day.format('D')}
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-1.5 w-1.5 rounded-full transition-opacity',
                      isSelected ? 'bg-white/90' : count > 0 ? dotClass : 'bg-transparent'
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="p-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Agenda semanal */}
        {!loading && !error && events.length === 0 ? (
          <EmptyCalendar onRefresh={handleRefresh} />
        ) : (
          <div className="space-y-6 pb-20">
            {weekDays.map((day) => {
              const dateKey = day.format('YYYY-MM-DD');
              const dayEvents = eventsByDate[dateKey] || [];
              const isSelected = day.isSame(selectedDate, 'day');

              if (dayEvents.length === 0 && !isSelected) return null;

              return (
                <section key={dateKey} className="space-y-3">
                  <div className="flex items-baseline justify-between px-1">
                    <h3 className="text-base font-extrabold text-foreground tracking-tight">
                      {day.isSame(dayjs(), 'day') ? 'Hoy' : capitalize(day.format('dddd'))}
                      <span className="ml-2 text-sm font-semibold text-slate-500">
                        {day.format('D [de] MMMM')}
                      </span>
                    </h3>
                    {dayEvents.length > 0 && (
                      <span className="text-xs font-semibold text-slate-500">
                        {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    )}
                  </div>

                  {dayEvents.length === 0 ? (
                    <Card
                      variant="flat"
                      className="py-6 flex items-center justify-center text-center text-slate-400"
                    >
                      <p className="text-sm font-medium">Sin eventos</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {dayEvents.map((event, idx) => {
                        const category = detectCategory(event.title || '');
                        const meta = CATEGORY_META[category];

                        return (
                          <Card
                            key={event.id}
                            variant="flat"
                            padding="none"
                            className="overflow-hidden stagger-item"
                            style={{ animationDelay: `${0.05 + idx * 0.05}s` }}
                          >
                            <button
                              onClick={() => openEvent(event)}
                              className="w-full text-left p-4 relative active:scale-[0.99] transition-transform touch-feedback"
                            >
                              <div
                                className={cn(
                                  'absolute left-0 top-3 bottom-3 w-1 rounded-full',
                                  meta.accent
                                )}
                              />
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-base font-bold text-foreground leading-snug">
                                    {event.title}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1.5 font-semibold">
                                      <Clock className="w-3.5 h-3.5" />
                                      {formatEventTime(event)}
                                    </span>
                                    {event.location && (
                                      <span className="inline-flex items-center gap-1.5 min-w-0">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[220px]">
                                          {event.location}
                                        </span>
                                      </span>
                                    )}
                                    <span
                                      className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-full font-semibold',
                                        meta.pill
                                      )}
                                    >
                                      {meta.label}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 mt-1 shrink-0" />
                              </div>
                            </button>
                          </Card>
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

  const renderMonthView = () => {
    const weekLabels = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day').format('dd'));

    return (
      <div className="space-y-6 pb-20">
        <Card variant="flat" padding="sm" className="overflow-hidden">
          <div className="grid grid-cols-7 gap-1.5 px-1 pb-2">
            {weekLabels.map((label) => (
              <div
                key={label}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((day) => {
              const isInMonth = day.isSame(cursorDate, 'month');
              const isSelected = day.isSame(selectedDate, 'day');
              const isToday = day.isSame(dayjs(), 'day');
              const dateKey = day.format('YYYY-MM-DD');
              const count = eventsByDate[dateKey]?.length ?? 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    'h-11 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    !isInMonth && !isSelected && 'text-slate-300 dark:text-slate-600',
                    isToday &&
                      !isSelected &&
                      'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
                  )}
                  aria-label={day.format('D [de] MMMM YYYY')}
                >
                  <span className={cn('text-sm font-extrabold', isSelected ? 'text-white' : '')}>
                    {day.format('D')}
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-1.5 w-1.5 rounded-full transition-opacity',
                      isSelected ? 'bg-white/90' : count > 0 ? 'bg-blue-500' : 'bg-transparent',
                      !isInMonth && count > 0 && !isSelected && 'bg-slate-300 dark:bg-slate-600'
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </Card>

        {/* Eventos del día seleccionado */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              {selectedDate.isSame(dayjs(), 'day')
                ? 'Hoy'
                : capitalize(selectedDate.format('dddd'))}
              <span className="ml-2 text-sm font-semibold text-slate-500">
                {selectedDate.format('D [de] MMMM')}
              </span>
            </h3>
            {(eventsByDate[selectedDate.format('YYYY-MM-DD')]?.length ?? 0) > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                {eventsByDate[selectedDate.format('YYYY-MM-DD')]?.length ?? 0}{' '}
                {(eventsByDate[selectedDate.format('YYYY-MM-DD')]?.length ?? 0) === 1
                  ? 'evento'
                  : 'eventos'}
              </span>
            )}
          </div>

          {(() => {
            const dateKey = selectedDate.format('YYYY-MM-DD');
            const dailyEvents = eventsByDate[dateKey] || [];

            if (dailyEvents.length === 0) {
              return (
                <Card
                  variant="flat"
                  className="py-8 flex flex-col items-center text-center text-slate-400"
                >
                  <Grid3X3 className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-medium">No hay eventos ese día</p>
                </Card>
              );
            }

            return (
              <div className="space-y-3">
                {dailyEvents.map((event) => {
                  const category = detectCategory(event.title || '');
                  const meta = CATEGORY_META[category];

                  return (
                    <Card key={event.id} variant="flat" padding="none" className="overflow-hidden">
                      <button
                        onClick={() => openEvent(event)}
                        className="w-full text-left p-4 relative active:scale-[0.99] transition-transform"
                      >
                        <div
                          className={cn(
                            'absolute left-0 top-3 bottom-3 w-1 rounded-full',
                            meta.accent
                          )}
                        />
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-base font-bold text-foreground leading-snug">
                              {event.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                {formatEventTime(event)}
                              </span>
                              {event.location && (
                                <span className="inline-flex items-center gap-1.5 min-w-0">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[220px]">{event.location}</span>
                                </span>
                              )}
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full font-semibold',
                                  meta.pill
                                )}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 mt-1 shrink-0" />
                        </div>
                      </button>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Premium Header */}
      <div
        className="px-6 pt-12 pb-4 flex flex-col sticky top-0 z-10"
        style={{
          background: 'var(--glass-background)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div className="flex justify-between items-end gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Calendario</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'month'
                ? capitalize(cursorDate.format('MMMM YYYY'))
                : `${weekStart.format('D MMM')} – ${weekEnd.format('D MMM YYYY')}`}
            </p>
            {meta?.lastUpdate && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {meta.cached ? 'En caché' : 'Actualizado'} ·{' '}
                {dayjs(meta.lastUpdate).format('DD MMM HH:mm')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95 disabled:opacity-50"
              aria-label="Actualizar"
            >
              <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-[var(--surface-primary)] text-[var(--tab-active-text)] hover:bg-[var(--surface-primary-strong)] transition-all active:scale-95"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* View Toggle - Segmented Control */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              aria-label={viewMode === 'week' ? 'Semana anterior' : 'Mes anterior'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              aria-label={viewMode === 'week' ? 'Semana siguiente' : 'Mes siguiente'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => {
                setViewMode('week');
                haptics.light();
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              Semana
            </button>
            <button
              onClick={() => {
                setViewMode('month');
                haptics.light();
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
        {error ? (
          <ErrorState onRetry={handleRefresh} />
        ) : loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : viewMode === 'week' ? (
          renderWeekView()
        ) : (
          renderMonthView()
        )}
      </div>

      {/* Event Details Sheet */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeEvent}
            aria-label="Cerrar detalles"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-t-[32px] shadow-2xl border-t border-white/10 dark:border-slate-800/50 px-6 pt-4 pb-6 pb-safe animate-slide-up"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <span className="sr-only">Detalles del evento</span>
              <button
                onClick={closeEvent}
                className="ml-auto p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors active:scale-95"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground leading-snug">
                  {activeEvent.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                  {capitalize(dayjs(activeEvent.start).format('dddd'))},{' '}
                  {dayjs(activeEvent.start).format('D [de] MMMM')} · {formatEventTime(activeEvent)}
                </p>
              </div>

              {(activeEvent.location || activeEvent.description) && (
                <Card variant="flat" className="space-y-3">
                  {activeEvent.location && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <p className="text-slate-700 dark:text-slate-200">{activeEvent.location}</p>
                    </div>
                  )}
                  {activeEvent.description && (
                    <div className="flex items-start gap-3 text-sm">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                        {activeEvent.description}
                      </p>
                    </div>
                  )}
                </Card>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => void handleShareEvent(activeEvent)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 font-bold text-sm hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <button
                  onClick={() => downloadICS(activeEvent)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Default export is needed for dynamic imports in page.tsx
export default CalendarComponent;
