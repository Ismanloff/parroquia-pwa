/**
 * Tests for Data Retention Policies (FASE 3)
 *
 * @module __tests__/compliance/data-retention.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  RETENTION_PERIODS,
  getRetentionPolicies,
  isEligibleForDeletion,
  getNextCleanupDates,
} from '@/lib/compliance/data-retention';

describe('Data Retention Policies', () => {
  describe('Retention Periods', () => {
    it('should define correct retention periods', () => {
      expect(RETENTION_PERIODS.AUDIT_LOGS).toBe(365);
      expect(RETENTION_PERIODS.SOFT_DELETED_CONTENT).toBe(90);
      expect(RETENTION_PERIODS.INACTIVE_SESSIONS).toBe(30);
      expect(RETENTION_PERIODS.DOCUMENTS).toBe(-1); // Manual deletion
    });

    it('should have all required periods defined', () => {
      expect(RETENTION_PERIODS).toHaveProperty('AUDIT_LOGS');
      expect(RETENTION_PERIODS).toHaveProperty('SOFT_DELETED_CONTENT');
      expect(RETENTION_PERIODS).toHaveProperty('INACTIVE_SESSIONS');
      expect(RETENTION_PERIODS).toHaveProperty('DOCUMENTS');
      expect(RETENTION_PERIODS).toHaveProperty('GDPR_EXPORT_FILES');
    });
  });

  describe('Retention Policies', () => {
    it('should return all retention policies', () => {
      const policies = getRetentionPolicies();

      expect(policies.length).toBeGreaterThanOrEqual(5);
      expect(policies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            resourceType: 'audit_logs',
            retentionPeriodDays: 365,
            isAutomatic: true,
          }),
          expect.objectContaining({
            resourceType: 'conversations',
            retentionPeriodDays: 90,
            isAutomatic: true,
          }),
          expect.objectContaining({
            resourceType: 'documents',
            retentionPeriodDays: -1,
            isAutomatic: false,
          }),
        ])
      );
    });

    it('should include cleanup functions for automatic policies', () => {
      const policies = getRetentionPolicies();
      const automaticPolicies = policies.filter(p => p.isAutomatic);

      automaticPolicies.forEach(policy => {
        expect(policy.cleanupFunction).toBeTruthy();
      });
    });

    it('should have descriptions for all policies', () => {
      const policies = getRetentionPolicies();

      policies.forEach(policy => {
        expect(policy.description).toBeTruthy();
        expect(policy.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Eligibility for Deletion', () => {
    it('should mark old soft-deleted content as eligible', () => {
      // Date 100 days ago (beyond 90-day retention)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      expect(isEligibleForDeletion('SOFT_DELETED_CONTENT', oldDate)).toBe(true);
    });

    it('should not mark recent soft-deleted content as eligible', () => {
      // Date 50 days ago (within 90-day retention)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 50);

      expect(isEligibleForDeletion('SOFT_DELETED_CONTENT', recentDate)).toBe(false);
    });

    it('should mark old audit logs as eligible for anonymization', () => {
      // Date 400 days ago (beyond 1-year retention)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400);

      expect(isEligibleForDeletion('AUDIT_LOGS', oldDate)).toBe(true);
    });

    it('should not mark recent audit logs as eligible', () => {
      // Date 200 days ago (within 1-year retention)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 200);

      expect(isEligibleForDeletion('AUDIT_LOGS', recentDate)).toBe(false);
    });

    it('should never mark documents as eligible (manual deletion)', () => {
      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 10);

      expect(isEligibleForDeletion('DOCUMENTS', veryOldDate)).toBe(false);
    });

    it('should handle date strings', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      const dateString = oldDate.toISOString();

      expect(isEligibleForDeletion('SOFT_DELETED_CONTENT', dateString)).toBe(true);
    });
  });

  describe('Next Cleanup Dates', () => {
    it('should calculate next cleanup dates', () => {
      const dates = getNextCleanupDates();

      expect(dates.softDeleteCleanup).toBeInstanceOf(Date);
      expect(dates.auditLogAnonymization).toBeInstanceOf(Date);
    });

    it('should schedule soft delete cleanup for tomorrow at 2 AM UTC', () => {
      const dates = getNextCleanupDates();
      const cleanup = dates.softDeleteCleanup;

      expect(cleanup.getUTCHours()).toBe(2);
      expect(cleanup.getUTCMinutes()).toBe(0);
      expect(cleanup.getUTCSeconds()).toBe(0);

      // Should be tomorrow
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      expect(cleanup.getUTCDate()).toBe(tomorrow.getUTCDate());
    });

    it('should schedule audit log anonymization for 1st of next month at 3 AM UTC', () => {
      const dates = getNextCleanupDates();
      const anonymization = dates.auditLogAnonymization;

      expect(anonymization.getUTCHours()).toBe(3);
      expect(anonymization.getUTCMinutes()).toBe(0);
      expect(anonymization.getUTCDate()).toBe(1); // 1st of month
    });
  });

  describe('GDPR Compliance', () => {
    it('should comply with 90-day retention for conversations', () => {
      const policy = getRetentionPolicies().find(
        p => p.resourceType === 'conversations'
      );

      expect(policy?.retentionPeriodDays).toBe(90);
      expect(policy?.description).toContain('90 days');
    });

    it('should comply with 1-year retention for audit logs', () => {
      const policy = getRetentionPolicies().find(
        p => p.resourceType === 'audit_logs'
      );

      expect(policy?.retentionPeriodDays).toBe(365);
      expect(policy?.description).toContain('1 year');
      expect(policy?.description).toContain('anonymized');
    });

    it('should allow manual document deletion', () => {
      const policy = getRetentionPolicies().find(
        p => p.resourceType === 'documents'
      );

      expect(policy?.retentionPeriodDays).toBe(-1);
      expect(policy?.isAutomatic).toBe(false);
      expect(policy?.description).toContain('manual');
    });
  });
});
