# Sentry Setup Guide

## Overview

Sentry is integrated into Resply for comprehensive error tracking, performance monitoring, and user session replay.

## Features

- **Error Tracking**: Automatic capture of exceptions and errors
- **Performance Monitoring**: Transaction tracking and performance metrics
- **Session Replay**: Visual reproduction of user sessions when errors occur
- **User Context**: Track errors per user and workspace
- **Breadcrumbs**: Detailed debugging information leading up to errors
- **Source Maps**: Error stack traces mapped to original source code

## Configuration Files

### 1. Sentry Config Files

- **[sentry.client.config.ts](sentry.client.config.ts)** - Client-side configuration
  - Session replay enabled (10% of all sessions, 100% of error sessions)
  - Filters out localhost errors
  - Ignores browser extension errors

- **[sentry.server.config.ts](sentry.server.config.ts)** - Server-side configuration
  - 50% transaction sampling in production (100% in development)
  - Filters out development errors
  - Ignores common network errors (ECONNREFUSED, ETIMEDOUT, etc.)

- **[sentry.edge.config.ts](sentry.edge.config.ts)** - Edge runtime configuration
  - Used by middleware and edge functions

### 2. Helper Functions

**[lib/monitoring/sentry.ts](lib/monitoring/sentry.ts)** provides easy-to-use wrappers:

```typescript
// Capture errors with context
captureError(error, {
  userId: 'user-123',
  workspaceId: 'workspace-456',
  endpoint: '/api/documents/upload',
  method: 'POST',
});

// Capture info/warning messages
captureMessage('Document processing started', 'info', {
  documentId: 'doc-123'
});

// Wrap API routes for automatic error handling
export async function POST(req: NextRequest) {
  return withSentryErrorHandler(async () => {
    // Your logic here
  }, {
    endpoint: '/api/documents/upload',
    method: 'POST',
  });
}

// Track user context
setUserContext(userId, email, workspaceId);

// Add debugging breadcrumbs
addBreadcrumb('document', 'Starting text extraction', 'info', {
  documentId: 'doc-123'
});

// Performance monitoring
const transaction = startTransaction('document-processing', 'task');
transaction.setAttribute('documentId', 'doc-123');
transaction.setAttribute('workspaceId', 'workspace-456');
// ... do work
transaction.setStatus({ code: 1, message: 'ok' }); // Success
transaction.end();
```

## Setup Instructions

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - Platform: **Next.js**
   - Name: **resply** (or your project name)
   - Team: Select your team
3. Copy the DSN from the project settings

### 2. Configure Environment Variables

Add these variables to your `.env.local` and Vercel project settings:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-key@o-your-org.ingest.sentry.io/your-project-id
SENTRY_DSN=https://your-key@o-your-org.ingest.sentry.io/your-project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token-for-uploading-sourcemaps
```

**How to get SENTRY_AUTH_TOKEN:**
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Create new token with scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy the token

### 3. Deploy to Vercel

```bash
# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add SENTRY_DSN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add SENTRY_AUTH_TOKEN

# Deploy
vercel --prod
```

### 4. Verify Integration

After deployment:

1. **Test error capturing**: Visit `/api/test-sentry?type=error`
2. **Test warnings**: Visit `/api/test-sentry?type=warning`
3. **Test transactions**: Visit `/api/test-sentry?type=transaction`
4. **Check Sentry Dashboard**: Go to sentry.io and verify events appear

## Integrated Endpoints

Sentry is already integrated into these critical endpoints:

### 1. Document Processing
- **[app/api/documents/process/route.ts](app/api/documents/process/route.ts)**
- Tracks full document processing pipeline
- Captures errors with document context
- Performance monitoring via transactions
- Breadcrumbs for each processing step

### 2. Authentication
- **[app/api/auth/login/route.ts](app/api/auth/login/route.ts)**
- Sets user context on successful login
- Captures authentication errors

### 3. Health Check
- **[app/api/health/route.ts](app/api/health/route.ts)**
- Returns system health status
- Database connectivity monitoring
- Uptime tracking

### 4. Test Endpoint
- **[app/api/test-sentry/route.ts](app/api/test-sentry/route.ts)**
- Manual testing of Sentry integration
- Only available in development/staging

## Best Practices

### 1. Always Add Context

```typescript
// ❌ BAD: No context
captureError(error);

