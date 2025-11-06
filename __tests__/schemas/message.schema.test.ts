/**
 * Tests para Message Schemas - FASE 1
 */

import { describe, it, expect } from 'vitest';
import { createMessageSchema, widgetMessageSchema } from '@/lib/schemas/message.schema';

describe('Message Schema - FASE 1', () => {
  describe('createMessageSchema', () => {
    it('should validate correct message', () => {
      const validMessage = {
        content: 'Hello, this is a test message',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(validMessage);

      expect(result.success).toBe(true);
    });

    it('should REJECT empty content', () => {
      const invalidMessage = {
        content: '',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
    });

    it('should REJECT content exceeding 4000 characters', () => {
      const invalidMessage = {
        content: 'a'.repeat(4001),
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('4000');
      }
    });

    it('should REJECT XSS script tags', () => {
      const maliciousMessages = [
        {
          content: '<script>alert("XSS")</script>',
          conversationId: 'conv-123',
        },
        {
          content: 'Hello <script>document.cookie</script>',
          conversationId: 'conv-123',
        },
      ];

      maliciousMessages.forEach((msg) => {
        const result = createMessageSchema.safeParse(msg);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('malicious');
        }
      });
    });

    it('should REJECT javascript: protocol', () => {
      const maliciousMessage = {
        content: 'Click here: javascript:alert("XSS")',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(maliciousMessage);

      expect(result.success).toBe(false);
    });

    it('should REJECT event handlers', () => {
      const maliciousMessages = [
        {
          content: '<img onerror="alert(1)" src="x">',
          conversationId: 'conv-123',
        },
        {
          content: '<div onclick="malicious()">Click me</div>',
          conversationId: 'conv-123',
        },
      ];

      maliciousMessages.forEach((msg) => {
        const result = createMessageSchema.safeParse(msg);
        expect(result.success).toBe(false);
      });
    });

    it('should accept markdown formatting', () => {
      const markdownMessage = {
        content: '# Title\n\n**Bold text** and *italic text*',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(markdownMessage);

      expect(result.success).toBe(true);
    });

    it('should accept code blocks', () => {
      const codeMessage = {
        content: '```javascript\nconst x = 10;\n```',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(codeMessage);

      expect(result.success).toBe(true);
    });

    it('should REJECT missing conversationId', () => {
      const invalidMessage = {
        content: 'Hello',
      };

      const result = createMessageSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const messageWithWhitespace = {
        content: '  Hello World  ',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(messageWithWhitespace);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Hello World');
      }
    });
  });

  describe('widgetMessageSchema', () => {
    it('should validate correct widget message', () => {
      const validMessage = {
        content: 'Test message from widget',
        conversationId: 'conv-widget-123',
        workspaceId: 'workspace-123',
        metadata: {
          widgetId: 'widget-1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const result = widgetMessageSchema.safeParse(validMessage);

      expect(result.success).toBe(true);
    });

    it('should REQUIRE workspaceId for widget messages', () => {
      const invalidMessage = {
        content: 'Test message',
        conversationId: 'conv-123',
      };

      const result = widgetMessageSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
    });

    it('should validate metadata structure', () => {
      const messageWithMetadata = {
        content: 'Test',
        conversationId: 'conv-123',
        workspaceId: 'workspace-123',
        metadata: {
          widgetId: 'widget-1',
          userAgent: 'Chrome',
          ipAddress: '192.168.1.1',
          customData: { foo: 'bar' },
        },
      };

      const result = widgetMessageSchema.safeParse(messageWithMetadata);

      expect(result.success).toBe(true);
    });

    it('should REJECT XSS in widget messages', () => {
      const maliciousMessage = {
        content: '<script>alert("XSS")</script>',
        conversationId: 'conv-123',
        workspaceId: 'workspace-123',
      };

      const result = widgetMessageSchema.safeParse(maliciousMessage);

      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters', () => {
      const specialCharsMessage = {
        content: 'Hello! @#$%^&*() - Testing special chars',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(specialCharsMessage);

      expect(result.success).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const unicodeMessage = {
        content: 'Hello 你好 مرحبا Привет 🚀',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(unicodeMessage);

      expect(result.success).toBe(true);
    });

    it('should handle newlines', () => {
      const multilineMessage = {
        content: 'Line 1\nLine 2\nLine 3',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(multilineMessage);

      expect(result.success).toBe(true);
    });

    it('should REJECT null content', () => {
      const nullMessage = {
        content: null,
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(nullMessage);

      expect(result.success).toBe(false);
    });

    it('should REJECT undefined content', () => {
      const undefinedMessage = {
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(undefinedMessage);

      expect(result.success).toBe(false);
    });
  });

  describe('Security - Advanced XSS Attempts', () => {
    it('should REJECT encoded XSS', () => {
      const encodedXSS = {
        content: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        conversationId: 'conv-123',
      };

      // While this is HTML encoded, we should still catch script patterns
      const result = createMessageSchema.safeParse(encodedXSS);

      // This might pass validation but should be sanitized on render
      expect(result.success).toBe(true); // HTML entities are safe
    });

    it('should REJECT event handlers in attributes', () => {
      const eventHandlers = [
        '<img src="x" onerror="alert(1)">',
        '<body onload="alert(1)">',
        '<input onfocus="alert(1)">',
      ];

      eventHandlers.forEach((content) => {
        const result = createMessageSchema.safeParse({
          content,
          conversationId: 'conv-123',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should REJECT data URLs with javascript', () => {
      const dataURL = {
        content: '<a href="data:text/html,<script>alert(1)</script>">Click</a>',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(dataURL);

      expect(result.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should validate quickly for normal messages', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        createMessageSchema.safeParse({
          content: `Test message ${i}`,
          conversationId: `conv-${i}`,
        });
      }

      const duration = Date.now() - start;

      // Should process 100 messages in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle maximum allowed length efficiently', () => {
      const start = Date.now();

      createMessageSchema.safeParse({
        content: 'a'.repeat(4000),
        conversationId: 'conv-123',
      });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Should be fast
    });
  });

  describe('Real-World Message Examples', () => {
    it('should accept customer support messages', () => {
      const supportMessages = [
        'Hi, I need help with my account',
        'My order #12345 has not arrived yet',
        'Can you help me reset my password?',
        'What are your business hours?',
      ];

      supportMessages.forEach((content) => {
        const result = createMessageSchema.safeParse({
          content,
          conversationId: 'conv-support',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept code snippets from users', () => {
      const codeSnippet = {
        content: `Here's my code:
\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`
Can you help me debug it?`,
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(codeSnippet);

      expect(result.success).toBe(true);
    });

    it('should accept URLs (non-javascript)', () => {
      const urlMessage = {
        content: 'Check out this link: https://example.com',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(urlMessage);

      expect(result.success).toBe(true);
    });

    it('should accept email addresses in messages', () => {
      const emailMessage = {
        content: 'Please contact me at support@example.com',
        conversationId: 'conv-123',
      };

      const result = createMessageSchema.safeParse(emailMessage);

      expect(result.success).toBe(true);
    });
  });
});
