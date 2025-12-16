/**
 * Sistema de caché local con estrategia SWR (stale-while-revalidate)
 * Muestra datos cacheados instantáneamente mientras actualiza en segundo plano
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type CacheConfig = {
  /** Tiempo máximo de caché en ms antes de considerarlo "stale" */
  maxAge: number;
  /** Tiempo en que los datos stale aún son útiles (mostrar mientras revalida) */
  staleWhileRevalidate: number;
};

// Configuración por defecto: 5 min fresh, 24h stale
const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutos
  staleWhileRevalidate: 24 * 60 * 60 * 1000, // 24 horas
};

// Configuraciones específicas por tipo de dato
export const CACHE_CONFIGS = {
  gospel: {
    maxAge: 60 * 60 * 1000, // 1 hora (el evangelio cambia 1 vez al día)
    staleWhileRevalidate: 24 * 60 * 60 * 1000,
  },
  saint: {
    maxAge: 60 * 60 * 1000, // 1 hora
    staleWhileRevalidate: 24 * 60 * 60 * 1000,
  },
  calendar: {
    maxAge: 5 * 60 * 1000, // 5 minutos
    staleWhileRevalidate: 60 * 60 * 1000, // 1 hora
  },
  calendarEvents: {
    maxAge: 2 * 60 * 1000, // 2 minutos
    staleWhileRevalidate: 30 * 60 * 1000, // 30 minutos
  },
} as const;

const CACHE_PREFIX = 'parro_cache_';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Guarda datos en localStorage con metadatos de caché
 */
export function setCache<T>(key: string, data: T, config: CacheConfig = DEFAULT_CONFIG): void {
  if (!isClient()) return;

  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt: now + config.maxAge + config.staleWhileRevalidate,
  };

  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Si localStorage está lleno, limpiamos entradas antiguas
    clearOldCache();
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      console.warn('Cache storage full, unable to cache:', key);
    }
  }
}

/**
 * Obtiene datos de caché con información sobre su estado
 */
export function getCache<T>(
  key: string,
  config: CacheConfig = DEFAULT_CONFIG
): { data: T | null; isFresh: boolean; isStale: boolean; needsRevalidation: boolean } {
  if (!isClient()) {
    return { data: null, isFresh: false, isStale: false, needsRevalidation: true };
  }

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) {
      return { data: null, isFresh: false, isStale: false, needsRevalidation: true };
    }

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();
    const age = now - entry.timestamp;

    // Datos expirados completamente
    if (now > entry.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return { data: null, isFresh: false, isStale: false, needsRevalidation: true };
    }

    // Datos frescos
    if (age < config.maxAge) {
      return { data: entry.data, isFresh: true, isStale: false, needsRevalidation: false };
    }

    // Datos stale pero usables
    return { data: entry.data, isFresh: false, isStale: true, needsRevalidation: true };
  } catch {
    return { data: null, isFresh: false, isStale: false, needsRevalidation: true };
  }
}

/**
 * Elimina una entrada específica del caché
 */
export function clearCache(key: string): void {
  if (!isClient()) return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Limpia todo el caché de la aplicación
 */
export function clearAllCache(): void {
  if (!isClient()) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Limpia entradas de caché expiradas
 */
function clearOldCache(): void {
  if (!isClient()) return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '{}');
        if (entry.expiresAt && now > entry.expiresAt) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
  GOSPEL_TODAY: 'gospel_today',
  SAINT_TODAY: 'saint_today',
  CALENDAR_EVENTS: (start: string, end: string) => `calendar_${start}_${end}`,
  UPCOMING_EVENTS: 'upcoming_events',
  HOME_DATA: 'home_data',
} as const;
