'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canShowPrompt: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
  isPromptDismissed: boolean;
}

const DISMISSED_KEY = 'pwa_install_dismissed';
const DISMISSED_TIMESTAMP_KEY = 'pwa_install_dismissed_timestamp';
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);

  // Detectar plataforma
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof window !== 'undefined' && /Android/.test(navigator.userAgent);

  // Verificar si ya está instalada
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar si está en modo standalone (ya instalada)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone =
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    checkInstalled();

    // Detectar cambios (por si se instala mientras está abierta)
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Verificar si el prompt fue dismissed recientemente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      const timestamp = localStorage.getItem(DISMISSED_TIMESTAMP_KEY);

      if (dismissed === 'true' && timestamp) {
        const dismissedTime = parseInt(timestamp, 10);
        const now = Date.now();

        // Si han pasado más de 7 días, resetear
        if (now - dismissedTime > DISMISSAL_DURATION) {
          localStorage.removeItem(DISMISSED_KEY);
          localStorage.removeItem(DISMISSED_TIMESTAMP_KEY);
          setIsPromptDismissed(false);
        } else {
          setIsPromptDismissed(true);
        }
      }
    });
  }, []);

  // Capturar el evento beforeinstallprompt (solo Chrome/Edge/Android)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Función para mostrar el prompt de instalación
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Mostrar el prompt nativo
      await deferredPrompt.prompt();

      // Esperar la decisión del usuario
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }

      // Limpiar el prompt (solo se puede usar una vez)
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error al mostrar prompt de instalación:', error);
    }
  }, [deferredPrompt]);

  // Función para marcar como dismissed
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    localStorage.setItem(DISMISSED_TIMESTAMP_KEY, Date.now().toString());
    setIsPromptDismissed(true);
  }, []);

  // Determinar si se puede mostrar el prompt
  const canShowPrompt = !isInstalled && !isPromptDismissed && (!!deferredPrompt || isIOS);

  return {
    isInstallable: !!deferredPrompt || isIOS,
    isInstalled,
    isIOS,
    isAndroid,
    canShowPrompt,
    promptInstall,
    dismissPrompt,
    isPromptDismissed,
  };
}
