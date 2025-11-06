# Uptime Monitoring Setup with UptimeRobot

## Overview

UptimeRobot monitors the availability and response time of your application by pinging the health check endpoint every few minutes. It sends alerts when the service goes down or becomes slow.

## Why UptimeRobot?

- **Free Tier**: 50 monitors, 5-minute interval checks
- **Simple Setup**: No SDK required, just HTTP monitoring
- **Multi-Channel Alerts**: Email, Slack, SMS, webhooks
- **Status Pages**: Public status page for customers
- **Incident History**: Track uptime percentage and incidents

## Prerequisites

- ✅ Health check endpoint created: [/api/health](app/api/health/route.ts)
- ⏳ UptimeRobot account (free)
- ⏳ Slack webhook for alerts (optional)

## Setup Instructions

### 1. Create UptimeRobot Account

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Verify your email

### 2. Create Health Check Monitor

1. Go to Dashboard → **Add New Monitor**
2. Configure monitor:

```
Monitor Type: HTTP(s)
Friendly Name: Resply Production API
URL: https://your-domain.vercel.app/api/health
Monitoring Interval: 5 minutes (free tier)
Monitor Timeout: 30 seconds
```

3. Click **Create Monitor**

### 3. Expected Health Check Response

Your `/api/health` endpoint returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-05T19:00:00.000Z",
  "uptime": {
    "seconds": 3600,
    "human": "1h 0m 0s"
  },
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 45
    },
    "api": {
      "status": "healthy",
      "latency_ms": 50
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

**HTTP Status Codes:**
- `200 OK` = System healthy
- `503 Service Unavailable` = System degraded/unhealthy

### 4. Configure Alert Contacts

#### Email Alerts (Default)

1. Go to **My Settings** → **Alert Contacts**
2. Add your email address
3. Verify email

#### Slack Alerts (Recommended)

1. Go to your Slack workspace
2. Create incoming webhook:
   - Go to **Apps** → **Incoming Webhooks**
   - Click **Add to Slack**
   - Choose channel (e.g., `#alerts`, `#ops`)
   - Copy webhook URL

3. Add to UptimeRobot:
   - Go to **My Settings** → **Alert Contacts**
   - Click **Add Alert Contact**
   - Type: **Webhook**
   - Friendly Name: `Slack - Alerts`
   - URL to Notify: `your-slack-webhook-url`
   - POST Value (JSON):

```json
{
  "text": "*[*monitorFriendlyName*]* is *[*alertType*]*",
  "attachments": [
    {
      "color": "*alertTypeColor*",
      "fields": [
        {
          "title": "Monitor",
          "value": "*monitorFriendlyName*",
          "short": true
        },
        {
          "title": "Status",
          "value": "*alertType*",
          "short": true
        },
        {
          "title": "URL",
          "value": "*monitorURL*",
          "short": false
        },
        {
          "title": "Reason",
          "value": "*alertDetails*",
          "short": false
        }
      ],
      "footer": "UptimeRobot",
      "ts": "*alertDateTime*"
    }
  ]
}
```

4. Enable alerts:
   - Go back to your monitor
   - Click **Edit**
   - Check **Alert Contacts** → Select Slack webhook
   - Save

### 5. Create Additional Monitors (Optional)

For comprehensive monitoring, create monitors for:

1. **Main Application**
   - URL: `https://your-domain.vercel.app`
   - Keyword Check: Look for "Resply" in response

2. **API Endpoints**
   - URL: `https://your-domain.vercel.app/api/health`
   - Response Time Check: Alert if > 2000ms

3. **Widget Embed Script**
   - URL: `https://your-domain.vercel.app/widget.js`
   - Status Code: 200

### 6. Configure Advanced Settings

#### Response Time Monitoring

1. Edit your monitor
2. Enable **Advanced Settings**
3. Set alert conditions:
   - Alert when response time > 2000ms for 5 checks
   - Alert when status code != 200

#### Maintenance Windows

Schedule maintenance windows to avoid false alerts:

1. Go to **Maintenance Windows**
2. Create window for your deployment times
3. Select monitors to pause during maintenance

### 7. Create Status Page (Optional)

Share uptime status with customers:

1. Go to **Status Pages** → **Add Status Page**
2. Configure:
   - Name: `Resply Status`
   - Domain: `status.your-domain.com` (or subdomain)
   - Monitors: Select all production monitors
   - Design: Choose template

3. Share URL with customers

## Integration with Sentry

UptimeRobot monitors **availability** (is it up?), while Sentry tracks **errors** (what went wrong?).

**Recommended Setup:**
- UptimeRobot: Monitors `/api/health` every 5 minutes
- Sentry: Captures all errors and performance issues in real-time

## Environment Variables

Add to `.env.local` and Vercel:

```bash
# UptimeRobot API (optional, for programmatic access)
UPTIME_ROBOT_API_KEY=your-api-key-here

# Slack webhook for alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**How to get UptimeRobot API Key:**
1. Go to **My Settings** → **API Settings**
2. Click **Show API Key**
3. Copy the key

## Alert Configuration

### Recommended Alert Rules

1. **Down Alert**: Immediate
   - Trigger: Service returns non-200 status code
   - Action: Send Slack + Email immediately

2. **Slow Response Alert**: After 5 checks
   - Trigger: Response time > 2000ms for 5 consecutive checks
   - Action: Send Slack notification

3. **Recovery Alert**: Always
   - Trigger: Service recovers from down state
   - Action: Send Slack + Email

### Alert Message Format

**Down Alert:**
```
🚨 [Resply Production API] is DOWN
URL: https://your-domain.vercel.app/api/health
Reason: Connection timeout
Duration: 00:05:00
```

**Slow Response Alert:**
```
⚠️ [Resply Production API] is SLOW
Response Time: 2500ms (threshold: 2000ms)
Checks: 5 consecutive slow responses
```

**Recovery Alert:**
```
✅ [Resply Production API] is UP
Downtime: 00:15:00
Recovery: 2025-01-05 19:30:00 UTC
```

## Monitoring Best Practices

### 1. Multiple Monitors

Don't rely on a single monitor:
- Health check endpoint (`/api/health`)
- Main application URL (`/`)
- Critical API endpoints (`/api/chat/completions`)

### 2. Check Frequency

**Free Tier (5 minutes):**
- Good for most SaaS applications
- Max downtime before detection: 5 minutes

**Pro Tier (1 minute, $7/month):**
- Better for mission-critical apps
- Max downtime before detection: 1 minute

### 3. Keyword Monitoring

Add keyword checks to ensure correct responses:
- Health endpoint: Look for `"status":"healthy"`
- Main app: Look for `"Resply"` or app name
- Prevents false positives from error pages

### 4. Geographic Monitoring (Pro Feature)

Monitor from multiple locations:
- US East
- Europe
- Asia Pacific

Helps identify regional outages or latency issues.

## Incident Response Workflow

### When You Receive a Down Alert

1. **Immediate Actions** (0-5 min):
   - Check UptimeRobot dashboard for details
   - Open Sentry to see if errors are being logged
   - Check Vercel deployment status
   - Try accessing the health endpoint manually

2. **Investigation** (5-15 min):
   - Review recent deployments (last 1 hour)
   - Check Supabase status (database connectivity)
   - Review Sentry error logs
   - Check external service status (OpenAI, Pinecone, Voyage AI)

3. **Resolution** (15-30 min):
   - Rollback to previous deployment if needed
   - Fix critical issues
   - Redeploy
   - Monitor recovery

4. **Post-Mortem** (within 24 hours):
   - Document incident in Sentry
   - Update runbooks
   - Implement preventive measures

## Dashboard Metrics

### Key Metrics to Track

1. **Uptime Percentage**
   - Target: 99.9% (SLA standard)
   - Monthly: 43 minutes of downtime allowed

2. **Response Time**
   - Target: < 500ms average
   - P95: < 1000ms
   - P99: < 2000ms

3. **Incident Frequency**
   - Target: < 2 incidents per month
   - Mean Time to Recovery (MTTR): < 15 minutes

4. **Alert Response Time**
   - Target: < 5 minutes from alert to acknowledgment

## Costs

**Free Tier:**
- 50 monitors
- 5-minute intervals
- Email alerts
- Webhook alerts (Slack)
- 2-month logs

**Pro Tier ($7/month):**
- 1-minute intervals
- SMS alerts
- Keyword monitoring
- 12-month logs
- Custom status pages

**Recommendation:** Start with Free tier, upgrade to Pro if you need faster detection.

## Health Check Implementation

Your health check endpoint is already implemented at [app/api/health/route.ts](app/api/health/route.ts).

**Current Features:**
- ✅ Database connectivity check (Supabase)
- ✅ Response time tracking
- ✅ Uptime since server start
- ✅ Service status breakdown
- ✅ Version and environment info

**Potential Enhancements:**
- Add external service checks (OpenAI API, Pinecone, Voyage AI)
- Add memory usage metrics
- Add active connection count
- Add queue depth (if applicable)

## Next Steps

1. ✅ Health check endpoint created
2. ⏳ Create UptimeRobot account
3. ⏳ Configure production monitor
4. ⏳ Set up Slack alerts
5. ⏳ Add UptimeRobot API key to environment variables
6. ⏳ Test alerts (click "Test Monitor" in dashboard)
7. ⏳ Create status page (optional)
8. ⏳ Document incident response procedures

## Related Documentation

- [Health Check Endpoint](app/api/health/route.ts)
- [Sentry Setup](SENTRY_SETUP.md)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

---

**Last Updated**: 2025-01-05
**Status**: ✅ Health endpoint ready, ⏳ UptimeRobot configuration pending
**Estimated Setup Time**: 15-20 minutes
