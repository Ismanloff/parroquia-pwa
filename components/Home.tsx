'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { haptics } from '@/lib/haptics';
import { Card } from '@/components/ui/Card';
import { useNavigationStore } from '@/lib/store/navigationStore';

dayjs.locale('es');

type Saint = {
  nombre: string;
  descripcion: string;
  imagen?: string | null;
};

type Gospel = {
  cita: string;
  texto: string;
  reflexion?: string | null;
};

type UpcomingEvent = {
  id: string;
  title: string;
  start: string;
  location?: string;
};

export function Home() {
  const router = useRouter();
  const [santo, setSanto] = useState<Saint | null>(null);
  const [evangelio, setEvangelio] = useState<Gospel | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { setActiveTab } = useNavigationStore();

  // Liturgical color for subtle accents
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [saintsRes, gospelRes, eventsRes] = await Promise.all([
        fetch(`/api/saints/today?t=${new Date().getTime()}`),
        fetch('/api/gospel/today'),
        fetch(
          `/api/calendar/events?start=${new Date().toISOString()}&end=${dayjs().add(3, 'day').toISOString()}`
        ),
      ]);

      if (saintsRes.ok) {
        const data = await saintsRes.json();
        setSanto(data.saint);
      }

      if (gospelRes.ok) {
        const data = await gospelRes.json();
        setEvangelio(data.gospel);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setUpcomingEvents(Array.isArray(data.events) ? data.events.slice(0, 3) : []);
      }
    } catch (err) {
      console.error('Error fetching daily content:', err);
      setError('No se pudo cargar el contenido. Verifica tu conexión.');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await fetchData();
    setRefreshing(false);
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
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && scrollContainerRef.current.scrollTop === 0) {
      setPullDistance(Math.min(distance / 2.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    if (pullDistance > 60) {
      haptics.success();
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const goToCalendar = () => {
    haptics.light();
    setActiveTab('calendar');
  };

  const goToEvangelio = () => {
    haptics.light();
    router.push('/evangelio');
  };

  const goToSanto = () => {
    haptics.light();
    router.push('/santo');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="pt-14 px-5 pb-6">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 shimmer rounded-xl" />
            <div className="h-10 w-10 shimmer rounded-full" />
          </div>
          {/* Skeleton Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 shimmer rounded-3xl" />
            <div className="h-36 shimmer rounded-3xl" />
          </div>
          <div className="h-32 shimmer rounded-3xl mt-4" />
          <div className="h-32 shimmer rounded-3xl mt-4" />
        </div>
      </div>
    );
  }

  const today = dayjs();
  const dateStr = today.format('D');
  const monthStr = today.format('MMMM');
  const weekdayStr = today.format('dddd');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background overflow-hidden relative">
      {/* Main Content with Pull-to-Refresh */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Pull to Refresh Indicator */}
        {isPulling && (
          <div className="absolute top-2 w-full flex justify-center pointer-events-none z-20">
            <RefreshCw
              className={`w-5 h-5 text-slate-400 transition-transform ${pullDistance > 60 ? 'rotate-180' : ''}`}
              style={{ opacity: Math.min(pullDistance / 60, 1) }}
            />
          </div>
        )}

        <div className="px-5 pt-14 pb-32 space-y-5">
          {/* ═══════════════════════════════════════════════════════════════
              HEADER - Fecha y tiempo litúrgico (estilo de la referencia)
              ═══════════════════════════════════════════════════════════════ */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground capitalize">
                {weekdayStr}, {dateStr} de {monthStr}
              </h1>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
              aria-label="Actualizar"
            >
              <RefreshCw
                className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </header>

          {/* Liturgical Season Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {liturgicalSeason.name}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: liturgicalSeason.gradient[0] }}
            />
          </div>

          {/* Error State */}
          {error && (
            <Card
              variant="flat"
              className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200 text-sm">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MAIN CARDS GRID - Estilo premium minimalista
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-4">
            {/* Evangelio Card */}
            <button
              onClick={goToEvangelio}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <BookOpen
                  className="w-6 h-6 text-amber-600 dark:text-amber-400"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Evangelio</h2>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">y lecturas</p>
              {evangelio && (
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
                  {evangelio.cita}
                </p>
              )}
            </button>

            {/* Santo del día Card */}
            <button
              onClick={goToSanto}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${liturgicalSeason.gradient[0]}20` }}
              >
                <Sparkles
                  className="w-6 h-6"
                  style={{ color: liturgicalSeason.gradient[0] }}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Santo</h2>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">del día</p>
              {santo && (
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2 line-clamp-1">
                  {santo.nombre}
                </p>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              UPCOMING EVENTS CARD
              ═══════════════════════════════════════════════════════════════ */}
          <button
            onClick={goToCalendar}
            className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <CalendarIcon
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground">Próximos eventos</h2>
                {upcomingEvents.length > 0 && upcomingEvents[0] ? (
                  <div className="mt-1">
                    <p className="text-base text-slate-600 dark:text-slate-300 truncate">
                      {upcomingEvents[0].title}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {dayjs(upcomingEvents[0].start).format('ddd D, HH:mm')}
                    </p>
                  </div>
                ) : (
                  <p className="text-base text-slate-400 mt-1">Sin eventos próximos</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* ═══════════════════════════════════════════════════════════════
              ADDITIONAL INFO / QUICK ACTIONS (opcional)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}, ${liturgicalSeason.gradient[1]})`,
                }}
              >
                <span className="text-2xl font-black text-white">{dateStr}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{liturgicalSeason.name}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400">Tiempo litúrgico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
