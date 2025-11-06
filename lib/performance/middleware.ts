/**
 * Performance Middleware
 *
 * Provides:
 * - Rate limiting per endpoint
 * - Request timing
 * - Error tracking
 * - Connection pooling optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/app/api/chat/utils/rateLimiter';
import { captureError } from '@/lib/monitoring/sentry';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  bypassForAdmin?: boolean;
}

/**
 * Rate Limit Configurations per endpoint type
 */
export const RATE_LIMITS = {
  // Public widget - higher limits but prevent abuse
  WIDGET: {
    maxRequests: 60, // 60 requests
    windowMs: 60 * 1000, // per minute
  },

  // Chat/AI endpoints - expensive operations
  CHAT: {
    maxRequests: 20, // 20 requests
    windowMs: 60 * 1000, // per minute
  },

  // Document processing - very expensive
  DOCUMENTS: {
    maxRequests: 10, // 10 requests
    windowMs: 60 * 1000, // per minute
  },

  // Auth endpoints - prevent brute force
  AUTH: {
    maxRequests: 5, // 5 attempts
    windowMs: 60 * 1000, // per minute
  },

  // General API - moderate limits
  API: {
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
} as const;

/**
 * Get client identifier for rate limiting
 * Uses IP address, or authenticated user ID if available
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from Vercel headers first
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  // Try to get user ID from authorization header
  const authHeader = req.headers.get('authorization');
  const workspaceId = req.headers.get('x-workspace-id');

  // Priority: authenticated user > workspace > IP
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return `user:${authHeader.substring(7, 50)}`; // Limit length
  }

  if (workspaceId) {
    return `workspace:${workspaceId}`;
  }

  // Fallback to IP
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 */
export async function withRateLimit(
  req: NextRequest,
  config: RateLimitOptions,
  handler: () => Promise<Response | NextResponse>
): Promise<Response | NextResponse> {
  const identifier = getClientIdentifier(req);

  try {
    // Check rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit({
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      identifier,
    });

    if (!rateLimitResult.allowed) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.`,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Execute handler
    const response = await handler();

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());

    return response;
  } catch (error) {
    console.error('🚨 CRITICAL: Rate limiting error - failing SECURE:', error);
    captureError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: req.url,
      method: req.method,
    });

    // SECURITY: Fail secure - block request if rate limiting fails
    // This prevents abuse during infrastructure outages
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        message: 'Rate limiting system is experiencing issues. Please try again later.',
      },
      { status: 503 }
    );
  }
}

/**
 * Measure request timing and add to response headers
 */
export function withTiming<T extends () => Promise<Response | NextResponse>>(
  handler: T
): () => Promise<Response | NextResponse> {
  return async () => {
    const startTime = Date.now();

    try {
      const response = await handler();
      const duration = Date.now() - startTime;

      // Add timing header
      response.headers.set('X-Response-Time', `${duration}ms`);

      // Log slow requests (> 2 seconds)
      if (duration > 2000) {
        console.warn(`⚠️ Slow request detected: ${duration}ms`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error after ${duration}ms:`, error);
      throw error;
    }
  };
}

/**
 * Standard error handler with Sentry integration
 */
export function withErrorHandler(
  handler: () => Promise<Response | NextResponse>,
  context?: {
    endpoint?: string;
    method?: string;
  }
): Promise<Response | NextResponse> {
  return handler().catch((error) => {
    console.error('Request handler error:', error);

    captureError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: context?.endpoint,
      method: context?.method,
      additionalData: {
        message: error.message,
        stack: error.stack,
      },
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      },
      { status: 500 }
    );
  });
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
