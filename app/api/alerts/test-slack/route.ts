/**
 * Test Slack Alerts
 *
 * GET /api/alerts/test-slack?type=test|error|degraded|load|cost|security
 *
 * Testing endpoint for Slack alert integration.
 * Only available in development/staging environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendTestAlert,
  alertSystemError,
  alertSystemDegraded,
  alertHighLoad,
  alertCostThreshold,
  alertSecurityEvent,
  alertDeployment,
  alertDatabaseIssue,
} from '@/lib/alerts/slack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in development/staging
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints not available in production' },
      { status: 403 }
    );
  }

  // Check if Slack webhook is configured
  if (!process.env.SLACK_WEBHOOK_URL) {
    return NextResponse.json(
      {
        error: 'SLACK_WEBHOOK_URL not configured',
        message: 'Add SLACK_WEBHOOK_URL to your environment variables',
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const alertType = searchParams.get('type') || 'test';

  let success = false;

  try {
    switch (alertType) {
      case 'test':
        success = await sendTestAlert();
        break;

      case 'error':
        success = await alertSystemError(
          new Error('Test error from alert system'),
          {
            endpoint: '/api/alerts/test-slack',
            userId: 'test-user-123',
            timestamp: new Date().toISOString(),
          }
        );
        break;

      case 'degraded':
        success = await alertSystemDegraded('Supabase Database', 2500, 1000);
        break;

      case 'load':
        success = await alertHighLoad('Active Connections', 850, 1000);
        break;

      case 'cost':
        success = await alertCostThreshold('January 2025', 285.50, 300, {
          'OpenAI API': 150.25,
          'Pinecone': 75.00,
          'Voyage AI': 45.25,
          'Vercel': 15.00,
        });
        break;

      case 'security':
        success = await alertSecurityEvent(
          'Multiple Failed Login Attempts',
          'high',
          {
            'IP Address': '192.168.1.100',
            'Failed Attempts': '15',
            'Time Window': '5 minutes',
            'User': 'admin@resply.com',
          }
        );
        break;

      case 'deployment':
        success = await alertDeployment(
          'success',
          '1.2.0',
          'production',
          'admin@resply.com'
        );
        break;

      case 'database':
        success = await alertDatabaseIssue(
          'High Connection Count',
          'warning',
          'Database connection pool is at 85% capacity (850/1000 connections)'
        );
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid alert type',
            validTypes: [
              'test',
              'error',
              'degraded',
              'load',
              'cost',
              'security',
              'deployment',
              'database',
            ],
          },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `${alertType} alert sent to Slack successfully`,
        type: alertType,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send alert to Slack',
          type: alertType,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error testing Slack alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
