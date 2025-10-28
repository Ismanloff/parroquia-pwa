'use client';

// Onboarding - PWA Best Practices 2025
// Tutorial inicial para nuevos usuarios (se muestra solo una vez)

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Calendar,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { haptics } from '@/lib/haptics';

const ONBOARDING_KEY = 'parroquia-onboarding-completed';

const slides = [
  {
    icon: BookOpen,
    title: 'Bienvenido a tu Parroquia Digital',
    description: 'Accede al Evangelio y Santo del día desde cualquier lugar, en cualquier momento.',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: Calendar,
    title: 'Calendario Parroquial',
    description: 'Consulta todos los eventos, misas y actividades de tu parroquia.',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: MessageCircle,
    title: 'Chat con IA',
    description: 'Pregunta sobre la fe, horarios de misa, sacramentos y más. Disponible 24/7.',
    gradient: 'from-green-500 to-green-600',
  },
  {
    icon: Sparkles,
    title: 'Desliza para actualizar',
    description: 'Desliza hacia abajo en cualquier pantalla para actualizar el contenido.',
    gradient: 'from-amber-500 to-amber-600',
  },
];

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsOpen(true));
    }
  }, []);

  const handleNext = () => {
    haptics.light();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    haptics.light();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    haptics.success();
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    haptics.medium();
    handleComplete();
  };

  if (!isOpen) return null;

  const slide = slides[currentSlide] || slides[0]!;
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden animate-spring-in">
        {/* Progress indicators */}
        <div className="flex gap-2 p-6 pb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full flex-1 transition-all ${
                index === currentSlide
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div
            className={`w-24 h-24 bg-gradient-to-br ${slide.gradient} rounded-[28px] flex items-center justify-center mb-8 shadow-lg`}
          >
            <Icon className="w-12 h-12 text-white" strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{slide.title}</h2>

          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors px-4 py-2"
          >
            Saltar
          </button>

          <div className="flex gap-2">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="w-11 h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-all active:scale-95"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-lg transition-all active:scale-95"
            >
              {isLastSlide ? 'Comenzar' : 'Siguiente'}
              {!isLastSlide && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
