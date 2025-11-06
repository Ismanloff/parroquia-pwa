/**
 * Compliance Module
 *
 * Módulo centralizado para cumplimiento legal y regulatorio.
 *
 * Includes:
 * - Data retention policies
 * - GDPR compliance helpers
 * - SOC 2 compliance utilities
 *
 * @module lib/compliance
 */

// Data Retention
export {
  RETENTION_PERIODS,
  getRetentionPolicies,
  isEligibleForDeletion,
  getRetentionStatus,
  triggerManualCleanup,
  getNextCleanupDates,
  type RetentionPolicy,
} from './data-retention';
