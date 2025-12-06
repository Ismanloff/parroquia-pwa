/**
 * Rate Limiter con Circuit Breaker para protección de la API
 *
 * Previene:
 * - Abuso de usuarios individuales
 * - Sobrecarga del sistema
 * - Costos excesivos de OpenAI
 */

import { kv } from '@vercel/kv';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // IP, userId, etc.
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class RateLimiter {
  /**
   * Verifica si una request está dentro del rate limit
   *
   * Ejemplo: 10 requests por minuto por IP
   */
  static async checkRateLimit(config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `rate_limit:${config.identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Obtener contador actual
      const current = await kv.get<number>(key) || 0;

      if (current >= config.maxRequests) {
        // Rate limit excedido
        const ttl = await kv.ttl(key);
        const resetAt = now + (ttl * 1000);

        return {
          allowed: false,
          remaining: 0,
          resetAt,
        };
      }

      // Incrementar contador
      const newCount = current + 1;
      await kv.set(key, newCount, { px: config.windowMs });

      return {
        allowed: true,
        remaining: config.maxRequests - newCount,
        resetAt: now + config.windowMs,
      };
    } catch (error) {
      console.error('Error en rate limiter:', error);
      // En caso de error, permitir la request (fail open)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
      };
    }
  }
}

export class CircuitBreaker {
  private static readonly FAILURE_THRESHOLD = 5; // Fallos para abrir circuito
  private static readonly TIMEOUT_MS = 60000; // 1 minuto en estado "open"
  private static readonly HALF_OPEN_MAX_REQUESTS = 3; // Requests en "half-open"

  /**
   * Circuit Breaker para OpenAI API
   *
   * Estados:
   * - CLOSED: Normal (permite requests)
   * - OPEN: Demasiados fallos (bloquea requests)
   * - HALF-OPEN: Probando si el servicio se recuperó
   */
  static async checkCircuit(service: string): Promise<{ allowed: boolean; state: string }> {
    const key = `circuit_breaker:${service}`;

    try {
      const state = await kv.get<CircuitBreakerState>(key);

      if (!state) {
        // Primera vez, crear estado inicial
        await kv.set(key, {
          failures: 0,
          lastFailureTime: 0,
          state: 'closed',
        } as CircuitBreakerState);

        return { allowed: true, state: 'closed' };
      }

      const now = Date.now();
      const timeSinceLastFailure = now - state.lastFailureTime;

      // Estado OPEN: Bloquear requests
      if (state.state === 'open') {
        // ¿Ha pasado suficiente tiempo para intentar de nuevo?
        if (timeSinceLastFailure > this.TIMEOUT_MS) {
          // Cambiar a HALF-OPEN
          await kv.set(key, {
            ...state,
            state: 'half-open',
          } as CircuitBreakerState);

          return { allowed: true, state: 'half-open' };
        }

        // Circuito aún abierto
        return { allowed: false, state: 'open' };
      }

      // Estado HALF-OPEN: Permitir requests limitadas
      if (state.state === 'half-open') {
        return { allowed: true, state: 'half-open' };
      }

      // Estado CLOSED: Normal
      return { allowed: true, state: 'closed' };
    } catch (error) {
      console.error('Error en circuit breaker:', error);
      // Fail open
      return { allowed: true, state: 'unknown' };
    }
  }

  /**
   * Registra un éxito (recupera el circuito)
   */
  static async recordSuccess(service: string): Promise<void> {
    const key = `circuit_breaker:${service}`;

    try {
      const state = await kv.get<CircuitBreakerState>(key);

      if (!state) return;

      // Si estaba en HALF-OPEN, volver a CLOSED
      if (state.state === 'half-open') {
        await kv.set(key, {
          failures: 0,
          lastFailureTime: 0,
          state: 'closed',
        } as CircuitBreakerState);
      }

      // Si estaba en CLOSED, decrementar fallos
      if (state.state === 'closed' && state.failures > 0) {
        await kv.set(key, {
          ...state,
          failures: Math.max(0, state.failures - 1),
        } as CircuitBreakerState);
      }
    } catch (error) {
      console.error('Error registrando éxito en circuit breaker:', error);
    }
  }

  /**
   * Registra un fallo (puede abrir el circuito)
   */
  static async recordFailure(service: string): Promise<void> {
    const key = `circuit_breaker:${service}`;
    const now = Date.now();

    try {
      const state = await kv.get<CircuitBreakerState>(key);

      if (!state) {
        await kv.set(key, {
          failures: 1,
          lastFailureTime: now,
          state: 'closed',
        } as CircuitBreakerState);
        return;
      }

      const newFailures = state.failures + 1;

      // ¿Excedimos el threshold?
      if (newFailures >= this.FAILURE_THRESHOLD) {
        console.warn(`🚨 Circuit breaker OPEN para ${service} (${newFailures} fallos)`);

        await kv.set(key, {
          failures: newFailures,
          lastFailureTime: now,
          state: 'open',
        } as CircuitBreakerState);
      } else {
        await kv.set(key, {
          failures: newFailures,
          lastFailureTime: now,
          state: state.state,
        } as CircuitBreakerState);
      }
    } catch (error) {
      console.error('Error registrando fallo en circuit breaker:', error);
    }
  }
}
