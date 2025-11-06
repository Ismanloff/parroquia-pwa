/**
 * Slack Alerting System
 *
 * Sends formatted alerts to Slack for critical events:
 * - System errors and degradation
 * - High load warnings
 * - Cost threshold alerts
 * - Security events
 */

export interface SlackAttachment {
  color: 'good' | 'warning' | 'danger' | string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface SlackMessage {
  text: string;
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
}

/**
 * Send a message to Slack webhook
 */
export async function sendSlackAlert(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Failed to send Slack alert:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return false;
  }
}

/**
 * Alert Types
 */

export async function alertSystemError(error: Error, context?: Record<string, any>) {
  return sendSlackAlert({
    text: '🚨 *System Error Detected*',
    username: 'Resply Alerts',
    icon_emoji: ':rotating_light:',
    attachments: [
      {
        color: 'danger',
        title: error.message,
        fields: [
          {
            title: 'Error Type',
            value: error.name || 'Error',
            short: true,
          },
          {
            title: 'Environment',
            value: process.env.NODE_ENV || 'unknown',
            short: true,
          },
          {
            title: 'Stack Trace',
            value: `\`\`\`${error.stack?.slice(0, 500) || 'No stack trace'}\`\`\``,
            short: false,
          },
          ...(context
            ? [
                {
                  title: 'Context',
                  value: `\`\`\`${JSON.stringify(context, null, 2).slice(0, 500)}\`\`\``,
                  short: false,
                },
              ]
            : []),
        ],
        footer: 'Resply Error Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertSystemDegraded(service: string, latency: number, threshold: number) {
  return sendSlackAlert({
    text: '⚠️ *System Performance Degraded*',
    username: 'Resply Alerts',
    icon_emoji: ':warning:',
    attachments: [
      {
        color: 'warning',
        title: `${service} is responding slowly`,
        fields: [
          {
            title: 'Service',
            value: service,
            short: true,
          },
          {
            title: 'Current Latency',
            value: `${latency}ms`,
            short: true,
          },
          {
            title: 'Threshold',
            value: `${threshold}ms`,
            short: true,
          },
          {
            title: 'Status',
            value: 'Degraded Performance',
            short: true,
          },
        ],
        footer: 'Resply Performance Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertHighLoad(metric: string, current: number, threshold: number) {
  return sendSlackAlert({
    text: '⚠️ *High Load Warning*',
    username: 'Resply Alerts',
    icon_emoji: ':chart_with_upwards_trend:',
    attachments: [
      {
        color: 'warning',
        title: `${metric} is above threshold`,
        fields: [
          {
            title: 'Metric',
            value: metric,
            short: true,
          },
          {
            title: 'Current Value',
            value: current.toString(),
            short: true,
          },
          {
            title: 'Threshold',
            value: threshold.toString(),
            short: true,
          },
          {
            title: 'Percentage',
            value: `${Math.round((current / threshold) * 100)}%`,
            short: true,
          },
        ],
        footer: 'Resply Load Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertCostThreshold(
  period: string,
  currentCost: number,
  threshold: number,
  breakdown?: Record<string, number>
) {
  const fields = [
    {
      title: 'Period',
      value: period,
      short: true,
    },
    {
      title: 'Current Cost',
      value: `$${currentCost.toFixed(2)}`,
      short: true,
    },
    {
      title: 'Threshold',
      value: `$${threshold.toFixed(2)}`,
      short: true,
    },
    {
      title: 'Percentage',
      value: `${Math.round((currentCost / threshold) * 100)}%`,
      short: true,
    },
  ];

  if (breakdown) {
    fields.push({
      title: 'Cost Breakdown',
      value: Object.entries(breakdown)
        .map(([service, cost]) => `• ${service}: $${cost.toFixed(2)}`)
        .join('\n'),
      short: false,
    });
  }

  return sendSlackAlert({
    text: '💰 *Cost Threshold Alert*',
    username: 'Resply Alerts',
    icon_emoji: ':moneybag:',
    attachments: [
      {
        color: currentCost > threshold ? 'danger' : 'warning',
        title: currentCost > threshold ? 'Budget exceeded!' : 'Approaching budget limit',
        fields,
        footer: 'Resply Cost Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) {
  const colorMap = {
    low: '#36a64f',
    medium: 'warning',
    high: 'danger',
    critical: '#FF0000',
  };

  const emojiMap = {
    low: '🔒',
    medium: '⚠️',
    high: '🚨',
    critical: '🚨🚨🚨',
  };

  return sendSlackAlert({
    text: `${emojiMap[severity]} *Security Event: ${eventType}*`,
    username: 'Resply Security',
    icon_emoji: ':shield:',
    attachments: [
      {
        color: colorMap[severity],
        title: `Severity: ${severity.toUpperCase()}`,
        fields: Object.entries(details).map(([key, value]) => ({
          title: key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          short: true,
        })),
        footer: 'Resply Security Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertDeployment(
  status: 'started' | 'success' | 'failed',
  version: string,
  environment: string,
  deployedBy?: string
) {
  const colorMap = {
    started: '#36a64f',
    success: 'good',
    failed: 'danger',
  };

  const emojiMap = {
    started: '🚀',
    success: '✅',
    failed: '❌',
  };

  return sendSlackAlert({
    text: `${emojiMap[status]} *Deployment ${status}*`,
    username: 'Resply Deployments',
    icon_emoji: ':rocket:',
    attachments: [
      {
        color: colorMap[status],
        title: `Version ${version} to ${environment}`,
        fields: [
          {
            title: 'Status',
            value: status.toUpperCase(),
            short: true,
          },
          {
            title: 'Environment',
            value: environment,
            short: true,
          },
          {
            title: 'Version',
            value: version,
            short: true,
          },
          ...(deployedBy
            ? [
                {
                  title: 'Deployed By',
                  value: deployedBy,
                  short: true,
                },
              ]
            : []),
        ],
        footer: 'Resply CI/CD',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function alertDatabaseIssue(issue: string, severity: 'warning' | 'critical', details?: string) {
  return sendSlackAlert({
    text: severity === 'critical' ? '🚨 *Critical Database Issue*' : '⚠️ *Database Warning*',
    username: 'Resply Database',
    icon_emoji: ':database:',
    attachments: [
      {
        color: severity === 'critical' ? 'danger' : 'warning',
        title: issue,
        fields: [
          {
            title: 'Severity',
            value: severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Service',
            value: 'Supabase PostgreSQL',
            short: true,
          },
          ...(details
            ? [
                {
                  title: 'Details',
                  value: details,
                  short: false,
                },
              ]
            : []),
        ],
        footer: 'Resply Database Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

/**
 * Test alert function
 */
export async function sendTestAlert() {
  return sendSlackAlert({
    text: '✅ *Slack Integration Test*',
    username: 'Resply Alerts',
    icon_emoji: ':white_check_mark:',
    attachments: [
      {
        color: 'good',
        title: 'Slack alerts are working correctly!',
        fields: [
          {
            title: 'Environment',
            value: process.env.NODE_ENV || 'unknown',
            short: true,
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true,
          },
        ],
        footer: 'Resply Alert System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}
