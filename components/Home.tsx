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
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { haptics } from '@/lib/haptics';
import { Card } from '@/components/ui/Card';
import { useNavigationStore } from '@/lib/store/navigationStore';
import { Modal } from '@/components/ui/Modal';

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
  const [santo, setSanto] = useState<Saint | null>(null);
  const [evangelio, setEvangelio] = useState<Gospel | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gospelExpanded, setGospelExpanded] = useState(false);

  const [showSaintModal, setShowSaintModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { setActiveTab } = useNavigationStore();

  // Liturgical color for subtle accents
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);
  const liturgicalColor = liturgicalSeason.gradient[0];

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
    } catch (error) {
      console.error('Error fetching daily content:', error);
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

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="pt-14 px-5 pb-6">
          {/* Skeleton Hero */}
          <div className="h-32 w-full shimmer rounded-3xl mb-5" />
          {/* Skeleton Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-44 shimmer rounded-2xl" />
            <div className="h-44 shimmer rounded-2xl" />
            <div className="col-span-2 h-48 shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const today = dayjs();
  const dateStr = today.format('D');
  const monthStr = today.format('MMMM');
  const weekday = today.format('dddd');

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
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

        <div className="px-5 pt-12 pb-32 space-y-5">
          {/* ═══════════════════════════════════════════════════════════════
              HERO SECTION - Gradient Litúrgico Animado
              ═══════════════════════════════════════════════════════════════ */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 stagger-item"
            style={{
              background: `linear-gradient(135deg, ${liturgicalColor} 0%, ${liturgicalSeason.gradient[1]} 100%)`,
            }}
          >
            {/* Decorative Elements */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10 flex justify-between items-start">
              <div>
                {/* Liturgical Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wide">
                    {liturgicalSeason.name}
                  </span>
                </div>

                {/* Date Display */}
                <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">
                  {weekday}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white leading-none">{dateStr}</span>
                  <span className="text-2xl font-bold text-white/80">{monthStr}</span>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50"
                aria-label="Actualizar"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card
              variant="flat"
              className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 flex items-start gap-4 stagger-item"
            >
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200 text-sm">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              BENTO GRID LAYOUT - Cards Modulares
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-3">
            {/* Saint Card - Large */}
            {santo && (
              <Card
                variant="flat"
                padding="md"
                interactive
                className="col-span-1 stagger-item touch-feedback"
                style={{ animationDelay: '0.1s' }}
                onClick={() => setShowSaintModal(true)}
              >
                <div className="flex flex-col h-full">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${liturgicalColor}20, ${liturgicalColor}10)`,
                    }}
                  >
                    <Sparkles
                      className="w-5 h-5"
                      style={{ color: liturgicalColor }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    Santo del día
                  </span>
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-3">
                    {santo.nombre}
                  </h3>
                </div>
              </Card>
            )}

            {/* Upcoming Events Card */}
            <Card
              variant="flat"
              padding="md"
              interactive
              onClick={goToCalendar}
              className="col-span-1 stagger-item touch-feedback"
              style={{ animationDelay: '0.15s' }}
            >
              <div className="flex flex-col h-full">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                  <CalendarIcon
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Próximos eventos
                </span>
                {upcomingEvents.length > 0 && upcomingEvents[0] ? (
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      {upcomingEvents[0].title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dayjs(upcomingEvents[0].start).format('ddd D, HH:mm')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin eventos próximos</p>
                )}
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2">
                  Ver calendario
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Card>

            {/* Gospel Card - Full Width */}
            {evangelio && (
              <Card
                variant="flat"
                padding="lg"
                className="col-span-2 stagger-item"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      Evangelio del día
                    </span>
                    <h2 className="text-lg font-bold text-foreground">{evangelio.cita}</h2>
                  </div>
                </div>

                <div className="relative">
                  <p
                    className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify ${!gospelExpanded ? 'line-clamp-6' : ''}`}
                  >
                    {evangelio.texto}
                  </p>

                  {/* Expand Text Gradient Overlay */}
                  {!gospelExpanded && evangelio.texto && evangelio.texto.length > 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--card-background)] to-transparent pointer-events-none" />
                  )}
                </div>

                {evangelio.texto && evangelio.texto.length > 100 && (
                  <button
                    onClick={() => {
                      setGospelExpanded(!gospelExpanded);
                      haptics.light();
                    }}
                    className="mt-4 w-full py-3 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-[0.98]"
                  >
                    {gospelExpanded ? 'Ver menos' : 'Leer evangelio completo'}
                  </button>
                )}

                {evangelio.reflexion && gospelExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Reflexión
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      {evangelio.reflexion}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Saint Description Card REMOVED (moved to Modal) */}
          </div>
        </div>
      </div>

      {/* Saint Details Modal */}
      <Modal isOpen={showSaintModal} onClose={() => setShowSaintModal(false)} title="Santo del día">
        {santo && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${liturgicalColor}20, ${liturgicalColor}10)`,
                }}
              >
                <Sparkles className="w-8 h-8" style={{ color: liturgicalColor }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight text-foreground">{santo.nombre}</h3>
                <p className="text-sm text-slate-500 mt-1 capitalize">
                  {weekday}, {dateStr} de {monthStr}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

            <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed text-justify space-y-4">
              {santo.descripcion}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
