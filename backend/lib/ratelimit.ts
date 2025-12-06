import { kv } from '@vercel/kv';

export type RateLimitConfig = {
  limit: number;
  window: string; // '10s', '1m', '1h', '1d'
};

export async function checkRateLimit(identifier: string, config: RateLimitConfig = { limit: 10, window: '1m' }) {
  // Si no hay KV configurado (desarrollo local sin env vars), permitimos todo
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn('⚠️ KV no configurado. Rate Limit deshabilitado.');
    return { success: true, remaining: 100, reset: 0 };
  }

  const windowDuration = parseWindow(config.window);
  const key = `ratelimit:${identifier}`;

  try {
    const requests = await kv.incr(key);
    
    if (requests === 1) {
      await kv.expire(key, windowDuration);
    }

    const remaining = Math.max(0, config.limit - requests);
    
    return {
      success: requests <= config.limit,
      remaining,
      reset: Date.now() + (windowDuration * 1000),
    };
  } catch (error) {
    console.error('❌ Error en Rate Limit:', error);
    // En caso de error de Redis, permitimos el tráfico para no bloquear usuarios legítimos (fail open)
    return { success: true, remaining: 1, reset: 0 };
  }
}

function parseWindow(window: string): number {
  const value = parseInt(window.slice(0, -1));
  const unit = window.slice(-1);
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 60; // Default 1m
  }
}
