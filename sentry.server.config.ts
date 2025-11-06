// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Capture 100% of transactions for performance monitoring in development
  // Lower in production to reduce noise and costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,

  // Ignore specific errors
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],

  // Filter events
  beforeSend(event, _hint) {
    // Don't send events from development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  // Integrate with Supabase errors
  beforeSendTransaction(event) {
    // Add custom tags
    event.tags = {
      ...event.tags,
      project: 'resply',
    };
    return event;
  },
});
