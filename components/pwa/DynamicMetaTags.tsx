'use client';

import { useEffect, useMemo } from 'react';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';

/**
 * Componente que actualiza dinámicamente los meta-tags de la PWA
 * según el tiempo litúrgico y el modo de color.
 */
export function DynamicMetaTags() {
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Actualizar el meta tag 'theme-color'
    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains('dark');

      // Color base del tiempo litúrgico
      let color = liturgicalSeason.gradient[0];

      // Si estamos en modo oscuro, oscurecemos un poco más el color para la barra de estado
      // o usamos el color de fondo de la app si queremos integración total.
      // Aquí optamos por usar el color litúrgico pero con una lógica de fallback para blanco
      if (liturgicalSeason.color === 'white') {
        color = isDark ? '#1e293b' : '#ffffff';
      }

      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', color || '#2563eb');
    };

    // Actualizar al inicio
    updateThemeColor();

    // Observar cambios en el modo oscuro (clase 'dark' en html)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeColor();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [liturgicalSeason]);

  return null; // Este componente no renderiza nada visual
}
