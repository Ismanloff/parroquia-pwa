# Slack Alerting System Setup

## Overview

The Slack alerting system sends real-time notifications to your Slack workspace for critical events:
- System errors and exceptions
- Performance degradation
- High load warnings
- Cost threshold alerts
- Security events
- Deployment notifications
- Database issues

## Architecture

```
Critical Event → Alert Function → Slack Webhook → #alerts Channel
```

**Components:**
- **[lib/alerts/slack.ts](lib/alerts/slack.ts)** - Alert functions and message formatting
- **[app/api/alerts/test-slack/route.ts](app/api/alerts/test-slack/route.ts)** - Test endpoint
- Integration points in critical API routes

## Setup Instructions

### 1. Create Slack Incoming Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose a channel (recommended: `#alerts` or `#ops`)
5. Copy the webhook URL

**Example webhook URL:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### 2. Configure Environment Variables

Add to `.env.local` and Vercel project settings:

```bash
# Slack Webhook for Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Vercel Configuration:**
```bash
vercel env add SLACK_WEBHOOK_URL
# Paste webhook URL when prompted
# Select: Production, Preview, Development
```

### 3. Test Integration

After deployment, test each alert type:

```bash
# Test basic connectivity
curl https://your-domain.vercel.app/api/alerts/test-slack?type=test

# Test error alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=error

# Test performance degradation alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=degraded

# Test high load alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=load

# Test cost threshold alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=cost

# Test security event alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=security

# Test deployment notification
curl https://your-domain.vercel.app/api/alerts/test-slack?type=deployment

# Test database issue alert
curl https://your-domain.vercel.app/api/alerts/test-slack?type=database
```

## Alert Types

### 1. System Error Alert

**Function:** `alertSystemError(error, context?)`

**When to use:** Critical system errors that require immediate attention

**Example:**
```typescript
import { alertSystemError } from '@/lib/alerts/slack';

try {
  await criticalOperation();
} catch (error) {
  alertSystemError(error as Error, {
    endpoint: '/api/critical/operation',
    userId: 'user-123',
    workspaceId: 'workspace-456',
  });
  throw error;
}
```

**Slack Message:**
```
🚨 System Error Detected

Error Type: TypeError
Environment: production

Stack Trace:
```
TypeError: Cannot read property 'id' of undefined
    at /api/documents/process:125:30
```

Context:
```json
{
  "endpoint": "/api/documents/process",
  "documentId": "doc-123",
  "workspaceId": "workspace-456"
}
```
```

### 2. Performance Degradation Alert

**Function:** `alertSystemDegraded(service, latency, threshold)`

**When to use:** Service response time exceeds threshold

**Example:**
```typescript
import { alertSystemDegraded } from '@/lib/alerts/slack';

const startTime = Date.now();
const result = await supabaseAdmin.from('documents').select('*');
const latency = Date.now() - startTime;

if (latency > 1000) {
  alertSystemDegraded('Supabase Database', latency, 1000);
}
```

**Slack Message:**
```
⚠️ System Performance Degraded

Supabase Database is responding slowly

Service: Supabase Database
Current Latency: 2500ms
Threshold: 1000ms
Status: Degraded Performance
```

### 3. High Load Alert

**Function:** `alertHighLoad(metric, current, threshold)`

**When to use:** System metrics exceed capacity thresholds

**Example:**
```typescript
import { alertHighLoad } from '@/lib/alerts/slack';

const activeConnections = await getActiveConnections();
const threshold = 1000;

if (activeConnections > threshold * 0.85) {
  alertHighLoad('Active Connections', activeConnections, threshold);
}
```

**Slack Message:**
```
⚠️ High Load Warning

Active Connections is above threshold

Metric: Active Connections
Current Value: 850
Threshold: 1000
Percentage: 85%
```

### 4. Cost Threshold Alert

**Function:** `alertCostThreshold(period, currentCost, threshold, breakdown?)`

**When to use:** API costs approach or exceed budget limits

**Example:**
```typescript
import { alertCostThreshold } from '@/lib/alerts/slack';

const monthlyCosts = {
  'OpenAI API': 150.25,
  'Pinecone': 75.00,
  'Voyage AI': 45.25,
  'Vercel': 15.00,
};

const totalCost = Object.values(monthlyCosts).reduce((a, b) => a + b, 0);
const budget = 300;

