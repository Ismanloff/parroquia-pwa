'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CalendarDays, Sparkles, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { SkeletonHome } from '@/components/ui/SkeletonLoader';
import { haptics } from '@/lib/haptics';

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

export function Home() {
  const [santo, setSanto] = useState<Saint | null>(null);
  const [evangelio, setEvangelio] = useState<Gospel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gospelExpanded, setGospelExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Obtener el color litúrgico del día
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [saintsRes, gospelRes] = await Promise.all([
        fetch('/api/saints/today'),
        fetch('/api/gospel/today'),
      ]);

      if (saintsRes.ok) {
        const data = await saintsRes.json();
        setSanto(data.saint);
      }

      if (gospelRes.ok) {
        const data = await gospelRes.json();
        setEvangelio(data.gospel);
      }
    } catch (error) {
      console.error('Error fetching daily content:', error);
      setError('Error al cargar el contenido. Por favor intenta de nuevo.');
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
    await fetchData();
    setRefreshing(false);
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !scrollContainerRef.current) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    if (distance > 0 && scrollContainerRef.current.scrollTop === 0) {
      // Efecto de resistencia: el pull se hace más difícil cuanto más se tira
      const resistance = 2.5;
      const adjustedDistance = Math.min(distance / resistance, 100);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    if (pullDistance > 60) {
      // Trigger refresh with haptic feedback
      haptics.success();
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header placeholder */}
        <div className="relative px-6 pt-5 pb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #3B82F615 0%, #6366F125 100%)' }}>
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }} />
          <div className="relative z-10">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl mb-2 animate-pulse" />
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
          <SkeletonHome />
        </div>
      </div>
    );
  }

  const today = dayjs().format('D [de] MMMM, YYYY');
  const weekday = dayjs().format('dddd');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Header con fecha y colores litúrgicos - iOS 26 Liquid Glass Lite */}
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
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                {weekday}
              </p>
            </div>
            <button
              onClick={() => {
                haptics.light();
                handleRefresh();
              }}
              disabled={refreshing}
              aria-label={refreshing ? "Actualizando contenido" : "Actualizar contenido del día"}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <RefreshCw className={`w-4 h-4 text-slate-700 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            </button>
          </div>

          {/* Día y mes - Tipografía grande iOS */}
          <h1 className="text-[34px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-2">
            {today}
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

      {/* Contenido scrolleable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 pb-28 relative"
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

        {/* Mensaje de error */}
        {error && (
          <div role="alert" aria-live="assertive" className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">Error al cargar</p>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => {
                    haptics.medium();
                    handleRefresh();
                  }}
                  disabled={refreshing}
                  aria-label="Reintentar carga del contenido"
                  className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Santo del día - iOS 26 Liquid Glass Lite */}
        {santo && (
          <article role="region" aria-labelledby="santo-heading" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 mb-6 shadow-lg border border-white/20 dark:border-slate-700/30 animate-spring-in" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Santo del día
                </p>
                <h2 id="santo-heading" className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {santo.nombre}
                </h2>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-5"></div>
            <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed tracking-tight">
              {santo.descripcion}
            </p>
          </article>
        )}

        {/* Evangelio del día - iOS 26 Liquid Glass Lite */}
        {evangelio && (
          <article role="region" aria-labelledby="evangelio-heading" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 animate-spring-in" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  Evangelio del día
                </p>
                <h2 id="evangelio-heading" className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {evangelio.cita}
                </h2>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-5"></div>
            <p
              className={`text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed tracking-tight text-justify ${
                !gospelExpanded ? 'line-clamp-5' : ''
              }`}
            >
              {evangelio.texto}
            </p>
            {evangelio.texto && evangelio.texto.length > 200 && (
              <button
                onClick={() => {
                  haptics.light();
                  setGospelExpanded(!gospelExpanded);
                }}
                aria-label={gospelExpanded ? "Ver menos texto del evangelio" : "Leer más del evangelio"}
                aria-expanded={gospelExpanded}
                className="mt-6 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-br from-indigo-50 to-indigo-100/80 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-semibold text-sm hover:from-indigo-100 hover:to-indigo-200/80 dark:hover:from-indigo-900/40 dark:hover:to-indigo-800/40 transition-all backdrop-blur-sm min-h-[44px]"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <span className="tracking-tight">{gospelExpanded ? 'Ver menos' : 'Leer más'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    gospelExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
            {evangelio.reflexion && (
              <div className="mt-5 p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-600/30" style={{ backdropFilter: 'blur(10px)' }}>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed tracking-tight">
                  {evangelio.reflexion}
                </p>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
