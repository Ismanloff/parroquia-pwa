'use client';

import { ArrowLeft, BookOpen, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { haptics } from '@/lib/haptics';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import { CACHE_CONFIGS, CACHE_KEYS } from '@/lib/cache';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { motion } from 'framer-motion';

dayjs.locale('es');

type Gospel = {
  cita: string;
  texto: string;
  reflexion?: string | null;
};

export default function EvangelioPage() {
  const router = useRouter();
  useSwipeBack(); // Habilitar gesto de volver deslizandov

  // Usar caché SWR - carga instantánea desde caché
  const { data: evangelio, loading } = useCachedFetch<Gospel | null>('/api/gospel/today', {
    cacheKey: CACHE_KEYS.GOSPEL_TODAY,
    cacheConfig: CACHE_CONFIGS.gospel,
    transform: (json) => (json.gospel as Gospel) || null,
  });

  const liturgicalSeason = getLiturgicalSeason(new Date());

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleShare = async () => {
    if (!evangelio) return;
    haptics.light();

    try {
      await navigator.share({
        title: `Evangelio del día - ${evangelio.cita}`,
        text: evangelio.texto.substring(0, 200) + '...',
        url: window.location.href,
      });
    } catch {
      // User cancelled or share not supported
    }
  };

  const today = dayjs();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <div className="pt-24 px-6 space-y-8">
          <div className="h-48 shimmer rounded-[2rem]" />
          <div className="h-64 shimmer rounded-[2rem]" />
          <div className="h-32 shimmer rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background pb-safe">
      {/* Fixed Header with Blur */}
      <header className="fixed top-0 left-0 right-0 z-50 safe-top">
        <div
          className="flex items-center justify-between px-4 h-14"
          style={{
            background: 'var(--glass-background)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Evangelio del día</h1>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
            aria-label="Compartir"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20 px-5 pb-8"
      >
        {evangelio ? (
          <article className="space-y-6">
            {/* Hero Section */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg shadow-blue-500/10"
              style={{
                background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}, ${liturgicalSeason.gradient[1]})`,
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 bg-white/30" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 bg-white/20" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                      {today.format('dddd, D [de] MMMM')}
                    </p>
                    <p className="text-white/60 text-xs">{liturgicalSeason.name}</p>
                  </div>
                </div>
                <h2 className="text-3xl font-black leading-tight">{evangelio.cita}</h2>
              </div>
            </motion.div>

            {/* Gospel Text */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 text-justify whitespace-pre-wrap">
                {evangelio.texto}
              </p>
            </div>

            {/* Reflection */}
            {evangelio.reflexion && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] p-6 border border-amber-100 dark:border-amber-900/30">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Reflexión
                </h3>
                <p className="text-base italic text-amber-800 dark:text-amber-200 leading-relaxed">
                  {evangelio.reflexion}
                </p>
              </div>
            )}
          </article>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-medium text-slate-500">No se pudo cargar el evangelio</p>
            <p className="text-sm text-slate-400 mt-1">Verifica tu conexión e intenta de nuevo</p>
          </div>
        )}
      </motion.main>
    </div>
  );
}
