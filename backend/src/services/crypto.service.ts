/**
 * Crypto Service
 * AES-256-GCM encryption for sensitive data at rest (MFA secrets, backup codes)
 */

import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive a key from the configured encryption key using PBKDF2
 * This ensures consistent key length and adds key stretching
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    config.security.mfaEncryptionKey,
    salt,
    100000, // iterations
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns base64-encoded string: salt:iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:ciphertext (all base64)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext,
  ].join(':');
}

/**
 * Decrypt a ciphertext string encrypted with encrypt()
 * Returns the original plaintext
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [saltB64, ivB64, authTagB64, ciphertext] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const key = deriveKey(salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}

/**
 * Hash a backup code for storage (one-way, uses SHA-256)
 * The original code is shown to user once, only hash is stored
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a backup code against its hash (constant-time comparison)
 */
export function verifyBackupCode(code: string, hash: string): boolean {
  const codeHash = hashBackupCode(code);
  if (codeHash.length !== hash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(hash));
}

export const cryptoService = {
  encrypt,
  decrypt,
  hashBackupCode,
  verifyBackupCode,
};
