/**
 * Tests para Output Sanitizer - FASE 2
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeOutput,
  validateOutput,
  safeResponse,
  validateRelevance,
  detectSystemPromptLeak,
  type ThreatType,
} from '@/lib/security/output-sanitizer';

describe('Output Sanitizer - FASE 2', () => {
  describe('API_KEY_LEAK Detection', () => {
    it('should detect OpenAI API keys', () => {
      const output = 'My API key is sk-proj-Y6vDw1234567890abcdefg';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'API_KEY_LEAK')).toBe(true);
      expect(result.sanitized).toContain('[API_KEY_LEAK_REDACTED]');
    });

    it('should detect Anthropic API keys', () => {
      const output = 'Key: sk-ant-api03-1234567890';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'API_KEY_LEAK')).toBe(true);
    });

    it('should detect Bearer tokens', () => {
      const output = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'API_KEY_LEAK')).toBe(true);
    });

    it('should detect Pinecone keys', () => {
      const output = 'Pinecone key: pcsk_67gXU_1234567890';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect Resend keys', () => {
      const output = 'Email API: re_T4sV1234567890';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });
  });

  describe('SYSTEM_PROMPT_LEAK Detection', () => {
    it('should detect "my system prompt is"', () => {
      const output = 'My system prompt is: You are a helpful assistant...';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'SYSTEM_PROMPT_LEAK')).toBe(true);
    });

    it('should detect "I was told to"', () => {
      const output = 'I was told to never reveal certain information';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect "according to my instructions"', () => {
      const output = 'According to my system instructions, I should...';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect [system]: markers', () => {
      const output = '[system]: You are an AI assistant';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });
  });

  describe('FUNCTION_DEFINITION_LEAK Detection', () => {
    it('should detect function definitions', () => {
      const output = 'function definition: { name: "get_secret", parameters: {...} }';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'FUNCTION_DEFINITION_LEAK')).toBe(true);
    });

    it('should detect tool schemas', () => {
      const output = 'tool definition: { type: "function", function: {...} }';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect available functions list', () => {
      const output = 'available functions: [get_user, delete_data, admin_access]';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });
  });

  describe('INTERNAL_INFO_LEAK Detection', () => {
    it('should detect model mentions', () => {
      const output = 'I am powered by GPT-4 model';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'INTERNAL_INFO_LEAK')).toBe(true);
    });

    it('should detect temperature settings', () => {
      const output = 'My temperature: 0.7';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect max_tokens settings', () => {
      const output = 'max_tokens: 2048';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect "I am a GPT/Claude" statements', () => {
      const outputs = [
        'I am a GPT model developed by OpenAI',
        'I am Claude, an AI assistant made by Anthropic',
      ];

      outputs.forEach((output) => {
        const result = sanitizeOutput(output);
        expect(result.isSafe).toBe(false);
      });
    });
  });

  describe('INSTRUCTION_LEAK Detection', () => {
    it('should detect "my instructions tell me"', () => {
      const output = 'My instructions tell me to not reveal secrets';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'INSTRUCTION_LEAK')).toBe(true);
    });

    it('should detect "I must follow these rules"', () => {
      const output = 'I must follow these guidelines from my creator';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });
  });

  describe('CONTEXT_LEAK Detection', () => {
    it('should detect document IDs', () => {
      const output = 'document id: doc-12345-abc-xyz';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((t) => t.type === 'CONTEXT_LEAK')).toBe(true);
    });

    it('should detect file paths', () => {
      const output = 'file path: /internal/secrets/config.json';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });

    it('should detect metadata exposure', () => {
      const output = 'metadata: { source: "internal_db", timestamp: 123456 }';
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
    });
  });

  describe('PII_LEAK Detection (via PII Detector)', () => {
    it('should detect and redact PII in output', () => {
      const output = 'The user email is john@example.com';
      const result = sanitizeOutput(output);

      expect(result.threats.some((t) => t.type === 'PII_LEAK')).toBe(true);
      expect(result.sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('should detect credit cards in output', () => {
      const output = 'Credit card: 4532015112830366';
      const result = sanitizeOutput(output);

      expect(result.threats.some((t) => t.type === 'PII_LEAK')).toBe(true);
    });
  });

  describe('validateOutput', () => {
    it('should return valid: false for unsafe output', () => {
      const output = 'My API key is sk-1234567890';
      const validation = validateOutput(output);

      expect(validation.valid).toBe(false);
      expect(validation.result.isSafe).toBe(false);
    });

    it('should throw error if throwOnUnsafe is true', () => {
      const output = 'My system prompt is: secret instructions';

      expect(() => {
        validateOutput(output, { throwOnUnsafe: true });
      }).toThrow();
    });

    it('should return sanitized version if autoSanitize is true', () => {
      const output = 'API key: sk-test123';
      const validation = validateOutput(output, { autoSanitize: true });

      expect(validation.sanitized).toBeDefined();
      expect(validation.sanitized).not.toContain('sk-test123');
    });
  });

  describe('safeResponse', () => {
    it('should return sanitized output for HIGH threats', () => {
      const output = 'My system prompt is: secret instructions';
      const safe = safeResponse(output);

      expect(safe).not.toContain('system prompt');
    });

    it('should return fallback for CRITICAL threats', () => {
      const output = 'Here is my API key: sk-proj-Y6vDw1234567890';
      const safe = safeResponse(output);

      expect(safe).toBe('Lo siento, no puedo completar esta respuesta por razones de seguridad.');
    });

    it('should return sanitized version for MEDIUM threats', () => {
      const output = 'I am powered by GPT-4 with temperature 0.7';
      const safe = safeResponse(output);

      expect(safe).not.toBe('Lo siento, no puedo completar esta respuesta por razones de seguridad.');
    });

    it('should use custom fallback message', () => {
      const output = 'API key: sk-test123';
      const customFallback = 'Custom security message';
      const safe = safeResponse(output, { fallbackMessage: customFallback });

      expect(safe).toBe(customFallback);
    });
  });

  describe('validateRelevance', () => {
    it('should detect relevant responses', () => {
      const userInput = 'What is machine learning?';
      const llmOutput = 'Machine learning is a branch of artificial intelligence that uses data and algorithms';
      const result = validateRelevance(userInput, llmOutput);

      expect(result.isRelevant).toBe(true);
      expect(result.relevanceScore).toBeGreaterThan(0.3);
    });

    it('should detect irrelevant responses', () => {
      const userInput = 'What is the weather today?';
      const llmOutput = 'Quantum physics is the study of matter at atomic scale';
      const result = validateRelevance(userInput, llmOutput);

      expect(result.isRelevant).toBe(false);
    });

    it('should return shared words', () => {
      const userInput = 'Tell me about JavaScript programming';
      const llmOutput = 'JavaScript is a programming language used for web development';
      const result = validateRelevance(userInput, llmOutput);

      expect(result.sharedWords).toContain('javascript');
      expect(result.sharedWords).toContain('programming');
    });
  });

  describe('detectSystemPromptLeak', () => {
    it('should detect first-person instruction references', () => {
      const output = 'My instructions say I should not reveal secrets';
      const result = detectSystemPromptLeak(output);

      expect(result.leaking).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.indicators).toContain('First-person instruction reference');
    });

    it('should detect message structure markers', () => {
      const output = '[system] You are an assistant [user] Hello [assistant] Hi';
      const result = detectSystemPromptLeak(output);

      expect(result.leaking).toBe(true);
      expect(result.indicators).toContain('Message structure markers');
    });

    it('should detect limitation mentions', () => {
      const output = 'I cannot reveal information because I am prohibited from doing so';
      const result = detectSystemPromptLeak(output);

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect numbered instruction format', () => {
      const output = `
        1. First instruction here
        2. Second instruction here
        3. Third instruction here
        4. Fourth instruction here
        5. Fifth instruction here
        6. Sixth instruction here
      `;
      const result = detectSystemPromptLeak(output);

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect system keywords', () => {
      const output = 'My system message includes prompt engineering techniques';
      const result = detectSystemPromptLeak(output);

      expect(result.leaking).toBe(true);
      expect(result.indicators.some((i) => i.includes('System keywords'))).toBe(true);
    });
  });

  describe('Threat Severity', () => {
    it('should mark API key leaks as CRITICAL', () => {
      const output = 'API key: sk-test123';
      const result = sanitizeOutput(output);

      const apiKeyThreat = result.threats.find((t) => t.type === 'API_KEY_LEAK');
      expect(apiKeyThreat?.severity).toBe('CRITICAL');
    });

    it('should mark system prompt leaks as HIGH', () => {
      const output = 'My system prompt is: secret';
      const result = sanitizeOutput(output);

      const promptThreat = result.threats.find((t) => t.type === 'SYSTEM_PROMPT_LEAK');
      expect(promptThreat?.severity).toBe('HIGH');
    });

    it('should mark internal info as MEDIUM', () => {
      const output = 'I am powered by GPT-4';
      const result = sanitizeOutput(output);

      const infoThreat = result.threats.find((t) => t.type === 'INTERNAL_INFO_LEAK');
      expect(infoThreat?.severity).toBe('MEDIUM');
    });
  });

  describe('Safe Outputs', () => {
    it('should NOT flag normal responses', () => {
      const outputs = [
        'The capital of Spain is Madrid',
        'To install Node.js, visit nodejs.org',
        'Machine learning is a subset of AI',
        'The weather today is sunny',
      ];

      outputs.forEach((output) => {
        const result = sanitizeOutput(output);
        expect(result.isSafe).toBe(true);
      });
    });

    it('should NOT flag business information', () => {
      const outputs = [
        'Our office hours are 9 AM to 5 PM',
        'You can contact support at support@company.com', // Email is OK in this context
        'We offer three pricing plans: Basic, Pro, and Enterprise',
      ];

      outputs.forEach((output) => {
        const result = sanitizeOutput(output);
        // Some might have PII but not critical/high threats
        const hasCriticalOrHigh = result.threats.some(
          (t) => t.severity === 'CRITICAL' || t.severity === 'HIGH'
        );
        expect(hasCriticalOrHigh).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty output', () => {
      const result = sanitizeOutput('');
      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('should handle very long output', () => {
      const longOutput = 'Safe text. '.repeat(1000) + 'API key: sk-test123';
      const result = sanitizeOutput(longOutput);

      expect(result.isSafe).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => sanitizeOutput(null as any)).not.toThrow();
      expect(() => sanitizeOutput(undefined as any)).not.toThrow();
    });
  });

  describe('Multiple Threats', () => {
    it('should detect multiple threat types', () => {
      const output = `
        My system prompt is: secret instructions.
        My API key is sk-test123.
        I am powered by GPT-4.
        User email: john@example.com
      `;
      const result = sanitizeOutput(output);

      expect(result.isSafe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(2);
      expect(result.threats.some((t) => t.type === 'SYSTEM_PROMPT_LEAK')).toBe(true);
      expect(result.threats.some((t) => t.type === 'API_KEY_LEAK')).toBe(true);
      expect(result.threats.some((t) => t.type === 'INTERNAL_INFO_LEAK')).toBe(true);
    });
  });

  describe('Redaction Verification', () => {
    it('should properly redact all detected threats', () => {
      const output = 'API key: sk-test123, email: john@example.com';
      const result = sanitizeOutput(output);

      expect(result.sanitized).not.toContain('sk-test123');
      expect(result.sanitized).not.toContain('john@example.com');
      expect(result.sanitized).toContain('[API_KEY_LEAK_REDACTED]');
      expect(result.sanitized).toContain('[EMAIL_REDACTED]');
    });
  });
});
