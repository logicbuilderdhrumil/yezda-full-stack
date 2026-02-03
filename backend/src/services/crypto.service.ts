/**
 * Crypto Service
 * AES-256-GCM encryption for sensitive data at rest (MFA secrets, backup codes, state store)
 * 
 * ## Encryption Key Rotation Strategy
 * 
 * ### Current Implementation
 * The encryption key is derived from `STATE_ENCRYPTION_KEY` environment variable.
 * Each encrypted value includes a unique salt, so the same plaintext produces
 * different ciphertext each time.
 * 
 * ### Key Rotation Procedure
 * 
 * **IMPORTANT: Key rotation requires a coordinated migration process.**
 * 
 * 1. **Pre-rotation:**
 *    - Schedule a maintenance window (minimal downtime expected)
 *    - Backup the current encryption key securely
 *    - Generate a new 32-byte encryption key
 * 
 * 2. **Migration steps:**
 *    a. Set `STATE_ENCRYPTION_KEY_OLD` to the current key
 *    b. Set `STATE_ENCRYPTION_KEY` to the new key
 *    c. Run migration script that:
 *       - Reads all encrypted state entries
 *       - Decrypts with OLD key (fallback on failure)
 *       - Re-encrypts with NEW key
 *       - Updates the database entry
 *    d. Validate all entries are re-encrypted
 *    e. Remove `STATE_ENCRYPTION_KEY_OLD` after confirmation
 * 
 * 3. **Rollback:**
 *    - If migration fails, revert `STATE_ENCRYPTION_KEY` to the old value
 *    - All data remains readable with the original key
 * 
 * ### Future Improvements (Not Yet Implemented)
 * - Add key version tracking in encrypted values:
 *   ```typescript
 *   interface EncryptedValue {
 *     keyVersion: number;  // 1, 2, etc.
 *     iv: string;
 *     authTag: string;
 *     ciphertext: string;
 *   }
 *   ```
 * - Support automatic decryption fallback to older key versions
 * - Automated re-encryption background job
 * 
 * ### Operational Notes
 * - Decryption failures are logged but don't crash—users get empty state
 * - Monitor `STATE_DECRYPTION_ERROR` logs after key changes
 * - Test key rotation in staging before production
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
