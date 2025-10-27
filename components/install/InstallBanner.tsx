'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Sparkles } from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { IOSInstallInstructions } from './IOSInstallInstructions';

interface InstallBannerProps {
  delay?: number; // Segundos antes de mostrar el banner
  position?: 'top' | 'bottom';
}

export function InstallBanner({ delay = 30, position = 'bottom' }: InstallBannerProps) {
  const {
    isInstalled,
    isIOS,
    canShowPrompt,
    promptInstall,
    dismissPrompt
  } = useInstallPrompt();

  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Mostrar banner después del delay
  useEffect(() => {
    if (!canShowPrompt || isInstalled) {
      return;
    }

    const timer = setTimeout(() => {
      setShowBanner(true);
      // Trigger animation
      setTimeout(() => setIsAnimating(true), 100);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [canShowPrompt, isInstalled, delay]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowBanner(false);
      dismissPrompt();
    }, 300);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
      handleDismiss();
    }
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  const positionClasses = position === 'top'
    ? 'top-0 rounded-b-3xl'
    : 'bottom-0 rounded-t-3xl mb-20'; // mb-20 para no tapar el tab bar

  return (
    <>
      <div
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${positionClasses} ${
          isAnimating
            ? 'translate-y-0 opacity-100'
            : position === 'top'
              ? '-translate-y-full opacity-0'
              : 'translate-y-full opacity-0'
        }`}
      >
        <div className="mx-4 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
          </div>

          <div className="relative p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                {isIOS ? (
                  <Smartphone className="w-7 h-7 text-white" />
                ) : (
                  <Download className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-white text-base leading-tight">
                    Instala la App Parroquial
                  </h3>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {isIOS
                    ? 'Acceso rápido desde tu pantalla de inicio'
                    : 'Acceso rápido, notificaciones y modo offline'
                  }
                </p>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-blue-600 rounded-xl font-semibold text-sm transition-colors shadow-lg"
                  >
                    {isIOS ? 'Ver cómo' : 'Instalar'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-colors backdrop-blur-sm"
                  >
                    Más tarde
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors backdrop-blur-sm"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Progress indicator (opcional) */}
          <div className="h-1 bg-white/20">
            <div
              className="h-full bg-white/40 transition-all duration-1000"
              style={{ width: isAnimating ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>

      <IOSInstallInstructions
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
