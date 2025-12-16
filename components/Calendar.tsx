'use client';

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type TouchEvent as ReactTouchEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Share2,
  Download,
  Loader2,
  X,
  MoreHorizontal,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { haptics } from '@/lib/haptics';
import { ErrorState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useCalendarEvents } from '@/hooks/useCachedFetch';

dayjs.locale('es');

// =============================================================================
// TYPES
// =============================================================================
type ViewMode = 'compact' | 'detailed' | 'agenda';
type EventCategory = 'mass' | 'confession' | 'adoration' | 'meeting' | 'other';
type SnapPoint = 'collapsed' | 'half' | 'full';

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
// CONSTANTS
// =============================================================================
const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  collapsed: 180,
  half: 0.55,
  full: 0.9,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  compact: 'Mes',
  detailed: 'Detalle',
  agenda: 'Agenda',
};

const CATEGORY_CLASSES: Record<EventCategory, { dot: string; chip: string }> = {
  mass: { dot: 'cal-cat-mass', chip: 'cal-chip-mass' },
  confession: { dot: 'cal-cat-confession', chip: 'cal-chip-confession' },
  adoration: { dot: 'cal-cat-adoration', chip: 'cal-chip-adoration' },
  meeting: { dot: 'cal-cat-meeting', chip: 'cal-chip-meeting' },
  other: { dot: 'cal-cat-other', chip: 'cal-chip-other' },
};

