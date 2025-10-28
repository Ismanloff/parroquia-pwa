'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, X, List, ChevronLeft, ChevronRight, RefreshCw, Share2, Download } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { Loading } from '@/components/ui/Loading';

dayjs.locale('es');

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

// Colores para eventos - Paleta suave inspirada en iOS
const EVENT_COLORS = [
  { primary: '#007AFF', light: '#E5F1FF', border: '#66A3FF' }, // systemBlue
  { primary: '#5AC8FA', light: '#E0F5FF', border: '#8CD8FA' }, // systemTeal
  { primary: '#34C759', light: '#E3F9E5', border: '#7ADB89' }, // systemGreen
  { primary: '#30B0C7', light: '#E0F4F7', border: '#6AC5D4' }, // systemCyan
  { primary: '#5856D6', light: '#EEEEFF', border: '#8B8AE8' }, // systemIndigo
  { primary: '#AF52DE', light: '#F5E6FF', border: '#C98AE8' }, // systemPurple
];

const getEventColor = (eventTitle: string) => {
  const hash = eventTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EVENT_COLORS[hash % EVENT_COLORS.length] || EVENT_COLORS[0]!;
};

export function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);

  // Referencias para scroll automático
  const eventsListRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Obtener el color litúrgico del día
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  // Fetch week events
  const fetchWeekEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/events?filter=week');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setWeekEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('Error fetching week events:', error);
      setWeekEvents([]);
    }
  }, []);

  // Fetch month events
  const fetchMonthEvents = useCallback(async (date: Date) => {
    try {
      const response = await fetch(`/api/calendar/events?filter=month&date=${date.toISOString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMonthEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('Error fetching month events:', error);
      setMonthEvents([]);
    }
  }, []);

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await (viewMode === 'week' ? fetchWeekEvents() : fetchMonthEvents(selectedMonth));
    } finally {
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && e.touches[0]) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !scrollContainerRef.current || !e.touches[0]) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    if (distance > 0 && scrollContainerRef.current.scrollTop === 0) {
      const resistance = 2.5;
      const adjustedDistance = Math.min(distance / resistance, 100);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    if (pullDistance > 60) {
      await handleRefresh();
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await (viewMode === 'week' ? fetchWeekEvents() : fetchMonthEvents(selectedMonth));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [viewMode, selectedMonth, fetchWeekEvents, fetchMonthEvents]);

  // Auto-refresh cada 2 minutos
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (viewMode === 'week') {
        fetchWeekEvents();
      } else {
        fetchMonthEvents(selectedMonth);
      }
    }, 120000); // 2 minutos = 120000ms

    return () => clearInterval(intervalId);
  }, [viewMode, selectedMonth, fetchWeekEvents, fetchMonthEvents]);

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm');
  };

  const formatDate = (dateString: string) => {
    const formatted = dayjs(dateString).format('dddd, D [de] MMMM');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatShortDate = (date: Date) => {
    return dayjs(date).format('D MMM');
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (day: Date, events: CalendarEvent[]) => {
    const dayString = dayjs(day).format('YYYY-MM-DD');
    return events
      .filter((event) => dayjs(event.start).format('YYYY-MM-DD') === dayString)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setSelectedMonth(newMonth);
  };

  const isToday = (date: Date) => {
    return dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  const isTomorrow = (date: Date) => {
    return dayjs(date).format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD');
  };

  const getEventBadge = (eventDate: Date) => {
    if (isToday(eventDate)) {
      return { text: 'HOY', color: '#007AFF', bgColor: '#E5F1FF' };
    }
    if (isTomorrow(eventDate)) {
      return { text: 'MAÑANA', color: '#5AC8FA', bgColor: '#E0F5FF' };
    }
    return null;
  };

  // Estado para mostrar toast de éxito
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Compartir evento
  const handleShareEvent = async (event: CalendarEvent) => {
    const eventText = `${event.title}\n${formatDate(event.start)}\n${!event.allDay ? `${formatTime(event.start)} - ${formatTime(event.end)}` : 'Todo el día'}${event.location ? `\nLugar: ${event.location}` : ''}${event.description ? `\n\n${event.description}` : ''}`;

    // Intentar usar la Web Share API si está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: eventText,
        });
        console.log('Evento compartido exitosamente');
      } catch (error: any) {
        // Si el usuario cancela, error.name === 'AbortError'
        if (error.name !== 'AbortError') {
          console.log('Error al compartir:', error);
          // Intentar fallback
          await fallbackCopyToClipboard(eventText);
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      await fallbackCopyToClipboard(eventText);
    }
  };

  // Función auxiliar para copiar al portapapeles
  const fallbackCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Mostrar toast de éxito
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (error) {
      console.log('Error al copiar:', error);
      // Último fallback: crear un textarea temporal
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
      } catch (err) {
        console.error('Error en fallback final:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  // Descargar evento como archivo .ics
  const handleDownloadEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//APP PARRO//ES
BEGIN:VEVENT
UID:${event.id}@appparro.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
${event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : ''}
${event.location ? `LOCATION:${event.location}` : ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loading message="Cargando eventos..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header con fecha actual y color litúrgico - iOS 26 Liquid Glass Lite */}
      <div
        className="relative px-6 pt-5 pb-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}15 0%, ${liturgicalSeason.gradient[1]}25 100%)`,
        }}
      >
        {/* Efecto Liquid Glass sutil en el fondo */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }} />

        <div className="relative z-10">
          {/* Día de la semana */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {dayjs().format('dddd')}
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <RefreshCw className={`w-4 h-4 text-slate-700 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Día y mes - Tipografía grande iOS */}
          <h1 className="text-[34px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-2">
            {dayjs().format('D [de] MMMM')}
          </h1>

          {/* Badge del tiempo litúrgico */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm" style={{ backdropFilter: 'blur(10px) saturate(180%)' }}>
            <div
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: liturgicalSeason.gradient[0] }}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
              {liturgicalSeason.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs flotantes - Liquid Glass Lite iOS 26 */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg border border-white/20 dark:border-slate-700/30" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ease-out min-h-[44px] ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-[0.98]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
            style={viewMode === 'week' ? { backdropFilter: 'blur(10px)' } : {}}
          >
            <List className="w-[18px] h-[18px]" strokeWidth={2.5} />
            <span className="tracking-tight">Semanal</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ease-out min-h-[44px] ${
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-[0.98]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
            style={viewMode === 'month' ? { backdropFilter: 'blur(10px)' } : {}}
          >
            <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
            <span className="tracking-tight">Mensual</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 pb-28 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Pull to refresh indicator - iOS 26 Liquid Glass */}
        {isPulling && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
            style={{
              transform: `translateY(-${Math.max(0, 50 - pullDistance)}px)`,
              opacity: Math.min(pullDistance / 60, 1)
            }}
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-full p-4 shadow-2xl border border-white/30 dark:border-slate-700/30" style={{ backdropFilter: 'blur(30px) saturate(180%)' }}>
              <RefreshCw
                className={`w-6 h-6 text-blue-600 dark:text-blue-400 ${pullDistance > 60 ? 'animate-spin' : ''}`}
                style={{
                  transform: pullDistance > 60 ? 'none' : `rotate(${pullDistance * 4}deg)`,
                  transition: pullDistance > 60 ? 'none' : 'transform 0.1s ease-out'
                }}
                strokeWidth={2.5}
              />
            </div>
          </div>
        )}
        {viewMode === 'week' ? (
          // Vista Semanal - iOS 26 Liquid Glass Lite
          <div className="space-y-7">
            {weekEvents.length === 0 ? (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[28px] p-12 text-center shadow-lg border border-white/20 dark:border-slate-700/30" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="w-[88px] h-[88px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <CalendarIcon className="w-11 h-11 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 tracking-tight">No hay eventos</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                  No tienes eventos programados<br />para los próximos 7 días
                </p>
              </div>
            ) : (
              getNext7Days().map((day) => {
                const events = getEventsForDay(day, weekEvents);
                if (events.length === 0) return null;

                const dayLabel = isToday(day) ? 'Hoy' : isTomorrow(day) ? 'Mañana' : formatShortDate(day);

                return (
                  <div key={day.toISOString()} className="mb-7">
                    {/* Separador de día - SF Typography */}
                    <div className="flex items-center gap-2.5 mb-4 px-1">
                      <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">
                        {dayLabel}
                      </h2>
                      <div className="px-2.5 py-1 bg-gradient-to-r from-blue-500/10 to-blue-600/15 dark:from-blue-400/10 dark:to-blue-500/15 rounded-xl backdrop-blur-sm">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">
                          {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline de eventos con línea visual */}
                    <div className="relative">
                      {/* Línea vertical del timeline */}
                      {events.length > 1 && (
                        <div className="absolute left-5 top-7 bottom-7 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-full z-0" />
                      )}

                      <div className="space-y-4">
                        {events.map((event, index) => {
                          const colors = getEventColor(event.title);
                          const badge = getEventBadge(new Date(event.start));

                          return (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="w-full text-left group"
                            >
                              <div
                                className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 dark:border-slate-700/30 group-hover:scale-[1.01]"
                                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                              >
                                {/* Barra lateral de color con glow effect */}
                                <div
                                  className="w-1.5 flex-shrink-0 relative"
                                  style={{
                                    backgroundColor: colors.primary,
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 blur-sm opacity-60"
                                    style={{ backgroundColor: colors.primary }}
                                  />
                                </div>

                                <div className="flex-1 p-5">
                                  {/* Header del evento */}
                                  <div className="flex items-start justify-between mb-3">
                                    <h3 className="flex-1 text-[17px] font-semibold text-slate-900 dark:text-white leading-snug tracking-tight pr-3">
                                      {event.title}
                                    </h3>
                                    {badge && (
                                      <div
                                        className="px-2.5 py-1.5 rounded-xl shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: badge.bgColor }}
                                      >
                                        <span
                                          className="text-[10px] font-extrabold tracking-wider"
                                          style={{ color: badge.color }}
                                        >
                                          {badge.text}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Descripción */}
                                  {event.description && (
                                    <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-3.5 line-clamp-2 leading-relaxed tracking-tight">
                                      {event.description}
                                    </p>
                                  )}

                                  {/* Metadata - Pills con glassmorphism */}
                                  <div className="flex flex-wrap gap-3 items-center">
                                    {!event.allDay && (
                                      <div
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm"
                                        style={{ backgroundColor: colors.light }}
                                      >
                                        <Clock className="w-4 h-4" style={{ color: colors.primary }} strokeWidth={2.5} />
                                        <span
                                          className="text-sm font-semibold tracking-tight"
                                          style={{ color: colors.primary }}
                                        >
                                          {formatTime(event.start)}
                                        </span>
                                      </div>
                                    )}

                                    {event.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={2.5} />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                                          {event.location}
                                        </span>
                                      </div>
                                    )}

                                    {event.allDay && (
                                      <div
                                        className="px-3 py-2 rounded-xl backdrop-blur-sm"
                                        style={{ backgroundColor: colors.light }}
                                      >
                                        <span
                                          className="text-[11px] font-bold tracking-wider"
                                          style={{ color: colors.primary }}
                                        >
                                          TODO EL DÍA
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Vista Mensual - iOS 26 Liquid Glass Lite
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            {/* Selector de mes - Controles táctiles 44x44pt */}
            <div className="flex items-center justify-between mb-7">
              <button
                onClick={() => changeMonth('prev')}
                className="w-11 h-11 rounded-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-slate-700/90 flex items-center justify-center transition-all shadow-sm"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ChevronLeft className="w-[22px] h-[22px] text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {dayjs(selectedMonth).format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
              </h2>

              <button
                onClick={() => changeMonth('next')}
                className="w-11 h-11 rounded-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-slate-700/90 flex items-center justify-center transition-all shadow-sm"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ChevronRight className="w-[22px] h-[22px] text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              </button>
            </div>

            {/* Días de la semana - SF Typography */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid del calendario */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {getDaysInMonth(selectedMonth).map((day, index) => {
                const eventsForDay = day ? getEventsForDay(day, monthEvents) : [];
                const hasEvents = eventsForDay.length > 0;
                const dayIsToday = day && isToday(day);
                const dayIsSelected = day && selectedDay && day.toDateString() === selectedDay.toDateString();
                const eventColors = eventsForDay.slice(0, 3).map(e => getEventColor(e.title).primary);

                return (
                  <button
                    key={index}
                    disabled={!day}
                    onClick={() => {
                      if (day) {
                        setSelectedDay(day);
                        // Scroll automático a la lista de eventos
                        setTimeout(() => {
                          eventsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                      }
                    }}
                    className="aspect-square relative group"
                  >
                    {day && (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold transition-all ${
                            dayIsToday
                              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                              : dayIsSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-600 dark:ring-blue-400'
                              : hasEvents
                              ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        {hasEvents && !dayIsToday && (
                          <div className="flex gap-1 mt-1.5">
                            {eventColors.map((color, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full shadow-sm"
                                style={{
                                  backgroundColor: color,
                                  boxShadow: `0 0 4px ${color}40`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lista de eventos del día seleccionado */}
            <div ref={eventsListRef} className="pt-5 border-t border-slate-200/60 dark:border-slate-700/40">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-3 tracking-wide">
                {selectedDay
                  ? `Eventos del ${selectedDay.getDate()} de ${dayjs(selectedDay).format('MMMM')}`
                  : 'Selecciona un día'}
              </h3>

              {!selectedDay ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4 text-sm">
                  Toca un día en el calendario para ver sus eventos
                </p>
              ) : getEventsForDay(selectedDay, monthEvents).length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4 text-sm">
                  No hay eventos este día
                </p>
              ) : (
                <div className="space-y-2">
                  {getEventsForDay(selectedDay, monthEvents).map((event) => {
                    const colors = getEventColor(event.title);
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left flex gap-3 p-3 rounded-xl border-l-4 hover:scale-[1.01] transition-all backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colors.light}E6`,
                          borderLeftColor: colors.primary,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">{event.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tracking-tight">
                            {!event.allDay ? formatTime(event.start) : 'Todo el día'}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles del evento - iOS 26 Sheet Presentation Style */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-t-[40px] w-full max-w-2xl p-7 pb-10 shadow-2xl border-t border-white/20 dark:border-slate-700/30 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
          >
            {/* Handle bar - iOS 26 style */}
            <div className="w-9 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-6 shadow-sm" />

            {/* Header con tipografía iOS */}
            <div className="flex items-start justify-between mb-7">
              <h2 className="text-[28px] font-bold text-slate-900 dark:text-white pr-4 leading-tight tracking-tight">
                {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-11 h-11 rounded-full bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-md hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-all shadow-sm"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
              </button>
            </div>

            {/* Contenido con Liquid Glass cards */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-4 items-start bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl p-[18px] rounded-2xl border border-white/20 dark:border-slate-600/30 shadow-sm" style={{ backdropFilter: 'blur(20px)' }}>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Clock className="w-[22px] h-[22px] text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-[17px] text-slate-900 dark:text-white mb-1.5 tracking-tight leading-snug">
                    {formatDate(selectedEvent.start)}
                  </p>
                  {!selectedEvent.allDay ? (
                    <p className="text-[15px] text-slate-600 dark:text-slate-400 tracking-tight">
                      {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                    </p>
                  ) : (
                    <p className="text-[15px] text-slate-600 dark:text-slate-400 tracking-tight">Todo el día</p>
                  )}
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex gap-4 items-start bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl p-[18px] rounded-2xl border border-white/20 dark:border-slate-600/30 shadow-sm" style={{ backdropFilter: 'blur(20px)' }}>
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <MapPin className="w-[22px] h-[22px] text-white" strokeWidth={2.5} />
                  </div>
                  <p className="flex-1 text-[16px] text-slate-900 dark:text-white font-medium self-center tracking-tight leading-relaxed">
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.description && (
                <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-600/30 shadow-sm" style={{ backdropFilter: 'blur(20px)' }}>
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed tracking-tight">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción - Grid mejorado */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  handleShareEvent(selectedEvent);
                }}
                className="flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200/80 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 text-blue-600 dark:text-blue-400 font-semibold rounded-2xl transition-all shadow-sm backdrop-blur-sm min-h-[56px]"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <Share2 className="w-5 h-5" strokeWidth={2.5} />
                <span className="tracking-tight">Compartir</span>
              </button>
              <button
                onClick={() => {
                  handleDownloadEvent(selectedEvent);
                }}
                className="flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-br from-green-50 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200/80 dark:hover:from-green-900/40 dark:hover:to-green-800/40 text-green-600 dark:text-green-400 font-semibold rounded-2xl transition-all shadow-sm backdrop-blur-sm min-h-[56px]"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <Download className="w-5 h-5" strokeWidth={2.5} />
                <span className="tracking-tight">Descargar</span>
              </button>
            </div>

            {/* Botón de cierre principal - iOS 26 style */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-[18px] rounded-2xl transition-all shadow-lg shadow-blue-500/20 min-h-[56px]"
            >
              <span className="text-[17px] tracking-tight">Cerrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast de copiado exitoso */}
      {showCopyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Evento copiado al portapapeles</span>
          </div>
        </div>
      )}
    </div>
  );
}
