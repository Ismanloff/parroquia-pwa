/**
 * Componente para instalar PWA
 *
 * Muestra banner cuando la app es instalable
 * Funciona solo en web
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Download, X } from 'lucide-react-native';
import { showInstallPrompt, isPWAInstalled } from '@/utils/registerServiceWorker';
import { useTheme } from '@/hooks/useTheme';

export const InstallPWA = () => {
  const { theme } = useTheme();
  const [isInstallable, setIsInstallable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Solo en web
    if (Platform.OS !== 'web') {
      return;
    }

    // Verificar si ya está instalada
    setIsInstalled(isPWAInstalled());

    // Escuchar evento de instalación disponible
    const handleInstallAvailable = () => {
      console.log('💾 PWA instalable detectada');
      setIsInstallable(true);

      // Mostrar banner después de 3 segundos (no molestar inmediatamente)
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    // Escuchar cuando se instala
    const handleInstalled = () => {
      console.log('🎉 PWA instalada');
      setIsInstalled(true);
      setIsVisible(false);
      setIsInstallable(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  // Manejar click en instalar
  const handleInstall = async () => {
    const installed = await showInstallPrompt();

    if (installed) {
      setIsVisible(false);
      setIsInstalled(true);
    }
  };

  // Cerrar banner
  const handleDismiss = () => {
    setIsVisible(false);

    // No mostrar de nuevo en esta sesión
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // No renderizar si:
  // - No es web
  // - Ya está instalada
  // - No es instalable
  // - No es visible
  // - Usuario ya lo cerró antes
  if (
    Platform.OS !== 'web' ||
    isInstalled ||
    !isInstallable ||
    !isVisible ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed'))
  ) {
    return null;
  }

  return (
    <View
      className="absolute top-4 left-4 right-4 z-50"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        className="rounded-2xl p-4 flex-row items-center justify-between"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }}
      >
        {/* Icono */}
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Download size={24} color="#FFFFFF" strokeWidth={2} />
        </View>

        {/* Contenido */}
        <View className="flex-1">
          <Text
            className="text-base font-semibold mb-1"
            style={{ color: theme.colors.foreground }}
          >
            Instalar App
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.mutedForeground }}
          >
            Acceso rápido desde tu pantalla principal
          </Text>
        </View>

        {/* Botones */}
        <View className="flex-row items-center gap-2 ml-3">
          {/* Botón Instalar */}
          <TouchableOpacity
            onPress={handleInstall}
            className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: theme.colors.primary }}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
              Instalar
            </Text>
          </TouchableOpacity>

          {/* Botón Cerrar */}
          <TouchableOpacity
            onPress={handleDismiss}
            className="w-8 h-8 items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={20} color={theme.colors.mutedForeground} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Hook para detectar si PWA está instalada
 */
export const useIsPWAInstalled = (): boolean => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsInstalled(isPWAInstalled());

      // Escuchar cuando se instala
      const handleInstalled = () => {
        setIsInstalled(true);
      };

      window.addEventListener('pwa-installed', handleInstalled);

      return () => {
        window.removeEventListener('pwa-installed', handleInstalled);
      };
    }
  }, []);

  return isInstalled;
};
