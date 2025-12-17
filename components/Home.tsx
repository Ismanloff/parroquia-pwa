'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { haptics } from '@/lib/haptics';
import { useNavigationStore } from '@/lib/store/navigationStore';
import { useHomeData } from '@/hooks/useCachedFetch';

dayjs.locale('es');

export function Home() {
  const router = useRouter();

  // Usar hook con caché SWR - carga instantánea de datos cacheados
  const {
    saint: santo,
    gospel: evangelio,
    upcomingEvents,
    loading,
    isRevalidating,
    error,
    refetch,
  } = useHomeData();

  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { setActiveTab } = useNavigationStore();

  // Liturgical color for subtle accents
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await refetch(true); // Force refresh
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
      await refetch(true);
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
      <div className="flex flex-col h-full bg-slate-50 dark:bg-background">
        <div className="pt-16 px-5 pb-6">
          {/* Skeleton Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-5 w-32 shimmer rounded-lg mb-2" />
              <div className="h-10 w-56 shimmer rounded-xl" />
            </div>
            <div className="h-12 w-12 shimmer rounded-2xl" />
          </div>
          {/* Skeleton Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-44 shimmer rounded-3xl" />
            <div className="h-44 shimmer rounded-3xl" />
          </div>
          <div className="h-24 shimmer rounded-3xl mt-4" />
          <div className="h-24 shimmer rounded-3xl mt-4" />
        </div>
      </div>
    );
  }

  const today = dayjs();
  const dateStr = today.format('D');
  const monthStr = today.format('MMMM');
  const weekdayStr = today.format('dddd');
  const yearStr = today.format('YYYY');

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
        {/* Pull to Refresh Indicator - Only visible when actively pulling */}
        {isPulling && pullDistance > 10 && (
          <div
            className="absolute top-0 w-full flex justify-center pointer-events-none z-20"
            style={{ paddingTop: Math.min(pullDistance / 3, 20) }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full p-2.5 shadow-xl border border-white/20 dark:border-slate-700/30 ring-4 ring-black/5 dark:ring-white/5">
              <RefreshCw
                className={`w-5 h-5 text-blue-500 transition-transform ${pullDistance > 60 ? 'rotate-180' : ''}`}
                style={{
                  opacity: Math.min(pullDistance / 60, 1),
                  transform: `rotate(${pullDistance * 3}deg)`,
                }}
              />
            </div>
          </div>
        )}

        <div className="px-5 pt-14 pb-32 space-y-6 relative">
          {/* Liturgical Glow Effect - Background shadow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-20 dark:opacity-30 blur-[100px] pointer-events-none z-0 transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle, ${liturgicalSeason.gradient[0]}, transparent 70%)`,
            }}
          />

          {/* ═══════════════════════════════════════════════════════════════
              PREMIUM HEADER - Diseño más impactante
              ═══════════════════════════════════════════════════════════════ */}
          <header className="flex items-start justify-between relative z-10">
            <div>
              {/* Greeting */}
              <p className="text-base font-medium text-slate-400 dark:text-slate-500 mb-1">
                {greeting} ✨
              </p>
              {/* Date Display - Más grande y prominente */}
              <h1 className="text-3xl font-black text-foreground leading-tight capitalize">
                {weekdayStr}
              </h1>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {dateStr} de {monthStr.toLowerCase()} de {yearStr}
              </p>
              {/* Liturgical Badge */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: liturgicalSeason.gradient[0] }}
                />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {liturgicalSeason.name}
                </span>
              </div>
            </div>

            {/* Refresh Button - Más prominente */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || isRevalidating}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 border border-slate-100 dark:border-slate-700"
              aria-label="Actualizar"
            >
              <RefreshCw
                className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${refreshing || isRevalidating ? 'animate-spin' : ''}`}
              />
            </button>
          </header>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 flex items-start gap-3 border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Error de conexión</p>
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MAIN CARDS GRID - Bento Grid Style Premium
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-4">
            {/* Evangelio Card - Premium Style */}
            <button
              onClick={goToEvangelio}
              aria-label="Ver el evangelio y lecturas del día"
              className="group bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.97] transition-all duration-200 border border-slate-100 dark:border-slate-700/50 overflow-hidden relative"
            >
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 flex items-center justify-center mb-4 shadow-sm">
                  <BookOpen
                    className="w-7 h-7 text-amber-600 dark:text-amber-400"
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">Evangelio</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-1">y lecturas</p>
                {evangelio && (
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-3 uppercase tracking-wide">
                    {evangelio.cita}
                  </p>
                )}
              </div>
            </button>

            {/* Santo del día Card - Premium Style */}
            <button
              onClick={goToSanto}
              aria-label="Ver el santo del día"
              className="group bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.97] transition-all duration-200 border border-slate-100 dark:border-slate-700/50 overflow-hidden relative"
            >
              {/* Subtle Gradient Overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}10, transparent)`,
                }}
              />

              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}25, ${liturgicalSeason.gradient[0]}10)`,
                  }}
                >
                  <Sparkles
                    className="w-7 h-7"
                    style={{ color: liturgicalSeason.gradient[0] }}
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">Santo</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-1">del día</p>
                {santo && (
                  <p
                    className="text-sm font-semibold mt-3 line-clamp-1"
                    style={{ color: liturgicalSeason.gradient[0] }}
                  >
                    {santo.nombre}
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              UPCOMING EVENTS - Enhanced Card
              ═══════════════════════════════════════════════════════════════ */}
          <button
            onClick={goToCalendar}
            className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 border border-slate-100 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 flex items-center justify-center shrink-0 shadow-sm">
                <CalendarIcon
                  className="w-7 h-7 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">Próximos eventos</h2>
                {upcomingEvents.length > 0 && upcomingEvents[0] ? (
                  <div className="mt-1.5">
                    <p className="text-base text-slate-600 dark:text-slate-300 truncate font-medium">
                      {upcomingEvents[0].title}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                      <Clock className="w-4 h-4" />
                      {dayjs(upcomingEvents[0].start).format('dddd D, HH:mm')}
                    </p>
                  </div>
                ) : (
                  <p className="text-base text-slate-400 mt-1">Sin eventos próximos</p>
                )}
              </div>
              <ChevronRight className="w-6 h-6 text-slate-300 dark:text-slate-600 shrink-0" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
