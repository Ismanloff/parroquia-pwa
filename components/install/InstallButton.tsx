'use client';

import { useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { IOSInstallInstructions } from './IOSInstallInstructions';

interface InstallButtonProps {
  variant?: 'default' | 'settings' | 'compact';
  showIcon?: boolean;
  className?: string;
}

export function InstallButton({
  variant = 'default',
  showIcon = true,
  className = ''
}: InstallButtonProps) {
  const {
    isInstalled,
    isIOS,
    canShowPrompt,
    promptInstall
  } = useInstallPrompt();

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Si ya está instalada, mostrar estado de instalado
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            App Instalada
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
            App instalada correctamente
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
            Ábrela desde tu pantalla de inicio
          </p>
        </div>
      </div>
    );
  }

  // Si no se puede mostrar el prompt (ya dismissed o no soportado)
  if (!canShowPrompt) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      // iOS: Mostrar instrucciones
      setShowIOSInstructions(true);
    } else {
      // Android/Chrome: Usar prompt nativo
      setIsLoading(true);
      await promptInstall();
      setIsLoading(false);
    }
  };

  // Variant: Settings (diseño para la página de configuración)
  if (variant === 'settings') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 ${className}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {showIcon && (
                isIOS ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Download className="w-6 h-6 text-white" />
                )
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-base">
                {isIOS ? 'Instalar en iPhone' : 'Instalar Aplicación'}
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                {isIOS
                  ? 'Añadir a la pantalla de inicio'
                  : 'Acceso rápido desde tu dispositivo'
                }
              </p>
            </div>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        <IOSInstallInstructions
          isOpen={showIOSInstructions}
          onClose={() => setShowIOSInstructions(false)}
        />
      </>
    );
  }

  // Variant: Compact (botón pequeño)
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${className}`}
        >
          {showIcon && <Download className="w-4 h-4" />}
          {isLoading ? 'Instalando...' : 'Instalar App'}
        </button>

        <IOSInstallInstructions
          isOpen={showIOSInstructions}
          onClose={() => setShowIOSInstructions(false)}
        />
      </>
    );
  }

  // Variant: Default (botón estándar)
  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 ${className}`}
      >
        {showIcon && (
          isIOS ? (
            <Smartphone className="w-5 h-5" />
          ) : (
            <Download className="w-5 h-5" />
          )
        )}
        <span>
          {isLoading
            ? 'Instalando...'
            : isIOS
              ? 'Instalar en iPhone'
              : 'Instalar Aplicación'
          }
        </span>
      </button>

      <IOSInstallInstructions
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