// ✅ GOOD: With context
captureError(error, {
  userId: currentUser.id,
  workspaceId: workspace.id,
  endpoint: '/api/conversations/messages',
  method: 'POST',
  additionalData: {
    conversationId,
    messageLength: message.length,
  },
});
```

### 2. Use Breadcrumbs for Debugging

```typescript
// Add breadcrumbs before key operations
addBreadcrumb('payment', 'Starting Stripe checkout', 'info', {
  customerId: customer.id,
  amount: 2000,
});

try {
  const session = await stripe.checkout.sessions.create({...});
  addBreadcrumb('payment', 'Checkout session created', 'info', {
    sessionId: session.id,
  });
} catch (error) {
  // Error will include breadcrumbs showing what led to failure
  captureError(error, {...});
}
```

### 3. Track Performance-Critical Operations

```typescript
const transaction = startTransaction('ai-response-generation', 'task');
transaction.setAttribute('model', 'gpt-4');
transaction.setAttribute('tokens', 1500);

try {
  const response = await openai.chat.completions.create({...});
  transaction.setStatus({ code: 1, message: 'ok' });
} catch (error) {
  transaction.setStatus({ code: 2, message: 'internal_error' });
  captureError(error, {...});
} finally {
  transaction.end(); // Records duration
}
```

### 4. Set User Context Early

```typescript
// In middleware or auth routes
const user = await getCurrentUser();
if (user) {
  setUserContext(user.id, user.email, user.workspaceId);
}

// Clear on logout
clearUserContext();
```

## Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate**
   - Should be < 1% of total requests
   - Spike indicates new bugs or infrastructure issues

2. **Transaction Performance**
   - P95 latency for API routes
   - Identify slow endpoints

3. **Issues by Workspace**
   - Tag errors with workspaceId to identify problem tenants
   - May indicate data-specific bugs

4. **Session Replays**
   - Watch user sessions leading to errors
   - Identify UX issues

### Alerts to Set Up

1. **High Error Rate**: Error rate > 5% for 5 minutes
2. **Slow Transactions**: P95 latency > 5s for critical endpoints
3. **Repeated Errors**: Same error > 50 times in 1 hour
4. **New Issue**: First occurrence of a new error type

## Source Maps

Source maps are automatically uploaded during Vercel builds via the Sentry webpack plugin.

**Configuration in [next.config.ts](next.config.ts):**
```typescript
import { withSentryConfig } from '@sentry/nextjs';

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

## Environments

Sentry automatically detects environments:

- **Development**: No events sent (filtered in `beforeSend`)
- **Preview**: Uses `VERCEL_ENV=preview`
- **Production**: Uses `VERCEL_ENV=production`

## Costs

- **Free Tier**: 5,000 errors/month, 10,000 transactions/month
- **Team Plan ($26/month)**: 50,000 errors, 100,000 transactions
- **Business Plan ($80/month)**: 100,000 errors, 500,000 transactions

**Our settings:**
- Client: 100% transaction sampling in dev, 10% session replay
- Server: 50% transaction sampling in production
- Estimated monthly events: ~20,000-30,000 (fits in Team plan)

## Troubleshooting

### No events appearing in Sentry

1. Check environment variables are set correctly
2. Verify DSN is correct
3. Check browser console for Sentry initialization errors
4. Test with `/api/test-sentry?type=error`

### Source maps not working

1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check build logs for source map upload errors
3. Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match exactly

### Too many events (hitting quota)

1. Increase sampling rate in configs (e.g., 50% → 25%)
2. Add more ignoreErrors patterns for noisy errors
3. Filter out specific error types in Sentry dashboard

## Next Steps

1. ✅ Sentry SDK installed and configured
2. ✅ Helper functions created
3. ✅ Critical endpoints integrated
4. ⏳ Set up Sentry project and get DSN
5. ⏳ Configure environment variables
6. ⏳ Deploy to Vercel
7. ⏳ Test error capturing
8. ⏳ Set up alerts in Sentry dashboard
9. ⏳ Integrate remaining API routes
10. ⏳ Add user context tracking to more routes

## Related Documentation

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Health Check API](app/api/health/route.ts)

---

**Last Updated**: 2025-01-05
**Status**: ✅ Integration Complete
**Next Task**: Deploy and verify in production
