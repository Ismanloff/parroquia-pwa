/**
 * Haptic Feedback Utility
 * Provides subtle vibration feedback for user interactions.
 *
 * NOTE: navigator.vibrate is currently NOT supported on iOS Safari (even in PWA mode).
 * This utility fails gracefully on unsupported devices.
 */

export const haptics = {
  /**
   * Light haptic feedback (10ms)
   * Use for: Tab changes, button taps, minor interactions
   */
  light: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (e) {
      // Silent error for environments where vibrate might fail or be restricted
    }
  },

  /**
   * Medium haptic feedback (20ms)
   * Use for: Important button presses, install prompts, settings changes
   */
  medium: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Success haptic pattern (10ms, pause 30ms, 10ms)
   * Use for: Successful operations, pull-to-refresh complete, form submissions
   */
  success: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([10, 30, 10]);
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Error haptic pattern (50ms, pause 30ms, 50ms)
   * Use for: Errors, failed operations, validation errors
   */
  error: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Heavy haptic feedback (30ms)
   * Use for: Major actions, destructive operations, confirmations
   */
  heavy: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Selection haptic feedback (5ms)
   * Use for: Scrolling through lists, date pickers, incremental changes
   */
  selection: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(5);
      }
    } catch (e) {
      // ignore
    }
  },
};