// =============================================================================
// UTILITIES
// =============================================================================
function capitalize(value: string): string {
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

function formatEventTime(event: Event): string {
  if (event.allDay) return 'Todo el día';
  const start = dayjs(event.start);
  const end = event.end ? dayjs(event.end) : null;
  if (end && end.isValid() && !end.isSame(start, 'minute')) {
    return `${start.format('HH:mm')} – ${end.format('HH:mm')}`;
  }
  return start.format('HH:mm');
}

function formatShortTime(event: Event): string {
  if (event.allDay) return 'Día';
  return dayjs(event.start).format('HH:mm');
}

// ICS helpers
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildICS(event: Event): string {
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

/** iOS-style Segmented Control */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const modes: ViewMode[] = ['compact', 'detailed', 'agenda'];
  const activeIndex = modes.indexOf(value);

  return (
    <div className="px-4 pb-3">
      <div className="segmented-control relative">
        {/* Sliding background */}
        <div
          className="absolute top-[2px] bottom-[2px] bg-[var(--cal-surface)] rounded-[7px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-out"
          style={{
            width: `calc(${100 / modes.length}% - 2px)`,
            left: '2px',
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
          }}
        />
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => {
              haptics.light();
              onChange(mode);
            }}
            className="segmented-button"
            data-active={value === mode}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Calendar Header with navigation and actions */
function CalendarHeader({
  currentMonth,
  onPrev,
  onNext,
  onToday,
  onRefresh,
  isRefreshing,
}: {
  currentMonth: dayjs.Dayjs;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--cal-surface-secondary)] active:scale-95 transition-all"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--cal-text-secondary)]" />
        </button>

        <h1
          className="font-semibold text-[var(--cal-text-primary)] min-w-[160px] text-center tracking-tight"
          style={{ fontSize: 'clamp(20px, 3.6vw, 26px)' }}
        >
          {capitalize(currentMonth.format('MMMM YYYY'))}
        </h1>

        <button
          onClick={onNext}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--cal-surface-secondary)] active:scale-95 transition-all"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 text-[var(--cal-text-secondary)]" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToday}
          className="px-3 h-8 text-[13px] font-semibold text-[var(--cal-primary)] rounded-full hover:bg-[var(--cal-primary-soft)] active:scale-95 transition-all"
        >
          Hoy
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--cal-surface-secondary)] active:scale-95 transition-all"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="w-5 h-5 text-[var(--cal-text-secondary)]" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-[var(--cal-surface)] rounded-xl shadow-lg border border-[var(--cal-border)] py-1 min-w-[160px] cal-animate-fade-scale">
                <button
                  onClick={() => {
                    onRefresh();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[var(--cal-text-primary)] hover:bg-[var(--cal-surface-secondary)] transition-colors"
                >
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                  Actualizar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Weekday row header */
function WeekdayRow() {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <div className="grid grid-cols-7 px-2 mb-1">
      {days.map((day, i) => (
        <div
          key={day + i}
          className={cn(
            'h-8 flex items-center justify-center text-[11px] font-semibold tracking-wide',
            i >= 5 ? 'text-[var(--cal-text-tertiary)]' : 'text-[var(--cal-text-secondary)]'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
}

/** Single day cell - Compact mode (dots only) */
function DayCellCompact({
  day,
  isToday,
  isSelected,
  isCurrentMonth,
  events,
  onSelect,
}: {
  day: dayjs.Dayjs;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: Event[];
  onSelect: () => void;
}) {
  const categories = events.slice(0, 3).map((e) => detectCategory(e.title));
  const hasOverflow = events.length > 3;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'cal-day py-1',
        !isCurrentMonth && 'cal-day-other-month',
        isToday && 'cal-day-today',
        isSelected && 'cal-day-selected'
      )}
      aria-label={`${day.format('D [de] MMMM')}, ${events.length} eventos`}
      aria-pressed={isSelected}
    >
      <span className="cal-day-number">{day.format('D')}</span>

      {events.length > 0 && (
        <div className="cal-dots">
          {categories.map((cat, i) => (
            <span
              key={i}
              className={cn('cal-dot', isSelected ? 'bg-white/70' : CATEGORY_CLASSES[cat].dot)}
            />
          ))}
          {hasOverflow && (
            <span className={cn('cal-dot-overflow', isSelected && 'text-white/60')}>
              +{events.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/** Single day cell - Detailed mode (chips) */
function DayCellDetailed({
  day,
  isToday,
  isSelected,
  isCurrentMonth,
  events,
  onSelect,
}: {
  day: dayjs.Dayjs;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: Event[];
  onSelect: () => void;
}) {
  const visibleEvents = events.slice(0, 2);
  const overflow = events.length - 2;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex flex-col items-stretch p-1 min-h-[72px] border-b border-r border-[var(--cal-border-subtle)] transition-colors',
        !isCurrentMonth && 'opacity-30',
        isSelected && 'bg-[var(--cal-primary-soft)]'
      )}
      aria-label={`${day.format('D [de] MMMM')}, ${events.length} eventos`}
    >
      <span
        className={cn(
          'w-7 h-7 flex items-center justify-center rounded-full font-medium mb-1 self-end',
          isToday && !isSelected && 'bg-[var(--cal-today)] text-white',
          isSelected && 'bg-[var(--cal-primary)] text-white',
          !isToday && !isSelected && 'text-[var(--cal-text-primary)]'
        )}
        style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}
      >
        {day.format('D')}
      </span>

      <div className="flex flex-col gap-[2px] flex-1 min-w-0">
        {visibleEvents.map((event) => {
          const cat = detectCategory(event.title);
          return (
            <div key={event.id} className={cn('cal-event-chip', CATEGORY_CLASSES[cat].chip)}>
              {event.title}
            </div>
          );
        })}
        {overflow > 0 && (
          <span className="text-[9px] font-medium text-[var(--cal-text-secondary)] pl-1">
            +{overflow} más
          </span>
        )}
      </div>
    </button>
  );
}

/** Month Grid - supports compact and detailed modes */
function MonthGrid({
  currentMonth,
  selectedDate,
  eventsByDate,
  viewMode,
  onSelectDate,
}: {
  currentMonth: dayjs.Dayjs;
  selectedDate: dayjs.Dayjs;
  eventsByDate: Record<string, Event[]>;
  viewMode: 'compact' | 'detailed';
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

  const DayCell = viewMode === 'compact' ? DayCellCompact : DayCellDetailed;

  return (
    <div
      className={cn(
        'px-2',
        viewMode === 'detailed' && 'border-t border-l border-[var(--cal-border-subtle)]'
      )}
    >
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = day.format('YYYY-MM-DD');
          const events = eventsByDate[dateKey] || [];

          return (
            <DayCell
              key={dateKey}
              day={day}
              isToday={day.isSame(today, 'day')}
              isSelected={day.isSame(selectedDate, 'day')}
              isCurrentMonth={day.isSame(currentMonth, 'month')}
              events={events}
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

/** Event Card for agenda views */
function EventCard({
  event,
  onTap,
  showDate = false,
}: {
  event: Event;
  onTap: () => void;
  showDate?: boolean;
}) {
  const category = detectCategory(event.title);

  return (
    <button onClick={onTap} className="cal-event-card w-full text-left">
      <div className={cn('cal-event-indicator self-stretch', CATEGORY_CLASSES[category].dot)} />

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-[var(--cal-text-primary)] leading-snug truncate"
          style={{ fontSize: 'clamp(16px, 2.6vw, 18px)' }}
        >
          {event.title}
        </p>

        <div
          className="flex items-center gap-2 mt-1 text-[var(--cal-text-secondary)]"
          style={{ fontSize: 'clamp(13px, 2.2vw, 15px)' }}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            {showDate && `${capitalize(dayjs(event.start).format('ddd D'))} · `}
            {formatShortTime(event)}
          </span>
        </div>

        {event.location && (
          <div
            className="flex items-center gap-2 mt-0.5 text-[var(--cal-text-secondary)]"
            style={{ fontSize: 'clamp(13px, 2.2vw, 15px)' }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-[var(--cal-text-tertiary)] self-center shrink-0" />
    </button>
  );
}

/** Draggable Agenda Panel with snap points */
function AgendaPanel({
  selectedDate,
  events,
  onEventTap,
  snapPoint,
  onSnapChange,
}: {
  selectedDate: dayjs.Dayjs;
  events: Event[];
  onEventTap: (event: Event) => void;
  snapPoint: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isToday = selectedDate.isSame(dayjs(), 'day');

  // Calculate actual height from snap point
  const getSnapHeight = useCallback((snap: SnapPoint): number => {
    if (typeof window === 'undefined') return SNAP_HEIGHTS.collapsed;
    const vh = window.innerHeight;
    const value = SNAP_HEIGHTS[snap];
    return typeof value === 'number' ? value : vh * value;
  }, []);

  // Snap to nearest point
  const snapToNearest = useCallback(
    (height: number) => {
      const vh = window.innerHeight;
      const points: [SnapPoint, number][] = [
        ['collapsed', SNAP_HEIGHTS.collapsed],
        ['half', vh * 0.55],
        ['full', vh * 0.9],
      ];

      let closest: SnapPoint = 'collapsed';
      let minDiff = Infinity;

      for (const [name, target] of points) {
        const diff = Math.abs(height - target);
        if (diff < minDiff) {
          minDiff = diff;
          closest = name;
        }
      }

      onSnapChange(closest);
      setDragHeight(null); // Clear drag height, use snap point
    },
    [onSnapChange]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY: number) => {
      const h = dragHeight ?? getSnapHeight(snapPoint);
      dragStartRef.current = { y: clientY, height: h };
      setIsDragging(true);
    },
    [dragHeight, getSnapHeight, snapPoint]
  );

  // Handle drag move
  const handleDragMove = useCallback((clientY: number) => {
    if (!dragStartRef.current) return;
    const deltaY = dragStartRef.current.y - clientY;
    const newHeight = Math.max(
      100,
      Math.min(window.innerHeight * 0.95, dragStartRef.current.height + deltaY)
    );
    setDragHeight(newHeight);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (dragStartRef.current && dragHeight !== null) {
      snapToNearest(dragHeight);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  }, [dragHeight, snapToNearest]);

  // Touch handlers
  const onTouchStart = (e: ReactTouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleDragStart(touch.clientY);
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleDragMove(touch.clientY);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers (for desktop)
  const onMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);

    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onMouseUp = () => {
      handleDragEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Calculate the actual height to use
  const currentHeight = isDragging && dragHeight !== null ? dragHeight : getSnapHeight(snapPoint);

  // Lock body scroll when expanded
  useEffect(() => {
    if (snapPoint === 'full') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [snapPoint]);

  return (
    <div
      ref={panelRef}
      className="cal-agenda-panel"
      style={{
        height: `${currentHeight}px`,
        transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="cal-agenda-handle" />
      </div>

      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--cal-border-subtle)]">
        <h2
          className="font-semibold text-[var(--cal-text-primary)]"
          style={{ fontSize: 'clamp(16px, 2.8vw, 18px)' }}
        >
          {isToday ? 'Hoy' : capitalize(selectedDate.format('dddd'))}
          <span className="font-normal text-[var(--cal-text-secondary)] ml-1.5">
            {selectedDate.format('D [de] MMMM')}
          </span>
        </h2>
      </div>

      {/* Events list */}
      <div
        ref={contentRef}
        className="overflow-y-auto overscroll-contain cal-safe-bottom"
        style={{ height: 'calc(100% - 70px)' }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--cal-text-tertiary)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--cal-surface-secondary)] flex items-center justify-center mb-3">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <p className="text-[15px] font-medium">Sin eventos</p>
            <p className="text-[13px] mt-0.5">No hay actividades programadas</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onTap={() => {
                  haptics.medium();
                  onEventTap(event);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full Agenda View (continuous list by date) */
function AgendaView({
  events,
  onEventTap,
}: {
  events: Event[];
  onEventTap: (event: Event) => void;
}) {
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: dayjs.Dayjs; events: Event[] }[] = [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    for (const event of sorted) {
      const eventDate = dayjs(event.start).startOf('day');
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date.isSame(eventDate, 'day')) {
        lastGroup.events.push(event);
      } else {
        groups.push({ date: eventDate, events: [event] });
      }
    }

    return groups;
  }, [events]);

  const today = dayjs();

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--cal-text-tertiary)]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--cal-surface-secondary)] flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <p className="text-[17px] font-medium">Sin eventos próximos</p>
        <p className="text-[14px] mt-1">No hay actividades programadas</p>
      </div>
    );
  }

  return (
    <div className="pb-24 cal-safe-bottom">
      {groupedEvents.map(({ date, events: dayEvents }) => {
        const isToday = date.isSame(today, 'day');
        const isTomorrow = date.isSame(today.add(1, 'day'), 'day');

        return (
          <div key={date.format('YYYY-MM-DD')}>
            {/* Date Header */}
            <div className="sticky top-0 z-10 px-4 py-2.5 bg-[var(--cal-bg)]/95 backdrop-blur-sm border-b border-[var(--cal-border-subtle)]">
              <h3
                className="font-semibold text-[var(--cal-text-secondary)] uppercase tracking-wide"
                style={{ fontSize: 'clamp(13px, 2.2vw, 15px)' }}
              >
                {isToday ? (
                  <span className="text-[var(--cal-today)]">Hoy</span>
                ) : isTomorrow ? (
                  'Mañana'
                ) : (
                  capitalize(date.format('dddd, D [de] MMMM'))
                )}
              </h3>
            </div>

            {/* Events */}
            <div className="p-3 space-y-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onTap={() => {
                    haptics.medium();
                    onEventTap(event);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Event Detail Bottom Sheet */
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

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-[var(--cal-surface)] rounded-t-[20px] shadow-2xl animate-slide-up max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-[var(--cal-border)]" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--cal-surface-secondary)] text-[var(--cal-text-secondary)] hover:bg-[var(--cal-border)] transition-colors active:scale-95"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto flex-1 cal-safe-bottom">
          {/* Category indicator + Title */}
          <div className="flex items-start gap-3 mb-5">
            <div className={cn('w-1 self-stretch rounded-full', CATEGORY_CLASSES[category].dot)} />
            <div className="flex-1 pr-6">
              <h2 className="text-[22px] font-bold text-[var(--cal-text-primary)] leading-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="bg-[var(--cal-surface-secondary)] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--cal-primary-soft)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--cal-primary)]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--cal-text-primary)]">
                  {capitalize(dayjs(event.start).format('dddd, D [de] MMMM'))}
                </p>
                <p className="text-[17px] font-semibold text-[var(--cal-primary)]">
                  {formatEventTime(event)}
                </p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          {event.location && (
            <div className="bg-[var(--cal-surface-secondary)] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--cal-surface)] flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[var(--cal-text-secondary)]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[var(--cal-text-tertiary)] uppercase tracking-wide">
                    Ubicación
                  </p>
                  <p className="text-[15px] text-[var(--cal-text-primary)]">{event.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          {event.description && (
            <div className="bg-[var(--cal-surface-secondary)] rounded-xl p-4 mb-5">
              <p className="text-[11px] font-semibold text-[var(--cal-text-tertiary)] uppercase tracking-wide mb-2">
                Descripción
              </p>
              <p className="text-[15px] text-[var(--cal-text-primary)] leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onShare}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[var(--cal-surface-secondary)] text-[var(--cal-text-primary)] font-semibold text-[15px] hover:bg-[var(--cal-border)] active:scale-[0.98] transition-all"
            >
              <Share2 className="w-5 h-5" />
              Compartir
            </button>
            <button
              onClick={onDownload}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[var(--cal-primary)] text-white font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
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
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [currentMonth, setCurrentMonth] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [agendaSnap, setAgendaSnap] = useState<SnapPoint>('collapsed');

  // Fetch events for visible range (expanded for agenda view)
  const visibleRange = useMemo(() => {
    if (viewMode === 'agenda') {
      // For agenda view, fetch current month + next 2 months
      return {
        start: dayjs().startOf('day'),
        end: dayjs().add(3, 'month').endOf('month'),
      };
    }
    return {
      start: currentMonth.startOf('month').subtract(1, 'week'),
      end: currentMonth.endOf('month').add(1, 'week'),
    };
  }, [currentMonth, viewMode]);

  const { events, loading, error, refetch, isRevalidating } = useCalendarEvents(
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

  const handleRefresh = () => {
    haptics.medium();
    refetch(true);
  };

  const handleSelectDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date);
    }
    // Expand agenda when selecting a date
    if (agendaSnap === 'collapsed') {
      setAgendaSnap('half');
    }
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Reset agenda snap when switching views
    if (mode === 'agenda') {
      setAgendaSnap('collapsed');
    } else {
      setAgendaSnap('collapsed');
    }
  };

  const handleShare = async (event: Event) => {
    haptics.medium();
    const text = [
      event.title,
      capitalize(dayjs(event.start).format('dddd, D [de] MMMM')),
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
    <div className="flex flex-col h-full bg-[var(--cal-bg)] relative overflow-hidden">
      {/* Fixed Header Area */}
      <div
        className="bg-[var(--cal-surface)] shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <CalendarHeader
          currentMonth={currentMonth}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onRefresh={handleRefresh}
          isRefreshing={isRevalidating}
        />

        <ViewSwitcher value={viewMode} onChange={handleViewChange} />
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--cal-primary)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <ErrorState onRetry={() => refetch(true)} />
        </div>
      ) : viewMode === 'agenda' ? (
        // Full Agenda View
        <div className="flex-1 overflow-y-auto">
          <AgendaView events={events} onEventTap={(e) => setActiveEvent(e)} />
        </div>
      ) : (
        // Month Views (compact/detailed)
        <div className="flex-1 overflow-y-auto">
          {/* Calendar Grid */}
          <div className="bg-[var(--cal-surface)]">
            <WeekdayRow />
            <MonthGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              eventsByDate={eventsByDate}
              viewMode={viewMode}
              onSelectDate={handleSelectDate}
            />
            <div className="h-3" />
          </div>
          {/* Spacer for agenda panel */}
          <div style={{ height: '200px' }} />
        </div>
      )}

      {/* Draggable Agenda Panel - Fixed at bottom for month views */}
      {viewMode !== 'agenda' && (
        <AgendaPanel
          selectedDate={selectedDate}
          events={selectedEvents}
          onEventTap={(e) => {
            haptics.medium();
            setActiveEvent(e);
          }}
          snapPoint={agendaSnap}
          onSnapChange={setAgendaSnap}
        />
      )}

      {/* Tab bar spacer */}
      <div className="h-16 shrink-0 bg-[var(--cal-bg)]" />

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
