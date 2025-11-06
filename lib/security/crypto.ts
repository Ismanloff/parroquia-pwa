/**
 * Crypto Utilities - AES-256-GCM Encryption
 *
 * Security: Encrypts sensitive credentials (WhatsApp tokens, API keys)
 * OWASP: A02:2021 - Cryptographic Failures
 *
 * Algorithm: AES-256-GCM (Galois/Counter Mode)
 * - Authentication: Yes (prevents tampering)
 * - IV: Random 16 bytes per encryption
 * - Auth Tag: 16 bytes
 */

import crypto from 'crypto';

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * IMPORTANT: Must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;

  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex string to buffer (should be 64 hex chars = 32 bytes)
  if (keyString.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
  }

  return Buffer.from(keyString, 'hex');
}

/**
 * Generate a secure encryption key (for initial setup)
 * Run this once and save to environment variables
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32); // 256 bits
  return key.toString('hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt (string or object)
 * @returns Encrypted data in format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string | object): string {
  try {
    const key = getEncryptionKey();

    // Convert object to JSON string if needed
    const text = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);

    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted data in format: iv:authTag:ciphertext
 * @param parseJSON - If true, parse the decrypted string as JSON
 * @returns Decrypted plaintext (string or object)
 */
export function decrypt<T = string>(encryptedData: string, parseJSON = false): T {
  try {
    const key = getEncryptionKey();

    // Parse encrypted data format: iv:authTag:ciphertext
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid auth tag length');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON if requested
    if (parseJSON) {
      return JSON.parse(decrypted) as T;
    }

    return decrypted as T;
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Check if a string is encrypted (has the correct format)
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }

  const parts = data.split(':');

  // Should have 3 parts: iv:authTag:ciphertext
  if (parts.length !== 3) {
    return false;
  }

  // Check if parts are valid hex
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

/**
 * Safely encrypt credentials object (handles partial encryption)
 * Used for channel.credentials JSONB field
 */
export function encryptCredentials(credentials: Record<string, any>): Record<string, any> {
  const encrypted: Record<string, any> = { ...credentials };

  // Fields to encrypt
  const sensitiveFields = ['apiKey', 'accessToken', 'secret', 'webhookSecret', 'appSecret'];

  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string' && !isEncrypted(encrypted[field])) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Safely decrypt credentials object (handles partial encryption)
 */
export function decryptCredentials(credentials: Record<string, any>): Record<string, any> {
  const decrypted: Record<string, any> = { ...credentials };

  // Fields to decrypt
  const sensitiveFields = ['apiKey', 'accessToken', 'secret', 'webhookSecret', 'appSecret'];

  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string' && isEncrypted(decrypted[field])) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`[Crypto] Failed to decrypt field "${field}":`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }

  return decrypted;
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * Use for: Webhook signatures, password verification, etc.
 */
export function hash(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Generate random token (for API keys, webhook secrets, etc.)
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