if (totalCost > budget * 0.85) {
  alertCostThreshold('January 2025', totalCost, budget, monthlyCosts);
}
```

**Slack Message:**
```
💰 Cost Threshold Alert

Approaching budget limit

Period: January 2025
Current Cost: $285.50
Threshold: $300.00
Percentage: 95%

Cost Breakdown:
• OpenAI API: $150.25
• Pinecone: $75.00
• Voyage AI: $45.25
• Vercel: $15.00
```

### 5. Security Event Alert

**Function:** `alertSecurityEvent(eventType, severity, details)`

**When to use:** Security-related events (failed logins, suspicious activity)

**Example:**
```typescript
import { alertSecurityEvent } from '@/lib/alerts/slack';

// Track failed login attempts
const failedAttempts = await getFailedLoginAttempts(ipAddress);

if (failedAttempts > 10) {
  alertSecurityEvent(
    'Multiple Failed Login Attempts',
    'high',
    {
      'IP Address': ipAddress,
      'Failed Attempts': failedAttempts.toString(),
      'Time Window': '5 minutes',
      'User': email,
    }
  );
}
```

**Slack Message:**
```
🚨 Security Event: Multiple Failed Login Attempts

Severity: HIGH

IP Address: 192.168.1.100
Failed Attempts: 15
Time Window: 5 minutes
User: admin@resply.com
```

### 6. Deployment Notification

**Function:** `alertDeployment(status, version, environment, deployedBy?)`

**When to use:** CI/CD pipeline events

**Example:**
```typescript
import { alertDeployment } from '@/lib/alerts/slack';

// In GitHub Actions or Vercel deploy hook
await alertDeployment(
  'success',
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || '1.0.0',
  process.env.VERCEL_ENV || 'production',
  process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN
);
```

**Slack Message:**
```
✅ Deployment success

Version 1.2.0 to production

Status: SUCCESS
Environment: production
Version: 1.2.0
Deployed By: admin@resply.com
```

### 7. Database Issue Alert

**Function:** `alertDatabaseIssue(issue, severity, details?)`

**When to use:** Database connectivity or performance issues

**Example:**
```typescript
import { alertDatabaseIssue } from '@/lib/alerts/slack';

try {
  await supabaseAdmin.from('workspaces').select('id').limit(1).single();
} catch (error) {
  alertDatabaseIssue(
    'Database Connection Failed',
    'critical',
    error.message
  );
}
```

**Slack Message:**
```
🚨 Critical Database Issue

Database Connection Failed

Severity: CRITICAL
Service: Supabase PostgreSQL
Details: ECONNREFUSED - Connection refused
```

## Integration Points

### Current Integrations

1. **[app/api/documents/process/route.ts](app/api/documents/process/route.ts)** (line 323)
   - Sends error alerts when document processing fails
   - Only in production environment

### Recommended Integrations

Add Slack alerts to these critical endpoints:

#### 1. Authentication Errors
```typescript
// app/api/auth/login/route.ts
if (failedLoginAttempts > 5) {
  alertSecurityEvent('Multiple Failed Login Attempts', 'medium', {
    email,
    attempts: failedLoginAttempts.toString(),
    ipAddress,
  });
}
```

#### 2. Chat API Errors
```typescript
// app/api/chat/completions/route.ts
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  if (error.status === 429) { // Rate limit
    alertHighLoad('OpenAI API Rate Limit', currentRate, rateLimit);
  } else {
    alertSystemError(error as Error, { endpoint: '/api/chat/completions' });
  }
}
```

#### 3. Database Performance
```typescript
// In health check or monitoring middleware
const dbLatency = await measureDatabaseLatency();
if (dbLatency > 1000) {
  alertSystemDegraded('Supabase Database', dbLatency, 1000);
}
```

#### 4. Cost Monitoring (Daily Cron)
```typescript
// app/api/cron/daily-cost-check/route.ts
const dailyCosts = await calculateDailyCosts();
const monthlyProjection = dailyCosts * 30;
const budget = 300;

