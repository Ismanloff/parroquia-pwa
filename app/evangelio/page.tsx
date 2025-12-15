'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { haptics } from '@/lib/haptics';

dayjs.locale('es');

type Gospel = {
  cita: string;
  texto: string;
  reflexion?: string | null;
};

export default function EvangelioPage() {
  const router = useRouter();
  const [evangelio, setEvangelio] = useState<Gospel | null>(null);
  const [loading, setLoading] = useState(true);

  const liturgicalSeason = getLiturgicalSeason(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/gospel/today');
      if (res.ok) {
        const data = await res.json();
        setEvangelio(data.gospel);
      }
    } catch (error) {
      console.error('Error fetching gospel:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const today = dayjs();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-14 px-6">
          <div className="h-8 w-24 shimmer rounded-lg mb-8" />
          <div className="h-10 w-3/4 shimmer rounded-lg mb-4" />
          <div className="h-6 w-1/2 shimmer rounded-lg mb-8" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-5 shimmer rounded-lg"
                style={{ width: `${85 + Math.random() * 15}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 px-4 h-14 safe-top">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Evangelio del día</h1>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 px-6">
        {evangelio ? (
          <article className="space-y-6">
            {/* Icon and Title */}
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${liturgicalSeason.gradient[0]}20, ${liturgicalSeason.gradient[1]}10)`,
                }}
              >
                <BookOpen
                  className="w-8 h-8"
                  style={{ color: liturgicalSeason.gradient[0] }}
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  {today.format('dddd, D [de] MMMM')}
                </p>
                <h2 className="text-2xl font-bold text-foreground mt-1">{evangelio.cita}</h2>
              </div>
            </div>

            {/* Liturgical Season Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: liturgicalSeason.gradient[0] }}
              />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {liturgicalSeason.name}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

            {/* Gospel Text */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 text-justify whitespace-pre-wrap">
                {evangelio.texto}
              </p>
            </div>

            {/* Reflection */}
            {evangelio.reflexion && (
              <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Reflexión
                </h3>
                <p className="text-base italic text-slate-600 dark:text-slate-300 leading-relaxed">
                  {evangelio.reflexion}
                </p>
              </div>
            )}
          </article>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No se pudo cargar el evangelio</p>
          </div>
        )}
      </main>
    </div>
  );
}
