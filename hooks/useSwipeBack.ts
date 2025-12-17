'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para emular el gesto nativo de iOS "Deslizar para volver"
 * Muy útil para PWAs en modo standalone donde no hay botones del sistema.
 */
export function useSwipeBack(enabled: boolean = true) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Solo capturar si el toque empieza muy cerca del borde izquierdo (ej. primeros 30px)
      if (e.touches && e.touches[0] && e.touches[0].clientX < 30) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null || !e.touches || !e.touches[0]) return;

      const deltaX = e.touches[0].clientX - startX.current;
      const deltaY = e.touches[0].clientY - startY.current;

      // Si el movimiento es predominantemente horizontal y hacia la derecha
      if (deltaX > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Prevenir scroll vertical mientras se detecta el swipe
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        startX.current === null ||
        startY.current === null ||
        !e.changedTouches ||
        !e.changedTouches[0]
      ) {
        startX.current = null;
        startY.current = null;
        return;
      }

      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = e.changedTouches[0].clientY - startY.current;

      // Umbral significativo para volver (ej: 80px)
      if (deltaX > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
        router.back();
      }

      startX.current = null;
      startY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, router]);
}