if (monthlyProjection > budget * 0.9) {
  alertCostThreshold(
    `${new Date().toLocaleString('default', { month: 'long' })} 2025`,
    monthlyProjection,
    budget,
    costBreakdown
  );
}
```

## Alert Channels

### Recommended Channel Structure

1. **#alerts** (High Priority)
   - System errors
   - Critical security events
   - Database failures
   - Production deployments

2. **#monitoring** (Medium Priority)
   - Performance degradation
   - High load warnings
   - Cost alerts

3. **#deployments** (Low Priority)
   - Successful deployments
   - Version updates

### Channel Configuration

```typescript
// Configure different webhooks for different channels
const ALERT_WEBHOOKS = {
  critical: process.env.SLACK_WEBHOOK_ALERTS, // #alerts
  monitoring: process.env.SLACK_WEBHOOK_MONITORING, // #monitoring
  deployments: process.env.SLACK_WEBHOOK_DEPLOYMENTS, // #deployments
};
```

## Best Practices

### 1. Rate Limiting

Prevent alert spam:

```typescript
// lib/alerts/rate-limiter.ts
const alertCache = new Map<string, number>();

export function shouldSendAlert(alertKey: string, cooldownMs = 300000): boolean {
  const lastSent = alertCache.get(alertKey);
  const now = Date.now();

  if (lastSent && now - lastSent < cooldownMs) {
    return false; // Skip alert (cooldown period)
  }

  alertCache.set(alertKey, now);
  return true;
}

// Usage
if (shouldSendAlert(`error-${error.message}`, 5 * 60 * 1000)) {
  alertSystemError(error, context);
}
```

### 2. Environment-Specific Alerts

```typescript
// Only send alerts in production
if (process.env.NODE_ENV === 'production') {
  alertSystemError(error, context);
}

// Or use VERCEL_ENV for more granularity
if (process.env.VERCEL_ENV === 'production') {
  alertSystemError(error, context);
}
```

### 3. Error Handling

Always catch alert failures:

```typescript
try {
  await criticalOperation();
} catch (error) {
  alertSystemError(error as Error, context).catch((alertError) => {
    console.error('Failed to send Slack alert:', alertError);
    // Don't fail the main operation if alert fails
  });
  throw error;
}
```

### 4. Contextual Information

Include relevant context:

```typescript
alertSystemError(error, {
  endpoint: req.url,
  method: req.method,
  userId: session?.user?.id,
  workspaceId,
  userAgent: req.headers.get('user-agent'),
  timestamp: new Date().toISOString(),
});
```

## Monitoring Dashboard

### Slack App (Optional)

Create a custom Slack app for richer interactions:

1. **Buttons**: Acknowledge alerts, view details in Sentry
2. **Slash Commands**: `/resply status`, `/resply health`
3. **Interactive Messages**: Resolve incidents, trigger rollbacks

### Metrics to Track

- **Alert Volume**: Alerts per hour/day
- **Response Time**: Time from alert to acknowledgment
- **False Positive Rate**: Alerts that don't require action
- **MTTR**: Mean Time to Resolution

## Troubleshooting

### Alerts Not Appearing

1. Check webhook URL is correct:
   ```bash
   echo $SLACK_WEBHOOK_URL
   ```

2. Test webhook manually:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}'
   ```

3. Check Vercel logs for errors:
   ```bash
   vercel logs
   ```

### Too Many Alerts

1. Implement rate limiting (see Best Practices)
2. Increase alert thresholds
3. Add cooldown periods between duplicate alerts
4. Filter out noisy errors

### Missing Context

Ensure you're passing relevant context:
```typescript
alertSystemError(error, {
  endpoint: '/api/documents/process',
  documentId,
  workspaceId,
  mimeType,
  fileSize,
});
```

## Next Steps

1. ✅ Slack utility module created
2. ✅ Test endpoint created
3. ✅ Document processing integration added
4. ⏳ Create Slack incoming webhook
5. ⏳ Configure SLACK_WEBHOOK_URL in Vercel
6. ⏳ Test all alert types
7. ⏳ Add integrations to remaining critical endpoints
8. ⏳ Set up alert rate limiting
9. ⏳ Document incident response procedures

## Related Documentation

- [Slack Utility Module](lib/alerts/slack.ts)
- [Test Endpoint](app/api/alerts/test-slack/route.ts)
- [Sentry Setup](SENTRY_SETUP.md)
- [Uptime Monitoring](UPTIME_MONITORING_SETUP.md)
- [Slack Incoming Webhooks API](https://api.slack.com/messaging/webhooks)

---

**Last Updated**: 2025-01-05
**Status**: ✅ Code complete, ⏳ Configuration pending
**Estimated Setup Time**: 10-15 minutes
