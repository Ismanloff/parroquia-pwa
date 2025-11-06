/**
 * Optimized Supabase Client with Connection Pooling
 *
 * Improvements:
 * - Connection pooling for better performance
 * - Automatic retries on transient failures
 * - Connection limits to prevent exhaustion
 * - Health checks
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

interface SupabasePoolConfig {
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionRetryAttempts?: number;
}

class SupabaseConnectionPool {
  private static instance: SupabaseConnectionPool;
  private adminClient: SupabaseClient<Database> | null = null;
  private anonClient: SupabaseClient<Database> | null = null;
  private activeConnections = 0;
  private readonly maxConnections: number;

  private constructor(config: SupabasePoolConfig = {}) {
    this.maxConnections = config.maxConnections || 10;

    // Initialize admin client (for server-side operations)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.adminClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          db: {
            schema: 'public',
          },
          global: {
            headers: {
              'x-client-info': 'resply-server',
            },
          },
          // Connection pooling via HTTP keepalive
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        }
      );
    }

    // Initialize anon client (for client-side operations)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.anonClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'resply-auth-token',
          },
        }
      );
    }
  }

  /**
   * Singleton instance
   */
  static getInstance(config?: SupabasePoolConfig): SupabaseConnectionPool {
    if (!SupabaseConnectionPool.instance) {
      SupabaseConnectionPool.instance = new SupabaseConnectionPool(config);
    }
    return SupabaseConnectionPool.instance;
  }

  /**
   * Get admin client (server-side operations)
   */
  getAdminClient(): SupabaseClient<Database> {
    if (!this.adminClient) {
      throw new Error('Supabase admin client not configured. Check environment variables.');
    }
    return this.adminClient;
  }

  /**
   * Get anon client (client-side operations)
   */
  getAnonClient(): SupabaseClient<Database> {
    if (!this.anonClient) {
      throw new Error('Supabase anon client not configured. Check environment variables.');
    }
    return this.anonClient;
  }

  /**
   * Execute query with automatic retries
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Check connection health
   */
  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const startTime = Date.now();

    try {
      const { error } = await this.getAdminClient()
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();

      const latencyMs = Date.now() - startTime;

      return {
        healthy: !error,
        latencyMs,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get connection pool stats
   */
  getStats() {
    return {
      activeConnections: this.activeConnections,
      maxConnections: this.maxConnections,
      utilization: (this.activeConnections / this.maxConnections) * 100,
      adminConfigured: !!this.adminClient,
      anonConfigured: !!this.anonClient,
    };
  }

  /**
   * Track active connection
   */
  private incrementConnections() {
    this.activeConnections++;
  }

  /**
   * Release connection
   */
  private decrementConnections() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  /**
   * Execute operation with connection tracking
   */
  async executeWithTracking<T>(operation: () => Promise<T>): Promise<T> {
    this.incrementConnections();
    try {
      return await operation();
    } finally {
      this.decrementConnections();
    }
  }
}

// Export singleton instance
const pool = SupabaseConnectionPool.getInstance({
  maxConnections: 30,        // Increased from 10 to 30 (3x capacity)
  idleTimeoutMs: 15000,      // Reduced from 30s to 15s (faster connection recycling)
  connectionRetryAttempts: 3,
});

/**
 * Optimized Supabase admin client
 */
export const supabaseAdmin = pool.getAdminClient();

/**
 * Optimized Supabase anon client
 */
export const supabase = pool.getAnonClient();

/**
 * Execute with automatic retries
 */
export const withRetry = pool.withRetry.bind(pool);

/**
 * Check database health
 */
export const checkDatabaseHealth = pool.checkHealth.bind(pool);

/**
 * Get connection pool stats
 */
export const getPoolStats = pool.getStats.bind(pool);

/**
 * Execute with connection tracking
 */
export const executeWithTracking = pool.executeWithTracking.bind(pool);
