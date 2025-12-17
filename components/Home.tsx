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
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  animate,
} from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();

  // Pull-to-refresh states (Optimized with MotionValues!)
  const pullDistance = useMotionValue(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Framer Motion Scroll Orchestration (No re-renders!)
  const { scrollY } = useScroll({
    container: scrollContainerRef,
  });

  const headerOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 500], [1, 0.9]);
  const headerY = useTransform(scrollY, [0, 500], [0, 100]);
  const glowOpacity = useTransform(scrollY, [0, 300], [0.2, 0.4]);

  // Derived transforms for pull-to-refresh UI (Purely GPU!)
  const pullIndicatorOpacity = useTransform(pullDistance, [0, 60], [0, 1]);
  const pullIndicatorRotate = useTransform(pullDistance, [0, 100], [0, 360]);
  const pullIndicatorY = useTransform(pullDistance, [0, 100], [0, 20]);

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
      pullDistance.set(Math.min(distance / 2.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    const currentDistance = pullDistance.get();

    if (currentDistance > 60) {
      haptics.success();
      setRefreshing(true);
      await refetch(true);
      setRefreshing(false);
    }

    setIsPulling(false);
    animate(pullDistance, 0, { type: 'spring', stiffness: 300, damping: 30 });
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
        <div className="pt-14 px-5 pb-6 space-y-6">
          {/* Skeleton Header - Exact match with UI */}
          <div className="pt-4 flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-4 w-24 shimmer rounded-full" />
              <div className="h-10 w-48 shimmer rounded-2xl" />
              <div className="h-6 w-56 shimmer rounded-xl" />
            </div>
            <div className="w-12 h-12 shimmer rounded-2xl" />
          </div>
          {/* Skeleton Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-44 shimmer rounded-[2rem]" />
            <div className="h-44 shimmer rounded-[2rem]" />
          </div>
          {/* Skeleton Event Card */}
          <div className="h-24 shimmer rounded-[2rem]" />
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
      {/* Immersive Liturgical Background - High Performance CSS Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.06] dark:opacity-[0.1] blur-[80px] animate-blob-slow will-change-transform"
          style={{ background: liturgicalSeason.gradient[0], transform: 'translateZ(0)' }}
        />
        <div
          className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-[0.04] dark:opacity-[0.08] blur-[70px] animate-blob-reverse will-change-transform"
          style={{
            background: liturgicalSeason.gradient[1] || liturgicalSeason.gradient[0],
            transform: 'translateZ(0)',
          }}
        />
      </div>

      {/* Main Content with Pull-to-Refresh */}
      <motion.div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          y: pullDistance,
        }}
      >
        {/* Pull to Refresh Indicator - Optimized via GPU */}
        {isPulling && (
          <motion.div
            className="absolute top-0 w-full flex justify-center pointer-events-none z-20"
            style={{
              opacity: pullIndicatorOpacity,
              y: pullIndicatorY,
            }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full p-2.5 shadow-xl border border-white/20 dark:border-slate-700/30 ring-4 ring-black/5 dark:ring-white/5">
              <motion.div style={{ rotate: pullIndicatorRotate }}>
                <RefreshCw className="w-5 h-5 text-blue-500 transition-transform" />
              </motion.div>
            </div>
          </motion.div>
        )}

        <div className="px-5 pt-14 pb-32 space-y-6 relative">
          {/* Liturgical Glow Effect - Dynamic via transform */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 blur-[100px] pointer-events-none z-0 transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle, ${liturgicalSeason.gradient[0]}, transparent 70%)`,
              opacity: glowOpacity,
            }}
          />

          {/* ═══════════════════════════════════════════════════════════════
              PREMIUM HEADER - Diseño más impactante
              ═══════════════════════════════════════════════════════════════ */}
          <motion.header
            style={{
              opacity: headerOpacity,
              scale: headerScale,
              y: headerY,
            }}
            className="flex items-start justify-between relative z-10 will-change-transform"
          >
            <div className="pt-4">
              {/* Greeting */}
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
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
          </motion.header>

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
              className="group bg-white dark:bg-slate-800 rounded-[2rem] p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.97] transition-all duration-200 border border-slate-100 dark:border-slate-700/50 overflow-hidden relative"
              style={{ transform: 'translateZ(0)' }}
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
              className="group bg-white dark:bg-slate-800 rounded-[2rem] p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.97] transition-all duration-200 border border-slate-100 dark:border-slate-700/50 overflow-hidden relative"
              style={{ transform: 'translateZ(0)' }}
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
            className="w-full bg-white dark:bg-slate-800 rounded-[2rem] p-5 text-left shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 border border-slate-100 dark:border-slate-700/50"
            style={{ transform: 'translateZ(0)' }}
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
      </motion.div>
    </div>
  );
}
