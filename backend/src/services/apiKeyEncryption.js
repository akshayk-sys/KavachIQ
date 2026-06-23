const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

/**
 * Derive a 256-bit encryption key from the JWT secret
 */
function getEncryptionKey() {
  return crypto.createHash('sha256')
    .update(process.env.JWT_SECRET || 'kavachiq-secret-key-2024')
    .digest();
}

/**
 * Encrypt a plaintext value using AES-256-GCM
 * Returns: "iv:authTag:encrypted" format
 */
function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a value stored in "iv:authTag:encrypted" format
 */
function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
