/**
 * Analytics utilities for Vercel Analytics
 * Follows 2025 best practices with event naming conventions
 *
 * Event naming convention: noun_verb (e.g., button_clicked, page_viewed)
 *
 * @see https://vercel.com/docs/analytics/custom-events
 */

import { track } from '@vercel/analytics';

// Event names constants - centralized for consistency
export const ANALYTICS_EVENTS = {
  // Workspace Events
  WORKSPACE_CREATED: 'workspace_created',
  WORKSPACE_SWITCHED: 'workspace_switched',
  WORKSPACE_SETTINGS_UPDATED: 'workspace_settings_updated',
  WORKSPACE_DELETED: 'workspace_deleted',

  // Document Events
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DELETED: 'document_deleted',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_VIEWED: 'document_viewed',

  // Conversation Events
  CONVERSATION_STARTED: 'conversation_started',
  CONVERSATION_ENDED: 'conversation_ended',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',

  // User Actions
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_SIGNED_UP: 'user_signed_up',
  USER_PROFILE_UPDATED: 'user_profile_updated',

  // Settings Events
  SETTINGS_UPDATED: 'settings_updated',
  CHATBOT_CONFIGURED: 'chatbot_configured',
  THEME_CHANGED: 'theme_changed',

  // Member Management
  MEMBER_INVITED: 'member_invited',
  MEMBER_REMOVED: 'member_removed',
  MEMBER_ROLE_CHANGED: 'member_role_changed',

  // Command Palette
  COMMAND_PALETTE_OPENED: 'command_palette_opened',
  COMMAND_EXECUTED: 'command_executed',

  // Navigation
  PAGE_VIEWED: 'page_viewed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  NAVIGATION_USED: 'navigation_used',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  ERROR_RETRY_CLICKED: 'error_retry_clicked',
} as const;

// Type for event properties (max 2 keys for Pro plan, max 255 chars per value)
type EventProperties = {
  [key: string]: string | number | boolean | null;
};

/**
 * Track a custom event with optional properties
 *
 * @param eventName - The name of the event (use ANALYTICS_EVENTS constants)
 * @param properties - Optional properties (max 2 keys for Pro plan)
 *
 * @example
 * trackEvent(ANALYTICS_EVENTS.WORKSPACE_CREATED, { name: 'My Workspace' });
 * trackEvent(ANALYTICS_EVENTS.DOCUMENT_UPLOADED, { type: 'pdf', size_mb: 2.5 });
 */
export function trackEvent(eventName: string, properties?: EventProperties) {
  // Only track in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics Dev]', eventName, properties);
    return;
  }

  // Validate property count (Pro plan limit: 2 keys)
  if (properties && Object.keys(properties).length > 2) {
    console.warn(
      `[Analytics Warning] Event "${eventName}" has more than 2 properties. Pro plan limits to 2 keys per event.`
    );
  }

  // Validate property values (max 255 characters)
  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      const stringValue = String(value);
      if (stringValue.length > 255) {
        console.warn(
          `[Analytics Warning] Property "${key}" in event "${eventName}" exceeds 255 characters (${stringValue.length} chars)`
        );
      }
    });
  }

  try {
    track(eventName, properties);
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
}

/**
 * Track a page view
 *
 * @param pageName - The name of the page being viewed
 * @param category - Optional category (e.g., 'dashboard', 'auth', 'settings')
 *
 * @example
 * trackPageView('Analytics', 'dashboard');
 * trackPageView('Login', 'auth');
 */
export function trackPageView(pageName: string, category?: string) {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, {
    page: pageName,
    ...(category && { category }),
  });
}

/**
 * Track a user action (button click, form submission, etc.)
 *
 * @param action - The action being performed
 * @param location - Where in the UI the action occurred
 *
 * @example
 * trackUserAction('signup_clicked', 'header');
 * trackUserAction('export_clicked', 'analytics_page');
 */
export function trackUserAction(action: string, location?: string) {
  trackEvent(action, {
    ...(location && { location }),
  });
}

/**
 * Track an error occurrence
 *
 * @param errorType - The type of error (e.g., 'api_error', 'validation_error')
 * @param errorCode - Optional error code
 *
 * @example
 * trackError('api_error', '500');
 * trackError('validation_error', 'invalid_email');
 */
export function trackError(errorType: string, errorCode?: string) {
  trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
    type: errorType,
    ...(errorCode && { code: errorCode }),
  });
}

/**
 * Track a workspace-related action
 *
 * @param action - The workspace action event name
 * @param workspaceId - The ID of the workspace
 *
 * @example
 * trackWorkspaceAction(ANALYTICS_EVENTS.WORKSPACE_CREATED, 'ws_123');
 */
export function trackWorkspaceAction(action: string, workspaceId?: string) {
  trackEvent(action, {
    ...(workspaceId && { workspace_id: workspaceId }),
  });
}
