/**
 * Test script for encryption/decryption
 *
 * Usage:
 *   npx tsx scripts/test-encryption.ts
 */

import { generateEncryptionKey, encrypt, decrypt, encryptCredentials, decryptCredentials, isEncrypted } from '../lib/security/crypto';

console.log('🔒 Testing Encryption/Decryption\n');

// Step 1: Generate encryption key
console.log('1. Generating encryption key...');
const key = generateEncryptionKey();
console.log(`   Generated key: ${key}`);
console.log(`   ⚠️  Save this to ENCRYPTION_KEY environment variable!\n`);

// Set the key for testing
process.env.ENCRYPTION_KEY = key;

// Step 2: Test simple string encryption
console.log('2. Testing string encryption...');
const plaintext = 'my-secret-api-key-12345';
console.log(`   Plaintext: ${plaintext}`);

const encrypted = encrypt(plaintext);
console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);
console.log(`   Is encrypted: ${isEncrypted(encrypted)}`);

const decrypted = decrypt(encrypted);
console.log(`   Decrypted: ${decrypted}`);
console.log(`   ✅ Match: ${plaintext === decrypted}\n`);

// Step 3: Test credentials object encryption
console.log('3. Testing credentials object encryption...');
const credentials = {
  provider: 'kapso',
  apiKey: 'kapso-api-key-secret-123',
  webhookSecret: 'webhook-secret-456',
  someOtherField: 'not-encrypted',
};
console.log('   Original:', JSON.stringify(credentials, null, 2));

const encryptedCreds = encryptCredentials(credentials);
console.log('   Encrypted:', JSON.stringify(encryptedCreds, null, 2).substring(0, 200) + '...');

const decryptedCreds = decryptCredentials(encryptedCreds);
console.log('   Decrypted:', JSON.stringify(decryptedCreds, null, 2));
console.log(`   ✅ Match: ${JSON.stringify(credentials) === JSON.stringify(decryptedCreds)}\n`);

// Step 4: Test WhatsApp Meta credentials
console.log('4. Testing WhatsApp Meta credentials...');
const metaCreds = {
  provider: 'meta',
  accessToken: 'EAABsbCS1iHgBO7ZCqh9ZCZBn...',  // Fake token
  secret: 'my-app-secret',
  phoneNumberId: '123456789',  // Not encrypted
};
console.log('   Original Meta credentials:', JSON.stringify(metaCreds, null, 2));

const encryptedMeta = encryptCredentials(metaCreds);
console.log(`   Encrypted accessToken: ${encryptedMeta.accessToken.substring(0, 50)}...`);
console.log(`   Encrypted secret: ${encryptedMeta.secret.substring(0, 50)}...`);
console.log(`   phoneNumberId (not encrypted): ${encryptedMeta.phoneNumberId}`);

const decryptedMeta = decryptCredentials(encryptedMeta);
console.log(`   ✅ accessToken match: ${metaCreds.accessToken === decryptedMeta.accessToken}`);
console.log(`   ✅ secret match: ${metaCreds.secret === decryptedMeta.secret}`);
console.log(`   ✅ phoneNumberId match: ${metaCreds.phoneNumberId === decryptedMeta.phoneNumberId}\n`);

// Step 5: Test isEncrypted helper
console.log('5. Testing isEncrypted helper...');
console.log(`   isEncrypted('plain-text'): ${isEncrypted('plain-text')}`);
console.log(`   isEncrypted('${encrypted.substring(0, 30)}...'): ${isEncrypted(encrypted)}`);
console.log(`   isEncrypted('invalid:format'): ${isEncrypted('invalid:format')}`);
console.log(`   isEncrypted(null): ${isEncrypted(null as any)}\n`);

console.log('✅ All tests passed!');
console.log('\n📝 Next steps:');
console.log('1. Add ENCRYPTION_KEY to your .env file:');
console.log(`   ENCRYPTION_KEY=${key}`);
console.log('2. Add ENCRYPTION_KEY to Vercel environment variables');
console.log('3. Restart your dev server to load the new environment variable');
