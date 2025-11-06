/**
 * Test Sentry Error Capturing
 *
 * GET /api/test-sentry?type=error|warning|info
 *
 * Testing endpoint to verify Sentry integration works correctly.
 * Should only be used in development/staging environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  captureError,
  captureMessage,
  withSentryErrorHandler,
  setUserContext,
  addBreadcrumb,
  startTransaction
} from '@/lib/monitoring/sentry';

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

  return withSentryErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'error';

    // Simulate user context
    setUserContext('test-user-123', 'test@resply.com', 'test-workspace-456');

    // Add breadcrumb
    addBreadcrumb(
      'test',
      `Testing Sentry with type: ${testType}`,
      'info',
      { testType, timestamp: new Date().toISOString() }
    );

    switch (testType) {
      case 'error':
        // Test error capturing
        try {
          throw new Error('Test error from Sentry test endpoint');
        } catch (error) {
          captureError(error, {
            userId: 'test-user-123',
            workspaceId: 'test-workspace-456',
            endpoint: '/api/test-sentry',
            method: 'GET',
            additionalData: {
              testType: 'intentional-error',
              environment: process.env.NODE_ENV,
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Error captured and sent to Sentry',
            type: 'error',
          });
        }

      case 'warning':
        // Test warning message
        captureMessage(
          'Test warning message from Sentry test endpoint',
          'warning',
          {
            userId: 'test-user-123',
            workspaceId: 'test-workspace-456',
            testType: 'intentional-warning',
          }
        );
        return NextResponse.json({
          success: true,
          message: 'Warning captured and sent to Sentry',
          type: 'warning',
        });

      case 'info':
        // Test info message
        captureMessage(
          'Test info message from Sentry test endpoint',
          'info',
          {
            userId: 'test-user-123',
            workspaceId: 'test-workspace-456',
            testType: 'intentional-info',
          }
        );
        return NextResponse.json({
          success: true,
          message: 'Info message captured and sent to Sentry',
          type: 'info',
        });

      case 'transaction':
        // Test transaction tracking
        const transaction = startTransaction('test-operation', 'test');
        transaction.setAttribute('test', 'true');
        transaction.setAttribute('userId', 'test-user-123');

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));

        transaction.end();
        return NextResponse.json({
          success: true,
          message: 'Transaction tracked and sent to Sentry',
          type: 'transaction',
        });

      case 'unhandled':
        // Test unhandled error (will be caught by withSentryErrorHandler)
        throw new Error('Unhandled test error - should be caught by wrapper');

      default:
        return NextResponse.json({
          error: 'Invalid test type',
          validTypes: ['error', 'warning', 'info', 'transaction', 'unhandled'],
        }, { status: 400 });
    }
  }, {
    endpoint: '/api/test-sentry',
    method: 'GET',
  });
}
