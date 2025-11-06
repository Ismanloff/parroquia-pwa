/**
 * Tests para PII Detector - FASE 1
 */

import { describe, it, expect } from 'vitest';
import {
  detectPII,
  hasPII,
  redactPII,
  isSafeText,
  redactObjectPII,
  type PIIType,
} from '@/lib/security/pii-detector';

describe('PII Detector - FASE 1', () => {
  describe('detectPII - Email Detection', () => {
    it('should detect email addresses', () => {
      const text = 'Contact me at john.doe@example.com for more info';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].type).toBe('EMAIL');
      expect(result.findings[0].value).toBe('john.doe@example.com');
    });

    it('should detect multiple emails', () => {
      const text = 'Email admin@test.com or support@company.org';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('detectPII - Phone Numbers', () => {
    it('should detect Spanish phone numbers', () => {
      const text = 'Llámame al 612345678 o al +34 600 123 456';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      const phoneFindings = result.findings.filter((f) => f.type === 'PHONE');
      expect(phoneFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect international format', () => {
      const text = 'Call +1 (555) 123-4567';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
    });
  });

  describe('detectPII - Credit Cards', () => {
    it('should detect valid credit card (Luhn check)', () => {
      // Visa test card: 4532015112830366
      const text = 'My card is 4532015112830366';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      const ccFindings = result.findings.filter((f) => f.type === 'CREDIT_CARD');
      expect(ccFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT detect invalid credit card (Luhn check fails)', () => {
      const text = 'My card is 1234567890123456'; // Invalid Luhn
      const result = detectPII(text);

      const ccFindings = result.findings.filter((f) => f.type === 'CREDIT_CARD');
      expect(ccFindings.length).toBe(0);
    });
  });

  describe('detectPII - Spanish DNI', () => {
    it('should detect valid Spanish DNI', () => {
      const text = 'Mi DNI es 12345678Z';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      const dniFindings = result.findings.filter((f) => f.type === 'SPAIN_DNI');
      expect(dniFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT detect invalid DNI (wrong letter)', () => {
      const text = 'Mi DNI es 12345678A'; // Letter doesn't match
      const result = detectPII(text);

      const dniFindings = result.findings.filter((f) => f.type === 'SPAIN_DNI');
      expect(dniFindings.length).toBe(0);
    });
  });

  describe('detectPII - Spanish NIE', () => {
    it('should detect valid Spanish NIE', () => {
      const text = 'Mi NIE es X1234567L';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      const nieFindings = result.findings.filter((f) => f.type === 'SPAIN_NIE');
      expect(nieFindings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('detectPII - IP Addresses', () => {
    it('should detect IPv4 addresses', () => {
      const text = 'Server IP: 192.168.1.1';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
      const ipFindings = result.findings.filter((f) => f.type === 'IP_ADDRESS');
      expect(ipFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect IPv6 addresses', () => {
      const text = 'IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const result = detectPII(text);

      expect(result.hasPII).toBe(true);
    });
  });

  describe('redactPII', () => {
    it('should redact emails', () => {
      const text = 'Email: john@example.com';
      const redacted = redactPII(text);

      expect(redacted).not.toContain('john@example.com');
      expect(redacted).toContain('[EMAIL_REDACTED]');
    });

    it('should redact multiple PII types', () => {
      const text = 'Email: test@test.com, DNI: 12345678Z, Phone: 612345678';
      const redacted = redactPII(text);

      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(redacted).toContain('[SPAIN_DNI_REDACTED]');
      expect(redacted).toContain('[PHONE_REDACTED]');
    });
  });

  describe('hasPII', () => {
    it('should return true if PII exists', () => {
      const text = 'Contact: admin@test.com';
      expect(hasPII(text)).toBe(true);
    });

    it('should return false if no PII', () => {
      const text = 'Hello world, this is a test message';
      expect(hasPII(text)).toBe(false);
    });
  });

  describe('isSafeText', () => {
    it('should return true if no PII', () => {
      const text = 'Safe message without PII';
      expect(isSafeText(text)).toBe(true);
    });

    it('should return false if PII detected', () => {
      const text = 'Email me at test@example.com';
      expect(isSafeText(text)).toBe(false);
    });
  });

  describe('redactObjectPII', () => {
    it('should redact PII in nested objects', () => {
      const obj = {
        name: 'John',
        email: 'john@example.com',
        contact: {
          phone: '612345678',
          address: 'Test Street',
        },
      };

      const redacted = redactObjectPII(obj);

      expect(redacted.email).toBe('[EMAIL_REDACTED]');
      expect(redacted.contact.phone).toBe('[PHONE_REDACTED]');
      expect(redacted.contact.address).toBe('Test Street'); // No PII
    });

    it('should handle arrays', () => {
      const obj = {
        emails: ['test1@example.com', 'test2@example.com'],
      };

      const redacted = redactObjectPII(obj);

      expect(redacted.emails[0]).toBe('[EMAIL_REDACTED]');
      expect(redacted.emails[1]).toBe('[EMAIL_REDACTED]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = detectPII('');
      expect(result.hasPII).toBe(false);
      expect(result.findings).toHaveLength(0);
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => detectPII(null as any)).not.toThrow();
      expect(() => detectPII(undefined as any)).not.toThrow();
    });

    it('should handle very long text', () => {
      const longText = 'Test text. '.repeat(1000) + 'Email: test@example.com';
      const result = detectPII(longText);

      expect(result.hasPII).toBe(true);
    });
  });
});
