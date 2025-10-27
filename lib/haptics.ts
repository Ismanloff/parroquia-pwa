/**
 * Haptic Feedback Utility
 * Provides subtle vibration feedback for user interactions
 * Only works on mobile devices with vibration support
 */

export const haptics = {
  /**
   * Light haptic feedback (10ms)
   * Use for: Tab changes, button taps, minor interactions
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback (20ms)
   * Use for: Important button presses, install prompts, settings changes
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Success haptic pattern (10ms, pause 30ms, 10ms)
   * Use for: Successful operations, pull-to-refresh complete, form submissions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },

  /**
   * Error haptic pattern (50ms, pause 30ms, 50ms)
   * Use for: Errors, failed operations, validation errors
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  /**
   * Heavy haptic feedback (30ms)
   * Use for: Major actions, destructive operations, confirmations
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  /**
   * Selection haptic feedback (5ms)
   * Use for: Scrolling through lists, date pickers, incremental changes
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
};
