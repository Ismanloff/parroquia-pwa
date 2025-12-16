'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCache, setCache, CACHE_CONFIGS } from '@/lib/cache';

type CacheConfig = {
  maxAge: number;
  staleWhileRevalidate: number;
};

// Tipos para los datos de la aplicación
type Saint = {
  nombre: string;
  descripcion: string;
  imagen?: string | null;
};

type Gospel = {
  cita: string;
  texto: string;
  reflexion?: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  allDay?: boolean;
};

type HomeData = {
  saint: Saint | null;
  gospel: Gospel | null;
  upcomingEvents: CalendarEvent[];
};

type UseCachedFetchOptions<T> = {
  /** Clave única para el caché */
  cacheKey: string;
  /** Configuración de tiempos de caché */
  cacheConfig?: CacheConfig;
  /** Transformar la respuesta antes de cachear */
  transform?: (response: Record<string, unknown>) => T;
  /** Ejecutar inmediatamente al montar */
  immediate?: boolean;
  /** Datos iniciales si no hay caché */
  initialData?: T;
};

type UseCachedFetchReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  isRevalidating: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
};

/**
 * Hook para fetch con caché SWR (stale-while-revalidate)
 * Muestra datos cacheados instantáneamente mientras actualiza en segundo plano
 */
export function useCachedFetch<T>(
  url: string | (() => string),
  options: UseCachedFetchOptions<T>
): UseCachedFetchReturn<T> {
  const {
    cacheKey,
    cacheConfig = CACHE_CONFIGS.calendar,
    transform,
    immediate = true,
    initialData = null,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Ref para evitar race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const resolvedUrl = typeof url === 'function' ? url() : url;

      // Paso 1: Mostrar datos cacheados inmediatamente
      if (!forceRefresh) {
        const cached = getCache<T>(cacheKey, cacheConfig);

        if (cached.data) {
          setData(cached.data);
          setIsFromCache(true);
          setLoading(false);

          // Si los datos son frescos, no revalidamos
          if (cached.isFresh) {
            return;
          }

          // Datos stale: seguimos mostrándolos pero revalidamos en segundo plano
          setIsRevalidating(true);
        }
      } else {
        // Force refresh: mostrar loading
        setLoading(true);
      }

      // Paso 2: Hacer la petición
      try {
        const response = await fetch(resolvedUrl, {
          signal: abortControllerRef.current.signal,
          cache: forceRefresh ? 'no-store' : 'default',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const transformedData = transform ? transform(json) : (json as T);

        if (isMountedRef.current) {
          setData(transformedData);
          setCache(cacheKey, transformedData, cacheConfig);
          setIsFromCache(false);
          setError(null);
        }
      } catch (err: unknown) {
        // Ignorar errores de abort
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error(`Error fetching ${cacheKey}:`, err);

        if (isMountedRef.current) {
          // Si tenemos datos cacheados, los mantenemos y mostramos error silencioso
          if (!data) {
            setError('No se pudieron cargar los datos');
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRevalidating(false);
        }
      }
    },
    [url, cacheKey, cacheConfig, transform, data]
  );

  // Cargar datos al montar
  useEffect(() => {
    isMountedRef.current = true;

    if (immediate) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  const refetch = useCallback(
    async (forceRefresh = false) => {
      await fetchData(forceRefresh);
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    isFromCache,
    isRevalidating,
    refetch,
  };
}

/**
 * Hook especializado para eventos del calendario
 * Usa caché por rango de fechas
 */
export function useCalendarEvents(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ cached: boolean; lastUpdate?: string } | null>(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(
    async (forceRefresh = false) => {
      // Cancelar petición anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      const cacheKey = `calendar_${startISO.split('T')[0]}_${endISO.split('T')[0]}`;
      const cacheConfig = CACHE_CONFIGS.calendarEvents;

      // Paso 1: Mostrar datos cacheados
      if (!forceRefresh) {
        const cached = getCache<CalendarEvent[]>(cacheKey, cacheConfig);

        if (cached.data) {
          setEvents(cached.data);
          setLoading(false);

          if (cached.isFresh) {
            return;
          }

          setIsRevalidating(true);
        }
      } else {
        setLoading(true);
      }

      // Paso 2: Fetch
      try {
        const params = new URLSearchParams({
          start: startISO,
          end: endISO,
        });

        if (forceRefresh) {
          params.set('refresh', 'true');
          params.set('ts', String(Date.now()));
        }

        const res = await fetch(`/api/calendar/events?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
          cache: forceRefresh ? 'no-store' : 'default',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const eventsData = Array.isArray(data?.events) ? data.events : [];

        if (isMountedRef.current) {
          setEvents(eventsData);
          setCache(cacheKey, eventsData, cacheConfig);
          setMeta({ cached: Boolean(data?.cached), lastUpdate: data?.lastUpdate });
          setError(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error fetching calendar events:', err);

        if (isMountedRef.current && events.length === 0) {
          setError('No se pudieron cargar los eventos');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRevalidating(false);
        }
      }
    },
    [startDate, endDate, events.length]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchEvents();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate.toISOString(), endDate.toISOString()]);

  return {
    events,
    loading,
    isRevalidating,
    error,
    meta,
    refetch: fetchEvents,
  };
}

/**
 * Hook especializado para datos del Home (santos, evangelio, eventos)
 * Cachea todo junto para carga instantánea
 */
export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    saint: null,
    gospel: null,
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = 'home_data';
      const cacheConfig = CACHE_CONFIGS.gospel; // 1 hora

      // Paso 1: Mostrar datos cacheados
      if (!forceRefresh) {
        const cached = getCache<HomeData>(cacheKey, cacheConfig);

        if (cached.data) {
          setData(cached.data);
          setIsFromCache(true);
          setLoading(false);

          if (cached.isFresh) {
            return;
          }

          setIsRevalidating(true);
        }
      } else {
        setLoading(true);
      }

      // Paso 2: Fetch en paralelo
      try {
        const now = new Date();
        const weekLater = new Date(now);
        weekLater.setDate(weekLater.getDate() + 7);

        const [saintsRes, gospelRes, eventsRes] = await Promise.all([
          fetch('/api/saints/today'),
          fetch('/api/gospel/today'),
          fetch(`/api/calendar/events?start=${now.toISOString()}&end=${weekLater.toISOString()}`),
        ]);

        const newData: HomeData = {
          saint: null,
          gospel: null,
          upcomingEvents: [],
        };

        if (saintsRes.ok) {
          const json = await saintsRes.json();
          newData.saint = json.saint;
        }

        if (gospelRes.ok) {
          const json = await gospelRes.json();
          newData.gospel = json.gospel;
        }

        if (eventsRes.ok) {
          const json = await eventsRes.json();
          newData.upcomingEvents = Array.isArray(json.events) ? json.events.slice(0, 3) : [];
        }

        if (isMountedRef.current) {
          setData(newData);
          setCache(cacheKey, newData, cacheConfig);
          setIsFromCache(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
        if (isMountedRef.current && !data.saint && !data.gospel) {
          setError('No se pudo cargar el contenido');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRevalidating(false);
        }
      }
    },
    [data.saint, data.gospel]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    saint: data.saint,
    gospel: data.gospel,
    upcomingEvents: data.upcomingEvents,
    loading,
    isFromCache,
    isRevalidating,
    error,
    refetch: fetchData,
  };
}
