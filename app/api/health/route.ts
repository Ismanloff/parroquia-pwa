/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Verifica el estado del sistema:
 * - Database connectivity (Supabase)
 * - External services status
 * - Uptime
 *
 * Usado por:
 * - UptimeRobot monitoring
 * - Load balancers
 * - Health dashboards
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Track server start time
const serverStartTime = Date.now();

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const { error: dbError } = await supabaseAdmin!
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();

    const dbStatus = dbError ? 'unhealthy' : 'healthy';
    const dbLatency = Date.now() - startTime;

    // Calculate uptime
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    // Overall system status
    const systemStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded';

    return NextResponse.json({
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        human: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
      },
      services: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
        },
        api: {
          status: 'healthy',
          latency_ms: Date.now() - startTime,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, {
      status: systemStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: {
        seconds: Math.floor((Date.now() - serverStartTime) / 1000),
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}
